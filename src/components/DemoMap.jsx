import React, { useState } from 'react';
import { Icon } from './Icons';

export function DemoMap({
  incidents = [],
  responders = [],
  selectedIncidentId,
  onSelectIncident
}) {
  const [showMeshGrid, setShowMeshGrid] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [hoveredPin, setHoveredPin] = useState(null);

  // Tactical mesh repeater towers deployed across the offline grid
  const meshNodes = [
    { id: 'NODE-01', x: 22, y: 28, label: 'Wharf Repeater #01', status: 'Online', hops: 1 },
    { id: 'NODE-02', x: 50, y: 35, label: 'Market Gateway #02', status: 'Online', hops: 2 },
    { id: 'NODE-03', x: 75, y: 58, label: 'East Industrial Node', status: 'Online', hops: 1 },
    { id: 'NODE-04', x: 38, y: 68, label: 'Shelter Hub Beacon', status: 'Online', hops: 1 },
    { id: 'NODE-05', x: 82, y: 25, label: 'Foothill High Mast', status: 'Online', hops: 2 },
    { id: 'BASE-00', x: 48, y: 52, label: 'EOC Base Station', status: 'Online', hops: 0 }
  ];

  const meshLinks = [
    { from: 'BASE-00', to: 'NODE-01' },
    { from: 'BASE-00', to: 'NODE-02' },
    { from: 'BASE-00', to: 'NODE-03' },
    { from: 'BASE-00', to: 'NODE-04' },
    { from: 'NODE-02', to: 'NODE-05' },
    { from: 'NODE-01', to: 'NODE-02' },
    { from: 'NODE-03', to: 'NODE-05' }
  ];

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'var(--critical)';
      case 'high':
        return 'var(--high)';
      case 'medium':
        return 'var(--medium)';
      case 'low':
        return 'var(--low)';
      default:
        return 'var(--teal-400)';
    }
  };

  return (
    <div className="demo-map-wrapper">
      {/* Map Control Strip */}
      <div className="map-toolbar-header">
        <div className="map-title-group">
          <Icon name="ripple" size={18} color="var(--teal-400)" />
          <div>
            <h3 className="map-title">Tactical Mesh Geo-Grid</h3>
            <span className="map-label-sub font-mono">
              DEMO ILLUSTRATIVE MAP // INDEPENDENT OF EXTERNAL TILES // OFFLINE READY
            </span>
          </div>
        </div>

        <div className="map-toggles">
          <label className="map-toggle-label">
            <input
              type="checkbox"
              checked={showMeshGrid}
              onChange={(e) => setShowMeshGrid(e.target.checked)}
            />
            <span>Mesh Nodes ({meshNodes.length})</span>
          </label>

          <label className="map-toggle-label">
            <input
              type="checkbox"
              checked={showResponders}
              onChange={(e) => setShowResponders(e.target.checked)}
            />
            <span>Responders ({responders.length})</span>
          </label>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="map-canvas-container">
        <svg viewBox="0 0 1000 600" className="tactical-map-svg">
          <defs>
            {/* Grid Pattern */}
            <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16233d" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#24385f" />
            </pattern>

            <pattern id="meshHexPattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 80 20 L 80 60 L 40 80 L 0 60 L 0 20 Z" fill="none" stroke="#131e33" strokeWidth="0.5" />
            </pattern>

            {/* Pulsing beacon glow filters */}
            <filter id="glowTeal" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowCritical" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Map Base & Grid */}
          <rect width="1000" height="600" fill="#090f1b" />
          <rect width="1000" height="600" fill="url(#tacticalGrid)" />
          <rect width="1000" height="600" fill="url(#meshHexPattern)" opacity="0.6" />

          {/* Simulated Geographical Land & Water Features */}
          <g className="geographic-contours" opacity="0.4">
            {/* River corridor */}
            <path
              d="M 120 0 C 140 140, 220 220, 200 360 C 180 500, 100 550, 80 600 L 0 600 L 0 0 Z"
              fill="#0d2847"
            />
            {/* Coastline / Marina Basin */}
            <path
              d="M 0 350 Q 180 320 280 430 T 420 600 L 0 600 Z"
              fill="#0b2440"
              opacity="0.7"
            />
            {/* East Foothill contour */}
            <path
              d="M 850 0 Q 780 180 820 300 T 960 600 L 1000 600 L 1000 0 Z"
              fill="#18253b"
              opacity="0.5"
            />
          </g>

          {/* Sector Boundary Annotations */}
          <g className="sector-labels" fill="#475569" fontSize="11" fontFamily="monospace">
            <text x="50" y="30">SECTOR 1 // NORTH BASIN</text>
            <text x="420" y="30">SECTOR 2 // CENTRAL METRO</text>
            <text x="750" y="30">SECTOR 3 // EAST RIDGE</text>
            <text x="60" y="580">SECTOR 4 // LOWER MARINA</text>
            <text x="450" y="580">SECTOR 5 // COMM SHELTER</text>
            <text x="750" y="580">SECTOR 6 // IND PARK</text>
          </g>

          {/* Mesh Network Links (Dotted Lines) */}
          {showMeshGrid && (
            <g className="mesh-network-layer">
              {meshLinks.map((link, idx) => {
                const nodeA = meshNodes.find((n) => n.id === link.from);
                const nodeB = meshNodes.find((n) => n.id === link.to);
                if (!nodeA || !nodeB) return null;
                const x1 = (nodeA.x / 100) * 1000;
                const y1 = (nodeA.y / 100) * 600;
                const x2 = (nodeB.x / 100) * 1000;
                const y2 = (nodeB.y / 100) * 600;

                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="var(--teal-500)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                );
              })}

              {/* Mesh Tower Nodes */}
              {meshNodes.map((node) => {
                const nx = (node.x / 100) * 1000;
                const ny = (node.y / 100) * 600;
                const isBase = node.id === 'BASE-00';

                return (
                  <g key={node.id} transform={`translate(${nx}, ${ny})`}>
                    {/* Radar Pulse Circle */}
                    <circle r="14" fill="none" stroke="var(--teal-400)" strokeWidth="0.8" opacity="0.3" />
                    <circle r="6" fill={isBase ? 'var(--teal-400)' : '#101a2e'} stroke="var(--teal-400)" strokeWidth="2" />
                    <circle r="2" fill="white" />
                    <text
                      x="12"
                      y="4"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Responders Layer */}
          {showResponders && (
            <g className="responders-layer">
              {responders.map((resp) => {
                if (!resp.coordinates) return null;
                const rx = (resp.coordinates.x / 100) * 1000;
                const ry = (resp.coordinates.y / 100) * 600;

                return (
                  <g
                    key={resp.id}
                    transform={`translate(${rx}, ${ry})`}
                    className="responder-map-pin"
                    onMouseEnter={() => setHoveredPin({ type: 'responder', data: resp })}
                    onMouseLeave={() => setHoveredPin(null)}
                  >
                    {/* Directional field box */}
                    <rect x="-8" y="-8" width="16" height="16" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                    <text x="12" y="3" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      {resp.callsign}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Incident Pins Layer */}
          <g className="incidents-layer">
            {incidents.map((incident) => {
              if (!incident.location?.coordinates) return null;
              const ix = (incident.location.coordinates.x / 100) * 1000;
              const iy = (incident.location.coordinates.y / 100) * 600;
              const isSelected = incident.id === selectedIncidentId;
              const isCritical = incident.severity?.toLowerCase() === 'critical';
              const pinColor = getSeverityColor(incident.severity);

              return (
                <g
                  key={incident.id}
                  transform={`translate(${ix}, ${iy})`}
                  className={`incident-map-pin ${isSelected ? 'is-selected-pin' : ''}`}
                  onClick={() => onSelectIncident(incident.id)}
                  onMouseEnter={() => setHoveredPin({ type: 'incident', data: incident })}
                  onMouseLeave={() => setHoveredPin(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer pulse wave for critical */}
                  {isCritical && (
                    <circle
                      r="18"
                      fill="none"
                      stroke="var(--critical)"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="map-pulse-anim"
                    />
                  )}

                  {/* Pin Selection Target Ring */}
                  {isSelected && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="var(--teal-400)"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Main Pin diamond / circle */}
                  <circle
                    r={isSelected ? 10 : 8}
                    fill={pinColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter={isCritical ? 'url(#glowCritical)' : 'url(#glowTeal)'}
                  />

                  {/* ID Tag */}
                  <rect
                    x="12"
                    y="-12"
                    width={incident.id.length * 7 + 10}
                    height="18"
                    rx="3"
                    fill="#0b1120"
                    stroke={isSelected ? 'var(--teal-400)' : pinColor}
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    x="16"
                    y="1"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {incident.id}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPin && (
          <div className="map-hover-tooltip">
            {hoveredPin.type === 'incident' ? (
              <>
                <div className="tooltip-header">
                  <span className="font-mono text-teal">{hoveredPin.data.id}</span>
                  <span className="tooltip-sev">{hoveredPin.data.severity}</span>
                </div>
                <div className="tooltip-title">{hoveredPin.data.title}</div>
                <div className="tooltip-sub font-mono text-xs text-muted">
                  {hoveredPin.data.location?.name} • Status: {hoveredPin.data.status}
                </div>
                <div className="tooltip-action-hint">Click pin to view full details →</div>
              </>
            ) : (
              <>
                <div className="tooltip-header">
                  <span className="font-mono text-teal">{hoveredPin.data.callsign}</span>
                  <span className="tooltip-status">{hoveredPin.data.status}</span>
                </div>
                <div className="tooltip-title">{hoveredPin.data.name}</div>
                <div className="tooltip-sub font-mono text-xs text-muted">
                  {hoveredPin.data.specialization} • Crew: {hoveredPin.data.crewCount}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="map-legend-bar">
        <div className="legend-items">
          <span className="legend-title font-mono">SEVERITY BEACONS:</span>
          <span className="legend-badge"><span className="dot dot-critical" /> Critical</span>
          <span className="legend-badge"><span className="dot dot-high" /> High</span>
          <span className="legend-badge"><span className="dot dot-medium" /> Medium</span>
          <span className="legend-badge"><span className="dot dot-low" /> Low</span>
        </div>

        <div className="legend-items">
          <span className="legend-title font-mono">TOPOLOGY:</span>
          <span className="legend-badge"><span className="dot dot-mesh" /> LoRa Mesh Node</span>
          <span className="legend-badge"><span className="dot dot-responder" /> Rescue Unit</span>
        </div>
      </div>
    </div>
  );
}
