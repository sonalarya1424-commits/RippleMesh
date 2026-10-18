/**
 * Citizen Emergency Portal JS
 * Plain status updates every 10s, no score exposure.
 */

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

function previewImage(event) {
  const file = event.target.files && event.target.files[0];
  const container = document.getElementById('image-preview-container');
  const img = document.getElementById('image-preview');

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      img.src = e.target.result;
      container.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    clearImagePreview();
  }
}

function clearImagePreview() {
  const input = document.getElementById('image');
  const container = document.getElementById('image-preview-container');
  const img = document.getElementById('image-preview');
  if (input) input.value = '';
  if (img) img.src = '';
  if (container) container.classList.add('hidden');
}

async function handleReportSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('report-form');
  const submitBtn = document.getElementById('btn-submit-report');
  const loading = document.getElementById('report-loading');
  const resultBox = document.getElementById('report-result');

  resultBox.className = 'result-box hidden';
  resultBox.innerHTML = '';
  submitBtn.disabled = true;
  loading.classList.remove('hidden');

  const formData = new FormData(form);

  try {
    const response = await fetch('/report', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      const detail = data && data.detail ? data.detail : 'Report submission failed';
      resultBox.className = 'result-box error';
      resultBox.innerHTML = `<strong>Submission Error:</strong> ${escapeHtml(detail)}`;
      resultBox.classList.remove('hidden');
      return;
    }

    const resData = data.data || {};
    const reportId = resData.report_id;

    if (reportId) {
      saveReportId(reportId);
      refreshReportStatuses();
    }

    if (resData.dismissed) {
      resultBox.className = 'result-box warning';
      resultBox.innerHTML = `
        <h3>⚠️ Report Dismissed</h3>
        <p>No hazard visible in this photo. Report dismissed.</p>
      `;
    } else {
      resultBox.className = 'result-box success';
      resultBox.innerHTML = `
        <h3>✅ Report Submitted</h3>
        <p>Your report has been broadcast to the local mesh and is being processed.</p>
      `;
      document.getElementById('transcript').value = '';
      clearImagePreview();
    }
    resultBox.classList.remove('hidden');
  } catch (err) {
    resultBox.className = 'result-box error';
    resultBox.innerHTML = `<strong>Network/Server Error:</strong> ${escapeHtml(err.message || String(err))}`;
    resultBox.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    loading.classList.add('hidden');
  }
}

async function refreshReportStatuses() {
  const container = document.getElementById('status-container');
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
          return { id, status: 'unknown', message: 'Unable to retrieve status' };
        }
        const data = await res.json();
        return { id, status: data.status, message: data.message };
      } catch (e) {
        return { id, status: 'offline', message: 'Connecting to mesh...' };
      }
    })
  );

  const statusBadgeClass = {
    received: 'badge-status',
    verified: 'badge-threat-soon',
    help_being_arranged: 'badge-threat-now',
    resolved: 'badge-threat-soon',
    dismissed: 'badge-threat-none'
  };

  container.innerHTML = items.map(item => `
    <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:12px; margin-top:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span class="text-sm text-muted">Report ID: <code>${escapeHtml(item.id.substring(0, 8))}...</code></span>
        <span class="badge ${statusBadgeClass[item.status] || 'badge-status'}">${escapeHtml(item.status.replace(/_/g, ' '))}</span>
      </div>
      <div style="font-weight:600; color:var(--text-main); font-size:14px;">
        ${escapeHtml(item.message)}
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.addEventListener('DOMContentLoaded', () => {
  refreshReportStatuses();
  // Auto-refresh status every 10 seconds
  setInterval(refreshReportStatuses, 10000);
});
