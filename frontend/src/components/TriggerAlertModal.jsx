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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-[#111827] border border-red-800/80 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-950 border-b border-red-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-200">
            <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />
            <h2 className="text-base font-bold uppercase tracking-wider">
              Emergency Evacuation Alert Dispatch • {ward.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-red-300 hover:text-white hover:bg-red-900/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto bg-[#0b1120]">
          {errorMsg && (
            <div className="bg-red-950 border border-red-700 p-3 rounded text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Target Ward Info */}
              <div className="bg-[#161f33] border border-[#26354f] p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">TARGET WARD & SECTOR</span>
                  <h3 className="text-base font-bold text-white">{ward.name} ({ward.district} District)</h3>
                  <p className="text-xs text-slate-400">Population: {ward.population.toLocaleString('en-IN')} residents • Safe Zone: {ward.safeZoneName}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-slate-400 block">Soil Saturation</span>
                  <span className="text-lg font-bold text-red-400">{ward.sensors.soilMoisture}% VWC</span>
                </div>
              </div>

              {/* Multi-Channel Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block mb-2">
                  Select Dissemination Channels:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleChannel('whatsapp')}
                    className={`p-3 rounded border text-left flex items-start justify-between transition-colors ${
                      channels.whatsapp ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block">WhatsApp Twilio Broadcast</span>
                        <span className="text-[10px] text-slate-400 block">Direct messaging to opted-in subscribers</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={channels.whatsapp} readOnly className="mt-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChannel('sms')}
                    className={`p-3 rounded border text-left flex items-start justify-between transition-colors ${
                      channels.sms ? 'bg-blue-950/60 border-blue-600 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block">SMS Gateway Blast</span>
                        <span className="text-[10px] text-slate-400 block">Cell tower broadcast</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={channels.sms} readOnly className="mt-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChannel('sirens')}
                    className={`p-3 rounded border text-left flex items-start justify-between transition-colors ${
                      channels.sirens ? 'bg-amber-950/60 border-amber-600 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block">Solar PA Sirens</span>
                        <span className="text-[10px] text-slate-400 block">Village siren nodes</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={channels.sirens} readOnly className="mt-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleChannel('cellBroadcast')}
                    className={`p-3 rounded border text-left flex items-start justify-between transition-colors ${
                      channels.cellBroadcast ? 'bg-red-950/60 border-red-600 text-red-200' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block">NDMA CAP Broadcast</span>
                        <span className="text-[10px] text-slate-400 block">Emergency mobile alert</span>
                      </div>
                    </div>
                    <input type="checkbox" checked={channels.cellBroadcast} readOnly className="mt-1" />
                  </button>
                </div>
              </div>

              {/* Message Template Preview */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block mb-1.5">
                  Standard WhatsApp Alert Template:
                </label>

                <div className="space-y-2 bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono">
                  <p className="text-slate-200">
                    ⚠️ [{ward.riskLevel}] Alert — {ward.name}<br />
                    Heavy rainfall & high soil saturation detected.<br />
                    🏃 SAFE ZONE: Move to {ward.safeZoneName} immediately.<br />
                    🕒 Updated: {new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC
                  </p>
                </div>
              </div>

              {/* Optional Custom Instructions */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Add Custom Note to Alert (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Move via North Ridge Road to Helipad..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 p-2 rounded text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </>
          ) : (
            /* Step 2: Final Confirmation */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-950 rounded-full border-2 border-red-500 flex items-center justify-center mx-auto text-red-400 animate-pulse">
                <AlertOctagon className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Confirm WhatsApp Evacuation Dispatch</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  You are dispatching a live evacuation alert for <strong className="text-white">{ward.name}</strong> to registered ward subscribers via Twilio API.
                </p>
              </div>

              <div className="p-3 bg-red-950/40 border border-red-800/80 rounded max-w-md mx-auto text-xs text-red-300 flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>This action will log an official manual override record in the FastAPI database log.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
          <button
            onClick={() => (step === 2 ? setStep(1) : onClose())}
            disabled={isExecuting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold disabled:opacity-50"
          >
            {step === 2 ? 'Back' : 'Cancel'}
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded border border-red-500"
            >
              <span>Review & Confirm</span>
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded border border-red-500 shadow-xl disabled:opacity-50"
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
