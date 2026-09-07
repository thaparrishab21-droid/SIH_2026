import React, { useState } from 'react';
import { PhoneCall, Radio, Printer, Smartphone, Shield, AlertOctagon, Volume2, VolumeX } from 'lucide-react';

export default function EmergencyNumbersView() {
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Level 3 Active Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          <span className="font-bold text-slate-900 uppercase font-mono tracking-wider">
            CIVIL DEFENSE LEVEL 3 ACTIVE
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="truncate">
            Carrier network SMS priority fallback enabled
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 font-bold shrink-0">
          <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded">LOW-BANDWIDTH MODE</span>
          <span>UPDATED: LIVE 04 SEC AGO</span>
        </div>
      </div>

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
            EMERGENCY HOTLINES & DISPATCH
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Speed Dial & Crisis Directory
          </h2>
        </div>
        <div className="text-[11px] font-mono text-slate-500 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>TOLL-FREE • ALL NETWORK OPERATORS • 24/7 PRIORITY DISPATCH</span>
        </div>
      </div>

      {/* 3 Top Priority Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Priority 1 Water Rescue (Red) */}
        <div className="bg-[#bd1e1e] text-white rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="bg-white text-[#bd1e1e] px-2 py-0.5 rounded uppercase">
                PRIORITY 1
              </span>
              <span className="text-red-200">24/7 ALL-WEATHER</span>
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Water Rescue & Flood Command
              </h3>
              <p className="text-xs text-red-100 mt-1 leading-snug">
                Boat squads, high-altitude rooftop rescue, aquatic extraction.
              </p>
            </div>

            <div className="text-4xl font-black font-mono tracking-tight text-white pt-2">
              1077
            </div>
          </div>

          <a
            href="tel:1077"
            className="w-full py-3 px-4 bg-[#8b0f0f] hover:bg-[#730a0a] border border-red-400/50 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Tap to Call 1077</span>
          </a>
        </div>

        {/* Card 2: Ambulance */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded uppercase">
                AMBULANCE
              </span>
              <span>CRITICAL CARE</span>
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                Medical Ambulance & Trauma
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Paramedic rescue boats, field triage, emergency resuscitation.
              </p>
            </div>

            <div className="text-4xl font-black font-mono tracking-tight text-slate-900 pt-2">
              108
            </div>
          </div>

          <a
            href="tel:108"
            className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Tap to Call 108</span>
          </a>
        </div>

        {/* Card 3: NDRF / Police */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded uppercase">
                DISASTER FORCE
              </span>
              <span>COMBINED OPS</span>
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                Police & NDRF Rescue Force
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Perimeter evacuation, SDRF flood battalions, crowd safety.
              </p>
            </div>

            <div className="text-4xl font-black font-mono tracking-tight text-slate-900 pt-2">
              112
            </div>
          </div>

          <a
            href="tel:112"
            className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Tap to Call 112</span>
          </a>
        </div>

      </div>

      {/* 2-Column Grid: Civic & Utility Lines + Vulnerable Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Civic & Utility Lines */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <h4 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                CIVIC & UTILITY LINES
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">INFRASTRUCTURE</span>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            
            <div className="pt-2 flex items-center justify-between text-xs">
              <div>
                <h5 className="font-bold text-slate-900">Electricity & Live Wires</h5>
                <p className="text-[11px] text-red-600 font-mono">Transformer sparks, snapped submerged lines</p>
              </div>
              <a href="tel:1912" className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded-md border border-blue-200">
                📞 1912
              </a>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs">
              <div>
                <h5 className="font-bold text-slate-900">Drinking Water Tankers</h5>
                <p className="text-[11px] text-slate-500">Emergency potable supply, contaminated mains</p>
              </div>
              <a href="tel:18001802345" className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded-md border border-blue-200">
                📞 1800-180-2345
              </a>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs">
              <div>
                <h5 className="font-bold text-slate-900">Gas Leakage Emergency</h5>
                <p className="text-[11px] text-slate-500">PNG line breach, submerged LPG recovery</p>
              </div>
              <a href="tel:1986" className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded-md border border-blue-200">
                📞 1986
              </a>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs">
              <div>
                <h5 className="font-bold text-slate-900">Disaster War Room (Landline)</h5>
                <p className="text-[11px] text-slate-500">Copper wired fallback if towers collapse</p>
              </div>
              <a href="tel:02222694725" className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded-md border border-blue-200">
                📞 022-2269-4725
              </a>
            </div>

          </div>
        </div>

        {/* Vulnerable Citizen Priority */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🛡️</span>
                <h4 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                  VULNERABLE CITIZEN PRIORITY
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">ADVOCACY</span>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              
              <div className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-bold text-slate-900">Senior Citizen Helpline</h5>
                  <p className="text-[11px] text-slate-500">Bedridden evacuation, medication, insulin supply</p>
                </div>
                <a href="tel:14567" className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded-md border border-blue-200">
                  📞 14567
                </a>
              </div>

              <div className="pt-3 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-bold text-slate-900">Women & Child Protection</h5>
                  <p className="text-[11px] text-slate-500">Emergency escort, maternal care kits, lost child</p>
                </div>
                <div className="flex items-center gap-1">
                  <a href="tel:1091" className="px-2 py-1 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded border border-blue-200">1091</a>
                  <a href="tel:1098" className="px-2 py-1 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded border border-blue-200">1098</a>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-bold text-slate-900">Mental Health & Crisis Support</h5>
                  <p className="text-[11px] text-slate-500">TELE-MANAS counseling, panic distress relief</p>
                </div>
                <a href="tel:14416" className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded-md border border-blue-200">
                  📞 14416
                </a>
              </div>

            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span>🔋</span> Conserve power: Keep phone in Ultra Battery Saver.
            </span>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-md flex items-center gap-1 text-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save / Print</span>
            </button>
          </div>
        </div>

      </div>

      {/* Zero Data / Offline Emergency Protocols */}
      <section className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <h4 className="text-base font-bold text-slate-900 tracking-tight">
              Zero Data / Offline Emergency Protocols
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Functions when 4G/5G data is down
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Protocol 1: SMS Location */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">💬 SMS Location to 56070</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Format: <strong className="text-slate-900 bg-slate-200 px-1 py-0.5 rounded">RESCUE [Location] [Count]</strong>
              </p>
            </div>
            <a
              href="sms:56070?body=RESCUE%20Location%20Count"
              className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg text-center transition-all shadow-xs"
            >
              ▶ Open SMS
            </a>
          </div>

          {/* Protocol 2: FM Radio 102.6 */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">📻 Emergency FM Radio: 102.6 FM</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All India Radio continuous disaster alert bulletin
              </p>
            </div>
            <button
              onClick={() => setIsPlayingRadio(!isPlayingRadio)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-sm font-black rounded-lg shrink-0 flex items-center gap-1.5 transition-all shadow-xs"
            >
              {isPlayingRadio ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>AIR 102.6</span>
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}
