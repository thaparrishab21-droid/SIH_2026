import React, { useEffect, useState } from 'react';
import { Layers, Activity, Database, CheckCircle, RefreshCw, Server, Globe } from 'lucide-react';
import { getSystemStatus, getDataStatus } from '../services/api';

const AdminDashboard = () => {
  const [sysStatus, setSysStatus] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [sysRes, dataRes] = await Promise.all([
        getSystemStatus(),
        getDataStatus()
      ]);
      setSysStatus(sysRes);
      setDataSources(dataRes.sources || []);
    } catch (err) {
      console.error("Error fetching admin status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            Data Health & Infrastructure Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline verification for OpenMeteo APIs, IMD rainfall grids, ISRO DEM rasters, and MySQL DB operations.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Health Checks
        </button>
      </div>

      {/* System Status Indicators */}
      {sysStatus && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Database Engine</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">{sysStatus.database_type}</p>
              <span className="text-[10px] text-slate-400">MySQL 8+ SQLAlchemy ORM</span>
            </div>
            <Database className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">API Gateway</p>
              <p className="text-sm font-bold text-cyan-400 mt-1">FastAPI v1.0.0</p>
              <span className="text-[10px] text-emerald-400">OPERATIONAL</span>
            </div>
            <Server className="w-6 h-6 text-cyan-400" />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Registered Villages</p>
              <p className="text-xl font-extrabold text-slate-100 mt-1">{sysStatus.active_villages_count}</p>
              <span className="text-[10px] text-slate-400">Pilot Catchment Grid</span>
            </div>
            <Globe className="w-6 h-6 text-amber-400" />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Active Shelters</p>
              <p className="text-xl font-extrabold text-slate-100 mt-1">{sysStatus.active_shelters_count}</p>
              <span className="text-[10px] text-slate-400">Highland Relief Complexes</span>
            </div>
            <CheckCircle className="w-6 h-6 text-sky-400" />
          </div>
        </div>
      )}

      {/* Multi-Source Data Health Pipeline Table */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Multi-Source External Data Ingestion Health
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Provider / Data Source</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">API Latency</th>
                <th className="py-3 px-4">Last Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {dataSources.map((ds, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                  <td className="py-3 px-4 font-bold text-slate-100">{ds.name}</td>
                  <td className="py-3 px-4 text-slate-400">{ds.type}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {ds.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400">{ds.latency_ms} ms</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{new Date(ds.last_synced).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
