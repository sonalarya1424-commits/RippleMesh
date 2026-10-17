/**
 * RippleMesh Mock Incidents Data
 * Offline-first mesh incident telemetry for coordinator dashboard.
 *
 * NOTE: Urgency/Severity, Confidence Score, and Trust Score are intentionally
 * decoupled. A Critical incident with a single witness maintains high priority triage
 * rather than being downgraded.
 */

export const INITIAL_INCIDENTS = [
  {
    id: "RM-8201",
    hazardType: "Flash Flood",
    title: "Rising Surge & Trapped Residents in Residential Sector 4",
    location: {
      name: "Sector 4 — Marina Lower Basin, Wharf 12",
      coordinates: { x: 28, y: 35 }, // percentage on demo tactical map
      lat: "13.0827° N",
      lng: "80.2707° E",
      accessNotes: "Road submerged by 1.2m; access limited to inflatable crafts or high-clearance trucks"
    },
    severity: "Critical",
    confidenceScore: 0.96, // AI confidence in extraction
    trustScore: 0.91,      // Source authenticity & cryptographic mesh trust
    witnessCount: 4,
    status: "Pending Review",
    reportedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    displayTime: "6m ago",
    summary: "Severe water ingress reported on ground levels. Four elderly occupants and two infants isolated on second-floor terrace. Mesh relay node #07 detected rapid hydrostatic pressure rise.",
    voiceTranscript: "\"Water reached the main breaker panel! We have four seniors and infants upstairs... cell towers completely dead here, sending this through neighborhood mesh node! Please hurry!\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Telemetry Snapshot — Marina Basin North Wall (Water level at +1.4m mark)",
      svgType: "flood"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 98,
      urgencyReasoning: "Imminent danger to human life. Rising water velocity exceeds 0.8 m/s near power infrastructure. Electrical fire hazard compounded by flood depth.",
      recommendedAction: "Dispatch Swiftwater Rescue Unit + portable flotation assets immediately.",
      meshProvenance: "Multi-hop LoRa packet relayed through 3 peer nodes (Client -> Node-07 -> Node-03 -> Base Station). 0% packet loss."
    },
    provenance: [
      { time: "08:46:12", source: "Citizen App (Mesh Beacon)", detail: "Initial distress burst signed by Ed25519 key 0x4f...89c" },
      { time: "08:47:04", source: "Node #07 (Wharf Sensor)", detail: "Hydrostatic telemetry corroborates water level > 1.2m" },
      { time: "08:48:30", source: "Verifier Agent", detail: "Confidence calculated at 96% based on multi-sensor corroboration" }
    ],
    witnesses: [
      { id: "W-1", role: "Resident / Reporter", verified: true, method: "Authenticated Mesh Node" },
      { id: "W-2", role: "Neighborhood Watch Scout", verified: true, method: "Bluetooth Low Energy P2P" },
      { id: "W-3", role: "Dock Worker", verified: false, method: "Analog LoRa repeat" },
      { id: "W-4", role: "Water Gauge IoT Beacon", verified: true, method: "Direct LoRaWAN" }
    ]
  },
  {
    id: "RM-8202",
    hazardType: "Structural Collapse",
    title: "Partial Wall & Stairwell Failure in Old Town Apartments",
    location: {
      name: "Old Town Market Square, Bldg #19",
      coordinates: { x: 55, y: 22 },
      lat: "13.0891° N",
      lng: "80.2811° E",
      accessNotes: "Debris blocking eastern alley; use Western Market thoroughfare"
    },
    // CRITICAL INCIDENT WITH SINGLE UNVERIFIED WITNESS:
    // Urgency remains CRITICAL even with 1 witness and unverified trust.
    severity: "Critical",
    confidenceScore: 0.62,
    trustScore: 0.54,
    witnessCount: 1,
    status: "Pending Review",
    reportedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    displayTime: "14m ago",
    summary: "Single uncorroborated report of third-floor load bearing collapse following shock tremor. Occupants heard calling from interior void space.",
    voiceTranscript: "\"Heard a massive crash like concrete fracturing. Third floor staircase collapsed inward. Can hear someone banging on pipes inside! Send USAR search team!\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Field Camera Frame — Alleyway dust plume and structural deflection",
      svgType: "collapse"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 92,
      urgencyReasoning: "High hazard severity despite low corroboration. Potential void-space entrapment carries critical mortality curve within first 60 minutes. Priority must NOT be downgraded solely due to single witness count.",
      recommendedAction: "Send USAR Recon Drone or Scout Team to verify structural stability and establish perimeter.",
      meshProvenance: "Direct single-hop emergency packet via ad-hoc smartphone mesh."
    },
    provenance: [
      { time: "08:38:22", source: "Citizen App (Ad-hoc BLE)", detail: "Unregistered peer 0x9a...31b emitted single voice payload" },
      { time: "08:39:05", source: "Corroboration Agent", detail: "Marked as uncorroborated (1 witness). High triage retention rule active." }
    ],
    witnesses: [
      { id: "W-1", role: "Passerby / Local Resident", verified: false, method: "Ad-hoc BLE broadcast" }
    ]
  },
  {
    id: "RM-8203",
    hazardType: "Gas Leak",
    title: "Industrial Storage Pressure Venting & Toxic Vapor Plume",
    location: {
      name: "District 2 — Eastside Cold Storage Plant",
      coordinates: { x: 78, y: 65 },
      lat: "13.0754° N",
      lng: "80.2923° E",
      accessNotes: "Upwind approach required from South-West; full SCBA protection mandated"
    },
    severity: "High",
    confidenceScore: 0.92,
    trustScore: 0.89,
    witnessCount: 3,
    status: "In Progress",
    reportedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    displayTime: "28m ago",
    summary: "Anhydrous ammonia cooling pipe fractured during blackout generator cutoff. Dense pungent cloud drifting southwest across residential zone.",
    voiceTranscript: "\"Plant safety valve failed! Strong chemical odor burning eyes and throat. We've evacuated employees but wind is pushing it towards the bus terminus.\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Gas Telemetry Visualizer — Sensor Node #19 detected NH3 at 85 ppm",
      svgType: "gas"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 84,
      urgencyReasoning: "Toxic respiratory hazard drifting into populated urban transit hub. Hazardous materials mitigation and public reverse-alert notification required.",
      recommendedAction: "Hazmat Team 3 on scene. Broadcast shelter-in-place mesh alert to subgrid 02-B.",
      meshProvenance: "Industrial IoT LoRa sensor mesh coupled with Plant Security radio burst."
    },
    provenance: [
      { time: "08:24:10", source: "Fixed Gas Sensor Node #19", detail: "NH3 PPM spike > 50 ppm threshold" },
      { time: "08:25:30", source: "Security Guard", detail: "Voice broadcast confirming visible vapor" },
      { time: "08:31:00", source: "Coordinator Agent", detail: "Assigned Hazmat Unit 3 (En route)" }
    ],
    witnesses: [
      { id: "W-1", role: "Plant Security Officer", verified: true, method: "Hardware Token Radio" },
      { id: "W-2", role: "Transit Supervisor", verified: true, method: "Mesh node repeater" },
      { id: "W-3", role: "Industrial IoT Node #19", verified: true, method: "Fixed Telemetry Sensor" }
    ]
  },
  {
    id: "RM-8204",
    hazardType: "Medical Emergency",
    title: "Trauma & Diabetic Complications in Community Shelter",
    location: {
      name: "St. Jude Relief Hall, Gymnasium",
      coordinates: { x: 42, y: 72 },
      lat: "13.0645° N",
      lng: "80.2589° E",
      accessNotes: "Clear road access via Main Ave; power running on emergency solar battery"
    },
    severity: "Medium",
    confidenceScore: 0.88,
    trustScore: 0.95,
    witnessCount: 2,
    status: "Approved",
    reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    displayTime: "45m ago",
    summary: "Two patients need immediate stabilization: one with severe head laceration from falling roof tile, one insulin-dependent patient with critically low reserves.",
    voiceTranscript: "\"Shelter medic here. We have dressed the laceration but patient is showing signs of concussion. We also urgently need refrigerated insulin before nightfall.\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Shelter Supply Log — Critical medical request form registered locally",
      svgType: "medical"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 71,
      urgencyReasoning: "Patients currently stabilized by on-site nurse, but degradation expected without specialized medical replenishment within 3 hours.",
      recommendedAction: "Route Medical Courier Drone or Mobile Clinic Van with cold-chain storage.",
      meshProvenance: "Official shelter mesh gateway packet with registered Red Cross ID."
    },
    provenance: [
      { time: "08:07:15", source: "Relief Camp Gateway #01", detail: "Nurse practitioner log sent via high-bandwidth mesh bridge" },
      { time: "08:15:00", source: "Coordinator Agent", detail: "Triage approved for scheduled courier dispatch" }
    ],
    witnesses: [
      { id: "W-1", role: "Volunteer Nurse Practitioner", verified: true, method: "Registered Medical Gateway" },
      { id: "W-2", role: "Camp Shelter Lead", verified: true, method: "Mesh Terminal #01" }
    ]
  },
  {
    id: "RM-8205",
    hazardType: "Power Grid Failure",
    title: "Substation Transformer Exploded & Power Line Dropped",
    location: {
      name: "Crossroad Junction 9, High Voltage Spur",
      coordinates: { x: 62, y: 48 },
      lat: "13.0712° N",
      lng: "80.2745° E",
      accessNotes: "Road blocked by live high-voltage cables; maintain 30m safe cordon"
    },
    severity: "High",
    confidenceScore: 0.95,
    trustScore: 0.90,
    witnessCount: 6,
    status: "Pending Review",
    reportedAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    displayTime: "52m ago",
    summary: "Transformer explosion caused high voltage cables to drape across highway intersection. Arc flashing observed. Area isolated by civilian traffic marshals.",
    voiceTranscript: "\"Transformer blew with a blinding flash! Lines are down across both lanes sparking against the metal guardrail. Vehicles are backing away.\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Cordon Telemetry — Live arc detection telemetry and barrier marker",
      svgType: "power"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 82,
      urgencyReasoning: "Electrocution hazard on active evacuation artery. Immediate grid breaker remote trip or physical lineman intervention required.",
      recommendedAction: "Notify Municipal Grid Team and dispatch traffic control unit to secure safety perimeter.",
      meshProvenance: "Reported by 6 distinct citizen nodes within 4 minutes; high spatial clustering confidence."
    },
    provenance: [
      { time: "08:00:10", source: "Citizen App Mesh", detail: "Burst received from vehicle dash sensor" },
      { time: "08:02:40", source: "Corroboration Agent", detail: "Spatial clustering confirmed 6 independent corroborating nodes" }
    ],
    witnesses: [
      { id: "W-1", role: "Motorist", verified: true, method: "Peer mesh" },
      { id: "W-2", role: "Shopkeeper", verified: true, method: "Fixed retail beacon" },
      { id: "W-3", role: "Traffic Officer", verified: true, method: "Civilian VHF mesh" },
      { id: "W-4", role: "Pedestrian", verified: false, method: "Bluetooth packet" },
      { id: "W-5", role: "Resident", verified: true, method: "Mesh node repeater" },
      { id: "W-6", role: "Bus Driver", verified: true, method: "Transit telemetry" }
    ]
  },
  {
    id: "RM-8206",
    hazardType: "Bridge Damage",
    title: "River Bridge Expansion Joint Displaced & Concrete Spalling",
    location: {
      name: "North River Causeway, Span #3",
      coordinates: { x: 18, y: 75 },
      lat: "13.0950° N",
      lng: "80.2630° E",
      accessNotes: "Weight limit reduced to zero; foot traffic only until structural inspection"
    },
    severity: "Medium",
    confidenceScore: 0.81,
    trustScore: 0.76,
    witnessCount: 2,
    status: "Resolved",
    reportedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    displayTime: "1h 50m ago",
    summary: "Flood currents caused scouring under Pier 3. Shift in expansion joint noticeable to passing traffic. Civil engineers confirmed safe for emergency foot crossings only.",
    voiceTranscript: "\"Bridge felt like it shifted when heavy supply truck went over. Visible gap in the pavement joint on the north span.\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Structural Strain Sensor — Deflection measured at 14mm (tolerance 18mm)",
      svgType: "bridge"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 59,
      urgencyReasoning: "Scour risk verified but pier integrity deemed non-critical for pedestrian traffic. Vehicular traffic successfully rerouted.",
      recommendedAction: "Traffic diversion active. Periodic acoustic monitoring every 30 minutes.",
      meshProvenance: "Infrastructure sensor mesh linked with Municipal Civil Defense node."
    },
    provenance: [
      { time: "07:02:15", source: "Civilian Vehicle App", detail: "Rough road anomaly telemetry reported" },
      { time: "07:20:00", source: "Civil Engineering Team", detail: "On-site inspection completed. Cordon deployed." },
      { time: "07:45:00", source: "Coordinator Agent", detail: "Incident marked as Resolved with diversion plan in place." }
    ],
    witnesses: [
      { id: "W-1", role: "Truck Driver", verified: true, method: "Mesh relay" },
      { id: "W-2", role: "Civil Engineer Volunteer", verified: true, method: "Official portal mesh" }
    ]
  },
  {
    id: "RM-8207",
    hazardType: "Wildfire Front",
    title: "Brushfire Approaching Eastern Ridge Power Transmission",
    location: {
      name: "East Ridge Foothills, Sector 7",
      coordinates: { x: 88, y: 20 },
      lat: "13.1020° N",
      lng: "80.3010° E",
      accessNotes: "Firefront moving West at 12 km/h; Ridge firebreak road partially compromised"
    },
    severity: "Low",
    confidenceScore: 0.74,
    trustScore: 0.70,
    witnessCount: 1,
    status: "Rejected",
    reportedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    displayTime: "2h 20m ago",
    summary: "Report of spot fires near forest border. Forestry scout verified it was a controlled burn by authorized park rangers with water tenders on standby.",
    voiceTranscript: "\"Seeing smoke columns rising above the eastern hill ridge. Can't see flames yet but smoke is dark.\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Thermal Camera Feed — Low intensity localized burn with clear firebreaks",
      svgType: "fire"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 28,
      urgencyReasoning: "Thermal signature confirms controlled containment burn managed by Forestry Division. No risk to residential perimeter.",
      recommendedAction: "No action required. Dismissed after Forestry verification.",
      meshProvenance: "Volunteer spotter node to Forestry Ranger relay bridge."
    },
    provenance: [
      { time: "06:30:10", source: "Spotter Beacon", detail: "Smoke alert filed" },
      { time: "06:45:00", source: "Forestry Ranger 02", detail: "Confirmed controlled burn, safe containment" },
      { time: "06:50:00", source: "Coordinator Agent", detail: "Report rejected as false alarm / authorized activity" }
    ],
    witnesses: [
      { id: "W-1", role: "Hilltop Spotter", verified: true, method: "Direct VHF mesh" }
    ]
  }
];
