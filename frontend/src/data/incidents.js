/**
 * RippleMesh Mock Incidents Data — Central Disaster Rescue Focus
 *
 * IMPORTANT DEMO DISCLAIMER:
 * All incidents, AI triage scores, mesh telemetry logs, and witness accounts
 * in this file are SIMULATED DEMO DATA for offline hackathon demonstration.
 * No real emergency dispatch, human victims, or backend services are involved.
 *
 * TRIAGE DESIGN PRINCIPLE:
 * Urgency/Severity, AI Confidence Score, and Source Trust Score are decoupled.
 * Critical rescue incidents (e.g. trapped victims in voids or rising waters)
 * maintain high triage priority regardless of single-witness or unverified trust states.
 */

export const INITIAL_INCIDENTS = [
  {
    id: "RM-8201",
    hazardType: "Flood Rescue",
    isSimulated: true,
    demoNotice: "SIMULATED INCIDENT — Synthetic scenario for coordinator dashboard demonstration.",
    title: "Rising Surge & Trapped Family on Submerged Rooftop",
    location: {
      name: "Sector 4 — Marina Lower Basin, Wharf 12",
      coordinates: { x: 28, y: 35 },
      lat: "13.0827° N",
      lng: "80.2707° E",
      accessNotes: "Road submerged by 1.4m fast-moving water; access requires inflatable swiftwater craft or high-clearance rescue rig"
    },
    severity: "Critical",
    confidenceScore: 0.96, // Simulated AI confidence in extraction
    trustScore: 0.91,      // Simulated source authenticity & cryptographic mesh trust
    witnessCount: 4,
    status: "Pending Review",
    reportedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    displayTime: "6m ago",
    summary: "Rapid flash flood water ingress on residential ground levels. Four elderly occupants and two infants isolated on a second-floor terrace with water reaching breaker panel. Swiftwater boat extraction urgently needed.",
    voiceTranscript: "\"Water reached the main breaker panel! We have four seniors and infants trapped upstairs... cell towers completely dead here, sending this through neighborhood mesh node! Please hurry!\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Synthetic Field Camera Snapshot — Marina Basin North Wall (Water level at +1.4m mark)",
      svgType: "flood"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 98,
      urgencyReasoning: "[SIMULATED REASONING] Immediate danger of drowning and hypothermia. Hydrostatic current velocity exceeds 0.9 m/s. High mortality curve without rapid boat extraction.",
      recommendedAction: "Dispatch Swiftwater Rescue Unit Alpha with inflatable zodiacs and pediatric flotation devices.",
      meshProvenance: "Multi-hop LoRa packet relayed through 3 peer nodes (Client -> Node-07 -> Node-03 -> Base Station). 0% packet loss (Simulated)."
    },
    provenance: [
      { time: "08:46:12", source: "Citizen App (Mesh Beacon)", detail: "Initial distress burst signed by simulated Ed25519 key 0x4f...89c" },
      { time: "08:47:04", source: "Node #07 (Wharf Sensor)", detail: "Hydrostatic telemetry corroborates water level > 1.2m" },
      { time: "08:48:30", source: "Verifier Agent (Simulated)", detail: "Confidence calculated at 96% based on multi-sensor corroboration" }
    ],
    witnesses: [
      { id: "W-1", role: "Resident / Trapped Reporter", verified: true, method: "Authenticated Mesh Node" },
      { id: "W-2", role: "Neighborhood Watch Scout", verified: true, method: "Bluetooth Low Energy P2P" },
      { id: "W-3", role: "Dock Worker", verified: false, method: "Analog LoRa repeat" },
      { id: "W-4", role: "Water Gauge IoT Beacon", verified: true, method: "Direct LoRaWAN" }
    ]
  },
  {
    id: "RM-8202",
    hazardType: "Earthquake Collapse",
    isSimulated: true,
    demoNotice: "SIMULATED INCIDENT — Single uncorroborated witness demonstrates urgency decoupling policy.",
    title: "Void-Space Entrapment in Collapsed 3-Story Apartment Stairwell",
    location: {
      name: "Old Town Market Square, Bldg #19",
      coordinates: { x: 55, y: 22 },
      lat: "13.0891° N",
      lng: "80.2811° E",
      accessNotes: "Heavy rubble blocking eastern alley; USAR shoring and void acoustic cameras required for western approach"
    },
    // CRITICAL INCIDENT WITH SINGLE UNVERIFIED WITNESS:
    // Urgency remains CRITICAL even with 1 witness and unverified trust.
    severity: "Critical",
    confidenceScore: 0.62, // Simulated moderate extraction confidence
    trustScore: 0.54,      // Simulated unauthenticated peer
    witnessCount: 1,       // Single witness! Must stay Critical priority
    status: "Pending Review",
    reportedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    displayTime: "14m ago",
    summary: "Single uncorroborated distress packet reporting structural collapse after shock tremor. Concrete slab pancaked over interior stairwell with muffled pipe-tapping heard from trapped victims inside void.",
    voiceTranscript: "\"Heard a massive crash like concrete fracturing! Third floor staircase collapsed inward. Can hear someone banging on pipes inside! Send USAR search and heavy shoring team!\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Synthetic Acoustic Scanner Frame — Alleyway dust plume and void-space deflection",
      svgType: "collapse"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 94,
      urgencyReasoning: "[SIMULATED REASONING] High hazard severity despite low corroboration. Void-space collapse carries a critical 60-minute survival golden window. Under offline triage protocol, incident is NOT downgraded due to single witness count.",
      recommendedAction: "Dispatch USAR Heavy Rescue Unit with acoustic listening probes and hydraulic shoring.",
      meshProvenance: "Direct single-hop emergency packet via ad-hoc smartphone mesh (Simulated)."
    },
    provenance: [
      { time: "08:38:22", source: "Citizen App (Ad-hoc BLE)", detail: "Unregistered peer 0x9a...31b emitted single voice payload" },
      { time: "08:39:05", source: "Corroboration Agent (Simulated)", detail: "Marked as uncorroborated (1 witness). High urgency retention rule active." }
    ],
    witnesses: [
      { id: "W-1", role: "Passerby / Local Resident", verified: false, method: "Ad-hoc BLE broadcast" }
    ]
  },
  {
    id: "RM-8203",
    hazardType: "Landslide Rescue",
    isSimulated: true,
    demoNotice: "SIMULATED INCIDENT — Debris flow entrapment scenario.",
    title: "Slope Failure Buried 2 Evacuation Vehicles on Mountain Pass",
    location: {
      name: "East Ridge Foothills, Sector 7 — Switchback 4",
      coordinates: { x: 86, y: 24 },
      lat: "13.1020° N",
      lng: "80.3010° E",
      accessNotes: "Road blocked by 200 tons of wet clay and rock; secondary slip risk high, winch-assisted approach needed"
    },
    severity: "Critical",
    confidenceScore: 0.94,
    trustScore: 0.88,
    witnessCount: 3,
    status: "Pending Review",
    reportedAt: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    displayTime: "21m ago",
    summary: "Heavy saturation triggered mudslide across the only mountain evacuation pass. Two civilian vehicles pushed against retaining wall and partially buried. Multiple occupants trapped inside cabin.",
    voiceTranscript: "\"Mudslide came down the hillside! Two cars pushed into the rock barrier, one is half-buried under mud and boulders! Driver is conscious but pinned by the dashboard!\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Synthetic Thermal Gimbal — Debris flow mass and vehicle heat signatures",
      svgType: "landslide"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 95,
      urgencyReasoning: "[SIMULATED REASONING] Active soil creep threatens secondary slip over trapped vehicles. Vehicle cabin integrity compromised; mechanical extrication and soil stabilization urgently needed.",
      recommendedAction: "Dispatch Mountain Extrication Team + heavy winch rescue vehicle and K9 soil search unit.",
      meshProvenance: "Multi-hop LoRa packet relayed via Drone-Relay-07 to Base Station (Simulated)."
    },
    provenance: [
      { time: "08:31:10", source: "Mountain Spotter Beacon", detail: "Soil movement accelerometer tripped threshold > 3.5g" },
      { time: "08:32:00", source: "Evacuee Voice Burst", detail: "Vehicle entrapment reported on BLE mesh" },
      { time: "08:33:45", source: "Verifier Agent (Simulated)", detail: "Confirmed spatial alignment with Drone-Relay-07 telemetry" }
    ],
    witnesses: [
      { id: "W-1", role: "Following Motorist", verified: true, method: "Car Dash Mesh Relay" },
      { id: "W-2", role: "Forestry Ranger Scout", verified: true, method: "Handheld LoRa Radio" },
      { id: "W-3", role: "Slope Soil Telemetry Sensor", verified: true, method: "Direct LoRaWAN" }
    ]
  },
  {
    id: "RM-8204",
    hazardType: "Wildfire Rescue",
    isSimulated: true,
    demoNotice: "SIMULATED INCIDENT — Wildfire evacuation corridor threat.",
    title: "Fast-Moving Brushfire Flank Encroaching on Rural Evacuation Route",
    location: {
      name: "North Ridge Highway Corridor, Mile Marker 14",
      coordinates: { x: 74, y: 18 },
      lat: "13.1110° N",
      lng: "80.2980° E",
      accessNotes: "Dense smoke reducing visibility to under 10m; respiratory protection required"
    },
    severity: "High",
    confidenceScore: 0.91,
    trustScore: 0.87,
    witnessCount: 4,
    status: "In Progress",
    reportedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    displayTime: "32m ago",
    summary: "Wind-driven brushfire flank crossed firebreak and is threatening a convoy of 12 evacuating civilian cars. Severe smoke inhalation reported among elderly passengers.",
    voiceTranscript: "\"Smoke is blinding on the road! Flames are within fifty meters of the asphalt. We need an escort vehicle or water tender to push through this smoke corridor!\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Synthetic Thermal FLIR Frame — Firefront velocity: 14 km/h towards roadway",
      svgType: "fire"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 86,
      urgencyReasoning: "[SIMULATED REASONING] Risk of radiant heat tire blowouts and asphyxiation for stalled vehicles. Escort convoy and water fog curtain required to ensure evacuation egress.",
      recommendedAction: "Dispatch Fire Escort Tender + emergency oxygen kits for trapped convoy passengers.",
      meshProvenance: "Relayed via Forestry VHF repeater bridge (Simulated)."
    },
    provenance: [
      { time: "08:20:05", source: "Convoy Lead Driver", detail: "Distress burst sent via mesh peer app" },
      { time: "08:23:12", source: "Thermal Drone #07", detail: "FLIR sensor confirmed flame front distance < 60m" }
    ],
    witnesses: [
      { id: "W-1", role: "Evacuation Convoy Marshal", verified: true, method: "Mobile Mesh Beacon" },
      { id: "W-2", role: "Civilian Motorist", verified: true, method: "BLE mesh" },
      { id: "W-3", role: "Aerial Recon Drone", verified: true, method: "Thermal Telemetry Node" },
      { id: "W-4", role: "Rural Fire Warden", verified: true, method: "Direct LoRa" }
    ]
  },
  {
    id: "RM-8205",
    hazardType: "Medical Emergency",
    isSimulated: true,
    demoNotice: "SIMULATED INCIDENT — Post-disaster shelter medical surge.",
    title: "Trauma Surge & Critical Diabetic Depletion at St. Jude Shelter",
    location: {
      name: "St. Jude Relief Hall, Gymnasium",
      coordinates: { x: 42, y: 72 },
      lat: "13.0645° N",
      lng: "80.2589° E",
      accessNotes: "Clear road access via Main Ave; facility operating on emergency solar-battery inverter"
    },
    severity: "High",
    confidenceScore: 0.95,
    trustScore: 0.96,
    witnessCount: 3,
    status: "Approved",
    reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    displayTime: "45m ago",
    summary: "Shelter treating 28 disaster evacuees: 3 with compound fractures from falling masonry, 2 severe shock cases, and 4 insulin-dependent patients facing life-threatening depletion within 4 hours.",
    voiceTranscript: "\"Shelter medic here. We have dressed multiple fracture cases but surgical supplies are exhausted. We also urgently need refrigerated insulin before nightfall.\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Synthetic Medical Triage Manifest — Shelter patient acuity log",
      svgType: "medical"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 84,
      urgencyReasoning: "[SIMULATED REASONING] High clinical vulnerability. Without cold-chain medical replenishment and advanced wound stabilization, acute deterioration expected within 4 hours.",
      recommendedAction: "Deploy Disaster Medical Mobile Clinic with cold-chain storage and orthopedic splints.",
      meshProvenance: "Official shelter mesh gateway packet with registered Red Cross cryptographic token (Simulated)."
    },
    provenance: [
      { time: "08:07:15", source: "Relief Camp Gateway #01", detail: "Nurse practitioner log sent via high-bandwidth mesh bridge" },
      { time: "08:15:00", source: "Coordinator Agent (Simulated)", detail: "Triage approved for scheduled courier dispatch" }
    ],
    witnesses: [
      { id: "W-1", role: "Volunteer Nurse Practitioner", verified: true, method: "Registered Medical Gateway" },
      { id: "W-2", role: "Camp Shelter Lead", verified: true, method: "Mesh Terminal #01" },
      { id: "W-3", role: "Red Cross Field Coordinator", verified: true, method: "Cryptographic Mesh Token" }
    ]
  },
  {
    id: "RM-8206",
    hazardType: "Disaster Gas Leak",
    isSimulated: true,
    demoNotice: "SIMULATED INCIDENT — Secondary earthquake hazard near evacuation zone.",
    title: "Post-Tremor Industrial Ammonia Venting Threatens Downwind Shelter",
    location: {
      name: "District 2 — Eastside Cold Storage Plant",
      coordinates: { x: 78, y: 65 },
      lat: "13.0754° N",
      lng: "80.2923° E",
      accessNotes: "Upwind approach required from South-West; full SCBA Level A protective gear mandated"
    },
    severity: "High",
    confidenceScore: 0.92,
    trustScore: 0.89,
    witnessCount: 3,
    status: "In Progress",
    reportedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    displayTime: "50m ago",
    summary: "Secondary earthquake shock fractured an industrial cooling valve. Dense ammonia gas plume is drifting southwest towards residential sector 2 evacuation perimeter.",
    voiceTranscript: "\"Plant safety valve sheared by aftershock tremor! Strong pungent cloud drifting towards the school shelter. We need hazmat isolation now!\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Synthetic Gas Dispersion Map — NH3 concentration detected at 85 ppm downwind",
      svgType: "gas"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 82,
      urgencyReasoning: "[SIMULATED REASONING] Toxic respiratory hazard compounding existing disaster evacuation. Emergency isolation valve shutoff and reverse-mesh shelter-in-place alert required.",
      recommendedAction: "Hazmat Team 3 on scene. Broadcast shelter-in-place mesh alert to subgrid 02-B.",
      meshProvenance: "Industrial IoT LoRa sensor mesh coupled with Plant Security radio burst (Simulated)."
    },
    provenance: [
      { time: "08:02:10", source: "Fixed Gas Sensor Node #19", detail: "NH3 PPM spike > 50 ppm threshold" },
      { time: "08:03:30", source: "Security Guard", detail: "Voice broadcast confirming visible vapor" },
      { time: "08:10:00", source: "Coordinator Agent (Simulated)", detail: "Assigned Hazmat Unit 3 (En route)" }
    ],
    witnesses: [
      { id: "W-1", role: "Plant Safety Technician", verified: true, method: "Hardware Token Radio" },
      { id: "W-2", role: "Transit Supervisor", verified: true, method: "Mesh node repeater" },
      { id: "W-3", role: "Industrial IoT Node #19", verified: true, method: "Fixed Telemetry Sensor" }
    ]
  },
  {
    id: "RM-8207",
    hazardType: "Disaster Power Hazard",
    isSimulated: true,
    demoNotice: "SIMULATED INCIDENT — Secondary flood hazard electrocution risk.",
    title: "Downed High-Voltage Line Sparking in Flooded Evacuation Crossing",
    location: {
      name: "Crossroad Junction 9, Waterway Bypass",
      coordinates: { x: 62, y: 48 },
      lat: "13.0712° N",
      lng: "80.2745° E",
      accessNotes: "High-voltage cable draped across flooded roadway; 35m danger cordon required"
    },
    severity: "High",
    confidenceScore: 0.95,
    trustScore: 0.90,
    witnessCount: 5,
    status: "Pending Review",
    reportedAt: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
    displayTime: "58m ago",
    summary: "Transformer fell during flood surge, dropping live 11kV line directly into moving flood water across key evacuation crossing. Arcing poses severe electrocution risk to wading evacuees.",
    voiceTranscript: "\"Power pole snapped! The live cable is sparking right in the water where families are trying to wade across. We've stopped people but we need the line de-energized!\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Synthetic Cordon Telemetry — Live arc detection and safe boundary marker",
      svgType: "power"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 81,
      urgencyReasoning: "[SIMULATED REASONING] Active lethal electrical hazard on active civilian evacuation artery. Immediate breaker trip and physical barricade needed.",
      recommendedAction: "Dispatch Power Isolation Crew to verify breaker trip and establish high-visibility cordon.",
      meshProvenance: "Reported by 5 distinct citizen nodes within 6 minutes; high spatial clustering confidence (Simulated)."
    },
    provenance: [
      { time: "07:54:10", source: "Citizen App Mesh", detail: "Arcing anomaly reported by civilian group" },
      { time: "07:56:40", source: "Corroboration Agent (Simulated)", detail: "Spatial clustering confirmed 5 independent corroborating nodes" }
    ],
    witnesses: [
      { id: "W-1", role: "Evacuation Volunteer", verified: true, method: "Peer mesh" },
      { id: "W-2", role: "Shopkeeper", verified: true, method: "Fixed retail beacon" },
      { id: "W-3", role: "Civilian Marshals", verified: true, method: "Civilian VHF mesh" },
      { id: "W-4", role: "Pedestrian", verified: false, method: "Bluetooth packet" },
      { id: "W-5", role: "Resident", verified: true, method: "Mesh node repeater" }
    ]
  },
  {
    id: "RM-8208",
    hazardType: "Bridge Scour",
    isSimulated: true,
    demoNotice: "SIMULATED INCIDENT — Flood scouring structural assessment scenario.",
    title: "Flood Current Scouring Causeway Pier with Stranded Pedestrians",
    location: {
      name: "North River Causeway, Span #3",
      coordinates: { x: 18, y: 75 },
      lat: "13.0950° N",
      lng: "80.2630° E",
      accessNotes: "Vehicular weight capacity zero; monitored foot crossing only under lifeline tether"
    },
    severity: "Medium",
    confidenceScore: 0.81,
    trustScore: 0.76,
    witnessCount: 2,
    status: "Resolved",
    reportedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    displayTime: "1h 50m ago",
    summary: "Flood surge caused scouring under Pier 3. Shift in expansion joint noticeable to passing pedestrian evacuees. Civil engineers completed inspection and cordoned vehicular lanes safely.",
    voiceTranscript: "\"Bridge felt like it shifted when supply truck passed. Visible gap in the pavement joint on the north span.\"",
    evidencePhoto: {
      type: "synthetic_sensor",
      caption: "Synthetic Structural Strain Sensor — Pier deflection measured at 14mm (tolerance 18mm)",
      svgType: "bridge"
    },
    aiTriage: {
      isSimulated: true,
      modelTag: "Llama-3-Emergency-8B (Simulated Local Engine)",
      triageScore: 59,
      urgencyReasoning: "[SIMULATED REASONING] Scour verified but pier integrity deemed non-critical for foot evacuation under safety monitors. Vehicular traffic successfully redirected.",
      recommendedAction: "Traffic diversion active. Periodic acoustic monitoring every 30 minutes.",
      meshProvenance: "Infrastructure sensor mesh linked with Municipal Civil Defense node (Simulated)."
    },
    provenance: [
      { time: "07:02:15", source: "Civilian Vehicle App", detail: "Rough road anomaly telemetry reported" },
      { time: "07:20:00", source: "Civil Engineering Team", detail: "On-site inspection completed. Cordon deployed." },
      { time: "07:45:00", source: "Coordinator Agent (Simulated)", detail: "Incident marked as Resolved with diversion plan in place." }
    ],
    witnesses: [
      { id: "W-1", role: "Truck Driver", verified: true, method: "Mesh relay" },
      { id: "W-2", role: "Civil Engineer Volunteer", verified: true, method: "Official portal mesh" }
    ]
  }
];
