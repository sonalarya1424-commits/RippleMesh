/**
 * RippleMesh IndexedDB Persistence Layer
 *
 * Provides offline-first storage for user-submitted emergency disaster reports
 * and uploaded evidence photos directly in the browser's IndexedDB.
 *
 * NOTE: This is client-side storage local to this specific device/browser session.
 * Reports are queued locally and are NOT synchronized to a live backend or mesh network.
 */

const DB_NAME = 'ripplemesh_offline_db';
const DB_VERSION = 1;
const INCIDENTS_STORE = 'incidents';
const PHOTOS_STORE = 'photos';

// Active object URLs created from stored Blobs, tracked for cleanup
const activeObjectUrls = new Set();

/**
 * Checks if IndexedDB is available in the current environment
 */
export function isIndexedDBAvailable() {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Opens or initializes the RippleMesh IndexedDB database
 */
export function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not supported or accessible in this browser environment.'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(INCIDENTS_STORE)) {
          db.createObjectStore(INCIDENTS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
          db.createObjectStore(PHOTOS_STORE, { keyPath: 'incidentId' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        const err = event.target.error || new Error('Failed to open RippleMesh local IndexedDB database.');
        reject(err);
      };

      request.onblocked = () => {
        reject(new Error('IndexedDB open blocked: please close other open tabs of this app.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Persists a new emergency report and optional evidence photo into IndexedDB
 * @param {Object} incident - Incident metadata object
 * @param {File|Blob|null} photoFile - Uploaded photo file or blob
 */
export async function saveLocalReport(incident, photoFile = null) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    try {
      const storeNames = photoFile ? [INCIDENTS_STORE, PHOTOS_STORE] : [INCIDENTS_STORE];
      const transaction = db.transaction(storeNames, 'readwrite');
      const incidentsStore = transaction.objectStore(INCIDENTS_STORE);

      // Store a clean clone of the incident metadata
      // (avoid storing temporary DOM object URLs directly in DB)
      const incidentToStore = {
        ...incident,
        evidencePhoto: {
          type: photoFile ? 'user_upload' : (incident.evidencePhoto?.type || 'none'),
          caption: photoFile
            ? `Citizen Field Evidence: ${photoFile.name || 'uploaded_image'}`
            : (incident.evidencePhoto?.caption || 'No photo attached'),
          fileName: photoFile ? photoFile.name : null,
          fileSize: photoFile ? photoFile.size : null,
          fileType: photoFile ? photoFile.type : null,
          hasStoredBlob: !!photoFile
        }
      };

      const putIncidentReq = incidentsStore.put(incidentToStore);

      putIncidentReq.onerror = (e) => {
        reject(e.target.error || new Error('Failed to save incident record in IndexedDB.'));
      };

      if (photoFile) {
        const photosStore = transaction.objectStore(PHOTOS_STORE);
        const photoRecord = {
          incidentId: incident.id,
          blob: photoFile,
          fileName: photoFile.name || 'evidence_photo',
          fileType: photoFile.type || 'image/jpeg',
          fileSize: photoFile.size || 0,
          savedAt: new Date().toISOString()
        };

        const putPhotoReq = photosStore.put(photoRecord);
        putPhotoReq.onerror = (e) => {
          reject(e.target.error || new Error('Failed to save evidence photo in IndexedDB.'));
        };
      }

      transaction.oncomplete = () => {
        resolve(incidentToStore);
      };

      transaction.onerror = (e) => {
        const error = e.target.error;
        let errorMessage = 'Failed to complete IndexedDB transaction.';
        if (error?.name === 'QuotaExceededError') {
          errorMessage = 'Storage quota exceeded. Please free up browser storage space.';
        } else if (error?.message) {
          errorMessage = `IndexedDB transaction error: ${error.message}`;
        }
        reject(new Error(errorMessage));
      };

      transaction.onabort = (e) => {
        const error = e.target.error;
        reject(new Error(error?.message || 'IndexedDB transaction was aborted.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Loads all user-submitted reports from IndexedDB and attaches photo Object URLs
 * @returns {Promise<Array>} Array of restored incidents with working image URLs
 */
export async function getAllLocalReports() {
  if (!isIndexedDBAvailable()) {
    return [];
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([INCIDENTS_STORE, PHOTOS_STORE], 'readonly');
      const incidentsStore = transaction.objectStore(INCIDENTS_STORE);
      const photosStore = transaction.objectStore(PHOTOS_STORE);

      const incidentsReq = incidentsStore.getAll();
      const photosReq = photosStore.getAll();

      let incidentsList = [];
      let photosList = [];

      incidentsReq.onsuccess = () => {
        incidentsList = incidentsReq.result || [];
      };

      photosReq.onsuccess = () => {
        photosList = photosReq.result || [];
      };

      transaction.oncomplete = () => {
        // Map photos by incidentId
        const photosMap = new Map();
        for (const p of photosList) {
          if (p && p.incidentId) {
            photosMap.set(p.incidentId, p);
          }
        }

        // Reconstruct incidents with object URLs for photos
        const restored = incidentsList.map((inc) => {
          const photoRecord = photosMap.get(inc.id);
          if (photoRecord && photoRecord.blob) {
            try {
              const url = URL.createObjectURL(photoRecord.blob);
              activeObjectUrls.add(url);
              return {
                ...inc,
                evidencePhoto: {
                  ...inc.evidencePhoto,
                  type: 'user_upload',
                  imageUrl: url,
                  fileName: photoRecord.fileName,
                  fileSize: photoRecord.fileSize,
                  fileType: photoRecord.fileType
                }
              };
            } catch (err) {
              console.warn(`Failed to create object URL for incident ${inc.id}:`, err);
              return {
                ...inc,
                evidencePhoto: {
                  ...inc.evidencePhoto,
                  type: 'none',
                  caption: 'Photo could not be loaded from storage'
                }
              };
            }
          }
          return inc;
        });

        resolve(restored);
      };

      transaction.onerror = (e) => {
        reject(e.target.error || new Error('Failed to retrieve stored reports from IndexedDB.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Updates an existing locally submitted incident (e.g. status changes: Approve/Edit/Reject)
 * @param {Object} updatedIncident
 */
export async function updateLocalReport(updatedIncident) {
  if (!isIndexedDBAvailable()) return;
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([INCIDENTS_STORE], 'readwrite');
      const store = transaction.objectStore(INCIDENTS_STORE);

      // Clean object URL reference before writing metadata
      const cleanIncident = {
        ...updatedIncident,
        evidencePhoto: {
          ...updatedIncident.evidencePhoto,
          // keep imageUrl out of DB or preserve metadata
          imageUrl: undefined
        }
      };

      const req = store.put(cleanIncident);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Cleans up temporary object URLs to prevent browser memory leaks
 * @param {string} url - Specific URL to revoke, or omit to revoke all
 */
export function revokePhotoUrl(url) {
  if (url && activeObjectUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
    activeObjectUrls.delete(url);
  }
}

/**
 * Revokes all active object URLs created by the storage module
 */
export function revokeAllPhotoUrls() {
  for (const url of activeObjectUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  activeObjectUrls.clear();
}
