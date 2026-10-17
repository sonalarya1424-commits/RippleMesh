# RippleMesh — Offline-First Coordinator Dashboard

RippleMesh is an offline-first, AI-powered disaster rescue coordination system designed for emergency operations centers (EOC) when conventional power and cellular infrastructure are severed.

This repository contains the **Coordinator Dashboard** frontend built with React, Vite, and clean modular CSS.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## Project Structure

```
RippleMesh/
├── index.html                   # HTML template with Google Fonts (Inter + JetBrains Mono)
├── package.json                 # Minimal React + Vite setup
├── vite.config.js               # Dev server port 5173 with React plugin
├── src/
│   ├── main.jsx                 # Application entrypoint
│   ├── App.jsx                  # Root state management, view routing & local mutations
│   ├── index.css                # Global imports, resets, scrollbars
│   ├── data/                    # Modular Mock Telemetry Datasets
│   │   ├── incidents.js         # Realistic incidents with decoupled urgency, trust & witnesses
│   │   ├── responders.js        # Active rescue units, equipment, radio nodes, battery
│   │   └── agentEvents.js       # Timeline for Reporter, Verifier, Relay, Corroboration, Coordinator
│   ├── components/              # Reusable UI Components
│   │   ├── Icons.jsx            # Zero-dependency SVG icon system
│   │   ├── StatusBadge.jsx      # Incident status badges
│   │   ├── SeverityBadge.jsx    # Urgency & severity badges with pulse animations
│   │   ├── SummaryCards.jsx     # Dynamically computed metric cards with quick filters
│   │   ├── IncidentList.jsx     # Filterable queue (search, severity, status, sorting)
│   │   ├── IncidentDetail.jsx   # Detailed panel with synthetic visualizer & voice telemetry
│   │   ├── AgentActivityFeed.jsx# Multi-agent timeline with agent filter chips & simulation
│   │   ├── DemoMap.jsx          # Offline illustrative tactical SVG grid with LoRa nodes
│   │   ├── RespondersView.jsx   # Unit fleet management with equipment & status cycling
│   │   ├── EditIncidentModal.jsx# In-memory modal dialog with form validation
│   │   ├── Sidebar.jsx          # Dark navy navigation with mesh health telemetry
│   │   └── Navbar.jsx           # Operations console header with simulated distress burst trigger
│   └── styles/                  # Modular Plain CSS Architecture
│       ├── variables.css        # Dark navy (#070b14) & electric teal (#00e5c9) tokens
│       ├── layout.css           # Sticky sidebar, grid systems, responsive breakpoints
│       └── components.css       # Styles for cards, feeds, badges, maps, audio player
```

---

## Core Architectural Highlights

1. **Decoupled Urgency, Confidence, and Trust:**
   - **Severity/Urgency**: Immediate hazard risk (e.g. Critical, High, Medium, Low).
   - **Confidence Score**: AI extraction probability (e.g. 96%).
   - **Trust Score**: Source authenticity & cryptographic signature verification.
   - *Design Rule*: Incident `RM-8202` represents a critical structural collapse with only **1 unverified witness**. Under RippleMesh offline triage policy, this incident preserves its **CRITICAL** triage priority rather than being downgraded due to low corroboration.

2. **Offline-First Zero-API Architecture:**
   - No external map tiles (e.g. Google Maps, Mapbox) are required. The tactical grid is rendered via an interactive SVG coordinate canvas.
   - No external font icon CDNs or large component libraries. All icons and evidence graphics are rendered via lightweight, performant SVGs.

3. **Interactive Local State Mutations:**
   - **Approve / Reject**: Updates local operational status with visible feedback banners and auto-logs Coordinator Agent events.
   - **Edit Incident**: Opens a validated modal to edit titles, severities, statuses, and notes.
   - **Simulate Distress Burst**: Emits simulated LoRa/BLE distress packets into the local queue.
   - **Simulate Next Agent Cycle**: Triggers autonomous background agent pulses across the 5 agents.

---

## Integration Guide for Teammates

- **Backend / Mesh Relay Team**: Replace `src/data/incidents.js` with WebSocket or SSE subscriptions connecting to local LoRa/BLE bridge nodes.
- **AI Agent Team**: Replace the simulated triage objects in `src/data/agentEvents.js` and `aiTriage` in `incidents.js` with local edge LLM outputs (e.g., Llama-3, Whisper-tiny).
- **Database Team**: Replace `useState` mutations in `src/App.jsx` (`handleApproveIncident`, `handleSaveEdit`, etc.) with SQLite/IndexedDB or CouchDB sync operations.
