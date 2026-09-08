import React, { useState } from 'react';
import { Search, MapPin, AlertTriangle, Shield, CheckCircle2, AlertOctagon, Eye, Compass, RefreshCw, Navigation, Info, ArrowRight, X } from 'lucide-react';
import { SEVERITY_LEVELS } from '../data/severityConfig';

export default function LocationRiskCheck({ 
  onCheckLocation, 
  locationResult, 
  isLoading, 
  error, 
  onClearResult,
  onViewOnMap
}) {
  const [addressInput, setAddressInput] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    onCheckLocation({ address: addressInput.trim() });
  };

  const handleGpsCheck = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onCheckLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: "Current GPS Location"
        });
      },
      (err) => {
        setGpsLoading(false);
        alert(`Could not acquire GPS position: ${err.message}`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const getSeverityConfig = (level) => {
    const lvlUpper = (level || 'SAFE').toUpperCase();
    return SEVERITY_LEVELS[lvlUpper] || SEVERITY_LEVELS.SAFE;
  };

  const cfg = locationResult ? getSeverityConfig(locationResult.risk_level) : SEVERITY_LEVELS.SAFE;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
            ANY-LOCATION DISASTER CHECK
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Check Landslide & Flood Hazard for Any Location
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Type any town, landmark, or street in Uttarakhand — or tap a point directly on the map.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Interactive GIS Coverage</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="Type any place, landmark or street (e.g. Kedarnath, Guptkashi Market, Joshimath, Badrinath Road)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleGpsCheck}
            disabled={gpsLoading || isLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
          >
            <Compass className={`w-3.5 h-3.5 text-blue-600 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Locating...' : 'Use My GPS'}</span>
          </button>
          <button
            type="submit"
            disabled={isLoading || !addressInput.trim()}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Check Danger</span>
            )}
          </button>
        </div>
      </form>

      {/* Map Click Tip */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-blue-50/60 border border-blue-100 p-2.5 rounded-lg">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>Tip: You can also <strong>click directly on the Leaflet Map</strong> below to inspect risk for any exact coordinate!</span>
      </div>

      {/* Error Message Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg flex items-start gap-3 text-xs text-red-800 animate-in fade-in">
          <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Location Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Result Card Display (100% Light Mode) */}
      {locationResult && (
        <div className="bg-white border-2 border-slate-200 text-slate-900 rounded-xl p-5 sm:p-6 space-y-5 animate-fade-in shadow-md">
          
          {/* Top Result Title Bar */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  📍 {locationResult.location_name}
                </span>
                {locationResult.is_estimated ? (
                  <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 font-mono text-[10px] font-bold rounded-full">
                    ⚠️ Estimated — Nearby Sensors
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-[10px] font-bold rounded-full">
                    📡 Direct Station Coverage
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-1">
                Coordinates: {locationResult.latitude}° N, {locationResult.longitude}° E • Nearest Ward: <strong className="text-slate-800">{locationResult.nearest_ward_name}</strong> ({locationResult.distance_to_nearest_ward_km} km away)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onViewOnMap && (
                <button
                  type="button"
                  onClick={onViewOnMap}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>View On Map</span>
                </button>
              )}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black tracking-wider border ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor}`}>
                {locationResult.risk_level === 'CRITICAL' && <AlertOctagon className="w-4 h-4 text-red-600 animate-pulse" />}
                {locationResult.risk_level === 'WARNING' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                {locationResult.risk_level === 'WATCH' && <Eye className="w-4 h-4 text-amber-600" />}
                {locationResult.risk_level === 'SAFE' && <Shield className="w-4 h-4 text-emerald-600" />}
                <span>{locationResult.risk_level} HAZARD</span>
              </span>
              {onClearResult && (
                <button onClick={onClearResult} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all" title="Clear Search">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Readout Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Readout 1: Landslide & Flood Danger Score */}
            <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl space-y-2 animated-flex-card hover-card-lift">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span className="font-bold">HAZARD DANGER SCORE (0-100)</span>
                <span className={`font-black ${cfg.textColor}`}>{locationResult.danger_factor} / 100</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight" style={{ color: cfg.hex }}>
                {locationResult.danger_factor}
                <span className="text-xs text-slate-500 font-sans font-medium ml-2">Danger Index ({locationResult.risk_level})</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-700 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, locationResult.danger_factor))}%`, backgroundColor: cfg.hex }}
                />
              </div>
            </div>

            {/* Readout 2: Safety Index (100% - Danger) */}
            <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl space-y-2 animated-flex-card hover-card-lift">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span className="font-bold">SAFETY & STABILITY INDEX</span>
                <span className="font-black text-emerald-700">{locationResult.safety_factor}% Safe</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-700">
                {locationResult.safety_factor}%
                <span className="text-xs text-slate-500 font-sans font-medium ml-2">
                  {locationResult.factor_of_safety ? `Geotechnical FoS: ${locationResult.factor_of_safety.toFixed(2)}` : 'Safety Margin'}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-700 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, locationResult.safety_factor))}%` }}
                />
              </div>
            </div>

          </div>

          {/* Estimated Warning Note */}
          {locationResult.is_estimated && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-900 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Estimated — based on nearby sensor data (inverse-distance weighted approximation from nearest weather stations).</span>
            </div>
          )}

          {/* Lower Grid: Contributing Factors & Nearest Safe Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* Contributing Factors List */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <span>🔍 Contributing Hazard Factors</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                {(locationResult.contributing_factors || []).map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-mono font-bold shrink-0">•</span>
                    <span className="leading-snug">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nearest Safe Zone Card */}
            {locationResult.nearest_safe_zone && (
              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <span>🛡️ Nearest Evacuation Safe Zone</span>
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                    {locationResult.nearest_safe_zone.distance_km} km {locationResult.nearest_safe_zone.direction}
                  </span>
                </div>
                <h5 className="text-sm font-black text-slate-900">
                  {locationResult.nearest_safe_zone.name}
                </h5>
                <p className="text-xs text-slate-600 leading-snug">
                  Type: <strong className="text-slate-900">{locationResult.nearest_safe_zone.safe_zone_type || 'Shelter'}</strong> • Capacity: <strong className="text-slate-900">{locationResult.nearest_safe_zone.capacity?.toLocaleString('en-IN')} persons</strong> ({locationResult.nearest_safe_zone.district} District)
                </p>
                <div className="pt-1 text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-bold">
                  <span>Evacuation route displayed on map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
