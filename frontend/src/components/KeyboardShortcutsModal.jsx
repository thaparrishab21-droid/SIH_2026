import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

export default function KeyboardShortcutsModal({ onClose }) {
  const shortcuts = [
    { key: 'M or 1', description: 'Switch to Risk Overview Map' },
    { key: 'L or 2', description: 'Switch to Dissemination & Audit Log' },
    { key: 'H or 3', description: 'Switch to System Health & Sensor Telemetry' },
    { key: 'Esc', description: 'Close Ward Detail Panel or Emergency Dialogs' },
    { key: 'F', description: 'Focus Search Bar to filter Wards' },
    { key: 'Space', description: 'Trigger Emergency Alert for currently selected Ward' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-slate-900 animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Control Room Keyboard Shortcuts
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 bg-[#f8fafc] text-xs">
          <p className="text-slate-600 font-medium">
            Designed for rapid control room operation during monsoon disaster response.
          </p>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <span className="text-slate-700 font-medium">{s.description}</span>
                <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-blue-700 font-mono text-[11px] rounded-md font-bold shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-t border-slate-200 p-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
