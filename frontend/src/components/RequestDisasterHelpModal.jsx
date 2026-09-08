import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Truck, Home, PhoneCall, ArrowRight } from 'lucide-react';

export default function RequestDisasterHelpModal({ isOpen, type, onClose, onSubmitSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [peopleCount, setPeopleCount] = useState('2');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onSubmitSuccess && onSubmitSuccess({
        id: `TICKET-${Math.floor(1000 + Math.random() * 9000)}`,
        type: type === 'shuttle' ? 'Shuttle Transport' : 'Pump / Boat Rescue',
        location,
        phone,
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative my-auto p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-100 text-red-700 rounded-lg font-bold">
              {type === 'shuttle' ? '🚑' : '🚨'}
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {type === 'shuttle' ? 'Request 4x4 Rescue Shuttle' : 'Request Emergency Pump / Boat'}
              </h3>
              <p className="text-[11px] text-slate-500">
                City Civil Defense Priority Dispatch Ticket
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-slate-900">Dispatch Ticket Issued!</h4>
            <p className="text-xs text-slate-600">
              Your GPS coordinates and contact details have been transmitted to the Ward Disaster Dispatch team. Average response time: 18 mins.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                CONTACT NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-50 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                MOBILE NUMBER (FOR DISPATCH SMS)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-50 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                EXACT STREET / WARD / LANDMARK
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="House No, Street, Ward 17, Riverbank..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-50 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  PEOPLE NEEDING RESCUE
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-50 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  CURRENT WATER DEPTH
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-50 outline-none">
                  <option>1 - 2 Feet (Ankle/Knee)</option>
                  <option>2 - 4 Feet (Waist High)</option>
                  <option>Ground Floor Completely Submerged</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                SPECIAL INSTRUCTIONS (ELDERLY, INFANTS, MEDICAL)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Mention elderly family members, infants, or oxygen requirement..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-slate-50 outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Submit Priority Request Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
