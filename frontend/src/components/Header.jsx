import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Radio, FileText, Monitor, HelpCircle, AlertOctagon, UserCheck, LogIn, LogOut, HeartHandshake } from 'lucide-react';


export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenShortcuts, 
  highContrast, 
  setHighContrast,
  currentUser,
  onOpenLogin,
  onLogout
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatIST = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' | ' + date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' IST';
  };

  return (
    <header className={`border-b transition-colors ${
      highContrast 
        ? 'bg-slate-950 border-slate-700 text-white' 
        : 'bg-[#0b1120] border-[#26354f] text-slate-100'
    }`}>
      {/* Top Warning Banner for Active Monsoon Alert */}
      <div className="bg-red-950/90 border-b border-red-800/80 px-4 py-1.5 flex items-center justify-between text-xs font-medium text-red-200">
        <div className="flex items-center gap-2 overflow-hidden">
          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-red-300 px-1.5 py-0.5 bg-red-900/60 rounded border border-red-700/60">
            IMD RED ALERT ACTIVE
          </span>
          <span className="truncate">
            Heavy to Extremely Heavy Monsoon Downpour forecast in Mandakini & Alaknanda River Valleys (Next 24h)
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 shrink-0 font-mono text-[11px] text-red-300">
          <span>CONTROL ROOM: CONTROL-SDRF-MND-01</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: System Title & Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                SDMA / DDMA HILL-EWS
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">
                v2.0 Operational
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Landslide & Flash-Flood Early Warning System • Uttarakhand Sector
            </p>
          </div>
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#161f33] p-1 rounded-md border border-[#26354f]" aria-label="Main Navigation">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Risk Overview Map</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'alerts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dissemination Log</span>
          </button>

          <button
            onClick={() => setActiveTab('relief')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'relief'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-emerald-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            <span>Relief & Community Recovery</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'health'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Data Sources & Mesh</span>
          </button>
        </nav>


        {/* Right: User Auth Badge & Clock */}
        <div className="flex items-center gap-3">
          {/* User Auth Badge */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded border border-blue-900 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block text-[11px] leading-none">{currentUser.full_name || currentUser.username}</span>
                <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest">{currentUser.role}</span>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700 text-xs font-semibold"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Login</span>
            </button>
          )}

          {/* Live IST Clock */}
          <div className="hidden lg:flex flex-col text-right font-mono text-xs text-slate-300 bg-slate-900/80 px-3 py-1 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">System Time</span>
            <span className="font-bold text-emerald-400 tabular-nums">{formatIST(time)}</span>
          </div>

          {/* Wall Screen High Contrast Toggle */}
          <button
            onClick={() => setHighContrast(!highContrast)}
            title="Toggle Control Room Wall Screen High-Contrast Mode"
            className={`p-2 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              highContrast
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={onOpenShortcuts}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
