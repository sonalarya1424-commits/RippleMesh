/**
 * RippleMesh Mock Responders Data
 * Emergency response teams connected via offline mesh radio nodes.
 */

export const INITIAL_RESPONDERS = [
  {
    id: "RESP-01",
    callsign: "Aqua-Lead 1",
    name: "Swiftwater Rescue Alpha",
    specialization: "Water Rescue & Evacuation",
    status: "En Route",
    assignedIncidentId: "RM-8201",
    crewCount: 5,
    meshNodeId: "NODE-SW-04",
    signalQuality: "Excellent (-64 dBm)",
    batteryPercent: 92,
    locationName: "En route to Marina Sector 4",
    coordinates: { x: 26, y: 39 },
    equipment: ["2x Zodiac Inflatable Boats", "6x High-Buoyancy Vests", "Water Stretcher", "Mesh Relay Beacon"]
  },
  {
    id: "RESP-02",
    callsign: "USAR-Breaker",
    name: "Urban Search & Heavy Rescue (USAR)",
    specialization: "Structural Collapse & Extraction",
    status: "Available",
    assignedIncidentId: null,
    crewCount: 8,
    meshNodeId: "NODE-US-11",
    signalQuality: "Good (-78 dBm)",
    batteryPercent: 88,
    locationName: "Base Camp Central Depot",
    coordinates: { x: 50, y: 45 },
    equipment: ["Acoustic Void Listening Devices", "Hydraulic Cutters/Spreaders", "Shoring Struts", "K9 Search Unit"]
  },
  {
    id: "RESP-03",
    callsign: "Chem-Shield 3",
    name: "Hazmat Emergency Unit 3",
    specialization: "Chemical, Biological & Gas Mitigation",
    status: "On Scene",
    assignedIncidentId: "RM-8203",
    crewCount: 4,
    meshNodeId: "NODE-HZ-02",
    signalQuality: "Strong (-70 dBm)",
    batteryPercent: 74,
    locationName: "District 2 Cold Storage Plant",
    coordinates: { x: 77, y: 64 },
    equipment: ["Level A Hazmat Ensembles", "Vapor Neutralizing Fogger", "Multi-Gas Spectrometer"]
  },
  {
    id: "RESP-04",
    callsign: "Triage-Delta",
    name: "Field Paramedic Mobile Clinic",
    specialization: "Emergency Trauma & Mass Casualty",
    status: "Available",
    assignedIncidentId: "RM-8204",
    crewCount: 4,
    meshNodeId: "NODE-MD-09",
    signalQuality: "Excellent (-62 dBm)",
    batteryPercent: 95,
    locationName: "St. Jude Relief Hall Perimeter",
    coordinates: { x: 44, y: 70 },
    equipment: ["Refrigerated Pharma Storage", "AEDs & Oxygen Monitors", "Trauma Surgical Packs"]
  },
  {
    id: "RESP-05",
    callsign: "Recon-Drone 7",
    name: "Autonomous Aerial Mesh Relay Drone",
    specialization: "Aerial Recon & Mesh Repeat",
    status: "On Scene",
    assignedIncidentId: "RM-8202",
    crewCount: 1,
    meshNodeId: "DRONE-RELAY-07",
    signalQuality: "Moderate (-82 dBm)",
    batteryPercent: 42,
    locationName: "Old Town Market Airspace (Alt 60m)",
    coordinates: { x: 56, y: 24 },
    equipment: ["4K FLIR Thermal Gimbal", "LoRa High-Altitude Relay", "Acoustic Beacon Finder"]
  },
  {
    id: "RESP-06",
    callsign: "Grid-Guard 2",
    name: "Municipal Power Isolation Crew",
    specialization: "Electrical Grid & Infrastructure",
    status: "Available",
    assignedIncidentId: null,
    crewCount: 3,
    meshNodeId: "NODE-PWR-16",
    signalQuality: "Good (-75 dBm)",
    batteryPercent: 68,
    locationName: "Sector 3 Staging Area",
    coordinates: { x: 65, y: 52 },
    equipment: ["High-Voltage Insulated Boom Truck", "Line Grounding Clamps", "Safety Cordon Arrays"]
  }
];
