import React, { useState } from 'react';
import { Icon } from './Icons';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';

export function IncidentDetail({
  incident,
  onApprove,
  onReject,
  onOpenEditModal,
  onClose
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  if (!incident) {
    return (
      <div className="incident-detail-panel empty-detail-panel">
        <div className="empty-detail-content">
          <div className="empty-icon-circle">
            <Icon name="incidents" size={32} color="var(--teal-400)" />
          </div>
          <h3>Select an Incident</h3>
          <p>Choose an incident from the ranked queue to inspect triage telemetry, AI reasoning, evidence, and witness provenance.</p>
        </div>
      </div>
    );
  }

  const handleApproveClick = () => {
    onApprove(incident.id);
    setActionFeedback({
      type: 'approved',
      message: `Incident ${incident.id} marked as Approved. Local operational status updated.`
    });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRejectClick = () => {
    onReject(incident.id);
    setActionFeedback({
      type: 'rejected',
      message: `Incident ${incident.id} marked as Rejected. Local operational status updated.`
    });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Render local synthetic SVG evidence photo based on incident type
  const renderEvidenceGraphic = (svgType) => {
    switch (svgType) {
      case 'flood':
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#091325" />
            <path d="M 0 110 Q 70 95 140 110 T 280 110 T 400 105 L 400 180 L 0 180 Z" fill="#0284c7" opacity="0.45" />
            <path d="M 0 125 Q 60 115 130 125 T 260 120 T 400 125 L 400 180 L 0 180 Z" fill="#00e5c9" opacity="0.35" />
            {/* Submerged building silhouette */}
            <rect x="70" y="60" width="45" height="90" fill="#1e2c4d" rx="2" />
            <rect x="78" y="70" width="8" height="10" fill="#facc15" opacity="0.7" />
            <rect x="95" y="70" width="8" height="10" fill="#64748b" />
            <rect x="78" y="90" width="8" height="10" fill="#64748b" />
            <rect x="180" y="45" width="60" height="110" fill="#182542" rx="2" />
            {/* Sensor water level marker */}
            <line x1="260" y1="30" x2="260" y2="160" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
            <text x="268" y="55" fill="#f43f5e" fontSize="11" fontFamily="monospace">CRITICAL LVL +1.4m</text>
            <circle cx="260" cy="110" r="4" fill="#f43f5e" />
            <text x="20" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">CAM-NORTH-04 // HYDRO-SENSOR #07</text>
          </svg>
        );
      case 'collapse':
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#130d17" />
            {/* Structural crack lines */}
            <path d="M 120 10 L 150 70 L 135 110 L 170 170" stroke="#f43f5e" strokeWidth="3" fill="none" />
            <path d="M 150 70 L 190 85 L 210 130" stroke="#fb923c" strokeWidth="2" fill="none" />
            <polygon points="170,170 210,140 280,180 140,180" fill="#2d1c24" opacity="0.8" />
            <text x="20" y="25" fill="#f87171" fontSize="10" fontFamily="monospace">USAR VOID SCANNER // ACOUSTIC DEFLECTION</text>
            <text x="220" y="95" fill="#facc15" fontSize="11" fontFamily="monospace">VOID DETECTED (TAP SIGNALS)</text>
            <circle cx="200" cy="110" r="6" stroke="#facc15" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'gas':
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#0d181e" />
            <circle cx="200" cy="90" r="65" fill="#10b981" opacity="0.15" />
            <circle cx="200" cy="90" r="40" fill="#facc15" opacity="0.25" />
            <circle cx="200" cy="90" r="20" fill="#f43f5e" opacity="0.4" />
            <path d="M 190 90 L 320 60" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
            <text x="325" y="62" fill="#38bdf8" fontSize="10" fontFamily="monospace">WIND NE 8kts</text>
            <text x="20" y="25" fill="#2dd4bf" fontSize="10" fontFamily="monospace">NH3 GAS TELEMETRY // CONCENTRATION: 85 PPM</text>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#0d1527" />
            <circle cx="200" cy="90" r="50" stroke="#00e5c9" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
            <circle cx="200" cy="90" r="4" fill="#00e5c9" />
            <text x="20" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">INCIDENT SENSOR LOG // POSITION VERIFIED</text>
            <text x="140" y="155" fill="#00e5c9" fontSize="11" fontFamily="monospace">COORDINATES: {incident.location?.lat}</text>
          </svg>
        );
    }
  };

  return (
    <div className="incident-detail-panel">
      {/* Header bar */}
      <div className="detail-panel-header">
        <div className="detail-header-left">
          <div className="detail-id-row">
            <span className="detail-id-tag font-mono">{incident.id}</span>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <h2 className="detail-incident-title">{incident.title}</h2>
        </div>

        {onClose && (
          <button className="panel-close-btn" onClick={onClose} title="Close panel">
            <Icon name="cross" size={16} />
          </button>
        )}
      </div>

      {/* Action feedback banner if any */}
      {actionFeedback && (
        <div className={`action-alert-banner alert-${actionFeedback.type}`}>
          <Icon name={actionFeedback.type === 'approved' ? 'check' : 'cross'} size={16} />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Primary Action Buttons Bar */}
      <div className="action-buttons-toolbar">
        <button
          className="btn btn-approve"
          onClick={handleApproveClick}
          title="Approve incident for local response"
        >
          <Icon name="check" size={16} />
          Approve Incident
        </button>

        <button
          className="btn btn-edit"
          onClick={() => onOpenEditModal(incident)}
          title="Edit details or adjust triage"
        >
          <Icon name="edit" size={16} />
          Edit Incident
        </button>

        <button
          className="btn btn-reject"
          onClick={handleRejectClick}
          title="Reject report as false alarm or duplicate"
        >
          <Icon name="cross" size={16} />
          Reject / Dismiss
        </button>
      </div>

      <div className="local-action-notice">
        <Icon name="shieldCheck" size={13} color="var(--teal-400)" />
        <span>Frontend simulation: Actions update the local coordinator state. No live dispatch has occurred.</span>
      </div>

      {/* Scrollable Content Body */}
      <div className="detail-scrollable-body">
        {/* Report Summary */}
        <section className="detail-section">
          <div className="section-title-with-icon">
            <Icon name="incidents" size={16} color="var(--teal-400)" />
            <h4 className="detail-subheading">Report Summary</h4>
          </div>
          <p className="summary-paragraph">{incident.summary}</p>

          <div className="location-detail-card">
            <div className="loc-card-row">
              <Icon name="mapPin" size={16} color="var(--teal-400)" />
              <div>
                <strong>Location:</strong> {incident.location?.name}
                <div className="font-mono text-xs text-muted">
                  Coords: {incident.location?.lat}, {incident.location?.lng}
                </div>
              </div>
            </div>
            {incident.location?.accessNotes && (
              <div className="access-notes-box">
                <span className="access-label">Access Assessment:</span> {incident.location.accessNotes}
              </div>
            )}
          </div>
        </section>

        {/* AI Triage Reasoning (Simulated) */}
        <section className="detail-section ai-triage-section">
          <div className="ai-section-badge-header">
            <div className="ai-brand-group">
              <Icon name="sparkles" size={16} color="var(--teal-400)" />
              <h4 className="detail-subheading">AI Triage Reasoning</h4>
            </div>
            <span className="simulated-model-pill">
              <span className="sim-indicator" />
              {incident.aiTriage?.modelTag || 'Simulated Local LLM'}
            </span>
          </div>

          <div className="ai-triage-body">
            <div className="triage-stat-strip">
              <div className="triage-stat-item">
                <span className="stat-label">Triage Urgency Score</span>
                <span className="stat-value font-mono text-teal">
                  {incident.aiTriage?.triageScore || 90} / 100
                </span>
              </div>
              <div className="triage-stat-item">
                <span className="stat-label">Model Confidence</span>
                <span className="stat-value font-mono">
                  {Math.round((incident.confidenceScore || 0) * 100)}%
                </span>
              </div>
              <div className="triage-stat-item">
                <span className="stat-label">Mesh Trust Auth</span>
                <span className="stat-value font-mono">
                  {Math.round((incident.trustScore || 0) * 100)}%
                </span>
              </div>
            </div>

            <div className="ai-reasoning-box">
              <div className="reasoning-block">
                <span className="reasoning-tag">Triage Analysis:</span>
                <p>{incident.aiTriage?.urgencyReasoning}</p>
              </div>

              <div className="reasoning-block">
                <span className="reasoning-tag">Recommended Local Action:</span>
                <p className="text-teal">{incident.aiTriage?.recommendedAction}</p>
              </div>

              <div className="reasoning-block mesh-provenance">
                <span className="reasoning-tag">Relay Provenance:</span>
                <p className="font-mono text-xs">{incident.aiTriage?.meshProvenance}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Evidence Photo Placeholder / Synthetic Visualizer */}
        <section className="detail-section">
          <div className="section-title-with-icon">
            <Icon name="camera" size={16} color="var(--teal-400)" />
            <h4 className="detail-subheading">Sensor & Field Evidence</h4>
          </div>

          <div className="evidence-graphic-wrapper">
            {renderEvidenceGraphic(incident.evidencePhoto?.svgType)}
            <div className="evidence-caption-strip">
              <span className="caption-text">{incident.evidencePhoto?.caption}</span>
              <span className="local-photo-tag font-mono">OFFLINE SNAPSHOT</span>
            </div>
          </div>
        </section>

        {/* Voice Transcript Placeholder */}
        <section className="detail-section">
          <div className="section-title-with-icon">
            <Icon name="mic" size={16} color="var(--teal-400)" />
            <h4 className="detail-subheading">Mesh Voice Telemetry</h4>
          </div>

          <div className="voice-audio-card">
            <div className="audio-player-control">
              <button
                className="play-audio-btn"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                aria-label="Play audio transcript"
              >
                {isPlayingAudio ? '❚❚' : '▶'}
              </button>
              <div className="audio-waveform-visual">
                <div className={`waveform-bars ${isPlayingAudio ? 'playing' : ''}`}>
                  <span style={{ height: '35%' }} />
                  <span style={{ height: '70%' }} />
                  <span style={{ height: '40%' }} />
                  <span style={{ height: '90%' }} />
                  <span style={{ height: '60%' }} />
                  <span style={{ height: '80%' }} />
                  <span style={{ height: '45%' }} />
                  <span style={{ height: '100%' }} />
                  <span style={{ height: '55%' }} />
                  <span style={{ height: '75%' }} />
                  <span style={{ height: '30%' }} />
                </div>
                <div className="audio-timing font-mono">
                  {isPlayingAudio ? '00:04 / 00:18 (Playing)' : '00:00 / 00:18'}
                </div>
              </div>
              <span className="format-tag font-mono">Opus / 8kbps LoRa</span>
            </div>

            <div className="transcript-speech-bubble">
              <span className="transcript-label font-mono">LOCAL SPEECH-TO-TEXT EXTRACTION:</span>
              <p className="transcript-quote">{incident.voiceTranscript}</p>
            </div>
          </div>
        </section>

        {/* Witness Information & Provenance History */}
        <section className="detail-section">
          <div className="section-title-with-icon">
            <Icon name="users" size={16} color="var(--teal-400)" />
            <h4 className="detail-subheading">Witnesses & Mesh Provenance</h4>
          </div>

          <div className="witnesses-list-container">
            <div className="witness-header-row">
              <span>{incident.witnessCount} Independent {incident.witnessCount === 1 ? 'Witness' : 'Witnesses'}</span>
              <span className="font-mono text-xs text-muted">First reported: {incident.displayTime}</span>
            </div>

            <div className="witness-cards-grid">
              {incident.witnesses?.map((w, idx) => (
                <div key={idx} className="witness-chip">
                  <div className="witness-chip-header">
                    <span className="witness-id font-mono">{w.id}</span>
                    <span className={`witness-verification ${w.verified ? 'is-verified' : 'unverified'}`}>
                      {w.verified ? 'Verified Node' : 'Unauthenticated'}
                    </span>
                  </div>
                  <div className="witness-role">{w.role}</div>
                  <div className="witness-method font-mono text-xs">{w.method}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Provenance Hop History */}
          <div className="provenance-timeline">
            <span className="provenance-heading font-mono">ROUTING & VERIFICATION AUDIT TRAIL:</span>
            <div className="provenance-steps">
              {incident.provenance?.map((p, idx) => (
                <div key={idx} className="provenance-step-item">
                  <span className="step-time font-mono">{p.time}</span>
                  <div className="step-content">
                    <div className="step-source">{p.source}</div>
                    <div className="step-detail text-muted text-xs">{p.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
