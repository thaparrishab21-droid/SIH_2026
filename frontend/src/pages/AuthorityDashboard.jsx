import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, Users, Clock, Compass, Activity, 
  MapPin, CheckCircle, Navigation, Home, AlertOctagon, TrendingUp, Info
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import RiskMap from '../maps/RiskMap';
import { getRiskMap, getVillageRisk, getAlerts, getShelters, getEvacuationIntelligence, getVillageRiskHistory } from '../services/api';

const AuthorityDashboard = ({ simStatus, onStepSim, onResetSim }) => {
  const [riskMapData, setRiskMapData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [villageRiskDetail, setVillageRiskDetail] = useState(null);
  const [evacuationDetail, setEvacuationDetail] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch baseline data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [mapRes, alertRes, shelterRes] = await Promise.all([
        getRiskMap(),
        getAlerts(),
        getShelters()
      ]);
      setRiskMapData(mapRes);
      setAlerts(alertRes);
      setShelters(shelterRes);

      // Select highest risk village by default if none selected
      if (mapRes?.villages?.length > 0) {
        const sorted = [...mapRes.villages].sort((a, b) => b.overall_risk_score - a.overall_risk_score);
        const target = selectedVillage ? mapRes.villages.find(v => v.id === selectedVillage.id) || sorted[0] : sorted[0];
        handleSelectVillage(target);
      }
    } catch (err) {
      console.error("Error fetching authority dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [simStatus]);

  const handleSelectVillage = async (v) => {
    setSelectedVillage(v);
    try {
      const [riskRes, evacRes, historyRes] = await Promise.all([
        getVillageRisk(v.id),
        getEvacuationIntelligence(v.id),
        getVillageRiskHistory(v.id)
      ]);
      setVillageRiskDetail(riskRes);
      setEvacuationDetail(evacRes);
      setRiskHistory(historyRes.timeline || []);
    } catch (err) {
      console.error("Error fetching village details:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-6 space-y-6">
      
      {/* 1. TOP KPI COMMAND BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Regional Risk Score */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Regional Max Risk</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-100">{riskMapData?.max_regional_risk || 28}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded text-white ${
              (riskMapData?.max_regional_risk || 0) >= 76 ? 'bg-red-600 animate-pulse' :
              (riskMapData?.max_regional_risk || 0) >= 51 ? 'bg-orange-600' :
              (riskMapData?.max_regional_risk || 0) >= 26 ? 'bg-yellow-600' : 'bg-emerald-600'
            }`}>
              {riskMapData?.max_regional_risk >= 76 ? 'CRITICAL HAZARD' :
               riskMapData?.max_regional_risk >= 51 ? 'HIGH RISK' :
               riskMapData?.max_regional_risk >= 26 ? 'MODERATE WATCH' : 'LOW RISK'}
            </span>
          </div>
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl border border-red-500/20">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Active Emergency Alerts */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Alerts</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-amber-400">{alerts.length}</span>
              <span className="text-xs text-slate-400">issued</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <AlertOctagon className="w-3 h-3 text-red-400" />
              {riskMapData?.critical_villages_count || 0} Critical Zones
            </p>
          </div>
          <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Population at Risk */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Population Exposed</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-cyan-400">
                {(riskMapData?.total_population_at_risk || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Across 10 catchment villages</p>
          </div>
          <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-xl border border-cyan-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Minimum Estimated Lead Time */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Warning Lead Time</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-3xl font-extrabold text-emerald-400">
                {selectedVillage?.estimated_lead_time || 28}
              </span>
              <span className="text-xs font-semibold text-slate-300">mins</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Uncertainty range: 20-40m</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 5: Active Shelters */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Shelter Status</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-sky-400">{shelters.length}</span>
              <span className="text-xs text-slate-400">Active</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-2 font-medium">Cap: 2,700 persons</p>
          </div>
          <div className="bg-sky-500/10 text-sky-400 p-3 rounded-xl border border-sky-500/20">
            <Home className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. MAIN CENTER SECTION: GIS MAP + SIDE INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HERO GIS MAP (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                Interactive Hyper-Local GIS Map
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Selected:</span>
              <span className="text-cyan-400 font-bold">{selectedVillage?.name || 'Pandoh Village'}</span>
            </div>
          </div>

          <div className="h-[560px] w-full">
            <RiskMap
              villages={riskMapData?.villages || []}
              shelters={shelters}
              selectedVillage={selectedVillage}
              onSelectVillage={handleSelectVillage}
              evacuationRoute={evacuationDetail}
            />
          </div>
        </div>

        {/* SIDE INSPECTOR PANEL (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Active Emergency Alerts Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Active Emergency Alerts ({alerts.length})
              </h3>
              <span className="text-[10px] text-slate-400">Auto-Refreshed</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {alerts.map((al) => (
                <div 
                  key={al.id} 
                  className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                    al.severity === 'CRITICAL' ? 'bg-red-950/40 border-red-800/80 text-red-200' :
                    al.severity === 'WARNING' ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' : 'bg-slate-800/60 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{al.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">{al.village_name}</span>
                  </div>
                  <p className="text-[11px] opacity-90">{al.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Village Risk Detail & Explainability Panel */}
          {selectedVillage && villageRiskDetail ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4 flex-1">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    {villageRiskDetail.village_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Elevation: {villageRiskDetail.elevation}m | Slope: {villageRiskDetail.slope}°
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-slate-100">
                    {villageRiskDetail.overall_risk_score}
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                    villageRiskDetail.risk_level === 'CRITICAL' ? 'bg-red-600' :
                    villageRiskDetail.risk_level === 'HIGH' ? 'bg-orange-600' : 'bg-yellow-600'
                  }`}>
                    {villageRiskDetail.risk_level}
                  </span>
                </div>
              </div>

              {/* Probabilities */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-semibold">Flash Flood Prob</p>
                  <p className="text-lg font-bold text-cyan-400">{Math.round(villageRiskDetail.flood_probability * 100)}%</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-semibold">Landslide Prob</p>
                  <p className="text-lg font-bold text-amber-400">{Math.round(villageRiskDetail.landslide_probability * 100)}%</p>
                </div>
              </div>

              {/* EXPLAINABLE AI FACTOR BREAKDOWN */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    WHY IS THE RISK HIGH? (Explainable AI)
                  </h4>
                </div>

                <div className="space-y-1.5 pt-1">
                  {villageRiskDetail.risk_factors.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-800/60 pb-1">
                      <span className="text-slate-300 font-medium">{f.factor_name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 font-mono text-[11px]">{f.factor_value}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${
                          f.severity === 'CRITICAL' ? 'bg-red-600' :
                          f.severity === 'HIGH' ? 'bg-orange-600' : 'bg-yellow-600'
                        }`}>
                          {f.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* EVACUATION ROUTE INTELLIGENCE RECOMMENDATION */}
              {evacuationDetail?.recommended_route && (
                <div className="bg-cyan-950/30 border border-cyan-800/60 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" />
                      Safest Evacuation Route
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                      Safety: {evacuationDetail.recommended_route.safety_score} / 100
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-100">{evacuationDetail.recommended_route.route_name}</p>
                    <p className="text-slate-300 text-[11px]">
                      Destination: <span className="text-cyan-300 font-semibold">{evacuationDetail.recommended_route.shelter_name}</span>
                    </p>
                    <div className="flex items-center space-x-3 text-slate-400 text-[11px] pt-1">
                      <span>Distance: {evacuationDetail.recommended_route.route_distance} km</span>
                      <span>Time: {evacuationDetail.recommended_route.estimated_time} mins</span>
                      <span>Exposure: {evacuationDetail.recommended_route.hazard_exposure}</span>
                    </div>
                    <p className="text-[10px] text-cyan-300 italic pt-1">
                      "{evacuationDetail.recommendation_reason}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              Select a village marker on the map to inspect hyper-local risk breakdown.
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM ANALYTICS & TREND SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Trend Curve (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Temporal Risk Projection Timeline ({selectedVillage?.name || 'Pandoh'})
            </h3>
            <span className="text-[10px] text-slate-400">12-Hour Forecast</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskHistory}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="risk_score" stroke="#06b6d4" fillOpacity={1} fill="url(#riskGrad)" name="Risk Score (0-100)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelter Capacity Progress List (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-sky-400" />
              Emergency Shelter Occupancy & Allocation
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold">Active Operational</span>
          </div>

          <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1 text-xs">
            {shelters.map((s) => {
              const pct = Math.round((s.current_occupancy / s.capacity) * 100);
              return (
                <div key={s.id} className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-200">{s.name}</span>
                    <span className="text-slate-400 text-[11px]">{s.current_occupancy} / {s.capacity} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AuthorityDashboard;
