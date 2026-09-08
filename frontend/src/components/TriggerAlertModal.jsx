import React, { useState } from 'react';
import { 
  AlertOctagon, X, MessageSquare, Phone, Radio, BellRing, 
  CheckCircle2, ShieldAlert, Users, Send, AlertTriangle, AlertCircle 
} from 'lucide-react';
import { triggerAlert } from '../api';

export default function TriggerAlertModal({ ward, onClose, onConfirmTrigger }) {
  if (!ward) return null;

  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    sirens: true,
    cellBroadcast: true,
  });

  const [step, setStep] = useState(1); // 1: Select & Preview | 2: Execution Confirmation
  const [customNote, setCustomNote] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const toggleChannel = (key) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const apiResult = await triggerAlert({
        wardId: ward.rawId || ward.id,
        severity: ward.riskLevel,
        customNote: customNote || undefined,
        triggeredBy: 'manual (Disaster Management Control Room)'
      });

      onConfirmTrigger({
        wardId: ward.id,
        rawId: ward.rawId,
        wardName: ward.name,
        district: ward.district,
        severity: ward.riskLevel,
        channels: Object.keys(channels).filter((k) => channels[k]),
        recipientsCount: apiResult.recipient_count || ward.population,
        customNote,
        apiResult
      });

      setIsExecuting(false);
      onClose();
    } catch (err) {
      console.error("Alert trigger failed:", err);
      setErrorMsg(err.message || "Failed to communicate with Twilio alert gateway.");
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white border border-red-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-900 animate-fade-in font-sans">
        {/* Header */}
        <div className="bg-red-600 border-b border-red-700 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
            <h2 className="text-base font-black uppercase tracking-wider font-mono">
              Emergency Evacuation Alert Dispatch • {ward.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white hover:bg-red-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto bg-slate-50">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg text-xs text-red-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Target Ward Info */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">TARGET WARD & SECTOR</span>
                  <h3 className="text-base font-black text-slate-900">{ward.name} ({ward.district} District)</h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">Population: {ward.population?.toLocaleString('en-IN')} residents • Safe Zone: {ward.safeZoneName}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-slate-500 font-bold block">Soil Saturation</span>
                  <span className="text-lg font-black text-red-600">{ward.sensors?.soilMoisture || 80}% VWC</span>
                </div>
              </div>

              {/* Multi-Channel Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono block mb-2">
                  Select Dissemination Channels:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleChannel('whatsapp')}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                      channels.whatsapp ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block text-slate-900">WhatsApp Twilio Broadcast</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Direct messaging to opted-in subscribers</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={channels.whatsapp} readOnly className="mt-1 accent-emerald-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChannel('sms')}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                      channels.sms ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block text-slate-900">SMS Gateway Blast</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Cell tower broadcast fallback</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={channels.sms} readOnly className="mt-1 accent-blue-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChannel('sirens')}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                      channels.sirens ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BellRing className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block text-slate-900">Solar PA Sirens</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Village siren nodes</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={channels.sirens} readOnly className="mt-1 accent-amber-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChannel('cellBroadcast')}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                      channels.cellBroadcast ? 'bg-red-50 border-red-500 text-red-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Radio className="w-4.5 h-4.5 text-red-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block text-slate-900">NDMA CAP Broadcast</span>
                        <span className="text-[10px] text-slate-500 font-medium block">Emergency mobile alert</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={channels.cellBroadcast} readOnly className="mt-1 accent-red-600" />
                  </button>
                </div>
              </div>

              {/* Message Template Preview */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono block mb-1.5">
                  Standard WhatsApp Alert Template:
                </label>

                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-mono shadow-2xs">
                  <p className="text-slate-800 leading-relaxed font-semibold">
                    ⚠️ [{ward.riskLevel}] Alert — {ward.name}<br />
                    Heavy rainfall & high soil saturation detected.<br />
                    🏃 SAFE ZONE: Move to {ward.safeZoneName} immediately.<br />
                    🕒 Updated: {new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC
                  </p>
                </div>
              </div>

              {/* Optional Custom Instructions */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 font-mono">
                  Add Custom Note to Alert (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Move via North Ridge Road to Helipad..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 p-2.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </>
          ) : (
            /* Step 2: Final Confirmation */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full border-2 border-red-500 flex items-center justify-center mx-auto text-red-600 animate-pulse">
                <AlertOctagon className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Confirm Evacuation Dispatch</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 font-medium">
                  You are dispatching a live evacuation alert for <strong className="text-slate-900">{ward.name}</strong> to registered ward subscribers via Twilio API.
                </p>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto text-xs text-red-800 flex items-start gap-2 text-left font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>This action will log an official manual override record in the FastAPI database log.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between">
          <button
            onClick={() => (step === 2 ? setStep(1) : onClose())}
            disabled={isExecuting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {step === 2 ? 'Back' : 'Cancel'}
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-red-700 shadow-xs transition-all"
            >
              <span>Review & Confirm</span>
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-red-700 shadow-md disabled:opacity-50 transition-all active:scale-95"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Transmitting via Twilio...</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-4 h-4 text-white" />
                  <span>TRANSMIT ALERT NOW</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
