import React from 'react';
import { Shield, Eye, AlertTriangle, AlertOctagon, CloudRain, RefreshCw, Layers } from 'lucide-react';

export default function SummaryStrip({ wards, activeFilter, setActiveFilter, highContrast, lastUpdated, isRefetching }) {
  const counts = {
    total: wards.length,
    CRITICAL: wards.filter((w) => w.riskLevel === 'CRITICAL').length,
    WARNING: wards.filter((w) => w.riskLevel === 'WARNING').length,
    WATCH: wards.filter((w) => w.riskLevel === 'WATCH').length,
    SAFE: wards.filter((w) => w.riskLevel === 'SAFE').length,
  };

  // Find ward with maximum 24h rainfall
  const maxRainWard = [...wards].sort((a, b) => (b.sensors?.rain24h || 0) - (a.sensors?.rain24h || 0))[0];

  const formatLastUpdated = (date) => {
    if (!date) return 'Syncing...';
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST';
  };

  return (
    <section className={`border-b px-4 py-2.5 transition-colors ${
      highContrast
        ? 'bg-slate-900 border-slate-700'
        : 'bg-[#161f33] border-[#26354f]'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Monitored Count & Severity Scale Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded font-semibold text-slate-200">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Monitored:</span>
            <span className="font-mono text-white text-sm tabular-nums">{counts.total} Wards</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Severity Quick Filters */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter wards by risk severity">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded border font-medium transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-slate-700 text-white border-slate-500 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              All ({counts.total})
            </button>

            {/* Critical */}
            <button
              onClick={() => setActiveFilter(activeFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
                activeFilter === 'CRITICAL'
                  ? 'bg-red-950 border-red-500 text-red-200 font-bold ring-1 ring-red-500'
                  : 'bg-red-950/40 border-red-800/80 text-red-400 hover:bg-red-900/40'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Critical:</span>
              <span className="font-mono font-bold text-red-300 tabular-nums text-sm">{counts.CRITICAL}</span>
            </button>

            {/* Warning */}
            <button
              onClick={() => setActiveFilter(activeFilter === 'WARNING' ? 'ALL' : 'WARNING')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
                activeFilter === 'WARNING'
                  ? 'bg-orange-950 border-orange-500 text-orange-200 font-bold ring-1 ring-orange-500'
                  : 'bg-orange-950/40 border-orange-800/80 text-orange-400 hover:bg-orange-900/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <span>Warning:</span>
              <span className="font-mono font-bold text-orange-300 tabular-nums text-sm">{counts.WARNING}</span>
            </button>

            {/* Watch */}
            <button
              onClick={() => setActiveFilter(activeFilter === 'WATCH' ? 'ALL' : 'WATCH')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
                activeFilter === 'WATCH'
                  ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold ring-1 ring-amber-500'
                  : 'bg-amber-950/40 border-amber-800/80 text-amber-400 hover:bg-amber-900/40'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Watch:</span>
              <span className="font-mono font-bold text-amber-300 tabular-nums text-sm">{counts.WATCH}</span>
            </button>

            {/* Safe */}
            <button
              onClick={() => setActiveFilter(activeFilter === 'SAFE' ? 'ALL' : 'SAFE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
                activeFilter === 'SAFE'
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/40'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safe:</span>
              <span className="font-mono font-bold text-emerald-300 tabular-nums text-sm">{counts.SAFE}</span>
            </button>
          </div>
        </div>

        {/* Right: Key Telemetry Summary & Live Sync */}
        <div className="flex flex-wrap items-center gap-4 text-slate-300 font-mono">
          {/* Max Rainfall Telemetry */}
          {maxRainWard && maxRainWard.sensors && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-sans text-slate-400">Peak 24h Rain:</span>
              <span className="font-bold text-cyan-300 tabular-nums">{maxRainWard.sensors.rain24h} mm</span>
              <span className="text-[11px] font-sans text-slate-400">({maxRainWard.name.split(' ')[0]})</span>
            </div>
          )}

          {/* Sync indicator */}
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-sans">
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Telemetry Sync:</span>
            <span className="font-mono font-bold text-emerald-400">LIVE ({formatLastUpdated(lastUpdated)})</span>
          </div>
        </div>
      </div>
    </section>
  );
}
