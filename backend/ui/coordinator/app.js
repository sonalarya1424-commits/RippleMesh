/**
 * Coordinator Dashboard JS with session authentication, auto-refresh,
 * incident detail modal, dispatch approval, and outcome tracking.
 */

let incidentsInterval = null;
let messagesInterval = null;
let currentCoordinatorTab = 'dashboard';

const AUTH_TOKEN_KEY = 'ripplemesh_coord_token';
const AUTH_NAME_KEY = 'ripplemesh_coord_name';

function getAuthToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function getAuthName() {
  return sessionStorage.getItem(AUTH_NAME_KEY) || 'Coordinator';
}

function authHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function handle401() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_NAME_KEY);
  stopLoops();
  document.getElementById('dashboard-section').classList.add('hidden');
  document.getElementById('login-section').classList.remove('hidden');
  showLoginError('Session expired or unauthorized. Please log in again.');
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const name = document.getElementById('coord-name').value;
  const pin = document.getElementById('coord-pin').value;
  const errBox = document.getElementById('login-error');
  errBox.classList.add('hidden');

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin })
    });

    const data = await res.json();
    if (!res.ok) {
      showLoginError(data.detail || 'Login failed');
      return;
    }

    sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
    sessionStorage.setItem(AUTH_NAME_KEY, data.name);
    initAuthenticatedUI();
  } catch (err) {
    showLoginError(`Network error: ${err.message}`);
  }
}

async function handleLogout() {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: authHeaders()
    });
  } catch (e) {}
  handle401();
}

function initAuthenticatedUI() {
  const token = getAuthToken();
  if (!token) {
    handle401();
    return;
  }

  document.getElementById('logged-user-name').textContent = getAuthName();
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');

  fetchIncidents();
  fetchMessages();
  startLoops();
}

function startLoops() {
  stopLoops();
  incidentsInterval = setInterval(() => {
    if (currentCoordinatorTab === 'dashboard') fetchIncidents();
  }, 5000);

  messagesInterval = setInterval(() => {
    if (currentCoordinatorTab === 'log') fetchMessages();
  }, 3000);
}

function stopLoops() {
  if (incidentsInterval) clearInterval(incidentsInterval);
  if (messagesInterval) clearInterval(messagesInterval);
}

function switchCoordinatorTab(tabName) {
  currentCoordinatorTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

  const btn = document.getElementById(`tab-btn-${tabName}`);
  const content = document.getElementById(`tab-${tabName}`);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');

  if (tabName === 'dashboard') fetchIncidents();
  if (tabName === 'log') fetchMessages();
}

function showNotification(text, durationMs = 4000) {
  const bar = document.getElementById('notification-bar');
  if (!bar) return;
  bar.textContent = text;
  bar.classList.remove('hidden');
  setTimeout(() => bar.classList.add('hidden'), durationMs);
}

