import React, { useState } from 'react';
import { ShieldCheck, Lock, User, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginUser } from '../api';

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin_official');
  const [password, setPassword] = useState('official123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await loginUser(username, password);
      onLoginSuccess(data);
      onClose();
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg(err.message || "Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-[#111827] border border-blue-800/80 rounded-lg shadow-2xl w-full max-w-md overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#26354f] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold uppercase tracking-wider font-mono">
              Control Room Official Authentication
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-[#0b1120]">
          {errorMsg && (
            <div className="bg-red-950 border border-red-700 p-3 rounded text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-2 rounded text-xs focus:outline-none focus:border-blue-500"
                placeholder="Enter official username..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-2 rounded text-xs focus:outline-none focus:border-blue-500"
                placeholder="Enter password..."
              />
            </div>
          </div>

          {/* Quick Demo Fill Credentials */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 block">DEMO LOGIN SHORTCUTS:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickLogin('admin_official', 'official123')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-blue-900/60 rounded text-left text-[11px]"
              >
                <span className="font-bold text-blue-400 block">District Official</span>
                <span className="text-[10px] text-slate-400">admin_official</span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin('observer', 'viewer123')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-left text-[11px]"
              >
                <span className="font-bold text-slate-300 block">Viewer / Observer</span>
                <span className="text-[10px] text-slate-400">observer</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded border border-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
