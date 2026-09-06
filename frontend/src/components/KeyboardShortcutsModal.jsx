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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-[#111827] border border-slate-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
        <div className="bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Control Room Keyboard Shortcuts
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 bg-[#0b1120] text-xs">
          <p className="text-slate-400">
            Designed for rapid control room operation during monsoon disaster response.
          </p>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded bg-[#161f33]">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between">
                <span className="text-slate-300 font-medium">{s.description}</span>
                <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-[11px] rounded font-bold">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border-t border-slate-800 p-3 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
