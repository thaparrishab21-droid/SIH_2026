import React, { useState } from 'react';
import { Heart, ShieldCheck, DollarSign, CreditCard, Lock, Download, CheckCircle2, Truck, RefreshCw, Users, FileText } from 'lucide-react';

export default function ReliefCharityView() {
  const [paymentRoute, setPaymentRoute] = useState('UPI'); // 'UPI' | 'ApplePay' | 'Card' | 'NetBanking'
  const [selectedAmount, setSelectedAmount] = useState('1000');
  const [customAmount, setCustomAmount] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Volunteer State
  const [volName, setVolName] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volRole, setVolRole] = useState('Food Distribution (Sector 4 & 7)');
  const [volShift, setVolShift] = useState('Morning');
  const [volSubmitted, setVolSubmitted] = useState(false);

  const ledgerData = [
    { time: '08 mins ago', amount: '₹12,500', deployment: '800 packaged hot meals (Rice, lentils, boiled water)', location: 'Ward 17 Relief Kitchen', disbursed: 'Community Seva Trust', tx: 'TX-40992-OK' },
    { time: '24 mins ago', amount: '₹8,000', deployment: '350 emergency water purification filter units', location: 'Sector 9 Water Point', disbursed: 'PureWater Initiative', tx: 'TX-40993-OK' },
    { time: '42 mins ago', amount: '₹22,000', deployment: 'Diesel fuel replenishment for 12 inflatable dinghies', location: 'West Marina Jetty', disbursed: 'Civil Coast Guard Auxiliary', tx: 'TX-40994-OK' },
    { time: '1 hr 12m ago', amount: '₹15,400', deployment: 'Pediatric formula & sterile diapers for 90 evacuated toddlers', location: 'St. Jude Shelter', disbursed: 'Red Cross Field Unit', tx: 'TX-40989-OK' },
    { time: '1 hr 45m ago', amount: '₹6,200', deployment: 'Tetanus toxoid, saline IV packs & antiseptic rolls', location: 'Civic Hospital Mobile Bay', disbursed: 'Apex Trauma Pharmacy', tx: 'TX-40988-OK' },
  ];

  const handleDonationSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  const handleVolunteerSubmit = (e) => {
    e.preventDefault();
    setVolSubmitted(true);
    setTimeout(() => setVolSubmitted(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* 1. Top Verified Relief Pipeline Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                VERIFIED RELIEF PIPELINE • 80G TAX EXEMPT
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Citizen Flood Relief Fund
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              100% of public donations flow immediately into life-critical field operations: prepared hot meals, water purification filters, pediatric nutrition, and sterile medical packs. Every cent is audited in real-time.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-medium text-slate-700">
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> State Disaster Management Authority
              </span>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-600" /> Red Cross Humanitarian Partner
              </span>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md font-mono text-slate-500">
                Instant Tax Invoice #80G-FLD-2025
              </span>
            </div>
          </div>

          {/* Fund Target Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shrink-0 w-full md:w-72 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">EMERGENCY FUND TARGET</span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">CYCLE 64</span>
            </div>

            <div className="text-2xl font-black text-slate-900">
              74.2% <span className="text-xs font-semibold text-slate-500">Funded</span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-slate-950 h-full w-[74.2%]"></div>
            </div>

            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Live bank ledger balance</span>
              <span className="text-emerald-700 font-bold">● Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Impact Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>FAMILIES FED TODAY</span>
            <span>🥣</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            1,840
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-mono">3 relief kitchens operating</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>MEDICAL KITS ISSUED</span>
            <span>💊</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            420
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-mono">Water purification & ORS</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>RESCUE BOATS DISPATCHED</span>
            <span>⛵</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            12
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-mono">Ward 4, 11 & Sector 9 basin</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>POTABLE WATER DELIVERED</span>
            <span>🚰</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
            18,500L
          </div>
          <p className="mt-1 text-[10px] text-slate-500 font-mono">Zero contamination certified</p>
        </div>

      </div>

      {/* 3. Direct Relief Contribution Form (Left) & Logistical Guarantee (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Contribution Form */}
        <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-xl p-6 space-y-5 shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              IMMEDIATE ACTION
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Direct Relief Contribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an impact tier. Every rupee goes directly into field procurement contracts with immediate digital receipts.
            </p>
          </div>

          {isSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-950">Contribution Recorded!</h4>
              <p className="text-xs text-emerald-900">
                Thank you for powering real-time field operations. Instant tax receipt #80G-FLD-2025 has been emailed to you.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDonationSubmit} className="space-y-4">
              
              {/* Preset Amount Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  SELECT IMPACT AMOUNT (INR)
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono font-bold">
                  {['500', '1000', '2500', '5000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-2 rounded-lg border transition-all ${
                        selectedAmount === amt && !customAmount
                          ? 'bg-slate-950 text-white border-slate-950'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  CUSTOM CONTRIBUTION AMOUNT
                </label>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  <span className="px-3 py-2 text-xs font-mono text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(''); }}
                    placeholder="Enter custom amount..."
                    className="w-full px-2 py-2 text-xs font-mono text-slate-900 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Donor Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    FULL NAME OR ANONYMOUS
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Elena Rostova / Citizen"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    EMAIL FOR 80G TAX RECEIPT
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Payment Express Route */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  SELECT PAYMENT EXPRESS ROUTE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentRoute('UPI')}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      paymentRoute === 'UPI' ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    💸 UPI / GPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentRoute('ApplePay')}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      paymentRoute === 'ApplePay' ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                     Apple Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentRoute('Card')}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      paymentRoute === 'Card' ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    💳 Card / Visa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentRoute('NetBanking')}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      paymentRoute === 'NetBanking' ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🏦 Net Banking
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Contribute ₹{customAmount || selectedAmount || '1000'} Now</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Logistical Guarantee & Image & Allocation */}
        <div className="md:col-span-5 space-y-5">
          
          {/* Rescue Photo Box */}
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xs relative group">
            <div className="h-44 bg-slate-800 bg-[url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-90"></div>
            <div className="p-3 bg-slate-950 text-white text-[11px] font-mono flex items-center justify-between">
              <span>Sector 7 Central Relief Depot</span>
              <span className="text-slate-400">Operational since 04:00 AM</span>
            </div>
          </div>

          {/* Logistical Guarantee Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
                LOGISTICAL GUARANTEE
              </span>
              <h4 className="text-sm font-black text-slate-900">
                Zero Bureaucracy. Fast Field Procurement.
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Every cash contribution converts to wholesale orders with accredited suppliers located within a 15-mile safety radius. Trucks depart every 90 minutes.
              </p>
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-100 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>Fund Allocation Architecture</span>
                <span className="text-[10px] text-slate-400">ISO-9001 AUDITED</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Hot Meals & Nutrition Packs</span>
                    <span className="font-bold text-slate-900">54%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                    <div className="bg-slate-900 h-full w-[54%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Water Purification & Medical Triage</span>
                    <span className="font-bold text-slate-900">28%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                    <div className="bg-slate-900 h-full w-[28%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Boat Fuel & Flotation Equipment</span>
                    <span className="font-bold text-slate-900">18%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                    <div className="bg-slate-900 h-full w-[18%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Administrative Overhead (Citizen zero-fee pledge)</span>
                    <span className="font-bold text-emerald-700">0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Essential Physical Supplies Drop-Off Locations */}
      <section className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
            DROP-OFF LOCATIONS
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Essential Physical Supplies
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prefer giving supplies in person? Our physical intake hubs are staffed by verified coordinators. High demand items: dry sealed lentils, water jugs, clean blankets, AAA batteries, and diapers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>🏠</span> Sector 4 Community Center
              </h5>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                OPEN NOW
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Plot 88, Central Avenue • Tel: (555) 019-4822</p>
            <p className="text-[11px] text-slate-700">Accepting: Ready-to-eat packets, infant milk powder, heavy duty flashlights</p>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
              <span>08:00 – 22:00</span>
              <span>Capacity: 65% Full</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>🏫</span> St. Jude School Main Gymnasium
              </h5>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                OPEN NOW
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">14 Northgate Road • Tel: (555) 018-9934</p>
            <p className="text-[11px] text-slate-700">Accepting: Dry wool blankets, hygienic pads, water chlorine tablets</p>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
              <span>24 HOURS OPEN</span>
              <span>Capacity: 40% Full</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>➕</span> Crescent Youth Pavilion
              </h5>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                OPEN NOW
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Riverside Drive East • Tel: (555) 012-7711</p>
            <p className="text-[11px] text-slate-700">Accepting: Bottled drinking water crates (1L / 5L), sterile bandaging</p>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
              <span>07:00 – 20:00</span>
              <span>Capacity: 80% Full</span>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Volunteer Registration Section */}
      <section className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              GROUND HANDS NEEDED
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Volunteer Your Time
            </h3>
          </div>
          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold uppercase rounded font-mono">
            🔴 URGENT
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Join emergency neighborhood dispatch teams. Shifts run in 4-hour rotations with field safety vests, hot rations, and local transport provided.
        </p>

        {volSubmitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Registration successful! A ward coordinator will call your mobile within 30 minutes.</span>
          </div>
        ) : (
          <form onSubmit={handleVolunteerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  FULL NAME & CONTACT PHONE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={volName}
                    onChange={(e) => setVolName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-slate-50 outline-none"
                    required
                  />
                  <input
                    type="tel"
                    value={volPhone}
                    onChange={(e) => setVolPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-slate-50 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  PREFERRED RELIEF ROLE
                </label>
                <select
                  value={volRole}
                  onChange={(e) => setVolRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 bg-slate-50 outline-none"
                >
                  <option>Relief Kitchen & Food Distribution (Sector 4 & 7)</option>
                  <option>Medical Triage & First-Aid Support</option>
                  <option>Boat Rescue & Logistics Assist</option>
                  <option>Shelter Check-in & Registration Desk</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                AVAILABILITY SHIFT
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold">
                {['Morning (06-12)', 'Afternoon (12-18)', 'Night (18-24)'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVolShift(s)}
                    className={`py-2 rounded-lg border transition-all ${
                      volShift === s
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>📋 Register as Citizen Volunteer</span>
            </button>
          </form>
        )}
      </section>

      {/* 6. Live Fund Allocation Ledger Table */}
      <section className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              TOTAL TRANSPARENCY
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Live Fund Allocation Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every donation is matched immediately against verifiable field expense receipts. Audited by municipal comptroller.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>STREAM ACTIVE</span>
            </span>
            <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-bold transition-all">
              Refresh Ledger
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">AMOUNT</th>
                <th className="py-2.5 px-3">OPERATIONAL DEPLOYMENT</th>
                <th className="py-2.5 px-3">FIELD LOCATION</th>
                <th className="py-2.5 px-3">DISBURSED TO</th>
                <th className="py-2.5 px-3">VERIFICATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ledgerData.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-2.5 px-3 text-slate-400">{item.time}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{item.amount}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-900">{item.deployment}</td>
                  <td className="py-2.5 px-3 text-slate-600">{item.location}</td>
                  <td className="py-2.5 px-3 text-slate-600">{item.disbursed}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded">
                      {item.tx}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
          <span>Automated hourly sync with Public Financial Management Network.</span>
          <button className="text-slate-900 font-bold hover:underline flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD COMPLETE CSV AUDIT SHEET</span>
          </button>
        </div>
      </section>

    </div>
  );
}
