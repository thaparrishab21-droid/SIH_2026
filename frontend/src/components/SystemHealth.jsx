import React, { useState, useEffect } from 'react';
import { 
  Radio, Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
  Wifi, Database, Cpu, Server, ShieldCheck, Zap, BarChart2 
} from 'lucide-react';
import { getSystemHealth } from '../api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SystemHealth({ highContrast }) {
  const [healthData, setHealthData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const data = await getSystemHealth();
      setHealthData(data);
    } catch (err) {
      console.error("Health check error:", err);
      setError(err.message);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ONLINE':
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ONLINE</span>
          </span>
        );
      case 'DEGRADED':
      case 'SIMULATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-700/60">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{status === 'SIMULATION' ? 'SIMULATION' : 'DEGRADED'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-red-950/80 text-red-400 border border-red-700/60">
            <XCircle className="w-3.5 h-3.5" />
            <span>OFFLINE</span>
          </span>
        );
    }
  };

  const sources = healthData?.data_sources || [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b1120] text-slate-100 p-4 space-y-4 overflow-y-auto">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161f33] border border-[#26354f] p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Integrated Data Sources & Mesh Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational status of database connectivity, Twilio gateway, sensor stream, and background risk monitor
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">System Status:</span>
          <span className={`font-bold ${healthData?.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
            {healthData ? (healthData.status === 'healthy' ? 'HEALTHY' : 'UNHEALTHY') : 'CHECKING...'}
          </span>
        </div>
      </div>

      {/* Backend API Live Status Card */}
      <div className="bg-[#161f33] border border-blue-900/60 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-blue-400 shrink-0" />
          <div>
            <h3 className="font-bold text-white text-sm font-sans">Flood-Flash Backend API System Health</h3>
            <span className="text-slate-400">Endpoint: {API_BASE_URL}/system-health</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-slate-400 block text-[10px]">Database Connectivity:</span>
            <span className={`font-bold ${healthData?.database_connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {healthData?.database_connected ? 'Connected (SQLAlchemy)' : 'Disconnected'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Twilio Gateway:</span>
            <span className={`font-bold ${healthData?.twilio_configured ? 'text-emerald-400' : 'text-amber-400'}`}>
              {healthData?.twilio_configured ? 'Twilio Live Credentials' : 'Simulation Mode'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px]">Latest Sensor Log:</span>
            <span className="text-cyan-400 font-bold">{healthData?.latest_sensor_reading_timestamp || 'None'}</span>
          </div>

          <button
            onClick={checkHealth}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Check Now</span>
          </button>
        </div>
      </div>

      {/* Grid of Data Stream Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {sources.map((source) => (
          <div 
            key={source.id}
            className="bg-[#161f33] border border-[#26354f] rounded-lg p-4 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block">{source.id}</span>
                  <h3 className="text-sm font-bold text-white leading-tight">{source.name}</h3>
                  <span className="text-[11px] text-slate-400 block">{source.provider}</span>
                </div>
                {getStatusBadge(source.status)}
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded border border-slate-800 leading-relaxed my-3">
                {source.healthDesc}
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 font-sans">
                  <Wifi className="w-3.5 h-3.5 text-blue-400" /> Latency:
                </span>
                <span className="font-bold text-slate-200 tabular-nums">{source.latencyMs} ms</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 font-sans">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Last Sync:
                </span>
                <span className="font-bold text-emerald-400 tabular-nums">{source.lastSync}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1 font-sans">
                  <Activity className="w-3.5 h-3.5 text-amber-400" /> Active Nodes / Wards:
                </span>
                <span className="font-bold text-slate-200 tabular-nums">{source.activeSensors} / {source.totalSensors}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
