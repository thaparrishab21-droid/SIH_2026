import React, { useState } from 'react';
import { Search, MapPin, CheckCircle2, AlertTriangle, Shield, ArrowRight, PhoneCall, CheckSquare, Square, Truck, Home, Navigation, HelpCircle, LifeBuoy } from 'lucide-react';

export default function LiveAlertsSafetyView({ 
  onNavigateTab, 
  onOpenReportModal,
  onSelectShelterSearch 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedStatus, setSearchedStatus] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Interactive Checklist State
  const [checklist, setChecklist] = useState({
    electricMeter: true,
    zipMedicines: true,
    batterySaver: false,
    storeWater: false,
  });

  const toggleChecklist = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Simulate search match logic
    const query = searchQuery.toLowerCase();
    if (query.includes('17') || query.includes('riverbank') || query.includes('kedarnath')) {
      setSearchedStatus({
        status: 'HIGH_RISK',
        title: 'Ward 17 (Riverbank Area)',
        msg: 'Water level +1.4m. Evacuate ground floors immediately if within 100m of river edge.',
        shelter: 'Government Model Senior Secondary School (0.8 km)',
      });
    } else if (query.includes('civil') || query.includes('underpass')) {
      setSearchedStatus({
        status: 'CAUTION',
        title: 'Civil Lines Underpass Sector',
        msg: 'Subway waterlogged (1.5 ft depth). Barricaded. Divert via Main Ring Road.',
        shelter: 'Indoor Sports Stadium (1.9 km)',
      });
    } else {
      setSearchedStatus({
        status: 'SAFE',
        title: `${searchQuery} Sector`,
        msg: 'No water accumulation reported. Public transport running on time.',
        shelter: 'Community Civic Pavilion (800m away)',
      });
    }
  };

  const handleGpsCheck = () => {
    setGpsLoading(true);
    setTimeout(() => {
      setGpsLoading(false);
      setSearchedStatus({
        status: 'SAFE',
        title: 'Your Location: Central & South Sector',
        msg: 'No water accumulation reported. All clear. Nearest dry supply shelter is 800m away.',
        shelter: 'Community Center (800m away)',
      });
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* 1. Instant Citizen Check Section */}
      <section className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              INSTANT CITIZEN CHECK
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Is my neighborhood safe right now?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Type your sector or tap location to receive a simple, verified status.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Verified 2 mins ago by Civil Defense</span>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type colony, landmark, or street name (e.g., Civil Lines, Ward 17, Model Town)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleGpsCheck}
              disabled={gpsLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{gpsLoading ? 'Locating...' : 'Check My GPS'}</span>
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
            >
              Search
            </button>
          </div>
        </form>

        {/* Dynamic Search / Default Status Alert Box */}
        <div className="mt-4 bg-blue-50/70 border border-blue-200/90 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-slate-900">
                  {searchedStatus ? searchedStatus.title : 'Your Area: Normal (Central & South)'}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase rounded font-mono">
                  ALL CLEAR
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                {searchedStatus ? searchedStatus.msg : 'No water accumulation reported. Public transport running on time. Nearest dry supply shelter: Community Center (800m away).'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('shelters')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 whitespace-nowrap"
          >
            <span>View 4 open shelters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. Active Citizen Safety Advisories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📢</span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Active Citizen Safety Advisories
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">3 active zones</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: High Risk */}
          <div className="bg-white border-l-4 border-l-red-600 border border-slate-200/90 rounded-r-xl p-4 space-y-3 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                  HIGH RISK • EVACUATE GROUND
                </span>
                <span className="text-slate-500">Water Level +1.4m</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-2">
                Ward 17 (Riverbank Area)
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Water rising rapidly along Lower Bridge Road. Evacuate ground floors immediately if located within 100m of river edge.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Rescue Boats Stationed at Pier 3</span>
              <a href="tel:1077" className="text-red-700 font-bold hover:underline flex items-center gap-0.5">
                <span>Rescue</span> ↗
              </a>
            </div>
          </div>

          {/* Card 2: Caution */}
          <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200/90 rounded-r-xl p-4 space-y-3 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded">
                  CAUTION • ROAD BLOCKED
                </span>
                <span className="text-slate-500">Depth: 1.5 ft</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-2">
                Civil Lines Underpass
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Subway underpass completely waterlogged. Barricaded for vehicular traffic. Divert all vehicles via Main Ring Road elevated corridor.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Pumps deployed by civic team</span>
              <span className="text-slate-900 font-bold">Alt Route Open</span>
            </div>
          </div>

          {/* Card 3: Normal */}
          <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200/90 rounded-r-xl p-4 space-y-3 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded">
                  NORMAL • SAFE TRANSIT
                </span>
                <span className="text-slate-500">No Stagnation</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-2">
                Model Town & Station Area
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Streets dry and clear. Train services and local bus shuttles running regularly without any flood interruption.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Commercial markets functioning</span>
              <span className="text-emerald-700 font-bold">100% Operational</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CITIZEN ASSISTANCE SERVICES */}
      <section className="space-y-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
            CITIZEN ASSISTANCE SERVICES
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            What do you need right now?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Every service is free and operated directly by city civil defense and vetted aid groups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Find Food & Bedding */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Find Food & Bedding</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                4 verified civic relief camps operating 24/7. Clean drinking water, hot rations, infant baby formula, and clean bedding ready.
              </p>

              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                  <span>Capacity across city</span>
                  <span className="font-bold text-slate-900">64% Beds Open</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full w-[64%]"></div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('shelters')}
              className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Locate Nearest Shelter</span>
              <MapPin className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Report Water in Home */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Report Water in Home</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ground floor submerged? File a rapid 1-tap ticket for municipal suction pumps, power isolation, or boat pickup.
              </p>

              <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                <span>Average response dispatch</span>
                <span className="font-bold text-slate-900">18 mins</span>
              </div>
            </div>

            <button
              onClick={() => onOpenReportModal && onOpenReportModal()}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <span>Request Pump / Boat</span>
              <span>▶</span>
            </button>
          </div>

          {/* Card 3: Senior & Medical Transport */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Senior & Medical Transport</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated high-clearance 4x4 vans ready for senior citizens, dialysis patients, and pregnant mothers needing urgent safe transit.
              </p>

              <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                <span>Available vans on patrol</span>
                <span className="font-bold text-slate-900">14 Units Active</span>
              </div>
            </div>

            <a
              href="tel:108"
              className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Call Free Transport Van</span>
              <PhoneCall className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </section>

      {/* 4. Lower 2-Column Section: Offline Checklist & Direct Municipal Lines */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Offline Safety Checklist */}
        <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              ZERO-CONNECTIVITY PROTOCOL
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Quick Offline Safety Checklist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow these 5 essential steps if cellular coverage weakens or water approaches your gate.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            
            {/* Item 1 */}
            <div 
              onClick={() => toggleChecklist('electricMeter')}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all"
            >
              {checklist.electricMeter ? (
                <CheckSquare className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className={`text-xs font-bold ${checklist.electricMeter ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  Turn off main electrical meter
                </h5>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  If rising water enters boundary walls or touches porch steps, kill the main breaker immediately to prevent shocks.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div 
              onClick={() => toggleChecklist('zipMedicines')}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all"
            >
              {checklist.zipMedicines ? (
                <CheckSquare className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className={`text-xs font-bold ${checklist.zipMedicines ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  Seal vital medicines and ID in zip-plastic
                </h5>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  Keep insulin, blood pressure medication, prescriptions, and cards inside a double waterproof seal inside an upper-floor bag.
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div 
              onClick={() => toggleChecklist('batterySaver')}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all"
            >
              {checklist.batterySaver ? (
                <CheckSquare className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className={`text-xs font-bold ${checklist.batterySaver ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  Enable Battery Saver & Limit Video Streaming
                </h5>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  Keep phone active for emergency radio broadcasts and calls. Conserve power bank for overnight alerts.
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div 
              onClick={() => toggleChecklist('storeWater')}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all"
            >
              {checklist.storeWater ? (
                <CheckSquare className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className={`text-xs font-bold ${checklist.storeWater ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  Store 10 Liters Drinking Water in Sealed Bottles
                </h5>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  Municipal pipeline water can experience temporary silt backup during high river discharge.
                </p>
              </div>
            </div>

          </div>

          <div className="pt-2 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>💬 Receive flash alerts via zero-data SMS: Text <strong className="text-slate-900">SAFE</strong> to <strong className="text-slate-900">56070</strong></span>
            </span>
            <span className="font-bold text-slate-500">Toll-Free</span>
          </div>
        </div>

        {/* Right Column: Direct Municipal Lines */}
        <div className="md:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                DIRECT MUNICIPAL LINES
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Instant Crisis Direct-Dials
              </h3>
            </div>

            <div className="space-y-3">
              <a 
                href="tel:1077"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-red-100 text-red-700 font-bold">🚨</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Flood Control Command</h5>
                    <p className="text-[11px] text-slate-500">Disaster Operations Headquarter</p>
                  </div>
                </div>
                <span className="font-mono text-base font-black text-red-700">1077</span>
              </a>

              <a 
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-blue-100 text-blue-700 font-bold">🚑</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Medical Ambulance</h5>
                    <p className="text-[11px] text-slate-500">Critical triage & trauma dispatch</p>
                  </div>
                </div>
                <span className="font-mono text-base font-black text-slate-900">108</span>
              </a>

              <a 
                href="tel:1912"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-amber-100 text-amber-800 font-bold">⚡</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Electricity Board Emergency</h5>
                    <p className="text-[11px] text-slate-500">Transformer or wire spark reports</p>
                  </div>
                </div>
                <span className="font-mono text-base font-black text-slate-900">1912</span>
              </a>
            </div>

            <button 
              onClick={() => onNavigateTab('emergency')}
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>View all neighborhood precinct helplines</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Collection Center Drop-off Card */}
          <div className="bg-blue-50/90 border border-blue-200 p-3.5 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <span>🤲</span>
              <span>Want to drop off blankets or dry ration?</span>
            </div>
            <p className="text-[11px] text-blue-900">
              Municipal collection center is open at Stadium Gate #4.
            </p>
            <button 
              onClick={() => onNavigateTab('charity')}
              className="text-[11px] font-bold text-blue-700 underline pt-1 block"
            >
              See urgent material requirements
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          <h5 className="font-bold text-slate-900">Flood-Flash Emergency Network</h5>
          <p className="text-[11px] mt-0.5">Official Municipal & Civil Defense Public Broadcast System. High-priority public information line active 24/7.</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-600">
          <button onClick={() => onNavigateTab('alerts')} className="hover:text-slate-900">Status Telemetry</button>
          <button onClick={() => onNavigateTab('emergency')} className="hover:text-slate-900">Hotlines</button>
          <button onClick={() => onNavigateTab('shelters')} className="hover:text-slate-900">Safe Havens</button>
        </div>
      </footer>

    </div>
  );
}
