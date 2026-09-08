import React, { useState, useEffect } from 'react';
import { Search, MapPin, CheckCircle2, AlertTriangle, Shield, ArrowRight, PhoneCall, CheckSquare, Square, Truck, Home, Navigation, HelpCircle, LifeBuoy } from 'lucide-react';
import MapView from './MapView';
import LocationRiskCheck from './LocationRiskCheck';
import { getWards, getSafeZones, checkLocationRisk, simulateReading } from '../api';

export default function LiveAlertsSafetyView({ 
  onNavigateTab, 
  onOpenReportModal,
  onSelectShelterSearch 
}) {
  const [wards, setWards] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [queriedLocation, setQueriedLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState(null);

  const mapSectionRef = React.useRef(null);

  const scrollToMap = () => {
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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

  // Fetch telemetry & wards data on load
  const loadTelemetryData = async () => {
    setWardsLoading(true);
    setTelemetryError(null);
    try {
      const [wData, szData] = await Promise.all([getWards(), getSafeZones()]);
      setWards(wData);
      setSafeZones(szData);
      if (wData.length > 0 && !selectedWard) {
        setSelectedWard(wData[0]);
      }
    } catch (err) {
      console.warn("[LiveAlerts] Telemetry fetch warning:", err.message);
      setTelemetryError(err.message);
    } finally {
      setWardsLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetryData();
  }, []);

  const handleCheckLocation = async (payload) => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const res = await checkLocationRisk(payload);
      setQueriedLocation(res);
      setTimeout(() => {
        scrollToMap();
      }, 350);
    } catch (err) {
      setLocationError(err.message || "Failed to calculate hazard score for location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleMapClickLocation = (lat, lng) => {
    handleCheckLocation({ latitude: lat, longitude: lng });
  };

  const handleSimulateSpike = async (wardId) => {
    try {
      await simulateReading(wardId, {
        rainfall_1h_mm: 55.0,
        rainfall_72h_mm: 240.0,
        soil_moisture_pct: 88.0
      });
      await loadTelemetryData();
    } catch (err) {
      console.error("[Simulation] Spike failed:", err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* 1. Check This Location Panel (Address Search & GPS Check) */}
      <section>
        <LocationRiskCheck
          onCheckLocation={handleCheckLocation}
          locationResult={queriedLocation}
          isLoading={locationLoading}
          error={locationError}
          onClearResult={() => setQueriedLocation(null)}
          onViewOnMap={scrollToMap}
        />
      </section>

      {/* 2. Interactive GIS Leaflet Heatmap & Risk Dashboard */}
      <section ref={mapSectionRef} className="space-y-3 scroll-mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              GIS TELEMETRY ENGINE & HEATMAP
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Uttarakhand River Catchment Risk Map
            </h3>
            <p className="text-xs text-slate-500">
              Live heat intensity weighted by ward hazard scores. Click any point on map to inspect location risk.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">18 Ward AWS Sensors Active</span>
          </div>
        </div>

        <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-slate-200">
          <MapView
            wards={wards}
            selectedWard={selectedWard}
            onSelectWard={(w) => setSelectedWard(w)}
            activeFilter="ALL"
            isLoading={wardsLoading}
            error={telemetryError}
            onRetry={loadTelemetryData}
            onSimulateSpike={handleSimulateSpike}
            safeZones={safeZones}
            queriedLocation={queriedLocation}
            onMapClickLocation={handleMapClickLocation}
          />
        </div>
      </section>

      {/* 3. Active Citizen Safety Advisories */}
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
          <div className="bg-white border-l-4 border-l-red-600 border border-slate-200/90 rounded-r-xl p-4 space-y-3 shadow-2xs flex flex-col justify-between animated-flex-card hover-card-lift">
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
          <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200/90 rounded-r-xl p-4 space-y-3 shadow-2xs flex flex-col justify-between animated-flex-card hover-card-lift">
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
          <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200/90 rounded-r-xl p-4 space-y-3 shadow-2xs flex flex-col justify-between animated-flex-card hover-card-lift">
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

      {/* 4. CITIZEN ASSISTANCE SERVICES */}
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

      {/* 5. Lower 2-Column Section: Offline Checklist & Direct Municipal Lines */}
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
          <h5 className="font-bold text-slate-900">Predict Flow Emergency Network</h5>
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
