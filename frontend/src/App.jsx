import React, { useState, useEffect } from 'react';
import { INITIAL_INCIDENTS } from './data/incidents';
import { INITIAL_RESPONDERS } from './data/responders';
import { INITIAL_AGENT_EVENTS } from './data/agentEvents';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { IncidentList } from './components/IncidentList';
import { IncidentDetail } from './components/IncidentDetail';
import { AgentActivityFeed } from './components/AgentActivityFeed';
import { DemoMap } from './components/DemoMap';
import { RespondersView } from './components/RespondersView';
import { EditIncidentModal } from './components/EditIncidentModal';
import { SubmitReportModal } from './components/SubmitReportModal';
import { getAllLocalReports, updateLocalReport, revokeAllPhotoUrls } from './utils/indexedDB';

export function App() {
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [responders, setResponders] = useState(INITIAL_RESPONDERS);
  const [agentEvents, setAgentEvents] = useState(INITIAL_AGENT_EVENTS);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState('RM-8201');
  const [listFilter, setListFilter] = useState('all');
  const [editingIncident, setEditingIncident] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Restore local IndexedDB reports on mount
  useEffect(() => {
    let isMounted = true;
    getAllLocalReports()
      .then((storedReports) => {
        if (!isMounted || !storedReports || storedReports.length === 0) return;
        setIncidents((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const uniqueNew = storedReports.filter((r) => !existingIds.has(r.id));
          return [...uniqueNew, ...prev];
        });
      })
      .catch((err) => {
        console.warn('Failed to load local reports from IndexedDB:', err);
      });

    return () => {
      isMounted = false;
      revokeAllPhotoUrls();
    };
  }, []);

  // Retrieve current selected incident object
  const selectedIncident = incidents.find((inc) => inc.id === selectedIncidentId) || null;

  // Count pending reviews for sidebar badge
  const pendingCount = incidents.filter(
    (i) => i.status?.toLowerCase() === 'pending review' || i.status?.toLowerCase() === 'pending'
  ).length;

  // Handlers for Local Frontend State Mutations
  const handleSelectIncident = (id) => {
    setSelectedIncidentId(id);
    // If on activity or responders view, allow switching to view incident
    if (currentView === 'activity' || currentView === 'responders') {
      setCurrentView('incidents');
    }
  };

  const handleReportSubmitted = (newIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncidentId(newIncident.id);
    if (currentView !== 'dashboard' && currentView !== 'incidents') {
      setCurrentView('incidents');
    }

    const newEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relativeTime: 'Just now',
      agent: 'Coordinator',
      agentRole: 'Mission Dispatch & Resource Allocation',
      type: 'action',
      badgeColor: 'teal',
      incidentId: newIncident.id,
      message: `[LOCAL DEMO] Saved emergency intake report ${newIncident.id} (${newIncident.hazardType}) to local device storage. Awaiting mesh sync / operator review.`,
      details: `Reported location: ${newIncident.location?.name || 'Local'}. Description: ${(newIncident.summary || '').slice(0, 70)}...`,
      isSimulated: true
    };
    setAgentEvents((prev) => [newEvent, ...prev]);
  };

  const handleApproveIncident = (id) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const updated = { ...inc, status: 'Approved' };
          if (inc.isLocalSubmission) {
            updateLocalReport(updated).catch(() => {});
          }
          return updated;
        }
        return inc;
      })
    );

    // Append simulated event to Agent Feed
    const newEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relativeTime: 'Just now',
      agent: 'Coordinator',
      agentRole: 'Mission Dispatch & Resource Allocation',
      type: 'action',
      badgeColor: 'teal',
      incidentId: id,
      message: `Coordinator manually APPROVED incident ${id}. Prioritizing resource allocation queue. (Simulated local state)`,
      details: 'Status changed to Approved in local browser session.',
      isSimulated: true
    };
    setAgentEvents((prev) => [newEvent, ...prev]);
  };

  const handleRejectIncident = (id) => {
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === id) {
          const updated = { ...inc, status: 'Rejected' };
          if (inc.isLocalSubmission) {
            updateLocalReport(updated).catch(() => {});
          }
          return updated;
        }
        return inc;
      })
    );

    const newEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relativeTime: 'Just now',
      agent: 'Coordinator',
      agentRole: 'Mission Dispatch & Resource Allocation',
      type: 'action',
      badgeColor: 'teal',
      incidentId: id,
      message: `Coordinator REJECTED incident ${id}. Dismissed as duplicate or non-actionable report. (Simulated local state)`,
      details: 'Status changed to Rejected in local browser session.',
      isSimulated: true
    };
    setAgentEvents((prev) => [newEvent, ...prev]);
  };

  const handleOpenEditModal = (incident) => {
    setEditingIncident(incident);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedIncident) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === updatedIncident.id ? updatedIncident : inc))
    );
    if (updatedIncident.isLocalSubmission) {
      updateLocalReport(updatedIncident).catch(() => {});
    }

    const newEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relativeTime: 'Just now',
      agent: 'Coordinator',
      agentRole: 'Mission Dispatch & Resource Allocation',
      type: 'action',
      badgeColor: 'teal',
      incidentId: updatedIncident.id,
      message: `Coordinator UPDATED record for incident ${updatedIncident.id} (Severity: ${updatedIncident.severity}, Status: ${updatedIncident.status}).`,
      details: 'Local incident details modified by operator.',
      isSimulated: true
    };
    setAgentEvents((prev) => [newEvent, ...prev]);
  };

  // Summary Card Click Filter Handler
  const handleSelectSummaryFilter = (filterType) => {
    if (filterType === 'responders-view') {
      setCurrentView('responders');
    } else {
      setListFilter(filterType);
      setCurrentView('incidents');
    }
  };

  // Responder Status Cycle
  const handleUpdateResponderStatus = (id) => {
    setResponders((prev) =>
      prev.map((resp) => {
        if (resp.id !== id) return resp;
        let nextStatus = 'Available';
        if (resp.status === 'Available') nextStatus = 'En Route';
        else if (resp.status === 'En Route') nextStatus = 'On Scene';
        else if (resp.status === 'On Scene') nextStatus = 'Available';
        return { ...resp, status: nextStatus };
      })
    );
  };

  // Simulate a New Incoming Disaster Distress Burst
  const handleSimulateDistressBurst = () => {
    const nextNum = 8200 + incidents.length + 1;
    const newId = `RM-${nextNum}`;

    const scenarios = [
      {
        hazardType: 'Flood Rescue',
        title: `Submerged Vehicle with Entrapped Driver near Pier ${incidents.length + 2}`,
        location: {
          name: `Sector 1 — Coastal Highway Underpass, Point ${incidents.length}`,
          coordinates: { x: 22 + Math.floor(Math.random() * 30), y: 30 + Math.floor(Math.random() * 20) },
          lat: '13.0845° N',
          lng: '80.2760° E',
          accessNotes: 'Water level rising past hood; boat or high-axle winch rig required'
        },
        severity: 'Critical',
        confidenceScore: 0.94,
        trustScore: 0.89,
        witnessCount: 2,
        summary: 'Ad-hoc LoRa beacon received distress packet. Vehicle stalled in rising floodway with driver unable to open doors due to hydrostatic pressure.',
        voiceTranscript: "\"Can anyone hear me on this channel? My truck is stuck in the floodway under the bypass, water is rising up to the windshield! Doors won't open!\"",
        svgType: 'flood',
        urgencyReasoning: '[SIMULATED REASONING] Critical life threat from rapid cabin inundation. Priority 1 extraction recommended.',
        recommendedAction: 'Dispatch closest Swiftwater Rescue Unit with pneumatic glass punch and flotation ring.'
      },
      {
        hazardType: 'Earthquake Collapse',
        title: `Trapped Occupants in Collapsed Cellar Void near Market`,
        location: {
          name: `Sector 2 — Old Quarter Bakery Basement, Alley 4`,
          coordinates: { x: 50 + Math.floor(Math.random() * 15), y: 20 + Math.floor(Math.random() * 15) },
          lat: '13.0880° N',
          lng: '80.2830° E',
          accessNotes: 'Heavy concrete beams shifted over cellar stairwell; USAR shoring struts required'
        },
        severity: 'Critical',
        confidenceScore: 0.78,
        trustScore: 0.65,
        witnessCount: 1, // Single witness critical rescue!
        summary: 'Single uncorroborated packet from Bluetooth mesh peer. Two bakery workers trapped in reinforced basement after ground floor collapsed. Air supply concern.',
        voiceTranscript: "\"We are in the flour storage cellar under the shop! Main floor collapsed overhead. We have some air but dust is thick, please dig us out!\"",
        svgType: 'collapse',
        urgencyReasoning: '[SIMULATED REASONING] Potential void-space asphyxiation. Decoupled triage policy ensures CRITICAL priority is retained despite single witness report.',
        recommendedAction: 'Dispatch USAR Heavy Search Unit with acoustic probes and air injection hose.'
      },
      {
        hazardType: 'Landslide Rescue',
        title: `Mudslide Buried Passenger Van on Ridge Switchback`,
        location: {
          name: `Sector 3 — Mountain Pass, Mile Marker 9`,
          coordinates: { x: 80 + Math.floor(Math.random() * 10), y: 20 + Math.floor(Math.random() * 15) },
          lat: '13.1040° N',
          lng: '80.3040° E',
          accessNotes: 'Debris blocking access from both directions; aerial winch extraction or heavy bulldozer needed'
        },
        severity: 'Critical',
        confidenceScore: 0.92,
        trustScore: 0.91,
        witnessCount: 3,
        summary: 'Saturated hill slope slipped over highway. Passenger van carrying 6 evacuees partially crushed against cliff guardrail. Multiple lacerations and limb entrapments.',
        voiceTranscript: "\"Landslide hit our transit van! The roof caved in on the back seats. Three passengers are trapped by debris and bleeding! We need heavy cutters!\"",
        svgType: 'landslide',
        urgencyReasoning: '[SIMULATED REASONING] Active structural crush and severe trauma. High risk of secondary soil movement.',
        recommendedAction: 'Deploy Mountain Extrication Team with hydraulic cutters and trauma stabilization packs.'
      },
      {
        hazardType: 'Wildfire Rescue',
        title: `Evacuation Convoy Surrounded by Fast Brushfire Flank`,
        location: {
          name: `Sector 4 — Ridge Connector Road, North Spur`,
          coordinates: { x: 70 + Math.floor(Math.random() * 15), y: 15 + Math.floor(Math.random() * 20) },
          lat: '13.1140° N',
          lng: '80.2920° E',
          accessNotes: 'Smoke engulfing roadway; thermal FLIR drone guidance needed for safe convoy escort'
        },
        severity: 'High',
        confidenceScore: 0.89,
        trustScore: 0.85,
        witnessCount: 4,
        summary: 'Sudden wind shift pushed brushfire flank within 30m of rural evacuation road. 8 civilian vehicles unable to reverse due to fallen tree behind them.',
        voiceTranscript: "\"Fire crossed the road behind us! A fallen pine tree is blocking reverse escape. Smoke is too thick to breathe without masks. Send water tender!\"",
        svgType: 'fire',
        urgencyReasoning: '[SIMULATED REASONING] Smoke inhalation and heat radiation hazard. Immediate chain-saw clearing or water fog curtain required.',
        recommendedAction: 'Dispatch Fire Escort Tender and Chainsaw Clearing Crew to open emergency escape corridor.'
      }
    ];

    const scenario = scenarios[incidents.length % scenarios.length];

    const newIncident = {
      id: newId,
      hazardType: scenario.hazardType,
      isSimulated: true,
      demoNotice: 'SIMULATED INCIDENT — Injected during operator testing session.',
      title: scenario.title,
      location: scenario.location,
      severity: scenario.severity,
      confidenceScore: scenario.confidenceScore,
      trustScore: scenario.trustScore,
      witnessCount: scenario.witnessCount,
      status: 'Pending Review',
      reportedAt: new Date().toISOString(),
      displayTime: 'Just now',
      summary: scenario.summary,
      voiceTranscript: scenario.voiceTranscript,
      evidencePhoto: {
        type: 'synthetic_sensor',
        caption: `Simulated Telemetry Snapshot — ${scenario.hazardType} Sensor Node`,
        svgType: scenario.svgType
      },
      aiTriage: {
        isSimulated: true,
        modelTag: 'Llama-3-Emergency-8B (Simulated Local Engine)',
        triageScore: scenario.severity === 'Critical' ? 96 : 85,
        urgencyReasoning: scenario.urgencyReasoning,
        recommendedAction: scenario.recommendedAction,
        meshProvenance: 'Relayed via mobile mesh nodes to Base Station (Simulated).'
      },
      provenance: [
        { time: new Date().toLocaleTimeString(), source: 'Citizen Mesh Beacon', detail: 'Distress burst broadcasted on LoRa 915MHz (Simulated)' },
        { time: new Date().toLocaleTimeString(), source: 'Reporter Agent (Simulated)', detail: 'Speech transcribed by local Whisper model' }
      ],
      witnesses: [
        { id: 'W-New1', role: 'Distressed Civilian', verified: true, method: 'Authenticated Mesh App' },
        { id: 'W-New2', role: 'Passing Scout', verified: scenario.witnessCount > 1, method: 'BLE Hop' }
      ]
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncidentId(newId);

    const reporterEvt = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relativeTime: 'Just now',
      agent: 'Reporter',
      agentRole: 'Distress Ingestion & Natural Language Parsing (Simulated)',
      type: 'ingest',
      badgeColor: 'purple',
      incidentId: newId,
      message: `[SIMULATED INGESTION] Ingested new offline distress burst ${newId} (${scenario.hazardType}) via local mesh beacon.`,
      details: `Extracted urgent rescue keywords from voice telemetry. Priority triage initiated.`,
      isSimulated: true
    };

    setAgentEvents((prev) => [reporterEvt, ...prev]);
  };

  // Simulate Next Multi-Agent Cycle Event
  const handleAddSimulatedAgentCycle = () => {
    const cycleEvents = [
      {
        agent: 'Relay',
        agentRole: 'Mesh Packet Hop & Routing Optimiser',
        message: 'Optimized routing table across 14 mesh repeaters. Packet loss: 0.12%, average hop count: 2.1.',
        details: 'Self-healing route selected around power outage zone.'
      },
      {
        agent: 'Verifier',
        agentRole: 'Sensor & Signal Authenticity Check',
        message: 'Completed signature verification on 8 active mesh telemetry streams. All keys verified.',
        details: 'Hardware cryptographic tokens confirmed authentic.'
      },
      {
        agent: 'Corroboration',
        agentRole: 'Multi-Source Clustering & Consensus',
        message: 'Evaluated spatial clusters for 7 incidents. Urgency decoupled triage verified.',
        details: 'Single-source critical incidents preserved at high priority.'
      },
      {
        agent: 'Coordinator',
        agentRole: 'Mission Dispatch & Resource Allocation',
        message: 'Re-evaluated responder battery levels and travel vectors. Ready for dispatch recommendations.',
        details: 'Responders Aqua-Lead 1 and USAR-Breaker monitored.'
      }
    ];

    const pick = cycleEvents[Math.floor(Math.random() * cycleEvents.length)];
    const newEvt = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relativeTime: 'Just now',
      agent: pick.agent,
      agentRole: pick.agentRole,
      type: 'action',
      badgeColor: 'teal',
      incidentId: selectedIncidentId,
      message: pick.message,
      details: pick.details,
      isSimulated: true
    };
    setAgentEvents((prev) => [newEvt, ...prev]);
  };

  // Reset to initial mock dataset
  const handleResetData = () => {
    setIncidents(INITIAL_INCIDENTS);
    setResponders(INITIAL_RESPONDERS);
    setAgentEvents(INITIAL_AGENT_EVENTS);
    setSelectedIncidentId('RM-8201');
    setListFilter('all');
  };

  return (
    <div className="app-root-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        pendingCount={pendingCount}
      />

      {/* Main Viewport */}
      <main className="app-main-viewport">
        {/* Top Navbar */}
        <Navbar
          onSimulateDistress={handleSimulateDistressBurst}
          onResetData={handleResetData}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          currentView={currentView}
        />

        {/* View Body */}
        <div className="view-body-wrapper">
          {/* Always show summary cards on dashboard and incidents views */}
          {(currentView === 'dashboard' || currentView === 'incidents') && (
            <SummaryCards
              incidents={incidents}
              responders={responders}
              onSelectFilter={handleSelectSummaryFilter}
              activeFilter={listFilter}
            />
          )}

          {/* View: Dashboard */}
          {currentView === 'dashboard' && (
            <>
              {/* Split View: Ranked Queue + Details Panel */}
              <div className="split-view-container">
                <IncidentList
                  incidents={incidents}
                  selectedIncidentId={selectedIncidentId}
                  onSelectIncident={handleSelectIncident}
                  initialFilter={listFilter}
                  onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                />

                <IncidentDetail
                  incident={selectedIncident}
                  onApprove={handleApproveIncident}
                  onReject={handleRejectIncident}
                  onOpenEditModal={handleOpenEditModal}
                  onClose={() => setSelectedIncidentId(null)}
                />
              </div>

              {/* Demo Tactical Map & Agent Feed Grid */}
              <div className="dashboard-grid-layout">
                <DemoMap
                  incidents={incidents}
                  responders={responders}
                  selectedIncidentId={selectedIncidentId}
                  onSelectIncident={handleSelectIncident}
                />

                <AgentActivityFeed
                  events={agentEvents.slice(0, 6)}
                  onSelectIncident={handleSelectIncident}
                  onAddSimulatedEvent={handleAddSimulatedAgentCycle}
                />
              </div>
            </>
          )}

          {/* View: Incidents Full Queue */}
          {currentView === 'incidents' && (
            <div className="split-view-container">
              <IncidentList
                incidents={incidents}
                selectedIncidentId={selectedIncidentId}
                onSelectIncident={handleSelectIncident}
                initialFilter={listFilter}
                onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
              />

              <IncidentDetail
                incident={selectedIncident}
                onApprove={handleApproveIncident}
                onReject={handleRejectIncident}
                onOpenEditModal={handleOpenEditModal}
                onClose={() => setSelectedIncidentId(null)}
              />
            </div>
          )}

          {/* View: Agent Activity Feed */}
          {currentView === 'activity' && (
            <AgentActivityFeed
              events={agentEvents}
              onSelectIncident={handleSelectIncident}
              onAddSimulatedEvent={handleAddSimulatedAgentCycle}
            />
          )}

          {/* View: Responders */}
          {currentView === 'responders' && (
            <RespondersView
              responders={responders}
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onUpdateResponderStatus={handleUpdateResponderStatus}
            />
          )}
        </div>
      </main>

      {/* Edit Incident Modal */}
      <EditIncidentModal
        incident={editingIncident}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
      />

      {/* Submit Emergency Report Modal */}
      <SubmitReportModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
}

export default App;
