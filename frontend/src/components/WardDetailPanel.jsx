import React, { useState } from 'react';
import { 
  X, AlertOctagon, AlertTriangle, Eye, Shield, CloudRain, Droplets, 
  Activity, History, PhoneCall, Radio, Send, ChevronRight, Info, ExternalLink, Users, Mountain, Zap, RefreshCw, Download, FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  Tooltip, ReferenceLine, CartesianGrid, Legend 
} from 'recharts';
import { SEVERITY_LEVELS } from '../data/severityConfig';
import { downloadWardPdfReport } from '../api';

export default function WardDetailPanel({ ward, onClose, onTriggerAlert, onSimulateSpike, isLoadingReadings, highContrast }) {
  if (!ward) return null;

  const [isSimulating, setIsSimulating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const cfg = SEVERITY_LEVELS[ward.riskLevel] || SEVERITY_LEVELS.SAFE;

  const handleSimulateClick = async () => {
    setIsSimulating(true);
    try {
      if (onSimulateSpike) {
        await onSimulateSpike(ward.rawId || ward.id);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadWardPdfReport(ward.rawId || ward.id, ward.name);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <aside 
      className="fixed top-0 right-0 h-full w-full sm:w-[540px] md:w-[600px] bg-[#111827] border-l border-[#26354f] shadow-2xl z-40 flex flex-col transition-transform duration-300 transform translate-x-0 text-slate-100 overflow-hidden"
      aria-label="Ward Detail Panel"
    >
      {/* Drawer Header */}
      <div className={`p-4 border-b flex items-start justify-between gap-3 ${cfg.bgColor} ${cfg.borderColor}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
              {ward.id} • {ward.district}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor}`}>
              {ward.riskLevel === 'CRITICAL' && <AlertOctagon className="w-3 h-3 text-red-400 animate-pulse" />}
              {ward.riskLevel === 'WARNING' && <AlertTriangle className="w-3 h-3 text-orange-400" />}
              {ward.riskLevel === 'WATCH' && <Eye className="w-3 h-3 text-amber-400" />}
              {ward.riskLevel === 'SAFE' && <Shield className="w-3 h-3 text-emerald-400" />}
              <span>{cfg.label.toUpperCase()}</span>
            </span>
          </div>

          <h2 className="text-xl font-bold text-white leading-tight">{ward.name}</h2>
          <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 font-mono">
            <span>District: {ward.district}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">Nearest Safe Zone: {ward.safeZoneName}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-blue-300 border border-slate-700 transition-colors"
            title="Download PDF Monsoonal Audit Report"
          >
            <Download className={`w-5 h-5 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            title="Close Panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drawer Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#0b1120]">
        {/* Risk Score & Model Confidence Tile */}
        <div className="bg-[#161f33] border border-[#26354f] p-3.5 rounded-lg flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Physics & ML Hazard Index</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono tabular-nums ${cfg.textColor}`}>
                {ward.riskScore}
              </span>
              <span className="text-xs text-slate-400">/ 100 Hazard Level</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{cfg.desc}</p>
          </div>

          <div className="text-right border-l border-slate-800 pl-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Model Confidence</span>
            <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
              {ward.confidence}%
            </span>
            <span className="text-[10px] text-slate-400 block">FastAPI XGBoost Engine</span>
          </div>
        </div>

        {/* Live Telemetry Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Live Telemetry Readings</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Rainfall cumulative */}
            <div className="bg-[#161f33] border border-[#26354f] p-3 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> Rain (1h / 72h)
                </span>
                <span className="text-[10px] font-mono text-slate-500">AWS</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-lg font-bold font-mono text-cyan-300 tabular-nums">{ward.sensors.rain1h}</span>
                  <span className="text-xs text-slate-400"> mm (1h)</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-cyan-400 tabular-nums">{ward.sensors.rain72h}</span>
                  <span className="text-xs text-slate-400"> mm (72h)</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{ward.sensors.rainIntensity}</p>
            </div>

            {/* Soil Moisture */}
            <div className="bg-[#161f33] border border-[#26354f] p-3 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-amber-400" /> Soil Saturation
                </span>
                <span className="text-[10px] font-mono text-slate-500">% VWC</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-xl font-bold font-mono tabular-nums ${
                  ward.sensors.soilMoisture > 80 ? 'text-red-400' : 'text-amber-300'
                }`}>
                  {ward.sensors.soilMoisture}%
                </span>
                <span className="text-xs font-mono text-slate-400">Pore: {ward.sensors.soilPorePressure} kPa</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full ${ward.sensors.soilMoisture > 80 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, ward.sensors.soilMoisture)}%` }}
                />
              </div>
            </div>

            {/* Slope Angle & Creep */}
            <div className="bg-[#161f33] border border-[#26354f] p-3 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-purple-400" /> Slope Multiplier
                </span>
                <span className="text-[10px] font-mono text-slate-500">Inclinometer</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-purple-300 tabular-nums">
                  {ward.slopeAngle}°
                </span>
                <span className="text-xs text-slate-400">({ward.sensors.slopeDisplacementRate} mm/h)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{ward.sensors.inclinometerStatus}</p>
            </div>

            {/* Ward Demographics */}
            <div className="bg-[#161f33] border border-[#26354f] p-3 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> Demographics
                </span>
                <span className="text-[10px] font-mono text-slate-500">Census</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold font-mono text-white tabular-nums">
                  {ward.population.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400">({ward.households} households)</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1 truncate font-mono">Safe Zone: {ward.safeZoneName}</p>
            </div>
          </div>
        </div>

        {/* Time Series Chart: 72h Precipitation & Soil Saturation Trend */}
        <div className="bg-[#161f33] border border-[#26354f] p-3.5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                72-Hour Precipitation & Soil Saturation Trend
              </h3>
              <span className="text-[10px] text-slate-400">
                Bar: Hourly Rain (mm) • Line: Soil Saturation (% VWC)
              </span>
            </div>
            {isLoadingReadings && (
              <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Loading chart...
              </span>
            )}
          </div>

          <div className="h-48 w-full font-mono text-xs">
            {ward.timeSeries && ward.timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ward.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26354f" opacity={0.6} />
                  <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 9 }} interval={2} />
                  <YAxis yAxisId="left" orientation="left" stroke="#38bdf8" tick={{ fontSize: 9 }} domain={[0, 'auto']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 9 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }} 
                    formatter={(val, name) => [
                      name === 'rain1h' ? `${val} mm/h` : `${val}% VWC`, 
                      name === 'rain1h' ? '1h Rain' : 'Soil Saturation'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                  
                  <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical Threshold (80%)', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                  
                  <Bar yAxisId="left" dataKey="rain1h" name="rain1h" fill="#38bdf8" radius={[2, 2, 0, 0]} opacity={0.8} />
                  <Line yAxisId="right" type="monotone" dataKey="soilMoisture" name="soilMoisture" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No time-series reading records available
              </div>
            )}
          </div>
        </div>

        {/* Evacuation Corridors & Safe Zone Detail */}
        <div className="bg-[#161f33] border border-[#26354f] p-3.5 rounded-lg space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>GIS Nearest Safe Zone & Evacuation Route</span>
          </h3>

          <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg text-xs space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 block uppercase tracking-wider">NEAREST EVACUATION SHELTER</span>
            <p className="font-bold text-white text-sm">{ward.safeZoneName}</p>
            <p className="text-slate-300 font-mono text-[11px]">
              Distance: {ward.nearestSafeZone?.distance_km ?? '0.0'} km ({ward.nearestSafeZone?.direction || 'N'}) • Capacity: {ward.nearestSafeZone?.capacity || 2500} residents • Safe Zone Type: {ward.nearestSafeZone?.safe_zone_type || 'Shelter'}
            </p>
          </div>

          <div className="space-y-1.5 text-xs pt-1">
            {ward.evacuationRoutes.map((route, idx) => (
              <div key={idx} className="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-start justify-between gap-2">
                <span className="text-slate-300">{route.name}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  route.status.includes('OPEN') ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {route.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Registered Multi-lingual Subscribers */}
        {ward.subscribers && ward.subscribers.length > 0 && (
          <div className="bg-[#161f33] border border-[#26354f] p-3.5 rounded-lg space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Registered Multi-lingual Subscribers ({ward.subscribers.length})</span>
            </h3>

            <div className="space-y-1.5 text-xs font-mono">
              {ward.subscribers.map((sub, idx) => (
                <div key={idx} className="p-2 bg-slate-900/90 rounded border border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-white font-bold block">{sub.name}</span>
                    <span className="text-[10px] text-slate-400">{sub.phone_number} ({sub.role})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded text-[9px] uppercase font-bold">
                      {sub.preferred_language || 'EN'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      sub.whatsapp_opted_in ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {sub.whatsapp_opted_in ? 'WhatsApp' : 'SMS Fallback'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar at Bottom of Panel */}
      <div className="p-4 bg-slate-950 border-t border-[#26354f] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* PDF Download Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold text-xs rounded border border-slate-700 shadow transition-all active:scale-95 disabled:opacity-50"
        >
          <FileText className={`w-4 h-4 text-blue-400 ${isDownloadingPdf ? 'animate-spin' : ''}`} />
          <span>{isDownloadingPdf ? 'Generating PDF...' : '📄 PDF Audit Report'}</span>
        </button>

        {/* Live Demo Simulation Button */}
        <button
          onClick={handleSimulateClick}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded border border-amber-300 shadow transition-all active:scale-95 disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 text-slate-950 ${isSimulating ? 'animate-bounce' : ''}`} />
          <span>{isSimulating ? 'Simulating...' : '⚡ Demo Spike'}</span>
        </button>

        {/* Trigger Alert Button */}
        <button
          onClick={() => onTriggerAlert(ward)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded border border-red-500 shadow-lg transition-all active:scale-95"
        >
          <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
          <span>Trigger Alert</span>
        </button>
      </div>
    </aside>
  );
}
