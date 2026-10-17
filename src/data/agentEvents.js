/**
 * RippleMesh Mock Multi-Agent Event Stream — Disaster Rescue Coordination Focus
 *
 * IMPORTANT DEMO DISCLAIMER:
 * All agent events, routing telemetry, and triage logs are SIMULATED DEMO VALUES.
 * No real backend models, live LoRa radios, or autonomous dispatch systems are connected.
 * Agents: Reporter, Verifier, Relay, Corroboration, Coordinator
 */

export const INITIAL_AGENT_EVENTS = [
  {
    id: "EVT-109",
    timestamp: "10:48:12",
    relativeTime: "2m ago",
    agent: "Coordinator",
    agentRole: "Mission Dispatch & Resource Allocation (Simulated)",
    type: "action",
    badgeColor: "teal",
    incidentId: "RM-8201",
    message: "[SIMULATED DISPATCH] Evaluated flood depth raster. Routed Swiftwater Rescue Alpha via Marina Eastern Accessway with 2 zodiac crafts.",
    details: "Computed terrain flood velocity model. Avoids submerged choke point at Pier 2.",
    isSimulated: true
  },
  {
    id: "EVT-108",
    timestamp: "10:46:55",
    relativeTime: "4m ago",
    agent: "Verifier",
    agentRole: "Sensor & Signal Authenticity Check (Simulated)",
    type: "verification",
    badgeColor: "green",
    incidentId: "RM-8201",
    message: "[SIMULATED CHECK] Authenticated Ed25519 payload signature from neighborhood beacon against offline ledger. Water sensor consistency confirmed at 96%.",
    details: "Zero hash collisions. Telemetry matches flood surge rate of +0.4m/hr.",
    isSimulated: true
  },
  {
    id: "EVT-107",
    timestamp: "10:45:30",
    relativeTime: "5m ago",
    agent: "Relay",
    agentRole: "Mesh Packet Hop & Routing Optimiser (Simulated)",
    type: "network",
    badgeColor: "blue",
    incidentId: "RM-8201",
    message: "[SIMULATED ROUTE] 3-hop LoRa packet delivered (Client -> Node-07 -> Node-03 -> Base Station). RSSI: -74 dBm, SNR: +8 dB.",
    details: "Packet buffered at Node-07 during flood water rise. Transit latency: 420ms.",
    isSimulated: true
  },
  {
    id: "EVT-106",
    timestamp: "10:42:10",
    relativeTime: "8m ago",
    agent: "Corroboration",
    agentRole: "Multi-Source Clustering & Consensus (Simulated)",
    type: "analysis",
    badgeColor: "amber",
    incidentId: "RM-8202",
    message: "[SIMULATED TRIAGE RULE] Single-witness earthquake collapse (RM-8202) evaluated. Urgency retention protocol applied: preserved CRITICAL triage priority despite 1 unverified witness.",
    details: "Cluster radius: 300m. Void entrapment golden-hour rule overrides low witness count.",
    isSimulated: true
  },
  {
    id: "EVT-105",
    timestamp: "10:39:18",
    relativeTime: "11m ago",
    agent: "Reporter",
    agentRole: "Distress Ingestion & Natural Language Parsing (Simulated)",
    type: "ingest",
    badgeColor: "purple",
    incidentId: "RM-8202",
    message: "[SIMULATED INGESTION] Ingested offline audio burst from ad-hoc BLE node. Transcribed speech with local edge model.",
    details: "Extracted rescue keywords: 'third floor collapsed', 'concrete fracturing', 'tapping on pipes in void'.",
    isSimulated: true
  },
  {
    id: "EVT-104",
    timestamp: "10:35:40",
    relativeTime: "14m ago",
    agent: "Coordinator",
    agentRole: "Mission Dispatch & Resource Allocation (Simulated)",
    type: "action",
    badgeColor: "teal",
    incidentId: "RM-8203",
    message: "[SIMULATED DISPATCH] Dispatched Mountain Extrication Unit (RESP-03) with heavy winch to landslide site on Switchback 4.",
    details: "Drone-Relay-07 provided real-time aerial reconnaissance of soil creep.",
    isSimulated: true
  },
  {
    id: "EVT-103",
    timestamp: "10:30:15",
    relativeTime: "20m ago",
    agent: "Corroboration",
    agentRole: "Multi-Source Clustering & Consensus (Simulated)",
    type: "analysis",
    badgeColor: "amber",
    incidentId: "RM-8204",
    message: "[SIMULATED CORROBORATION] Clustered 4 citizen mesh pings along North Ridge Highway into single active wildfire threat event.",
    details: "Corroborated vehicle convoy coordinates with thermal drone FLIR detection.",
    isSimulated: true
  },
  {
    id: "EVT-102",
    timestamp: "10:21:15",
    relativeTime: "29m ago",
    agent: "Relay",
    agentRole: "Mesh Packet Hop & Routing Optimiser (Simulated)",
    type: "network",
    badgeColor: "blue",
    incidentId: null,
    message: "[SIMULATED NETWORK] Dynamic mesh topology audit: 14 repeaters, 3 aerial drone links, 68 peripheral citizen nodes online. Simulated network health: 99.2%.",
    details: "Average hop count: 2.4. Zero mesh partition detected across operational sectors.",
    isSimulated: true
  },
  {
    id: "EVT-101",
    timestamp: "10:15:02",
    relativeTime: "35m ago",
    agent: "Coordinator",
    agentRole: "Mission Dispatch & Resource Allocation (Simulated)",
    type: "action",
    badgeColor: "teal",
    incidentId: "RM-8205",
    message: "[SIMULATED RESOURCE QUEUE] Approved cold-chain medical replenishment request for St. Jude disaster relief shelter.",
    details: "DMAT Mobile Clinic (RESP-04) confirmed on scene providing trauma triage.",
    isSimulated: true
  }
];
