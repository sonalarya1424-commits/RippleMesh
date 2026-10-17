import React, { useState } from 'react';
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

export function App() {
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [responders, setResponders] = useState(INITIAL_RESPONDERS);
  const [agentEvents, setAgentEvents] = useState(INITIAL_AGENT_EVENTS);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState('RM-8201');
  const [listFilter, setListFilter] = useState('all');
  const [editingIncident, setEditingIncident] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleApproveIncident = (id) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'Approved' } : inc))
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
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'Rejected' } : inc))
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

  // Simulate a New Incoming Distress Burst
  const handleSimulateDistressBurst = () => {
    const nextNum = 8200 + incidents.length + 1;
    const newId = `RM-${nextNum}`;
    const newIncident = {
      id: newId,
      hazardType: 'Medical Emergency',
      title: `Submerged Vehicle with Entrapped Driver near Pier ${incidents.length + 2}`,
      location: {
        name: `Sector 1 — Coastal Accessway, Checkpoint ${incidents.length}`,
        coordinates: { x: 20 + Math.floor(Math.random() * 60), y: 25 + Math.floor(Math.random() * 50) },
        lat: '13.0845° N',
        lng: '80.2760° E',
        accessNotes: 'Water level rising quickly; urgent extraction requested'
      },
      severity: 'Critical',
      confidenceScore: 0.93,
      trustScore: 0.88,
      witnessCount: 2,
      status: 'Pending Review',
      reportedAt: new Date().toISOString(),
      displayTime: 'Just now',
      summary: 'Ad-hoc LoRa beacon received distress packet. Vehicle stalled in rising floodway with driver unable to open doors due to hydrostatic pressure.',
      voiceTranscript: "\"Can anyone hear me on this channel? My truck is stuck in the floodway under the bypass, water is rising up to the windshield! Doors won't open!\"",
      evidencePhoto: {
        type: 'synthetic_sensor',
        caption: 'Field Telemetry — Pressure anomaly & vehicle transponder echo',
        svgType: 'flood'
      },
      aiTriage: {
        isSimulated: true,
        modelTag: 'Llama-3-Emergency-8B (Simulated Local Engine)',
        triageScore: 97,
        urgencyReasoning: 'Critical life threat from rapid compartment submergence. Priority 1 dispatch recommended.',
        recommendedAction: 'Dispatch closest Swiftwater unit or aerial rescue asset immediately.',
        meshProvenance: 'Relayed via 2 mobile citizen mesh nodes to Base Station.'
      },
      provenance: [
        { time: new Date().toLocaleTimeString(), source: 'Citizen App Beacon', detail: `Distress ping burst broadcasted on LoRa 915MHz` },
        { time: new Date().toLocaleTimeString(), source: 'Reporter Agent', detail: 'Local Whisper transcribed voice emergency' }
      ],
      witnesses: [
        { id: 'W-New1', role: 'Driver / Reporter', verified: true, method: 'Authenticated Mesh App' },
        { id: 'W-New2', role: 'Passing Pedestrian', verified: false, method: 'BLE Hop' }
      ]
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedIncidentId(newId);

    // Agent events
    const reporterEvt = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relativeTime: 'Just now',
      agent: 'Reporter',
      agentRole: 'Distress Ingestion & Natural Language Parsing',
      type: 'ingest',
      badgeColor: 'purple',
      incidentId: newId,
      message: `Ingested new offline distress burst ${newId} from coastal sector. Decoded voice telemetry.`,
      details: 'Extracted high water level warning & entrapment tags.',
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
    </div>
  );
}

export default App;