// Incidents Dashboard
async function fetchIncidents() {
  const container = document.getElementById('incidents-container');
  try {
    const res = await fetch('/incidents', {
      headers: authHeaders()
    });
    if (res.status === 401) {
      handle401();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const incidents = await res.json();

    if (!incidents || incidents.length === 0) {
      container.innerHTML = `
        <div class="card empty-state">
          <h3>No Active Incidents</h3>
          <p class="text-muted">The emergency mesh has no active corroborated hazards right now.</p>
        </div>
      `;
      return;
    }

    renderIncidents(incidents);
  } catch (err) {
    console.error('fetchIncidents error:', err);
  }
}

function renderIncidents(incidents) {
  const container = document.getElementById('incidents-container');

  const html = incidents.map((inc, index) => {
    const rank = index + 1;
    const lifeThreat = inc.life_threat || 'none';
    const confidencePct = Math.round((inc.confidence || 0) * 100);
    const reportsCount = inc.independent_reports || 1;
    const reportText = reportsCount === 1 ? '1 independent report' : `${reportsCount} independent reports`;
    const isUnverified = Boolean(inc.unverified);
    const priority = inc.priority_score !== null && inc.priority_score !== undefined ? Number(inc.priority_score).toFixed(3) : '0.000';
    const trust = inc.trust !== null && inc.trust !== undefined ? Number(inc.trust).toFixed(2) : '0.70';
    const dispatchId = inc.pending_dispatch_id || '';
    const isFallbackModel = inc.model_used && (inc.model_used.includes('fallback') || inc.model_used.includes('default'));

    return `
      <div class="incident-card" id="inc-card-${escapeHtml(inc.incident_id)}">
        <div class="incident-header">
          <div class="incident-title-row">
            <span class="rank-badge">#${rank}</span>
            <span class="hazard-title">${escapeHtml(inc.hazard_type || 'Unknown Hazard')}</span>
            <span class="badge badge-threat-${escapeHtml(lifeThreat)}">Threat: ${escapeHtml(lifeThreat)}</span>
            <span class="badge badge-status">${escapeHtml(inc.status || 'new')}</span>
            ${isUnverified ? '<span class="badge badge-unverified">UNVERIFIED, help requested</span>' : ''}
          </div>
          <div class="priority-display">
            <span class="metric-label">Priority:</span>
            <span class="priority-val">${priority}</span>
          </div>
        </div>

        <div class="incident-metrics">
          <div class="metric-item">
            <span class="metric-label">Witness Count</span>
            <span class="metric-value">👥 ${reportText}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Corroborated Confidence</span>
            <span class="metric-value">${confidencePct}%</span>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${confidencePct}%;"></div>
            </div>
          </div>
          <div class="metric-item">
            <span class="metric-label">Source Trust</span>
            <span class="metric-value">🛡️ ${trust}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Coordinates</span>
            <span class="metric-value text-sm">${inc.lat !== null ? inc.lat.toFixed(4) : '-'}, ${inc.lng !== null ? inc.lng.toFixed(4) : '-'}</span>
          </div>
        </div>

        ${inc.reasoning ? `
          <div class="reasoning-box">
            <strong>Coordinator Assessment:</strong> ${escapeHtml(inc.reasoning)}
            ${isFallbackModel ? '<br><span class="fallback-note">⚠️ Default values used, review manually</span>' : ''}
          </div>
        ` : ''}

        <div class="incident-actions">
          <button class="btn btn-secondary btn-sm" onclick="showIncidentDetails('${escapeHtml(inc.incident_id)}')">
            🔍 Details & Provenance
          </button>

          ${dispatchId ? `
            <div class="dispatch-buttons">
              <button class="btn btn-success btn-sm" onclick="handleDispatchAction('${escapeHtml(dispatchId)}', 'approve')">
                ✅ Approve
              </button>
              <button class="btn btn-subtle btn-sm" onclick="handleDispatchAction('${escapeHtml(dispatchId)}', 'edit')">
                ✏️ Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="handleDispatchAction('${escapeHtml(dispatchId)}', 'reject')">
                ❌ Reject
              </button>

              <div class="outcome-select-group">
                <select class="btn-sm" onchange="handleDispatchOutcome('${escapeHtml(dispatchId)}', this.value)">
                  <option value="" disabled selected>Mark outcome...</option>
                  <option value="reached">Reached</option>
                  <option value="resolved">Resolved</option>
                  <option value="false_alarm">False Alarm</option>
                </select>
              </div>
            </div>
          ` : '<span class="text-muted text-sm">No pending dispatch</span>'}
        </div>

        <div id="dispatch-feedback-${escapeHtml(inc.incident_id)}"></div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

async function handleDispatchAction(dispatchId, action) {
  try {
    const res = await fetch(`/dispatch/${encodeURIComponent(dispatchId)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ action: action })
    });
    if (res.status === 401) {
      handle401();
      return;
    }
    const result = await res.json();
    if (!res.ok) throw new Error(result.detail || 'Dispatch action failed');

    showNotification(`Dispatch ${action.toUpperCase()} processed.`);

    if (action === 'approve' || action === 'edit') {
      loadTaskCardDisplay(result.incident_id, dispatchId);
    }
    fetchIncidents();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function loadTaskCardDisplay(incidentId, dispatchId) {
  const target = document.getElementById(`dispatch-feedback-${incidentId}`);
  if (!target) return;

  try {
    const res = await fetch(`/incidents/${encodeURIComponent(incidentId)}`, {
      headers: authHeaders()
    });
    if (res.status === 401) {
      handle401();
      return;
    }
    const data = await res.json();
    const dsp = (data.dispatches || []).find(d => d.dispatch_id === dispatchId) || (data.dispatches || [])[0];

    if (dsp && dsp.task_card) {
      let card = dsp.task_card;
      if (typeof card === 'string') {
        try { card = JSON.parse(card); } catch (e) {}
      }
      const responder = dsp.responder_name || (card && card.responder ? card.responder.name : 'Field Team');
      const mapsUrl = card && card.map_link ? card.map_link : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.lat || 0)},${encodeURIComponent(data.lng || 0)}`;

      target.innerHTML = `
        <div class="task-card-box">
          <strong>Mission Dispatched:</strong> Assigned to <strong>${escapeHtml(responder)}</strong>.<br>
          📍 Navigation: <a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">Open Google Maps Route</a>
        </div>
      `;
    }
  } catch (e) {
    console.error('loadTaskCardDisplay error:', e);
  }
}

async function handleDispatchOutcome(dispatchId, outcome) {
  if (!outcome) return;
  try {
    const res = await fetch(`/dispatch/${encodeURIComponent(dispatchId)}/outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ outcome: outcome })
    });
    if (res.status === 401) {
      handle401();
      return;
    }
    const result = await res.json();
    if (!res.ok) throw new Error(result.detail || 'Outcome update failed');

    showNotification(`Mission outcome updated: ${outcome.replace('_', ' ').toUpperCase()}`);
    fetchIncidents();
  } catch (err) {
    alert(`Error updating outcome: ${err.message}`);
  }
}

