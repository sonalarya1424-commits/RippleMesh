/**
 * RippleMesh Mock Responders Data — Disaster Rescue Focus
 *
 * IMPORTANT DEMO DISCLAIMER:
 * All responder teams, telemetry data, and radio callsigns are SIMULATED DEMO VALUES.
 * No real human responders, dispatch orders, or external telemetry connections exist.
 */

export const INITIAL_RESPONDERS = [
  {
    id: "RESP-01",
    callsign: "Aqua-Lead 1",
    name: "Swiftwater Rescue Alpha",
    specialization: "Flood Evacuation & Inflatable Boat Rescue",
    status: "En Route",
    assignedIncidentId: "RM-8201",
    crewCount: 5,
    meshNodeId: "NODE-SW-04",
    signalQuality: "Excellent (-64 dBm)",
    batteryPercent: 92,
    locationName: "En route to Marina Sector 4 Wharf",
    coordinates: { x: 26, y: 39 },
    equipment: ["2x Zodiac Inflatable Rescue Crafts", "6x High-Buoyancy Vests", "Water Stretcher", "Mesh Relay Beacon"],
    isSimulated: true
  },
  {
    id: "RESP-02",
    callsign: "USAR-Breaker",
    name: "Urban Search & Heavy Extraction (USAR)",
    specialization: "Earthquake Structural Collapse & Void Shoring",
    status: "Available",
    assignedIncidentId: "RM-8202",
    crewCount: 8,
    meshNodeId: "NODE-US-11",
    signalQuality: "Good (-78 dBm)",
    batteryPercent: 88,
    locationName: "Old Town Market Staging Area",
    coordinates: { x: 53, y: 26 },
    equipment: ["Acoustic Void Listening Probes", "Hydraulic Spreaders & Cutters", "Pneumatic Shoring Struts", "Certified Search K9"],
    isSimulated: true
  },
  {
    id: "RESP-03",
    callsign: "Slope-Alpine 2",
    name: "Mountain & Landslide Extrication Unit",
    specialization: "Debris Flow & Vehicle Winch Extraction",
    status: "En Route",
    assignedIncidentId: "RM-8203",
    crewCount: 6,
    meshNodeId: "NODE-LS-08",
    signalQuality: "Moderate (-81 dBm)",
    batteryPercent: 84,
    locationName: "East Ridge Switchback Approach",
    coordinates: { x: 82, y: 28 },
    equipment: ["Heavy 12-Ton Extraction Winch", "Telescopic Earthmoving Augers", "Soil Stability Seismic Monitors", "Trauma Extrication Board"],
    isSimulated: true
  },
  {
    id: "RESP-04",
    callsign: "Triage-Delta",
    name: "Disaster Medical Assistance (DMAT) Mobile Clinic",
    specialization: "Mass Casualty Trauma & Field Medicine",
    status: "On Scene",
    assignedIncidentId: "RM-8205",
    crewCount: 4,
    meshNodeId: "NODE-MD-09",
    signalQuality: "Excellent (-62 dBm)",
    batteryPercent: 95,
    locationName: "St. Jude Relief Hall Gymnasium",
    coordinates: { x: 44, y: 70 },
    equipment: ["Refrigerated Pharma & Insulin Storage", "Automated Defibrillators & O2 Concentrators", "Field Surgical Stabilization Packs"],
    isSimulated: true
  },
  {
    id: "RESP-05",
    callsign: "Recon-Drone 7",
    name: "Autonomous Aerial Thermal Recon Drone",
    specialization: "Thermal FLIR Search & High-Altitude Mesh Relay",
    status: "On Scene",
    assignedIncidentId: "RM-8204",
    crewCount: 1,
    meshNodeId: "DRONE-RELAY-07",
    signalQuality: "Moderate (-82 dBm)",
    batteryPercent: 42,
    locationName: "North Ridge Highway Airspace (Alt 75m)",
    coordinates: { x: 75, y: 20 },
    equipment: ["4K Dual FLIR Thermal Gimbal", "LoRa High-Altitude Repeater", "Acoustic Beacon Transceiver"],
    isSimulated: true
  },
  {
    id: "RESP-06",
    callsign: "Chem-Shield 3",
    name: "Hazmat Disaster Containment Team",
    specialization: "Chemical Mitigation & Vapor Scrubbing",
    status: "On Scene",
    assignedIncidentId: "RM-8206",
    crewCount: 4,
    meshNodeId: "NODE-HZ-02",
    signalQuality: "Strong (-70 dBm)",
    batteryPercent: 74,
    locationName: "District 2 Industrial Cold Plant",
    coordinates: { x: 77, y: 64 },
    equipment: ["Level A Vapor-Tight Ensembles", "Vapor-Neutralizing Fog Nozzle", "Multi-Gas Photoionization Detector"],
    isSimulated: true
  }
];
