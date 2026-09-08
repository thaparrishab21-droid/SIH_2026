import React, { useState } from 'react';
import { X, ShieldCheck, Radio, AlertOctagon, Smartphone, ArrowRight, Zap, CheckCircle2, Lock } from 'lucide-react';

export default function IdentityAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [roleTab, setRoleTab] = useState('citizen'); // 'citizen' | 'official'
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'aadhaar'
  const [mobileNumber, setMobileNumber] = useState('98765 43210');
  const [aadhaarId, setAadhaarId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [lang, setLang] = useState('EN');

  if (!isOpen) return null;

  const handleGenerateOtp = (e) => {
    e.preventDefault();
    setOtpSent(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    // Create mock user session based on inputs
    const mockUser = {
      username: authMethod === 'phone' ? `+91 ${mobileNumber}` : aadhaarId,
      full_name: roleTab === 'official' ? 'Civil Defense Officer' : 'Citizen Resident',
      role: roleTab === 'official' ? 'district_official' : 'viewer',
    };
    onLoginSuccess(mockUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden relative my-auto animate-in fade-in zoom-in duration-200">
        
        {/* Top Status Bar */}
        <div className="bg-[#050b14] text-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-red-400 font-bold">CIVIL TELEMETRY: SECTOR 4 LIVE</span>
            <span className="text-slate-500">• Active Inundation Protocol v4.2</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:1077" className="text-slate-300 hover:text-white font-sans flex items-center gap-1">
              <span>📞 NO DATA? DIAL 1077</span>
            </a>
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-sans">
              <button 
                onClick={() => setLang('EN')} 
                className={`px-1 font-bold ${lang === 'EN' ? 'bg-slate-100 text-slate-900 rounded-xs' : 'hover:text-white'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('HI')} 
                className={`px-1 font-bold ${lang === 'HI' ? 'bg-slate-100 text-slate-900 rounded-xs' : 'hover:text-white'}`}
              >
                हिंदी
              </button>
              <button 
                onClick={() => setLang('BN')} 
                className={`px-1 font-bold ${lang === 'BN' ? 'bg-slate-100 text-slate-900 rounded-xs' : 'hover:text-white'}`}
              >
                বাংলা
              </button>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 p-6 gap-6 bg-[#fafbfc]">
          
          {/* Left Column: Access Guarantee & Capabilities */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm tracking-tight mb-1">
                <img src="/predict-flow-logo.png" alt="PREDICT FLOW Logo" className="h-6 w-auto object-contain" />
                <span>PREDICT FLOW CITIZEN CONSOLE</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Rapid Hazard Prediction & Rescue Portal
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Authorized telemetry bridge connecting local residents with National Disaster Response Force (NDRF), Ward Engineers, and real-time basin flow trackers.
              </p>

              {/* Guest Access Card */}
              <div className="mt-4 bg-blue-50/70 border border-blue-200/80 rounded-lg p-4">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-950">Immediate Hazard Access Guarantee</h4>
                    <p className="text-[11px] text-blue-900/80 mt-1 leading-snug">
                      Authentication is strictly optional during code-red warnings. Zero paywalls, zero credentials required to view flood perimeters, muster zones, or emergency siren status.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-3 w-full bg-white hover:bg-slate-50 border border-blue-200 text-slate-900 text-xs font-bold py-2 px-3 rounded flex items-center justify-between transition-all shadow-2xs"
                    >
                      <span>Continue as Guest / Public Viewer</span>
                      <span className="font-mono text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                        NO LOGIN <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Authenticated Resident Capabilities */}
              <div className="mt-5 space-y-3">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span>AUTHENTICATED RESIDENT CAPABILITIES</span>
                </h5>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <span className="p-1 bg-slate-100 text-slate-800 rounded text-sm shrink-0">📡</span>
                    <div>
                      <span className="font-bold text-slate-900">Precision Micro-Ward SMS Alerts</span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Instant WhatsApp/SMS siren warnings calibrated to your exact street drain catchment.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="p-1 bg-slate-100 text-slate-800 rounded text-sm shrink-0">🚨</span>
                    <div>
                      <span className="font-bold text-slate-900">Vulnerable Resident Priority Tagging</span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Pre-register bedridden or elderly family members for early evacuation by NDRF boats.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="p-1 bg-slate-100 text-slate-800 rounded text-sm shrink-0">⚙️</span>
                    <div>
                      <span className="font-bold text-slate-900">Municipal Heavy-Pump Dispatch</span>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Request and GPS-track mobile de-watering diesel pumps for flooded basements and lanes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SDMA Certification Footer */}
            <div className="bg-slate-100/80 border border-slate-200/80 rounded p-2.5 text-[10px] font-mono text-slate-500 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>SDMA & Municipal Civil Defense Certified • Zero Commercial Data Sharing • 256-Bit Telemetry Encryption</span>
            </div>
          </div>

          {/* Right Column: Identity Verification Form */}
          <div className="md:col-span-6 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              {/* Role Selector Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 mb-5">
                <button
                  type="button"
                  onClick={() => setRoleTab('citizen')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    roleTab === 'citizen'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>👤</span> Citizen / Household
                </button>
                <button
                  type="button"
                  onClick={() => setRoleTab('official')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    roleTab === 'official'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>🛡️</span> Official / First Responder
                </button>
              </div>

              {/* Header & Auth Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Verify Identity</h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <button
                    onClick={() => setAuthMethod('phone')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      authMethod === 'phone' ? 'bg-slate-200 text-slate-900' : 'hover:text-slate-900'
                    }`}
                  >
                    Phone OTP
                  </button>
                  <span>/</span>
                  <button
                    onClick={() => setAuthMethod('aadhaar')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      authMethod === 'aadhaar' ? 'bg-slate-200 text-slate-900' : 'hover:text-slate-900'
                    }`}
                  >
                    Aadhaar / Ration ID
                  </button>
                </div>
              </div>

              {/* Form Controls */}
              {!otpSent ? (
                <form onSubmit={handleGenerateOtp} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {authMethod === 'phone' ? 'MOBILE NUMBER' : 'AADHAAR / RATION NUMBER'}
                    </label>
                    {authMethod === 'phone' ? (
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-slate-900 bg-slate-50">
                        <span className="px-3 py-2.5 bg-slate-100 font-mono text-xs text-slate-700 border-r border-slate-300 font-bold">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="98765 43210"
                          className="w-full px-3 py-2.5 text-xs font-mono text-slate-900 bg-transparent outline-none"
                          required
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={aadhaarId}
                        onChange={(e) => setAadhaarId(e.target.value)}
                        placeholder="XXXX - XXXX - XXXX"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    )}
                    <p className="text-[10px] font-mono text-slate-500 mt-1.5 leading-tight">
                      Instant one-time security passcode will be triggered via National Emergency Gateway.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <span>Generate Emergency OTP</span>
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      ENTER 6-DIGIT EMERGENCY OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-center tracking-widest text-base font-mono text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
                      required
                    />
                    <p className="text-[10px] font-mono text-emerald-600 mt-1.5 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> OTP sent to +91 {mobileNumber}
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <span>Verify & Login to Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Low Bandwidth Backup Box */}
              <div className="mt-5 bg-blue-50/90 border border-blue-200/80 rounded-lg p-3 text-xs">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-[11px] uppercase tracking-wider text-blue-900 flex items-center gap-1">
                      <span>⚡ LOW-BANDWIDTH / ZERO-INTERNET BACKUP</span>
                    </h5>
                    <p className="text-[11px] text-blue-950 mt-1 leading-snug">
                      In deep water zones with lost 4G/5G data coverage: Send a standard SMS text <strong className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">LOGIN</strong> to <strong className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900">56070</strong>. Your session link will arrive via priority USSD callback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Direct Lines */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between text-[11px] font-mono font-bold text-slate-700">
          <div>STATE DISASTER WAR-ROOM: <a href="tel:1077" className="text-blue-700 underline">1077</a></div>
          <div>POLICE CONTROL: <a href="tel:100" className="text-blue-700 underline">100</a></div>
          <div>AMBULANCE & TRAUMA: <a href="tel:108" className="text-blue-700 underline">108</a></div>
          <div>BOAT RESCUE DISPATCH: <a href="tel:1077" className="text-blue-700 underline">1077</a></div>
        </div>

      </div>
    </div>
  );
}
