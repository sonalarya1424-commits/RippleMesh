import React, { useState } from 'react';
import { Icon } from './Icons';

export function AgentActivityFeed({
  events = [],
  onSelectIncident,
  onAddSimulatedEvent
}) {
  const [selectedAgent, setSelectedAgent] = useState('all');

  const agentsList = ['Reporter', 'Verifier', 'Relay', 'Corroboration', 'Coordinator'];

  const filteredEvents = events.filter((evt) => {
    if (selectedAgent === 'all') return true;
    return evt.agent?.toLowerCase() === selectedAgent.toLowerCase();
  });

  const getAgentColor = (agent) => {
    switch (agent?.toLowerCase()) {
      case 'reporter':
        return 'agent-reporter'; // purple
      case 'verifier':
        return 'agent-verifier'; // emerald green
      case 'relay':
        return 'agent-relay'; // cyan blue
      case 'corroboration':
        return 'agent-corroboration'; // amber
      case 'coordinator':
        return 'agent-coordinator'; // electric teal
      default:
        return 'agent-default';
    }
  };

  const getAgentIcon = (agent) => {
    switch (agent?.toLowerCase()) {
      case 'reporter':
        return 'mic';
      case 'verifier':
        return 'shieldCheck';
      case 'relay':
        return 'radio';
      case 'corroboration':
        return 'layers';
      case 'coordinator':
        return 'cpu';
      default:
        return 'sparkles';
    }
  };

  return (
    <div className="agent-feed-container">
      {/* Feed Header */}
      <div className="agent-feed-header">
        <div className="feed-title-row">
          <div className="title-with-badge">
            <h2 className="section-heading">Multi-Agent Activity Feed</h2>
            <span className="count-pill">{filteredEvents.length} Events</span>
          </div>

          <div className="demo-local-badge" title="No backend connected. Local client execution only.">
            <span className="demo-dot" />
            <span className="demo-text">DEMO / LOCAL MODE</span>
          </div>
        </div>

        <p className="feed-subheading">
          Autonomous coordination agents operating over offline mesh protocols. All logs simulated client-side.
        </p>

        {/* Agent Filter Buttons */}
        <div className="agent-filter-toolbar">
          <button
            className={`agent-filter-chip ${selectedAgent === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedAgent('all')}
          >
            All Agents ({events.length})
          </button>
          {agentsList.map((agentName) => {
            const count = events.filter((e) => e.agent?.toLowerCase() === agentName.toLowerCase()).length;
            return (
              <button
                key={agentName}
                className={`agent-filter-chip ${selectedAgent.toLowerCase() === agentName.toLowerCase() ? 'active' : ''}`}
                onClick={() => setSelectedAgent(agentName)}
              >
                <span className={`mini-agent-dot ${getAgentColor(agentName)}`} />
                {agentName} <span className="chip-count font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Timeline */}
      <div className="feed-events-scroll">
        {filteredEvents.length === 0 ? (
          <div className="empty-state-card">
            <Icon name="cpu" size={28} color="var(--text-muted)" />
            <p className="empty-state-title">No events for selected agent filter</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAgent('all')}>
              Show All Agents
            </button>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div key={evt.id} className="feed-event-card">
              <div className="feed-event-time-col font-mono">
                <span className="event-clock">{evt.timestamp}</span>
                <span className="event-rel text-muted text-xs">{evt.relativeTime}</span>
              </div>

              {/* Event node indicator */}
              <div className={`event-icon-avatar ${getAgentColor(evt.agent)}`}>
                <Icon name={getAgentIcon(evt.agent)} size={15} />
              </div>

              {/* Content body */}
              <div className="feed-event-content">
                <div className="feed-event-top-line">
                  <div className="agent-identity">
                    <span className="agent-name">{evt.agent} Agent</span>
                    <span className="agent-role text-muted font-mono text-xs">{evt.agentRole}</span>
                  </div>

                  <div className="feed-event-meta-right">
                    {evt.incidentId && (
                      <button
                        className="incident-link-badge font-mono"
                        onClick={() => onSelectIncident && onSelectIncident(evt.incidentId)}
                        title="Jump to associated incident"
                      >
                        Ref: {evt.incidentId} →
                      </button>
                    )}
                    <span className="simulated-pill">Simulated</span>
                  </div>
                </div>

                <p className="feed-event-message">{evt.message}</p>

                {evt.details && (
                  <div className="feed-event-subdetail font-mono text-xs">
                    <span className="text-teal">▸</span> {evt.details}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Local Simulation Trigger */}
      <div className="feed-footer-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onAddSimulatedEvent}
          title="Emit a simulated agent check in frontend state"
        >
          <Icon name="sparkles" size={14} color="var(--teal-400)" />
          Simulate Next Agent Cycle
        </button>
        <span className="text-muted text-xs">Simulated in-memory event scheduler</span>
      </div>
    </div>
  );
}
