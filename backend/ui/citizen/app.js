/**
 * Citizen Emergency Portal JS
 * Mobile-friendly, plain language, geolocation & presets, no external CDNs.
 */

// TODO: Replace with official Belagavi survey/GIS coordinates
const BELAGAVI_LANDMARKS = [
  { name: "Temple Road Bridge", lat: 15.8540, lng: 74.5090 },
  { name: "Market Chowk", lat: 15.8510, lng: 74.5065 },
  { name: "Bus Stand", lat: 15.8495, lng: 74.5120 },
  { name: "Hospital Road", lat: 15.8560, lng: 74.5040 },
  { name: "Lake Side", lat: 15.8480, lng: 74.5030 },
  { name: "School Ground", lat: 15.8550, lng: 74.5150 },
  { name: "Railway Crossing", lat: 15.8450, lng: 74.5110 },
  { name: "Other (Belagavi Area)", lat: 15.8523, lng: 74.5085 }
];

let selectedHazardType = "";
let selectedFile = null;
let currentCaptureMode = "in_app";

const STORAGE_KEY = 'ripplemesh_citizen_reports';

function getStoredReportIds() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveReportId(id) {
  const list = getStoredReportIds();
  if (!list.includes(id)) {
    list.unshift(id);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

// 1. Populate Places Dropdown
function initPlaces() {
  const select = document.getElementById("nearest_place");
  if (!select) return;
  BELAGAVI_LANDMARKS.forEach((place, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = place.name;
    select.appendChild(opt);
  });
}

function onPlaceSelected(index) {
  const place = BELAGAVI_LANDMARKS[index];
  if (!place) return;
  document.getElementById("lat").value = place.lat.toFixed(6);
  document.getElementById("lng").value = place.lng.toFixed(6);

  const geoMsg = document.getElementById("geo-status-msg");
  geoMsg.textContent = `📍 Location set to ${place.name}`;
  geoMsg.style.color = "var(--primary)";
}

// 2. Geolocation Handling
function requestGeolocation() {
  const geoMsg = document.getElementById("geo-status-msg");
  const btn = document.getElementById("btn-geolocation");

  if (!navigator.geolocation) {
    geoMsg.textContent = "Could not get location. Pick the nearest place below.";
    geoMsg.style.color = "var(--danger)";
    return;
  }

  btn.disabled = true;
  geoMsg.textContent = "Acquiring GPS location...";
  geoMsg.style.color = "var(--text-muted)";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy || 15);

      document.getElementById("lat").value = lat.toFixed(6);
      document.getElementById("lng").value = lng.toFixed(6);

      // Reset dropdown selection
      document.getElementById("nearest_place").selectedIndex = 0;

      geoMsg.textContent = `✅ Location captured, accuracy about ${accuracy} m`;
      geoMsg.style.color = "var(--success)";
      btn.disabled = false;
    },
    (err) => {
      console.warn("Geolocation failed:", err);
      geoMsg.textContent = "Could not get location. Pick the nearest place below.";
      geoMsg.style.color = "var(--danger)";
      btn.disabled = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// 3. Hazard Emoji Buttons
function selectHazardEmoji(hazardLabel, emoji, element) {
  selectedHazardType = hazardLabel;
  document.querySelectorAll(".btn-emoji").forEach((b) => b.classList.remove("selected"));
  element.classList.add("selected");
}

// 4. Photo Inputs: Camera vs Gallery
function triggerPhotoCapture(source) {
  if (source === "camera") {
    document.getElementById("file-camera").click();
  } else {
    document.getElementById("file-gallery").click();
  }
}

function handleFileChosen(event, mode) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  selectedFile = file;
  currentCaptureMode = mode;
  document.getElementById("capture_mode").value = mode;

  const reader = new FileReader();
  const img = document.getElementById("image-preview");
  const container = document.getElementById("image-preview-container");
  const label = document.getElementById("photo-source-label");

  reader.onload = function (e) {
    img.src = e.target.result;
    label.textContent = mode === "in_app" ? "Live photo attached" : "Gallery photo attached";
    container.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function clearImagePreview() {
  selectedFile = null;
  document.getElementById("file-camera").value = "";
  document.getElementById("file-gallery").value = "";
  document.getElementById("image-preview").src = "";
  document.getElementById("image-preview-container").classList.add("hidden");
}

// 5. Submit Form
async function handleReportSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById("btn-submit-report");
  const loading = document.getElementById("report-loading");
  const resultBox = document.getElementById("report-result");

  const lat = document.getElementById("lat").value.trim();
  const lng = document.getElementById("lng").value.trim();

  // Validate location requirement
  if (!lat || !lng) {
    alert("Please provide a location before sending: click 'Use my location' or pick the nearest place.");
    return;
  }

  resultBox.className = "result-box hidden";
  resultBox.innerHTML = "";
  submitBtn.disabled = true;
  loading.classList.remove("hidden");

  // Construct transcript with prepended reporter selection if picked
  let rawTranscript = document.getElementById("transcript").value.trim();
  if (selectedHazardType) {
    const prefix = `[Reporter selected: ${selectedHazardType.toLowerCase()}]`;
    rawTranscript = rawTranscript ? `${prefix} ${rawTranscript}` : prefix;
  }

  const formData = new FormData();
  formData.append("device_id", document.getElementById("device_id").value || "citizen-1");
  formData.append("transcript", rawTranscript);
  formData.append("lat", lat);
  formData.append("lng", lng);
  formData.append("capture_mode", currentCaptureMode);

  if (selectedFile) {
    formData.append("image", selectedFile);
  }

  try {
    const response = await fetch("/report", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      const detail = data && data.detail ? data.detail : "Report submission failed";
      resultBox.className = "result-box error";
      resultBox.innerHTML = `<strong>Error:</strong> ${escapeHtml(detail)}`;
      resultBox.classList.remove("hidden");
      return;
    }

    const resData = data.data || {};
    const reportId = resData.report_id;

    if (reportId) {
      saveReportId(reportId);
      refreshReportStatuses();
    }

    if (resData.dismissed) {
      resultBox.className = "result-box warning";
      resultBox.innerHTML = `
        <h3>Report Notice</h3>
        <p>No emergency hazard was visible in this photo. Report dismissed.</p>
      `;
    } else {
      resultBox.className = "result-box success";
      resultBox.innerHTML = `
        <h3>✅ Emergency Report Sent</h3>
        <p>Your report has been sent to nearby emergency responders and the control room.</p>
      `;
      // Clear form
      document.getElementById("transcript").value = "";
      clearImagePreview();
      selectedHazardType = "";
      document.querySelectorAll(".btn-emoji").forEach((b) => b.classList.remove("selected"));
    }
    resultBox.classList.remove("hidden");
  } catch (err) {
    resultBox.className = "result-box error";
    resultBox.innerHTML = `<strong>Network/Connection Error:</strong> ${escapeHtml(err.message || String(err))}`;
    resultBox.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    loading.classList.add("hidden");
  }
}

// 6. Citizen Report Status Polling
async function refreshReportStatuses() {
  const container = document.getElementById("status-container");
  const ids = getStoredReportIds();

  if (ids.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm">No reports submitted from this session yet.</p>`;
    return;
  }

  const items = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`/report-status/${encodeURIComponent(id)}`);
        if (!res.ok) {
          return { id, status: "unknown", message: "Checking status..." };
        }
        const data = await res.json();
        return { id, status: data.status, message: data.message };
      } catch (e) {
        return { id, status: "offline", message: "Connecting to response network..." };
      }
    })
  );

  const statusBadgeClass = {
    received: "badge-status",
    verified: "badge-threat-soon",
    help_being_arranged: "badge-threat-now",
    resolved: "badge-threat-soon",
    dismissed: "badge-threat-none"
  };

  container.innerHTML = items
    .map(
      (item) => `
    <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:12px; margin-top:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span class="text-sm text-muted">Report ID: <code>${escapeHtml(item.id.substring(0, 8))}...</code></span>
        <span class="badge ${statusBadgeClass[item.status] || "badge-status"}">${escapeHtml(item.status.replace(/_/g, " "))}</span>
      </div>
      <div style="font-weight:600; color:var(--text-main); font-size:14px;">
        ${escapeHtml(item.message)}
      </div>
    </div>
  `
    )
    .join("");
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function checkHealth() {
  const banner = document.getElementById("mock-banner");
  const aiContainer = document.getElementById("ai-status-container");
  try {
    const res = await fetch("/health");
    if (!res.ok) return;
    const data = await res.json();
    if (data.mock_mode) {
      if (banner) banner.classList.remove("hidden");
      if (aiContainer) {
        aiContainer.innerHTML = `<span class="badge badge-threat-now">DEMO / MOCK MODE</span>`;
      }
    } else {
      if (banner) banner.classList.add("hidden");
      if (aiContainer) {
        aiContainer.innerHTML = `<span class="ai-badge"><span class="ai-badge-dot"></span> AI: ${escapeHtml(data.model || data.model_name || "gemma4:e2b")}</span>`;
      }
    }
  } catch (e) {
    console.warn("Could not check /health", e);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  initPlaces();
  refreshReportStatuses();
  setInterval(refreshReportStatuses, 10000);
});

