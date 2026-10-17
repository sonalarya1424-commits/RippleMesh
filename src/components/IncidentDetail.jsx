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
          <h3>Select a Disaster Incident</h3>
          <p>Choose an incident from the ranked queue to inspect simulated triage telemetry, decoupled urgency scores, sensor evidence, and voice transcripts.</p>
        </div>
      </div>
    );
  }

  const handleApproveClick = () => {
    onApprove(incident.id);
    setActionFeedback({
      type: 'approved',
      message: `Simulated Action: Incident ${incident.id} marked as Approved in local state. (No live dispatch sent)`
    });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRejectClick = () => {
    onReject(incident.id);
    setActionFeedback({
      type: 'rejected',
      message: `Simulated Action: Incident ${incident.id} marked as Rejected in local state. (No live dispatch sent)`
    });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Render local synthetic SVG evidence graphic based on incident type
  const renderEvidenceGraphic = (svgType) => {
    switch (svgType) {
      case 'flood':
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#091325" />
            <path d="M 0 110 Q 70 95 140 110 T 280 110 T 400 105 L 400 180 L 0 180 Z" fill="#0284c7" opacity="0.45" />
            <path d="M 0 125 Q 60 115 130 125 T 260 120 T 400 125 L 400 180 L 0 180 Z" fill="#00e5c9" opacity="0.35" />
            {/* Submerged building */}
            <rect x="70" y="60" width="45" height="90" fill="#1e2c4d" rx="2" />
            <rect x="78" y="70" width="8" height="10" fill="#facc15" opacity="0.7" />
            <rect x="95" y="70" width="8" height="10" fill="#64748b" />
            <rect x="78" y="90" width="8" height="10" fill="#64748b" />
            <rect x="180" y="45" width="60" height="110" fill="#182542" rx="2" />
            {/* Water level telemetry marker */}
            <line x1="260" y1="30" x2="260" y2="160" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
            <text x="268" y="55" fill="#f43f5e" fontSize="11" fontFamily="monospace">WATER LVL +1.4m [CRITICAL]</text>
            <circle cx="260" cy="110" r="4" fill="#f43f5e" />
            <text x="20" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">SYNTHETIC SENSOR FEED // CAM-NORTH-04</text>
          </svg>
        );
      case 'collapse':
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#130d17" />
            <path d="M 120 10 L 150 70 L 135 110 L 170 170" stroke="#f43f5e" strokeWidth="3" fill="none" />
            <path d="M 150 70 L 190 85 L 210 130" stroke="#fb923c" strokeWidth="2" fill="none" />
            <polygon points="170,170 210,140 280,180 140,180" fill="#2d1c24" opacity="0.8" />
            <text x="20" y="25" fill="#f87171" fontSize="10" fontFamily="monospace">SYNTHETIC VOID SCANNER // ACOUSTIC DEFLECTION</text>
            <text x="210" y="95" fill="#facc15" fontSize="11" fontFamily="monospace">TRAPPED VICTIM VOID DETECTED</text>
            <circle cx="200" cy="110" r="6" stroke="#facc15" strokeWidth="1.5" fill="none" />
          </svg>
        );
      case 'landslide':
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#16120e" />
            <polygon points="0,0 220,0 380,180 0,180" fill="#281e18" opacity="0.9" />
            <path d="M 180 20 Q 240 70 340 180" stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" fill="none" />
            <rect x="220" y="115" width="45" height="25" rx="3" fill="#64748b" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="272" y="132" fill="#f43f5e" fontSize="10" fontFamily="monospace">VEHICLE PINNED</text>
            <circle cx="210" cy="90" r="12" fill="#78350f" opacity="0.7" />
            <circle cx="240" cy="80" r="8" fill="#78350f" opacity="0.8" />
            <text x="20" y="25" fill="#fb923c" fontSize="10" fontFamily="monospace">SYNTHETIC SLOPE RADAR // DEBRIS MASS: 200T</text>
          </svg>
        );
      case 'fire':
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#180e0c" />
            <circle cx="340" cy="90" r="80" fill="#f43f5e" opacity="0.3" />
            <circle cx="340" cy="90" r="50" fill="#f97316" opacity="0.4" />
            <circle cx="340" cy="90" r="25" fill="#facc15" opacity="0.6" />
            <line x1="40" y1="120" x2="300" y2="120" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
            <text x="40" y="110" fill="#38bdf8" fontSize="10" fontFamily="monospace">CIVILIAN EVAC CORRIDOR</text>
            <text x="20" y="25" fill="#fb923c" fontSize="10" fontFamily="monospace">SYNTHETIC THERMAL FLIR // FLAME FRONT: 14 KM/H</text>
          </svg>
        );
      case 'medical':
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#09181e" />
            <line x1="20" y1="90" x2="100" y2="90" stroke="#00e5c9" strokeWidth="1.5" />
            <path d="M 100 90 L 115 50 L 130 130 L 145 75 L 160 100 L 175 90 L 380 90" stroke="#00e5c9" strokeWidth="1.5" fill="none" />
            <rect x="250" y="40" width="130" height="40" rx="3" fill="#102533" stroke="#00e5c9" strokeWidth="1" />
            <text x="258" y="58" fill="#00e5c9" fontSize="10" fontFamily="monospace">INSULIN CRITICAL: &lt;4h</text>
            <text x="258" y="72" fill="#94a3b8" fontSize="9" fontFamily="monospace">TRAUMA CASES: 28</text>
            <text x="20" y="25" fill="#2dd4bf" fontSize="10" fontFamily="monospace">SYNTHETIC FIELD CLINIC VITAL TELEMETRY</text>
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
            <text x="20" y="25" fill="#2dd4bf" fontSize="10" fontFamily="monospace">SYNTHETIC GAS TELEMETRY // NH3: 85 PPM</text>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 400 180" className="evidence-svg-canvas">
            <rect width="400" height="180" fill="#0d1527" />
            <circle cx="200" cy="90" r="50" stroke="#00e5c9" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
            <circle cx="200" cy="90" r="4" fill="#00e5c9" />
            <text x="20" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">SYNTHETIC SENSOR LOG // POSITION VERIFIED</text>
            <text x="140" y="155" fill="#00e5c9" fontSize="11" fontFamily="monospace">COORDINATES: {incident.location?.lat}</text>
          </svg>
        );
    }
  };

  return (
    <div className="incident-detail-panel">
      {/* Top Demo Disclaimer Ribbon */}
      <div className="demo-disclaimer-ribbon font-mono">
        <Icon name="shieldCheck" size={13} color="var(--teal-400)" />
        <span>DEMO INCIDENT // SIMULATED TELEMETRY &amp; AI VALUES ONLY</span>
      </div>

      {/* Header bar */}
      <div className="detail-panel-header">
        <div className="detail-header-left">
          <div className="detail-id-row">
            <span className="detail-id-tag font-mono">{incident.id}</span>
            <span className="simulated-pill">Simulated Scenario</span>
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
          title="Approve incident in local frontend state"
        >
          <Icon name="check" size={16} />
          Approve Incident
        </button>

        <button
          className="btn btn-edit"
          onClick={() => onOpenEditModal(incident)}
          title="Edit simulated incident details locally"
        >
          <Icon name="edit" size={16} />
          Edit Incident
        </button>

        <button
          className="btn btn-reject"
          onClick={handleRejectClick}
          title="Reject report in local frontend state"
        >
          <Icon name="cross" size={16} />
          Reject / Dismiss
        </button>
      </div>

      <div className="local-action-notice">
        <Icon name="shieldCheck" size={13} color="var(--teal-400)" />
        <span>Local Frontend Interaction: Actions update in-memory session only. No live backend dispatch occurs.</span>
      </div>

      {/* Scrollable Content Body */}
      <div className="detail-scrollable-body">
        {/* Report Summary */}
        <section className="detail-section">
          <div className="section-title-with-icon">
            <Icon name="incidents" size={16} color="var(--teal-400)" />
            <h4 className="detail-subheading">Disaster Rescue Summary</h4>
          </div>
          <p className="summary-paragraph">{incident.summary}</p>

          <div className="location-detail-card">
            <div className="loc-card-row">
              <Icon name="mapPin" size={16} color="var(--teal-400)" />
              <div>
                <strong>Location:</strong> {incident.location?.name}
                <div className="font-mono text-xs text-muted">
                  Simulated Coords: {incident.location?.lat}, {incident.location?.lng}
                </div>
              </div>
            </div>
            {incident.location?.accessNotes && (
              <div className="access-notes-box">
                <span className="access-label">Rescue Access Assessment:</span> {incident.location.accessNotes}
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
              {incident.aiTriage?.modelTag || 'Simulated Edge LLM'}
            </span>
          </div>

          <div className="ai-triage-body">
            <div className="triage-stat-strip">
              <div className="triage-stat-item" title="Simulated urgency priority score">
                <span className="stat-label">Simulated Urgency</span>
                <span className="stat-value font-mono text-teal">
                  {incident.aiTriage?.triageScore || 90} / 100
                </span>
              </div>
              <div className="triage-stat-item" title="Simulated AI confidence in extraction">
                <span className="stat-label">Sim AI Extraction</span>
                <span className="stat-value font-mono">
                  {Math.round((incident.confidenceScore || 0) * 100)}%
                </span>
              </div>
              <div className="triage-stat-item" title="Simulated cryptographic trust score">
                <span className="stat-label">Sim Mesh Trust</span>
                <span className="stat-value font-mono">
                  {Math.round((incident.trustScore || 0) * 100)}%
                </span>
              </div>
            </div>

            <div className="ai-reasoning-box">
              <div className="reasoning-block">
                <span className="reasoning-tag">Simulated Triage Analysis:</span>
                <p>{incident.aiTriage?.urgencyReasoning}</p>
              </div>

              <div className="reasoning-block">
                <span className="reasoning-tag">Simulated Rescue Recommendation:</span>
                <p className="text-teal">{incident.aiTriage?.recommendedAction}</p>
              </div>

              <div className="reasoning-block mesh-provenance">
                <span className="reasoning-tag">Simulated Mesh Provenance:</span>
                <p className="font-mono text-xs">{incident.aiTriage?.meshProvenance}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Evidence Photo Placeholder / Synthetic Visualizer */}
        <section className="detail-section">
          <div className="section-title-with-icon">
            <Icon name="camera" size={16} color="var(--teal-400)" />
            <h4 className="detail-subheading">Field Sensor Evidence (Simulated)</h4>
          </div>

          <div className="evidence-graphic-wrapper">
            {renderEvidenceGraphic(incident.evidencePhoto?.svgType)}
            <div className="evidence-caption-strip">
              <span className="caption-text">{incident.evidencePhoto?.caption}</span>
              <span className="local-photo-tag font-mono">DEMO SENSOR SNAPSHOT</span>
            </div>
          </div>
        </section>

        {/* Voice Transcript Placeholder */}
        <section className="detail-section">
          <div className="section-title-with-icon">
            <Icon name="mic" size={16} color="var(--teal-400)" />
            <h4 className="detail-subheading">Mesh Voice Telemetry (Simulated)</h4>
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
                  {isPlayingAudio ? '00:04 / 00:18 (Playing Simulated Audio)' : '00:00 / 00:18 (Simulated Audio)'}
                </div>
              </div>
              <span className="format-tag font-mono">Simulated LoRa Voice</span>
            </div>

            <div className="transcript-speech-bubble">
              <span className="transcript-label font-mono">SIMULATED LOCAL SPEECH-TO-TEXT TRANSCRIPT:</span>
              <p className="transcript-quote">{incident.voiceTranscript}</p>
            </div>
          </div>
        </section>

        {/* Witness Information & Provenance History */}
        <section className="detail-section">
          <div className="section-title-with-icon">
            <Icon name="users" size={16} color="var(--teal-400)" />
            <h4 className="detail-subheading">Witnesses &amp; Mesh Provenance (Simulated)</h4>
          </div>

          <div className="witnesses-list-container">
            <div className="witness-header-row">
              <span>{incident.witnessCount} Simulated {incident.witnessCount === 1 ? 'Witness Report' : 'Independent Witnesses'}</span>
              <span className="font-mono text-xs text-muted">First reported: {incident.displayTime}</span>
            </div>

            <div className="witness-cards-grid">
              {incident.witnesses?.map((w, idx) => (
                <div key={idx} className="witness-chip">
                  <div className="witness-chip-header">
                    <span className="witness-id font-mono">{w.id}</span>
                    <span className={`witness-verification ${w.verified ? 'is-verified' : 'unverified'}`}>
                      {w.verified ? 'Simulated Verified Node' : 'Unauthenticated Peer'}
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
            <span className="provenance-heading font-mono">SIMULATED ROUTING &amp; VERIFICATION AUDIT TRAIL:</span>
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
