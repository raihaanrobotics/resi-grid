"use client";

import React, { useState, useEffect } from "react";
import {
  Radar as RadarIcon,
  Zap,
  Droplet,
  Wifi,
  AlertTriangle,
  Layers,
  MapPin,
  RefreshCw,
  Sun,
  Moon,
  ChevronRight,
  Eye,
  EyeOff,
  Crosshair,
  ShieldAlert,
  Activity,
  Filter,
} from "lucide-react";

interface IncidentMarker {
  id: string;
  type: "power" | "water" | "mesh" | "civic";
  title: string;
  location: string;
  severity: "high" | "medium" | "low";
  time: string;
  coordinates: { x: number; y: number }; // Percentage offsets for interactive radar overlay
}

const mockIncidents: IncidentMarker[] = [
  {
    id: "INC-101",
    type: "water",
    title: "Burst Water Main",
    location: "4th Avenue & Park Road",
    severity: "high",
    time: "10 mins ago",
    coordinates: { x: 38, y: 42 },
  },
  {
    id: "INC-102",
    type: "power",
    title: "Substation Trip",
    location: "Sector 3 Substation",
    severity: "high",
    time: "24 mins ago",
    coordinates: { x: 65, y: 28 },
  },
  {
    id: "INC-103",
    type: "mesh",
    title: "Relay Node #19 Offline",
    location: "Block B Water Tower",
    severity: "medium",
    time: "45 mins ago",
    coordinates: { x: 52, y: 70 },
  },
  {
    id: "INC-104",
    type: "civic",
    title: "Pothole Hazard",
    location: "Main Road Outer Curve",
    severity: "low",
    time: "1 hr ago",
    coordinates: { x: 25, y: 60 },
  },
];

