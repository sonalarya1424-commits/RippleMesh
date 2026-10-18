-- RippleMesh SQLite Database Schema

PRAGMA foreign_keys = ON;

-- Devices participating in the mesh network
CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    role TEXT,
    display_name TEXT,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_lat REAL,
    last_lng REAL
);

-- Ingested reports from citizens, field agents, or mesh relays
CREATE TABLE IF NOT EXISTS reports (
    report_id TEXT PRIMARY KEY,
    device_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lat REAL,
    lng REAL,
    hazard_type TEXT,
    summary TEXT,
    language TEXT,
    transcript TEXT,
    reporter_conf REAL,
    capture_mode TEXT CHECK(capture_mode IN ('in_app', 'gallery')),
    payload_bytes INTEGER,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE SET NULL
);

-- Media attachments linked to reports
CREATE TABLE IF NOT EXISTS media (
    media_id TEXT PRIMARY KEY,
    report_id TEXT,
    file_path TEXT,
    phash TEXT,
    gemma_caption TEXT,
    captured_at TIMESTAMP,
    gps_stamp TEXT,
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
);

-- Report credibility and authenticity verification results
CREATE TABLE IF NOT EXISTS verifications (
    verification_id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    trust_score REAL,
    in_app_capture INTEGER,
    duplicate_of TEXT,
    claim_photo_match REAL,
    location_plausible INTEGER,
    detector_ai_prob REAL,
    notes TEXT,
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    FOREIGN KEY (duplicate_of) REFERENCES reports(report_id) ON DELETE SET NULL
);

-- Corroborated disaster/hazard incidents
CREATE TABLE IF NOT EXISTS incidents (
    incident_id TEXT PRIMARY KEY,
    hazard_type TEXT,
    lat REAL,
    lng REAL,
    first_reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    independent_reports INTEGER DEFAULT 1,
    confidence REAL DEFAULT 0.0,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'triaged', 'approved', 'dispatched', 'resolved', 'false_alarm', 'rejected')),
    priority_score REAL DEFAULT 0.0
);

-- Association between incidents and contributing reports
CREATE TABLE IF NOT EXISTS incident_reports (
    incident_id TEXT NOT NULL,
    report_id TEXT NOT NULL,
    independent INTEGER DEFAULT 1,
    PRIMARY KEY(incident_id, report_id),
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE,
    FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
);

-- Emergency triage assessment records
CREATE TABLE IF NOT EXISTS triage (
    triage_id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    life_threat TEXT CHECK(life_threat IN ('now', 'soon', 'none')),
    time_to_harm TEXT CHECK(time_to_harm IN ('seconds', 'minutes', 'hours')),
    vulnerability TEXT, -- JSON array
    rescuable_in_time REAL,
    responder_type TEXT,
    reasoning TEXT,
    model_used TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE
);

-- Responder units available for dispatch
CREATE TABLE IF NOT EXISTS responders (
    responder_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    lat REAL,
    lng REAL,
    available INTEGER DEFAULT 1,
    contact TEXT
);

-- Tactical dispatch orders and mission outcomes
CREATE TABLE IF NOT EXISTS dispatches (
    dispatch_id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    responder_id TEXT NOT NULL,
    approved_by TEXT,
    approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'edited', 'rejected', 'auto_alerted')),
    task_card TEXT, -- JSON
    dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    outcome TEXT CHECK(outcome IS NULL OR outcome IN ('reached', 'resolved', 'false_alarm', 'failed')),
    outcome_at TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES responders(responder_id) ON DELETE RESTRICT
);

-- Inter-agent communication logs
CREATE TABLE IF NOT EXISTS agent_messages (
    message_id TEXT PRIMARY KEY,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    from_device TEXT,
    to_device TEXT,
    msg_type TEXT NOT NULL,
    ref_id TEXT,
    body TEXT, -- JSON
    bytes INTEGER
);

-- Vulnerable households / residential mapping
CREATE TABLE IF NOT EXISTS households (
    household_id TEXT PRIMARY KEY,
    lat REAL,
    lng REAL,
    flags TEXT,
    contact TEXT
);

-- Audit log for administrative and automated system actions
CREATE TABLE IF NOT EXISTS audit_log (
    log_id TEXT PRIMARY KEY,
    at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    incident_id TEXT,
    detail TEXT,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE SET NULL
);

-- Indexes for performance and quick retrieval
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_messages_sent_at ON agent_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_reports_device_id ON reports(device_id);
CREATE INDEX IF NOT EXISTS idx_media_report_id ON media(report_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_incident_id ON dispatches(incident_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_responder_id ON dispatches(responder_id);
