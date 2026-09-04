import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, MapPin, UserCheck, Layers, Cpu, Radio, Play, RotateCcw, AlertTriangle } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, simStatus, onStepSim, onResetSim }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stepData = simStatus?.step_data;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-red-600/20 text-red-500 p-2 rounded-lg border border-red-500/30 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
              Disaster Intelligence Command Center
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                SIH 100% SOFTWARE PLATFORM
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Pilot: Mandi Hilly District, Himachal Pradesh
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                SYSTEM OPERATIONAL
              </span>
            </p>
          </div>
        </div>

        {/* Live Clock & Navigation Modes */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400">
            <Radio className="w-3.5 h-3.5 mr-1.5 text-emerald-400 animate-pulse" />
            {time}
          </div>

          <nav className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('authority')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'authority'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Authority Command</span>
            </button>

            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'citizen'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Citizen View</span>
            </button>

            <button
              onClick={() => setActiveTab('model')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'model'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ML Explainability</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-slate-700 text-white shadow-lg font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Data Health</span>
            </button>
          </nav>
        </div>
      </div>

      {/* SIH Live Scenario Simulation Control Strip */}
      <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wide border border-amber-500/30 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              SIH LIVE DEMO SIMULATION
            </span>
            <span className="text-slate-300 font-medium">
              Step {simStatus?.current_step || 1} of 7:
            </span>
            <span className="text-cyan-400 font-bold">
              {stepData?.title || 'Normal Baseline'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => onStepSim(stepNum)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  simStatus?.current_step === stepNum
                    ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-400 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {stepNum === 1 && '1. Normal'}
                {stepNum === 2 && '2. Heavy Rain'}
                {stepNum === 3 && '3. Cloudburst'}
                {stepNum === 4 && '4. Escalation'}
                {stepNum === 5 && '5. Flood Alert'}
                {stepNum === 6 && '6. Landslide'}
                {stepNum === 7 && '7. Evacuation'}
              </button>
            ))}

            <button
              onClick={onResetSim}
              className="ml-2 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 flex items-center gap-1 text-[11px] font-semibold border border-red-700/50"
              title="Reset Simulation to Step 1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
