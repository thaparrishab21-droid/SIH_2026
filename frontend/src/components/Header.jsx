import React from 'react';
import { PhoneCall, UserCheck, AlertTriangle, ShieldCheck, Flame, Radio } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenLogin,
  currentUser,
  onLogout
}) {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      {/* Top Critical Notice Bar */}
      <div className="bg-[#bd1e1e] text-white px-4 py-2 flex flex-wrap items-center justify-between text-xs font-semibold gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="bg-white text-[#bd1e1e] uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
            CRITICAL NOTICE
          </span>
          <span className="truncate">
            Ward 17 (Riverbank) under Flood Watch • Central & South Sectors completely safe & normal.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a 
            href="tel:1077" 
            className="flex items-center gap-1 bg-[#8b0f0f] hover:bg-[#730a0a] text-white px-3 py-1 rounded text-xs font-bold transition-all border border-red-400/40 shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 1077 (Toll-Free)</span>
          </a>
        </div>
      </div>

      {/* Main Nav Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('alerts')}>
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black shadow-sm shrink-0">
            <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                FLOOD-FLASH
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded">
                CITIZEN PORTAL
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'alerts'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Live Alerts & Safety
          </button>

          <button
            onClick={() => setActiveTab('shelters')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'shelters'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Verified Shelters
          </button>

          <button
            onClick={() => setActiveTab('charity')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'charity'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Community Relief & Charity
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'emergency'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Emergency Numbers (Dial 1077)
          </button>
        </nav>

        {/* Right: Quick Emergency Badge & Profile Button */}
        <div className="flex items-center gap-2">
          <a
            href="tel:1077"
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>1077</span>
          </a>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold hover:bg-slate-100 transition-all"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="max-w-[100px] truncate">{currentUser.full_name || currentUser.username}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Citizen Profile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
