/**
 * RippleMesh Mock Multi-Agent Event Stream
 * Telemetry log of local AI agents operating offline across the mesh.
 * Agents: Reporter, Verifier, Relay, Corroboration, Coordinator
 */

export const INITIAL_AGENT_EVENTS = [
  {
    id: "EVT-109",
    timestamp: "10:48:12",
    relativeTime: "2m ago",
    agent: "Coordinator",
    agentRole: "Mission Dispatch & Resource Allocation",
    type: "action",
    badgeColor: "teal",
    incidentId: "RM-8201",
    message: "Calculated optimal route for Swiftwater Rescue Alpha via Marina Eastern Accessway. Dispatched mission packet to team terminal.",
    details: "Computed terrain flood depth raster. Path avoids high-water choke point at Pier 2.",
    isSimulated: true
  },
  {
    id: "EVT-108",
    timestamp: "10:46:55",
    relativeTime: "4m ago",
    agent: "Verifier",
    agentRole: "Sensor & Signal Authenticity Check",
    type: "verification",
    badgeColor: "green",
    incidentId: "RM-8201",
    message: "Validated cryptographic Ed25519 payload signature against offline mesh registry. Hydrostatic sensor consistency confirmed at 96%.",
    details: "Zero hash collisions. Telemetry matches historical tidal surge propagation model.",
    isSimulated: true
  },
  {
    id: "EVT-107",
    timestamp: "10:45:30",
    relativeTime: "5m ago",
    agent: "Relay",
    agentRole: "Mesh Packet Hop & Routing Optimiser",
    type: "network",
    badgeColor: "blue",
    incidentId: "RM-8201",
    message: "3-hop LoRa packet routed successfully (Client -> Node-07 -> Node-03 -> Base Station). RSSI: -74 dBm, SNR: +8 dB.",
    details: "Packet fragmentation handled at Node-07 buffer. Total transit latency: 420ms.",
    isSimulated: true
  },
  {
    id: "EVT-106",
    timestamp: "10:42:10",
    relativeTime: "8m ago",
    agent: "Corroboration",
    agentRole: "Multi-Source Clustering & Consensus",
    type: "analysis",
    badgeColor: "amber",
    incidentId: "RM-8202",
    message: "Identified high-severity single-witness report (RM-8202). Applied urgency retention override: preserved CRITICAL triage state despite uncorroborated count.",
    details: "Cluster radius: 300m. Awaiting secondary peer confirmation. Flagged for drone reconnaissance.",
    isSimulated: true
  },
  {
    id: "EVT-105",
    timestamp: "10:39:18",
    relativeTime: "11m ago",
    agent: "Reporter",
    agentRole: "Distress Ingestion & Natural Language Parsing",
    type: "ingest",
    badgeColor: "purple",
    incidentId: "RM-8202",
    message: "Ingested offline voice burst from ad-hoc BLE node. Transcribed speech to text with local Whisper-tiny model.",
    details: "Extracted keywords: 'load bearing collapse', 'staircase fallen', 'occupants calling from interior void'.",
    isSimulated: true
  },
  {
    id: "EVT-104",
    timestamp: "10:32:04",
    relativeTime: "18m ago",
    agent: "Coordinator",
    agentRole: "Mission Dispatch & Resource Allocation",
    type: "action",
    badgeColor: "teal",
    incidentId: "RM-8203",
    message: "Assigned Hazmat Emergency Unit 3 to ammonia venting incident. Broadcasted localized reverse-alert to 47 mesh peer devices.",
    details: "Buffer cordon established at 350m radius based on current wind vector (NE at 8 knots).",
    isSimulated: true
  },
  {
    id: "EVT-103",
    timestamp: "10:28:44",
    relativeTime: "22m ago",
    agent: "Verifier",
    agentRole: "Sensor & Signal Authenticity Check",
    type: "verification",
    badgeColor: "green",
    incidentId: "RM-8203",
    message: "Industrial IoT Node #19 confirmed NH3 concentration at 85 ppm. Sensor health report: battery 91%, calibration valid.",
    details: "Automated cross-check with ambient air humidity and temperature sensor arrays.",
    isSimulated: true
  },
  {
    id: "EVT-102",
    timestamp: "10:21:15",
    relativeTime: "29m ago",
    agent: "Relay",
    agentRole: "Mesh Packet Hop & Routing Optimiser",
    type: "network",
    badgeColor: "blue",
    incidentId: null,
    message: "Dynamic mesh topology update: 14 active repeaters, 3 mobile drone links, 68 peripheral citizen nodes online. Offline health: 99.2%.",
    details: "Average hop count: 2.4. Zero partition detected across active operational grid.",
    isSimulated: true
  },
  {
    id: "EVT-101",
    timestamp: "10:15:02",
    relativeTime: "35m ago",
    agent: "Corroboration",
    agentRole: "Multi-Source Clustering & Consensus",
    type: "analysis",
    badgeColor: "amber",
    incidentId: "RM-8205",
    message: "Merged 6 independent citizen distress pings into single high-voltage power hazard event (RM-8205). Spatial centroid computed at Junction 9.",
    details: "Confidence heightened to 95% due to rapid spatial temporal clustering across 4 unique cell radio sectors.",
    isSimulated: true
  }
];