async function showIncidentDetails(incidentId) {
  const modal = document.getElementById('details-modal');
  const body = document.getElementById('modal-body');
  document.getElementById('modal-title').textContent = `Incident ${incidentId}`;
  modal.classList.remove('hidden');
  body.innerHTML = '<div class="empty-state">Loading provenance records...</div>';

  try {
    const res = await fetch(`/incidents/${encodeURIComponent(incidentId)}`, {
      headers: authHeaders()
    });
    if (res.status === 401) {
      handle401();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    let reportsHtml = (data.reports || []).map(r => `
      <div class="report-item">
        <div><strong>Device:</strong> ${escapeHtml(r.device_id || 'Unknown')} | <strong>Mode:</strong> ${escapeHtml(r.capture_mode || 'in_app')}</div>
        <div><strong>Transcript:</strong> "${escapeHtml(r.transcript || 'No transcript')}"</div>
        ${r.summary ? `<div><strong>Summary:</strong> ${escapeHtml(r.summary)}</div>` : ''}
        <div><strong>Verification Notes:</strong> ${escapeHtml(r.verification_notes || 'Verified authentic')} (Trust: ${r.trust_score !== undefined ? Number(r.trust_score).toFixed(2) : '-'})</div>
      </div>
    `).join('') || '<p class="text-muted">No linked reports.</p>';

    let triageHtml = (data.triage || []).map(t => `
      <div class="report-item">
        <div><strong>Life Threat:</strong> ${escapeHtml(t.life_threat || '-')} | <strong>Time to Harm:</strong> ${escapeHtml(t.time_to_harm || '-')}</div>
        <div><strong>Reasoning:</strong> ${escapeHtml(t.reasoning || '-')}</div>
        <div class="text-sm text-muted">Model: ${escapeHtml(t.model_used || 'default')} | At: ${escapeHtml(t.created_at || '')}</div>
      </div>
    `).join('') || '<p class="text-muted">No triage records.</p>';

    let dispatchHtml = (data.dispatches || []).map(d => `
      <div class="dispatch-item">
        <div><strong>Responder:</strong> ${escapeHtml(d.responder_name || 'Unit')} (${escapeHtml(d.responder_type || 'Field')})</div>
        <div><strong>Status:</strong> ${escapeHtml(d.approval_status || 'pending')} | <strong>Outcome:</strong> ${escapeHtml(d.outcome || 'None')}</div>
        ${d.dispatched_at ? `<div class="text-sm text-muted">Dispatched: ${escapeHtml(d.dispatched_at)}</div>` : ''}
      </div>
    `).join('') || '<p class="text-muted">No dispatches created.</p>';

    body.innerHTML = `
      <div class="section-title">Contributing Reports (${(data.reports || []).length})</div>
      ${reportsHtml}

      <div class="section-title">Coordinator Triage Assessments</div>
      ${triageHtml}

      <div class="section-title">Field Dispatches</div>
      ${dispatchHtml}
    `;
  } catch (err) {
    body.innerHTML = `<div class="empty-state" style="color:var(--danger)">Failed to load details: ${escapeHtml(err.message)}</div>`;
  }
}

function closeModal() {
  document.getElementById('details-modal').classList.add('hidden');
}

function closeModalOnOverlay(e) {
  if (e.target.id === 'details-modal') closeModal();
}

// Agent Log Bus
async function fetchMessages() {
  const container = document.getElementById('messages-container');
  try {
    const res = await fetch('/messages?limit=50', {
      headers: authHeaders()
    });
    if (res.status === 401) {
      handle401();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const messages = await res.json();

    if (!messages || messages.length === 0) {
      container.innerHTML = `<div class="empty-state">No agent messages recorded yet.</div>`;
      return;
    }

    renderMessages(messages);
  } catch (err) {
    console.error('fetchMessages error:', err);
  }
}

function renderMessages(messages) {
  const container = document.getElementById('messages-container');

  const html = messages.map(msg => {
    const typeClass = `msg-${msg.msg_type || 'UNKNOWN'}`;
    const timeStr = msg.sent_at ? msg.sent_at.split('T')[1] || msg.sent_at : '';
    let parsedBody = msg.body;
    if (typeof parsedBody === 'string') {
      try { parsedBody = JSON.parse(parsedBody); } catch (e) {}
    }
    const formattedBody = typeof parsedBody === 'object' ? JSON.stringify(parsedBody, null, 2) : String(parsedBody);

    return `
      <div class="msg-row" id="msg-row-${escapeHtml(msg.message_id)}">
        <div class="msg-summary" onclick="toggleMsgDetails('${escapeHtml(msg.message_id)}')">
          <span class="col-time">${escapeHtml(timeStr || msg.sent_at || '-')}</span>
          <span class="col-route"><strong>${escapeHtml(msg.from_agent || '?')}</strong> &rarr; <strong>${escapeHtml(msg.to_agent || '?')}</strong></span>
          <span class="col-type"><span class="msg-badge ${escapeHtml(typeClass)}">${escapeHtml(msg.msg_type || '')}</span></span>
          <span class="col-ref text-muted text-sm">${escapeHtml(msg.ref_id ? msg.ref_id.substring(0, 12) + '...' : '-')}</span>
          <span class="col-bytes text-muted text-sm">${msg.bytes || 0} B</span>
        </div>
        <div id="msg-details-${escapeHtml(msg.message_id)}" class="msg-details hidden">
          <pre>${escapeHtml(formattedBody)}</pre>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function toggleMsgDetails(messageId) {
  const details = document.getElementById(`msg-details-${messageId}`);
  if (details) details.classList.toggle('hidden');
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
  if (getAuthToken()) {
    initAuthenticatedUI();
  } else {
    handle401();
  }
});
