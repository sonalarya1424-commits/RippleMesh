import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icons';
import { saveLocalReport } from '../utils/indexedDB';

const DISASTER_TYPES = [
  'Flood',
  'Earthquake',
  'Landslide',
  'Fire',
  'Medical Emergency',
  'Other Disaster'
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function SubmitReportModal({ isOpen, onClose, onReportSubmitted }) {
  const [disasterType, setDisasterType] = useState('Flood');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [peopleAffected, setPeopleAffected] = useState('');

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

  // Form states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState(null);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Reset form and revoke temporary preview URL
  const resetForm = () => {
    setDisasterType('Flood');
    setDescription('');
    setLocation('');
    setPeopleAffected('');
    if (photoPreviewUrl) {
      try {
        URL.revokeObjectURL(photoPreviewUrl);
      } catch {
        // ignore
      }
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setErrors({});
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    setSubmittedIncidentId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Close modal with clean-up
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photoPreviewUrl]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        try {
          URL.revokeObjectURL(photoPreviewUrl);
        } catch {
          // ignore
        }
      }
    };
  }, [photoPreviewUrl]);

  if (!isOpen) return null;

  // Validate photo file helper
  const validatePhotoFile = (file) => {
    if (!file) return null;

    // Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `Image size (${sizeMB} MB) exceeds the 5 MB maximum limit. Please choose a smaller photo.`;
    }

    // Check mime type
    const mimeValid = ALLOWED_MIME_TYPES.includes(file.type?.toLowerCase());
    const extValid = ALLOWED_EXTENSIONS.some((ext) => file.name?.toLowerCase().endsWith(ext));

    if (!mimeValid && !extValid) {
      return 'Invalid image format. Only JPG, JPEG, PNG, and WebP images are accepted.';
    }

    return null;
  };

  // Handle file selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const photoError = validatePhotoFile(file);
    if (photoError) {
      setErrors((prev) => ({ ...prev, photo: photoError }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Clean up previous preview URL if any
    if (photoPreviewUrl) {
      try {
        URL.revokeObjectURL(photoPreviewUrl);
      } catch {
        // ignore
      }
    }

    const newPreviewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreviewUrl(newPreviewUrl);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });
  };

  // Handle Replace Photo
  const handleReplacePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle Remove Photo
  const handleRemovePhoto = () => {
    if (photoPreviewUrl) {
      try {
        URL.revokeObjectURL(photoPreviewUrl);
      } catch {
        // ignore
      }
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });
  };

  // Validate entire form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!disasterType || !DISASTER_TYPES.includes(disasterType)) {
      newErrors.disasterType = 'Please select a valid disaster type.';
    }

    if (!description.trim()) {
      newErrors.description = 'Incident description is required.';
    } else if (description.trim().length < 8) {
      newErrors.description = 'Please provide a bit more detail (minimum 8 characters).';
    }

    if (!location.trim()) {
      newErrors.location = 'Incident location or landmark is required.';
    }

    if (peopleAffected.trim() !== '') {
      const parsed = Number(peopleAffected.trim());
      if (!/^\d+$/.test(peopleAffected.trim()) || !Number.isInteger(parsed) || parsed < 0) {
        newErrors.peopleAffected = 'People affected must be a non-negative whole number (0, 1, 2, ...).';
      }
    }

    if (photoFile) {
      const photoErr = validatePhotoFile(photoFile);
      if (photoErr) {
        newErrors.photo = photoErr;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a stable unique ID for this local intake report
      const stableId = `RM-L${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
      const parsedPeople = peopleAffected.trim() !== '' ? parseInt(peopleAffected.trim(), 10) : null;

      // Clean hazard category title
      const hazardTitle = disasterType === 'Other Disaster' ? 'Disaster Incident' : `${disasterType} Rescue`;

      const newIncident = {
        id: stableId,
        hazardType: hazardTitle,
        title: `${disasterType} Report — ${location.trim()}`,
        summary: description.trim(),
        location: {
          name: location.trim(),
          accessNotes: 'Citizen field intake report (submitted on this device)',
          coordinates: {
            x: 30 + Math.floor(Math.random() * 40),
            y: 35 + Math.floor(Math.random() * 30)
          },
          lat: 'Local Coordinates',
          lng: 'Intake Station'
        },
        peopleAffected: parsedPeople,
        severity: 'Critical', // default triage level for rapid rescue visibility
        status: 'Pending Review', // mandatory human coordinator review
        confidenceScore: null, // honest: unverified intake
        trustScore: null, // honest: local device intake, unauthenticated
        witnessCount: 1, // honest: 1 direct citizen report
        reportedAt: new Date().toISOString(),
        displayTime: 'Just now',
        isSimulated: true,
        isLocalSubmission: true,
        localStatus: 'LOCAL DEMO · QUEUED ON THIS DEVICE',
        evidencePhoto: {
          type: photoFile ? 'user_upload' : 'none',
          caption: photoFile ? `Citizen Upload: ${photoFile.name}` : 'No photo attached',
          imageUrl: photoPreviewUrl || null,
          fileName: photoFile?.name || null,
          fileSize: photoFile?.size || null,
          fileType: photoFile?.type || null
        },
        aiTriage: {
          isSimulated: true,
          modelTag: 'Pending Coordinator Review',
          triageScore: null,
          urgencyReasoning: '[LOCAL INTAKE] Citizen report submitted directly on this device. Awaiting human coordinator triage and local verification.',
          recommendedAction: 'Verify situation details and evaluate access before assigning rescue units.',
          meshProvenance: 'Stored in local IndexedDB. Queued on this device (offline-first).'
        },
        provenance: [
          {
            time: new Date().toLocaleTimeString(),
            source: 'Citizen Emergency Intake',
            detail: 'Report submitted and saved to browser IndexedDB (Queued locally)'
          }
        ],
        witnesses: [
          {
            id: 'W-Citizen',
            role: 'Citizen / Direct Reporter',
            verified: false,
            method: 'Local Browser Intake Form'
          }
        ]
      };

      // Persist to IndexedDB
      await saveLocalReport(newIncident, photoFile);

      setSubmittedIncidentId(stableId);
      setSubmitSuccess(true);
      setIsSubmitting(false);

      // Notify parent to add to active queue and select it
      if (onReportSubmitted) {
        onReportSubmitted(newIncident);
      }

      // Auto-close modal after brief visual feedback
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to persist report to IndexedDB:', err);
      setIsSubmitting(false);
      setSubmitError(
        err.message || 'Failed to save emergency report to local storage. Please check browser permissions and try again.'
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="modal-card submit-report-modal-card" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="font-mono text-teal text-xs">OFFLINE CITIZEN INTAKE // LOCAL QUEUE</span>
            <h3 id="report-modal-title" className="modal-heading">Submit Emergency Incident Report</h3>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close dialog">
            <Icon name="cross" size={16} />
          </button>
        </div>

        {/* Demo Disclaimer Ribbon */}
        <div className="modal-demo-ribbon font-mono text-xs">
          <Icon name="shieldCheck" size={13} color="var(--teal-400)" />
          <span>LOCAL DEMO · QUEUED ON THIS DEVICE ONLY // NO LIVE DISPATCH OCCURS</span>
        </div>

        {/* Success Banner */}
        {submitSuccess ? (
          <div className="modal-success-screen">
            <div className="success-icon-box">
              <Icon name="check" size={28} color="var(--teal-400)" />
            </div>
            <h4 className="success-title">Emergency Report Saved Locally</h4>
            <p className="success-desc font-mono text-xs">
              Incident ID: <strong>{submittedIncidentId}</strong> has been saved into <strong>IndexedDB</strong> and queued on this device for coordinator review.
            </p>
            <span className="local-queued-badge font-mono">
              LOCAL DEMO · QUEUED ON THIS DEVICE
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form" noValidate>
            {/* Global Error Banner */}
            {submitError && (
              <div className="modal-error-box font-mono text-xs" role="alert">
                <Icon name="alertTriangle" size={14} color="var(--critical)" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Disaster Type Selector */}
            <div className="form-group">
              <label htmlFor="disaster-type-select" className="form-label">
                Disaster Type <span className="required-star">*</span>
              </label>
              <select
                id="disaster-type-select"
                className={`filter-select ${errors.disasterType ? 'input-error' : ''}`}
                value={disasterType}
                onChange={(e) => {
                  setDisasterType(e.target.value);
                  if (errors.disasterType) {
                    setErrors((prev) => ({ ...prev, disasterType: undefined }));
                  }
                }}
              >
                {DISASTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.disasterType && <span className="field-error-text font-mono text-xs">{errors.disasterType}</span>}
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor="incident-location-input" className="form-label">
                Incident Location or Landmark <span className="required-star">*</span>
              </label>
              <input
                id="incident-location-input"
                type="text"
                className={`text-input ${errors.location ? 'input-error' : ''}`}
                placeholder="e.g. Marina Basin Wharf 14, Sector 4, or coordinates"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) {
                    setErrors((prev) => ({ ...prev, location: undefined }));
                  }
                }}
              />
              {errors.location && <span className="field-error-text font-mono text-xs">{errors.location}</span>}
            </div>

            {/* Incident Description */}
            <div className="form-group">
              <label htmlFor="incident-desc-textarea" className="form-label">
                Incident Description &amp; Urgent Needs <span className="required-star">*</span>
              </label>
              <textarea
                id="incident-desc-textarea"
                className={`text-area-input ${errors.description ? 'input-error' : ''}`}
                rows={4}
                placeholder="Describe current hazard conditions, trapped persons, rising water, structural damage, or emergency medical needs..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
              />
              {errors.description && <span className="field-error-text font-mono text-xs">{errors.description}</span>}
            </div>

            {/* People Affected (Optional) */}
            <div className="form-group">
              <label htmlFor="people-affected-input" className="form-label">
                People Affected / Stranded <span className="optional-tag font-mono">(Optional)</span>
              </label>
              <input
                id="people-affected-input"
                type="number"
                min="0"
                step="1"
                className={`text-input ${errors.peopleAffected ? 'input-error' : ''}`}
                placeholder="e.g. 4 (whole number, leave blank if unknown)"
                value={peopleAffected}
                onChange={(e) => {
                  setPeopleAffected(e.target.value);
                  if (errors.peopleAffected) {
                    setErrors((prev) => ({ ...prev, peopleAffected: undefined }));
                  }
                }}
              />
              {errors.peopleAffected && (
                <span className="field-error-text font-mono text-xs">{errors.peopleAffected}</span>
              )}
            </div>

            {/* Evidence Photo Upload & Preview */}
            <div className="form-group">
              <label className="form-label">
                Evidence Photo <span className="optional-tag font-mono">(Optional, max 5 MB)</span>
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="visually-hidden-input"
                onChange={handlePhotoSelect}
                id="evidence-photo-upload"
              />

              {photoPreviewUrl ? (
                /* Photo Preview Box with Replace & Remove Controls */
                <div className="photo-preview-card">
                  <div className="preview-image-wrapper">
                    <img src={photoPreviewUrl} alt="Selected evidence preview" className="preview-thumbnail" />
                  </div>
                  <div className="preview-info-col">
                    <span className="preview-filename font-mono text-xs">{photoFile?.name}</span>
                    <span className="preview-filesize font-mono text-xs text-muted">
                      {(photoFile?.size / 1024).toFixed(1)} KB
                    </span>
                    <div className="preview-controls-row">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleReplacePhoto}
                        title="Choose a different image file"
                      >
                        <Icon name="upload" size={13} />
                        Replace Photo
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-outline btn-sm"
                        onClick={handleRemovePhoto}
                        title="Remove photo from report"
                      >
                        <Icon name="trash" size={13} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Dropzone / Upload Trigger Button */
                <div
                  className="photo-dropzone-box"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <Icon name="camera" size={24} color="var(--teal-400)" />
                  <div className="dropzone-text">
                    <span className="dropzone-main-text">Click to attach evidence photo</span>
                    <span className="dropzone-sub-text font-mono text-xs text-muted">
                      JPG, PNG, WebP up to 5 MB
                    </span>
                  </div>
                </div>
              )}

              {errors.photo && <span className="field-error-text font-mono text-xs">{errors.photo}</span>}
            </div>

            {/* Modal Footer Controls */}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner" />
                    Saving to Device...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={15} />
                    Submit Emergency Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
