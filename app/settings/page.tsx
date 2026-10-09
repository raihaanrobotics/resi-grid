"use client";

import React, { useState } from "react";
import {
  Sliders,
  Bell,
  Zap,
  Shield,
  Sun,
  Moon,
  Save,
  CheckCircle2,
  Cpu,
  Wifi,
  Database,
  RefreshCw,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Grid & Battery Controls
  const [minBatteryReserve, setMinBatteryReserve] = useState(20);
  const [peakTradingRate, setPeakTradingRate] = useState(1.45);
  const [gridFailover, setGridFailover] = useState(true);

  // Notification Toggles
  const [outageAlerts, setOutageAlerts] = useState(true);
  const [tradeNotifications, setTradeNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // System State
  const [meshTelemetry, setMeshTelemetry] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState(90);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="resigrid-shell min-h-screen text-[var(--text)] pb-32 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      {/* TOP NAVIGATION & CONTROLS */}
      <header className="glass-header p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="feature-icon feature-energy">
            <Sliders className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                System Preferences
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                ResiGrid Config
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Configure grid telemetry thresholds, automated trade triggers, and alert policies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Status Badge */}
          <div className="status-pill hidden sm:flex">
            <span className="status-dot" />
            <span>SYSTEM ACTIVE</span>
          </div>

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

      {/* SUCCESS NOTIFICATION TOAST */}
      {savedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn relative z-10">
          <CheckCircle2 className="w-4 h-4" /> System configuration parameters saved and updated across local nodes.
        </div>
      )}

      {/* SETTINGS CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* MAIN CONFIGURATION PANELS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Energy & Battery Automation Thresholds */}
          <div className="glass-panel p-6 space-y-5">
            <div className="panel-reflection" />
            
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Battery & Power Thresholds
                </h2>
                <p className="text-xs text-secondary mt-0.5">Define automated safeguards for local battery backup and P2P dispatch</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Slider 1: Min Battery Reserve */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <label className="font-medium text-white">Minimum Reserve Battery Level</label>
                  <span className="font-mono text-amber-400 font-bold">{minBatteryReserve}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={minBatteryReserve}
                  onChange={(e) => setMinBatteryReserve(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-black/40 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[10px] text-muted mt-1">P2P energy selling automatically halts when battery capacity drops to this level.</p>
              </div>

              {/* Slider 2: Peak Power Trade Price */}
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs">
                  <label className="font-medium text-white">Target Minimum P2P Sale Tariff</label>
                  <span className="font-mono text-teal-400 font-bold">R{peakTradingRate.toFixed(2)} / kWh</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="3.00"
                  step="0.05"
                  value={peakTradingRate}
                  onChange={(e) => setPeakTradingRate(Number(e.target.value))}
                  className="w-full accent-teal-400 bg-black/40 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[10px] text-muted mt-1">Minimum price threshold required before automated selling to neighbor nodes is initiated.</p>
              </div>

              {/* Toggle: Automatic Grid Failover */}
              <div className="flex items-center justify-between p-3.5 bg-black/20 border border-white/5 rounded-2xl mt-2">
                <div>
                  <p className="text-xs font-semibold text-white">Automatic Load Shedding Isolation</p>
                  <p className="text-[11px] text-muted">Isolate household circuits instantly upon detecting main municipal grid dropouts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGridFailover(!gridFailover)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    gridFailover ? "bg-teal-500" : "bg-white/10"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    gridFailover ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Alert & Notification Controls */}
          <div className="glass-panel p-6 space-y-4">
            <div className="panel-reflection" />

            <div className="border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" /> Notifications & Civic Alerts
              </h2>
              <p className="text-xs text-secondary mt-0.5">Customize push triggers and email notifications</p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3.5 bg-black/20 border border-white/5 rounded-2xl">
                <div>
                  <p className="text-xs font-semibold text-white">Grid Outage & Water Cut Alerts</p>
                  <p className="text-[11px] text-muted">Immediate push notification when local municipal infrastructure fails</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOutageAlerts(!outageAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    outageAlerts ? "bg-cyan-500" : "bg-white/10"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    outageAlerts ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-black/20 border border-white/5 rounded-2xl">
                <div>
                  <p className="text-xs font-semibold text-white">ResiMarket Trade Execution Receipts</p>
                  <p className="text-[11px] text-muted">Notify when energy offer is bought or sold on the local ledger</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTradeNotifications(!tradeNotifications)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    tradeNotifications ? "bg-cyan-500" : "bg-white/10"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    tradeNotifications ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-black/20 border border-white/5 rounded-2xl">
                <div>
                  <p className="text-xs font-semibold text-white">Weekly Consumption Analytics</p>
                  <p className="text-[11px] text-muted">Receive email breakdown of grid usage and energy trade yield</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWeeklyDigest(!weeklyDigest)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    weeklyDigest ? "bg-cyan-500" : "bg-white/10"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    weeklyDigest ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR: SYSTEM HEALTH & ACTION PANEL */}
        <div className="space-y-6">
          
          {/* Network & Storage Health */}
          <div className="glass-panel p-6 space-y-4">
            <div className="panel-reflection" />

            <div className="border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" /> Local Node Telemetry
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-secondary flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" /> KasiMesh Relay
                </span>
                <span className="font-mono text-emerald-400 font-semibold">Connected</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-secondary flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-cyan-400" /> Local Log History
                </span>
                <span className="font-mono text-white font-semibold">{dataRetentionDays} Days</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-secondary flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Firmware Status
                </span>
                <span className="font-mono text-white font-semibold">v2.4.1-rc</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:bg-teal-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save All Preferences
            </button>
          </div>

          {/* Maintenance & Reset Controls */}
          <div className="glass-panel p-6 space-y-4">
            <div className="panel-reflection" />

            <div className="border-b border-white/10 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" /> Advanced Operations
              </h2>
            </div>

            <div className="space-y-2.5">
              <button className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-secondary hover:text-white transition-colors flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Force Sync Mesh Node
              </button>

              <button className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold text-red-400 transition-colors flex items-center justify-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Clear Local Cache
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
