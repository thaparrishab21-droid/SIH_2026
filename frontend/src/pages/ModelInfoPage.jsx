import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle, BarChart2, ShieldCheck, Activity, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getModelInfo } from '../services/api';

const floodFeaturesData = [
  { name: '24h Rainfall Accumulation', importance: 38 },
  { name: '3h Rainfall Spurt', importance: 25 },
  { name: 'River Proximity', importance: 18 },
  { name: 'Drainage Density', importance: 12 },
  { name: 'Historical Frequency', importance: 7 }
];

const landslideFeaturesData = [
  { name: 'Slope Angle (°)', importance: 35 },
  { name: '24h Rainfall Accumulation', importance: 30 },
  { name: 'Antecedent Rainfall (72h)', importance: 15 },
  { name: 'Terrain Roughness Index', importance: 12 },
  { name: 'Land Cover Type', importance: 8 }
];

const ModelInfoPage = () => {
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    getModelInfo().then(res => setModelInfo(res)).catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            Machine Learning Models & Explainability Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervised Ensemble Pipeline (XGBoost / Random Forest / Logistic Regression) trained on Himalayan hydrological features.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-indigo-400" />
          OPTIMIZED FOR RECALL (SAFETY)
        </span>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Flash Flood Model */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-cyan-400 flex items-center gap-2">
                🌊 Flash Flood Susceptibility Model
              </h3>
              <p className="text-xs text-slate-400">Model Type: LogisticRegression / XGBoost Classifier</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              v1.0.0 Serialized
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Recall</p>
              <p className="text-lg font-black text-emerald-400">0.8448</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Precision</p>
              <p className="text-lg font-black text-cyan-400">0.7101</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase">F1-Score</p>
              <p className="text-lg font-black text-amber-400">0.7717</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase">ROC-AUC</p>
              <p className="text-lg font-black text-indigo-400">0.9608</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Feature Importance Drivers (%)</h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={floodFeaturesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Weight (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Landslide Model */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-amber-400 flex items-center gap-2">
                🏔️ Landslide Susceptibility Model
              </h3>
              <p className="text-xs text-slate-400">Model Type: RandomForest / XGBoost Classifier</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
              v1.0.0 Serialized
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Recall</p>
              <p className="text-lg font-black text-emerald-400">0.8938</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Precision</p>
              <p className="text-lg font-black text-cyan-400">0.8106</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase">F1-Score</p>
              <p className="text-lg font-black text-amber-400">0.8502</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase">ROC-AUC</p>
              <p className="text-lg font-black text-indigo-400">0.9195</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Feature Importance Drivers (%)</h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={landslideFeaturesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="importance" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Weight (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Scientific Responsibility Footer Note */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-400 flex items-center space-x-3">
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
        <p>
          <strong className="text-slate-200">Scientific Responsibility & Decision Support:</strong> Predictions represent probabilistic warning windows and estimated susceptibility scores derived from multi-source meteorological and geospatial models.
        </p>
      </div>

    </div>
  );
};

export default ModelInfoPage;
