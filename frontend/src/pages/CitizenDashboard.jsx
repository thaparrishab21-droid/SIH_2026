import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Navigation, MapPin, CheckCircle, AlertOctagon, Info, PhoneCall } from 'lucide-react';
import { getVillageRisk, getEvacuationIntelligence, getRiskMap } from '../services/api';

const CitizenDashboard = ({ simStatus }) => {
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState(1);
  const [riskDetail, setRiskDetail] = useState(null);
  const [evacuationDetail, setEvacuationDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const mapRes = await getRiskMap();
        setVillages(mapRes.villages || []);
        loadVillage(selectedVillageId);
      } catch (err) {
        console.error("Error loading citizen dashboard:", err);
      }
    };
    fetchInit();
  }, [simStatus]);

  const loadVillage = async (vId) => {
    try {
      setLoading(true);
      const [riskRes, evacRes] = await Promise.all([
        getVillageRisk(vId),
        getEvacuationIntelligence(vId)
      ]);
      setRiskDetail(riskRes);
      setEvacuationDetail(evacRes);
    } catch (err) {
      console.error("Error loading village data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVillageChange = (e) => {
    const vId = parseInt(e.target.value);
    setSelectedVillageId(vId);
    loadVillage(vId);
  };

  const getStatusBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return { color: 'bg-red-600', text: '🔴 CRITICAL FLOOD & LANDSLIDE WARNING', border: 'border-red-500' };
      case 'HIGH':
        return { color: 'bg-orange-600', text: '🟠 HIGH HAZARD WARNING', border: 'border-orange-500' };
      case 'MODERATE':
        return { color: 'bg-yellow-600', text: '🟡 WEATHER WATCH IN EFFECT', border: 'border-yellow-500' };
      case 'LOW':
      default:
        return { color: 'bg-emerald-600', text: '🟢 NORMAL CONDITIONS - SAFE', border: 'border-emerald-500' };
    }
  };

  const badge = getStatusBadge(riskDetail?.risk_level || 'LOW');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8 flex flex-col items-center justify-start space-y-6">
      
      {/* Village Location Selector Header */}
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-600/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Your Home Village / Ward</h2>
            <p className="text-base font-extrabold text-slate-100">{riskDetail?.village_name || 'Pandoh Village'}</p>
          </div>
        </div>

        <select
          value={selectedVillageId}
          onChange={handleVillageChange}
          className="bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
        >
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.risk_level})
            </option>
          ))}
        </select>
      </div>

      {/* MAIN CITIZEN STATUS CARD */}
      {riskDetail && (
        <div className={`w-full max-w-3xl bg-slate-900/90 border ${badge.border} rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6`}>
          
          {/* Status Badge Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="text-center sm:text-left space-y-1">
              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black text-white tracking-wide shadow-lg ${badge.color}`}>
                {badge.text}
              </span>
              <h3 className="text-2xl font-black text-slate-100 pt-2">
                Hazard Advisory for {riskDetail.village_name}
              </h3>
            </div>

            {/* Countdown Clock */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center min-w-[160px] shadow-inner">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Est Lead Time
              </p>
              <p className="text-3xl font-black text-emerald-400 mt-1">
                {riskDetail.estimated_lead_time}
                <span className="text-sm font-semibold text-slate-300 ml-1">mins</span>
              </p>
            </div>
          </div>

          {/* Plain English "WHY" Section */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              What is Happening in Your Area?
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {riskDetail.risk_level === 'CRITICAL' || riskDetail.risk_level === 'HIGH'
                ? `Heavy cloudburst rainfall (${Math.round(riskDetail.rainfall_24h)} mm / 24h) combined with steep mountain terrain (${riskDetail.slope}°) is accelerating river runoff and slope slump risks.`
                : `Normal seasonal rainfall levels (${Math.round(riskDetail.rainfall_24h)} mm / 24h). No immediate flash flood danger detected.`}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400">Flash Flood Risk</p>
                <p className="text-base font-bold text-cyan-400">{Math.round(riskDetail.flood_probability * 100)}% Risk</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                <p className="text-xs text-slate-400">Landslide Risk</p>
                <p className="text-base font-bold text-amber-400">{Math.round(riskDetail.landslide_probability * 100)}% Risk</p>
              </div>
            </div>
          </div>

          {/* SAFEST SHELTER & ACTIONABLE EVACUATION INSTRUCTIONS */}
          {evacuationDetail?.recommended_route ? (
            <div className="bg-cyan-950/30 border border-cyan-500/40 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-cyan-400" />
                  Recommended Safe Evacuation Action
                </h4>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white">
                  Route Safety: {evacuationDetail.recommended_route.safety_score} / 100
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-400">Designated Emergency Shelter:</p>
                <p className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                  🛡️ {evacuationDetail.recommended_route.shelter_name}
                </p>
                <p className="text-xs text-slate-300">
                  Via: <span className="text-cyan-400 font-bold">{evacuationDetail.recommended_route.route_name}</span>
                </p>
                <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
                  <span>Distance: {evacuationDetail.recommended_route.route_distance} km</span>
                  <span>Est Time: {evacuationDetail.recommended_route.estimated_time} mins</span>
                  <span>Status: Clear</span>
                </div>
              </div>

              <div className="text-xs text-cyan-300 bg-cyan-900/20 p-3 rounded-lg border border-cyan-800/40 italic">
                Reason: "{evacuationDetail.recommendation_reason}"
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Conditions are currently safe. Stay tuned for emergency updates from local authorities.
            </div>
          )}

          {/* Emergency Helpline Banner */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-red-400" />
              <span>Emergency Disaster Control Room: <strong className="text-slate-200">1077 / 112</strong></span>
            </div>
            <span className="text-emerald-400 font-mono">24x7 ACTIVE</span>
          </div>

        </div>
      )}

    </div>
  );
};

export default CitizenDashboard;