export default function RadarPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedIncident, setSelectedIncident] = useState<IncidentMarker | null>(mockIncidents[0]);
  const [scanning, setScanning] = useState(true);

  // Active Map Filter Layers
  const [layers, setLayers] = useState({
    power: true,
    water: true,
    mesh: true,
    civic: true,
  });

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const filteredIncidents = mockIncidents.filter((inc) => layers[inc.type]);

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">

        {/* TOP NAVIGATION & CONTROLS */}
        <header className="glass-header flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="feature-icon feature-energy">
              <RadarIcon className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-[0.2em] text-white">
                  COMMUNITY RADAR™
                </h1>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-medium tracking-[0.15em] text-emerald-400">
                  LIVE SCAN ACTIVE
                </span>
              </div>
              <p className="mt-0.5 text-[9px] tracking-[0.15em] text-muted">
                REAL-TIME GEOSPATIAL INTELLIGENCE, GRID OUTAGES & INFRASTRUCTURE TELEMETRY
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Live Scanner Toggle */}
            <button
              onClick={() => setScanning(!scanning)}
              className={`status-pill hidden cursor-pointer transition-colors sm:flex ${
                scanning ? "border-emerald-500/40 text-emerald-300" : "opacity-60"
              }`}
            >
              <span className={`status-dot ${scanning ? "bg-emerald-400 animate-ping" : "bg-gray-500"}`} />
              <span>{scanning ? "SWEEP ACTIVE" : "RADAR PAUSED"}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="glass-icon-button"
              title="Toggle theme"
              aria-label="Toggle visual theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* GEOSPATIAL RADAR CANVAS & SIDEBAR CONTROL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* RADAR INTERACTIVE MAP DISPLAY */}
          <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between relative overflow-hidden min-h-[460px]">
            <div className="panel-reflection" />

            {/* Map Header Overlay Controls */}
            <div className="flex items-center justify-between mb-4 z-20">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-white font-semibold">SECTOR GRID: PMB-SOUTH</span>
              </div>

              {/* Quick Layer Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => toggleLayer("power")}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                    layers.power ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-muted hover:text-white"
                  }`}
                  title="Toggle Power Outages Layer"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleLayer("water")}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                    layers.water ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-muted hover:text-white"
                  }`}
                  title="Toggle Water Faults Layer"
                >
                  <Droplet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleLayer("mesh")}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                    layers.mesh ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-muted hover:text-white"
                  }`}
                  title="Toggle KasiMesh Nodes Layer"
                >
                  <Wifi className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleLayer("civic")}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                    layers.civic ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "text-muted hover:text-white"
                  }`}
                  title="Toggle Civic Issues Layer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SIMULATED RADAR SCOPE DISPLAY */}
            <div className="relative w-full flex-1 bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center my-2">
              
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
              
              {/* Radar Circular Concentric Sweep Rings */}
              <div className="absolute w-[360px] h-[360px] border border-emerald-500/20 rounded-full pointer-events-none" />
              <div className="absolute w-[240px] h-[240px] border border-emerald-500/20 rounded-full pointer-events-none" />
              <div className="absolute w-[120px] h-[120px] border border-emerald-500/20 rounded-full pointer-events-none" />
              <div className="absolute w-full h-[1px] bg-emerald-500/10 pointer-events-none" />
              <div className="absolute h-full w-[1px] bg-emerald-500/10 pointer-events-none" />

              {/* Rotating Radar Sweep Line */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[360px] h-[360px] rounded-full relative animate-spin" style={{ animationDuration: "6s" }}>
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-emerald-500/25 to-transparent origin-bottom-left rounded-tr-full" />
                  </div>
                </div>
              )}

              {/* Dynamic Incident Markers on Canvas */}
              {filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                
                let markerBg = "bg-amber-500 text-amber-950";
                let markerGlow = "shadow-[0_0_15px_rgba(245,158,11,0.6)]";
                
                if (incident.type === "water") {
                  markerBg = "bg-cyan-400 text-cyan-950";
                  markerGlow = "shadow-[0_0_15px_rgba(34,211,238,0.6)]";
                } else if (incident.type === "mesh") {
                  markerBg = "bg-purple-400 text-purple-950";
                  markerGlow = "shadow-[0_0_15px_rgba(192,132,252,0.6)]";
                } else if (incident.type === "civic") {
                  markerBg = "bg-teal-400 text-teal-950";
                  markerGlow = "shadow-[0_0_15px_rgba(45,212,191,0.6)]";
                }

                return (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    style={{ top: `${incident.coordinates.y}%`, left: `${incident.coordinates.x}%` }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group z-30`}
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Ping Animation for High Severity */}
                      {incident.severity === "high" && (
                        <span className={`absolute w-6 h-6 rounded-full animate-ping opacity-75 ${
                          incident.type === "water" ? "bg-cyan-400" : "bg-amber-400"
                        }`} />
                      )}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${markerBg} ${markerGlow} ${
                        isSelected ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                      }`}>
                        {incident.type === "power" && <Zap className="w-3.5 h-3.5" />}
                        {incident.type === "water" && <Droplet className="w-3.5 h-3.5" />}
                        {incident.type === "mesh" && <Wifi className="w-3.5 h-3.5" />}
                        {incident.type === "civic" && <AlertTriangle className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Footer Telemetry */}
            <div className="flex items-center justify-between text-xs text-muted mt-3 z-20">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Showing <strong className="text-white">{filteredIncidents.length}</strong> active hazards
              </span>
              <span className="font-mono text-[11px] text-muted">LAT: -29.6006, LON: 30.3794</span>
            </div>
          </div>

          {/* INCIDENT DETAILS & FILTER CONTROL PANEL */}
          <div className="glass-panel p-6 flex flex-col justify-between relative">
            <div className="panel-reflection" />

            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" /> Hazard Telemetry
                </h2>
                <span className="text-[10px] font-mono text-muted">ID: {selectedIncident?.id || "N/A"}</span>
              </div>

              {selectedIncident ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {selectedIncident.type.toUpperCase()} HAZARD
                      </span>
                      <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {selectedIncident.severity.toUpperCase()} PRIORITY
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{selectedIncident.title}</h3>
                      <p className="text-xs text-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {selectedIncident.location}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-muted">
                      <span>Logged: {selectedIncident.time}</span>
                      <span className="text-emerald-400 font-medium">Crew Dispatched</span>
                    </div>
                  </div>

                  {/* Layer Visibility Selectors */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono tracking-wider text-muted uppercase">ACTIVE RADAR LAYERS</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleLayer("power")}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          layers.power
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-black/20 border-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Power</span>
                        {layers.power ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => toggleLayer("water")}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          layers.water
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                            : "bg-black/20 border-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5" /> Water</span>
                        {layers.water ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => toggleLayer("mesh")}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          layers.mesh
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                            : "bg-black/20 border-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> KasiMesh</span>
                        {layers.mesh ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => toggleLayer("civic")}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          layers.civic
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                            : "bg-black/20 border-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Civic</span>
                        {layers.civic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted py-8 text-center">Select an incident marker on the radar map to view telemetry.</p>
              )}
            </div>

            <button className="w-full mt-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2">
              Report New Hazard <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* RECENT RADAR FEED LIST */}
        <div className="glass-panel p-6 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Real-time Hazard Feed
            </h2>
            <span className="text-xs text-muted font-mono">Auto-Updating</span>
          </div>

          <div className="space-y-3">
            {mockIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedIncident?.id === incident.id
                    ? "bg-white/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    incident.type === "power" ? "bg-amber-500/20 text-amber-400" :
                    incident.type === "water" ? "bg-cyan-500/20 text-cyan-400" :
                    incident.type === "mesh" ? "bg-purple-500/20 text-purple-400" :
                    "bg-teal-500/20 text-teal-400"
                  }`}>
                    {incident.type === "power" && <Zap className="w-4 h-4" />}
                    {incident.type === "water" && <Droplet className="w-4 h-4" />}
                    {incident.type === "mesh" && <Wifi className="w-4 h-4" />}
                    {incident.type === "civic" && <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{incident.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{incident.location}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-muted block">{incident.time}</span>
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase">{incident.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
