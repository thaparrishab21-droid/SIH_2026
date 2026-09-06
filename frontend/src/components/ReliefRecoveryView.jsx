import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  HeartHandshake, 
  PlusCircle, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ExternalLink, 
  PhoneCall, 
  Lock, 
  Sparkles,
  Users,
  Building2,
  Ambulance,
  Utensils,
  Home,
  Droplets,
  Shirt,
  LifeBuoy,
  RefreshCw,
  Search
} from 'lucide-react';

import { 
  getWardReliefStatus, 
  submitReliefRequest, 
  updateReliefRequestStatus, 
  registerReliefProvider, 
  verifyReliefProvider, 
  getDonationLinks,
  activateWardIncident,
  deactivateWardIncident
} from '../api';

export default function ReliefRecoveryView({ 
  wards, 
  selectedWard, 
  onSelectWard, 
  currentUser, 
  highContrast,
  setToastMessage 
}) {
  // Active Ward Selection
  const [currentWardId, setCurrentWardId] = useState(
    selectedWard?.rawId || (wards.length > 0 ? wards[0].rawId : 1)
  );

  const [reliefStatus, setReliefStatus] = useState(null);
  const [donationLinks, setDonationLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters for Relief Requests Feed
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [needTypeFilter, setNeedTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form States: Report Need
  const [needForm, setNeedForm] = useState({
    requesterName: '',
    requesterPhone: '',
    needType: 'food',
    description: '',
    peopleAffectedCount: 1,
    urgency: 'high',
    honeypotCheck: ''
  });
  const [isSubmittingNeed, setIsSubmittingNeed] = useState(false);
  const [needFormSuccess, setNeedFormSuccess] = useState(false);

  // Form States: Register Helper
  const [helperForm, setHelperForm] = useState({
    name: '',
    type: 'ngo',
    phone: '',
    whatTheyCanOffer: '',
    wardIdsCovered: currentWardId.toString(),
    honeypotCheck: ''
  });
  const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
  const [helperFormSuccess, setHelperFormSuccess] = useState(false);

  // Official Action Loading
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 1. Fetch Ward Relief Data
  const loadReliefData = useCallback(async (wardId, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [statusRes, donationRes] = await Promise.all([
        getWardReliefStatus(wardId),
        getDonationLinks(wardId).catch(() => [])
      ]);
      setReliefStatus(statusRes);
      setDonationLinks(donationRes);
    } catch (err) {
      console.error("Error loading relief status:", err);
      setError(err.message || "Failed to load relief coordination data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWard && (selectedWard.rawId || selectedWard.id)) {
      const targetId = selectedWard.rawId || (typeof selectedWard.id === 'string' ? parseInt(selectedWard.id.replace(/\D/g, ''), 10) : selectedWard.id);
      setCurrentWardId(targetId);
      loadReliefData(targetId);
    } else if (currentWardId) {
      loadReliefData(currentWardId);
    }
  }, [selectedWard, currentWardId, loadReliefData]);

  // Handle Ward Switch
  const handleWardChange = (e) => {
    const newId = parseInt(e.target.value, 10);
    setCurrentWardId(newId);
    const targetWard = wards.find((w) => w.rawId === newId || w.id === newId);
    if (targetWard && onSelectWard) {
      onSelectWard(targetWard);
    }
  };

  // Official Toggle: Activate/Deactivate Incident
  const handleToggleIncident = async (shouldActivate) => {
    setIsUpdatingStatus(true);
    try {
      if (shouldActivate) {
        await activateWardIncident(
          currentWardId, 
          `Official disaster incident activated for relief coordination by ${currentUser?.full_name || 'Control Room'}.`
        );
        if (setToastMessage) setToastMessage(`🚨 INCIDENT ACTIVATED for Ward ${currentWardId}. Relief coordination portal is now LIVE.`);
      } else {
        await deactivateWardIncident(currentWardId);
        if (setToastMessage) setToastMessage(`✅ INCIDENT DEACTIVATED for Ward ${currentWardId}. Recovery declared complete.`);
      }
      await loadReliefData(currentWardId, true);
    } catch (err) {
      console.error("Failed to toggle incident status:", err);
      if (setToastMessage) setToastMessage(`Error: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit Need Form
  const handleSubmitNeed = async (e) => {
    e.preventDefault();
    if (!needForm.requesterName.trim() || !needForm.requesterPhone.trim() || !needForm.description.trim()) {
      alert("Please fill in your name, phone number, and details of what is needed.");
      return;
    }

    setIsSubmittingNeed(true);
    try {
      await submitReliefRequest({
        wardId: currentWardId,
        ...needForm
      });

      setNeedFormSuccess(true);
      setNeedForm({
        requesterName: '',
        requesterPhone: '',
        needType: 'food',
        description: '',
        peopleAffectedCount: 1,
        urgency: 'high',
        honeypotCheck: ''
      });

      if (setToastMessage) setToastMessage("✅ Relief request submitted successfully! Local relief teams have been notified.");
      setTimeout(() => setNeedFormSuccess(false), 5000);
      await loadReliefData(currentWardId, true);
    } catch (err) {
      console.error("Submit request failed:", err);
      alert(`Error submitting request: ${err.message}`);
    } finally {
      setIsSubmittingNeed(false);
    }
  };

  // Submit Helper Registration Form
  const handleSubmitHelper = async (e) => {
    e.preventDefault();
    if (!helperForm.name.trim() || !helperForm.phone.trim() || !helperForm.whatTheyCanOffer.trim()) {
      alert("Please fill in your name/organization, phone number, and what you can offer.");
      return;
    }

    setIsSubmittingHelper(true);
    try {
      await registerReliefProvider({
        ...helperForm,
        wardIdsCovered: currentWardId.toString()
      });

      setHelperFormSuccess(true);
      setHelperForm({
        name: '',
        type: 'ngo',
        phone: '',
        whatTheyCanOffer: '',
        wardIdsCovered: currentWardId.toString(),
        honeypotCheck: ''
      });

      if (setToastMessage) setToastMessage("🤝 Helper profile registered! Pending official SDMA verification.");
      setTimeout(() => setHelperFormSuccess(false), 5000);
      await loadReliefData(currentWardId, true);
    } catch (err) {
      console.error("Helper registration failed:", err);
      alert(`Error registering helper: ${err.message}`);
    } finally {
      setIsSubmittingHelper(false);
    }
  };

  // Official Action: Verify Provider
  const handleVerifyProvider = async (providerId) => {
    try {
      await verifyReliefProvider(providerId);
      if (setToastMessage) setToastMessage("✅ Helper verified by District Official.");
      await loadReliefData(currentWardId, true);
    } catch (err) {
      console.error("Verification failed:", err);
      alert(`Error verifying provider: ${err.message}`);
    }
  };

  // Official Action: Update Request Status
  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await updateReliefRequestStatus(requestId, { status: newStatus });
      if (setToastMessage) setToastMessage(`Updated request #${requestId} to ${newStatus.toUpperCase()}`);
      await loadReliefData(currentWardId, true);
    } catch (err) {
      console.error("Status update failed:", err);
      alert(`Error updating request status: ${err.message}`);
    }
  };

  // Filtered Requests
  const rawRequests = reliefStatus?.relief_requests || [];
  const filteredRequests = rawRequests.filter((req) => {
    if (urgencyFilter !== 'ALL' && req.urgency.toUpperCase() !== urgencyFilter) return false;
    if (needTypeFilter !== 'ALL' && req.need_type.toLowerCase() !== needTypeFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = req.description.toLowerCase().includes(q);
      const matchName = req.requester_name.toLowerCase().includes(q);
      const matchType = req.need_type.toLowerCase().includes(q);
      if (!matchDesc && !matchName && !matchType) return false;
    }
    return true;
  });

  // Need Type Icon & Styling Helper
  const getNeedBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'food':
        return { label: 'Food Rations', icon: Utensils, color: 'text-amber-400 bg-amber-950/80 border-amber-800' };
      case 'shelter':
        return { label: 'Shelter & Tents', icon: Home, color: 'text-blue-400 bg-blue-950/80 border-blue-800' };
      case 'medical':
        return { label: 'Medical & First Aid', icon: Ambulance, color: 'text-rose-400 bg-rose-950/80 border-rose-800' };
      case 'water':
        return { label: 'Drinking Water', icon: Droplets, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'clothing':
        return { label: 'Clothing & Fleece', icon: Shirt, color: 'text-purple-400 bg-purple-950/80 border-purple-800' };
      case 'rescue':
        return { label: 'Rescue & Winch', icon: LifeBuoy, color: 'text-red-400 bg-red-950/80 border-red-800' };
      default:
        return { label: 'General Relief', icon: HeartHandshake, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' };
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-700 animate-pulse">CRITICAL URGENCY</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700">HIGH URGENCY</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800">MEDIUM URGENCY</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">LOW URGENCY</span>;
    }
  };

  const isIncidentActive = reliefStatus?.incident_status?.incident_active === true;
  const isOfficial = currentUser && (currentUser.role === 'official' || currentUser.role === 'district_official');

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${highContrast ? 'bg-slate-950 text-white' : 'bg-[#0b1120] text-slate-100'}`}>
      
      {/* 1. Header Control & Active Incident Selector Bar */}
      <div className="bg-[#161f33] border-b border-[#26354f] px-4 py-3 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
            <HeartHandshake className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Post-Disaster Relief & Community Support Portal
              </h2>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 bg-emerald-900/60 border border-emerald-700 text-emerald-300 rounded">
                Ward Response Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Community need matching & verified volunteer coordination for hit wards • Separate from Risk Prediction
            </p>
          </div>
        </div>

        {/* Ward Selector & Action Controls */}
        <div className="flex items-center gap-3">
          <label htmlFor="relief-ward-select" className="text-xs font-semibold text-slate-300 hidden sm:inline">Select Ward:</label>
          <select
            id="relief-ward-select"
            aria-label="Select Ward for Relief Status"
            value={currentWardId}
            onChange={handleWardChange}
            className="bg-slate-900 text-white text-xs font-semibold border border-slate-700 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {wards.map((w) => {
              const wid = w.rawId || w.id;
              return (
                <option key={wid} value={wid}>
                  {w.name} ({w.district}) {w.riskLevel === 'CRITICAL' ? '⚠️ CRITICAL' : ''}
                </option>
              );
            })}
          </select>

          <button
            onClick={() => loadReliefData(currentWardId, true)}
            disabled={isRefreshing}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Official Toggle Button */}
          {isOfficial && (
            <button
              onClick={() => handleToggleIncident(!isIncidentActive)}
              disabled={isUpdatingStatus}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                isIncidentActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isIncidentActive ? 'Deactivate Incident (Recovery Done)' : 'Official Activate Incident'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-medium">Fetching relief status & active community requests...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-950/80 border border-red-800 p-4 rounded-lg text-red-200 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* 2. INCIDENT STATUS BANNER */}
            {isIncidentActive ? (
              <div className="bg-gradient-to-r from-red-950/90 via-[#1e1321] to-slate-900 border-2 border-red-700/80 rounded-xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                      <span className="text-xs font-mono uppercase font-bold tracking-widest text-red-400 bg-red-900/60 px-2 py-0.5 rounded border border-red-700">
                        OFFICIAL ACTIVE DISASTER INCIDENT
                      </span>
                      {reliefStatus?.incident_status?.incident_started_at && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Declared {new Date(reliefStatus.incident_status.incident_started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-extrabold text-white">
                      Active Disaster Relief & Evacuation in Progress — {reliefStatus?.ward_name} ({reliefStatus?.district})
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium bg-black/40 p-3 rounded border border-slate-800">
                      {reliefStatus?.incident_status?.incident_description || "Emergency cloudburst and slope failure reported. Official SDMA relief teams on site."}
                    </p>
                  </div>

                  {/* Official Hotline Card */}
                  <div className="bg-slate-950/80 border border-red-800/80 p-3.5 rounded-lg shrink-0 space-y-1.5 text-right">
                    <span className="text-[10px] font-mono uppercase text-red-300 tracking-wider block font-bold">EMERGENCY CONTROL ROOM</span>
                    <div className="flex items-center justify-end gap-2 text-red-400 font-extrabold text-base font-mono">
                      <PhoneCall className="w-4 h-4 text-red-400 animate-bounce" />
                      <span>1077 / +91 135 2710334</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium">State Disaster Management Authority</span>
                  </div>
                </div>
              </div>
            ) : (
              /* NON-ACTIVE INCIDENT NOTICE SCREEN */
              <div className="bg-[#161f33] border border-[#26354f] rounded-xl p-6 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">
                  No Active Disaster Incident for {reliefStatus?.ward_name || `Ward ${currentWardId}`}
                </h3>
                <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                  This ward is currently in normal operational status. Post-disaster community relief pages activate automatically whenever a Critical monsoonal alert is triggered or officially declared by district authorities.
                </p>
                {isOfficial && (
                  <button
                    onClick={() => handleToggleIncident(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold shadow"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Manually Declare Active Incident for Test / Emergency</span>
                  </button>
                )}
              </div>
            )}

            {/* 3. MAIN GRID: RELIEF REQUEST FEED & FORMS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT COLUMN: LIVE REQUEST FEED & REPORT NEED FORM (7 COLS) */}
              <div className="lg:col-span-7 space-y-6">

                {/* RELIEF REQUESTS FEED SECTION */}
                <div className="bg-[#161f33] border border-[#26354f] rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#26354f] pb-3">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Live Relief Requests ({filteredRequests.length})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Who Needs What Right Now
                    </span>
                  </div>

                  {/* Filter Controls */}
                  <div className="space-y-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Filter className="w-3.5 h-3.5 text-blue-400" />
                      <span>Filter Feed:</span>
                    </div>

                    {/* Urgency Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 mr-1">Urgency:</span>
                      {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setUrgencyFilter(lvl)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                            urgencyFilter === lvl
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>

                    {/* Need Type Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 mr-1">Need Type:</span>
                      {['ALL', 'food', 'shelter', 'medical', 'water', 'clothing', 'rescue'].map((nt) => (
                        <button
                          key={nt}
                          onClick={() => setNeedTypeFilter(nt)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-all ${
                            needTypeFilter === nt
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {nt === 'ALL' ? 'All Needs' : nt}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search needs by keyword or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Request Cards List */}
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg text-slate-400 space-y-2">
                      <HeartHandshake className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold">No relief requests match the selected filters.</p>
                      <p className="text-[11px] text-slate-500">Use the form below to report an urgent community need.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                      {filteredRequests.map((req) => {
                        const badge = getNeedBadge(req.need_type);
                        const IconComp = badge.icon;
                        const isFulfilled = req.status === 'fulfilled';
                        const isInProgress = req.status === 'in_progress';

                        return (
                          <div
                            key={req.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isFulfilled
                                ? 'bg-slate-900/40 border-slate-800 opacity-75'
                                : isInProgress
                                ? 'bg-[#15233b] border-blue-700/80 shadow-md'
                                : 'bg-[#1a253d] border-[#2e4063] shadow-md hover:border-slate-600'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1.5 ${badge.color}`}>
                                  <IconComp className="w-3.5 h-3.5" />
                                  <span>{badge.label}</span>
                                </span>
                                {getUrgencyBadge(req.urgency)}
                              </div>

                              {/* Status Pill */}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isFulfilled
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : isInProgress
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}>
                                {isFulfilled ? '✓ FULFILLED' : isInProgress ? '⏳ IN PROGRESS' : '● OPEN NEED'}
                              </span>
                            </div>

                            {/* Need Description */}
                            <p className="text-sm font-semibold text-white leading-snug my-2">
                              {req.description}
                            </p>

                            {/* Requester & Metadata */}
                            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 pt-2 border-t border-slate-800/80 font-mono">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200">{req.requester_name}</span>
                                <span className="text-slate-500">•</span>
                                <span className="flex items-center gap-1 text-slate-300" title={isOfficial ? "Unmasked Phone Number" : "Phone Masked for Requester Privacy"}>
                                  {!isOfficial && <Lock className="w-3 h-3 text-slate-500" />}
                                  <span>{req.requester_phone}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-amber-300 font-bold">
                                  People Affected: {req.people_affected_count}
                                </span>
                                <span>
                                  {new Date(req.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                                </span>
                              </div>
                            </div>

                            {/* Actions for Officials & Verified Helpers */}
                            {isOfficial && (
                              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                                {!isFulfilled && (
                                  <button
                                    onClick={() => handleUpdateRequestStatus(req.id, 'fulfilled')}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                                  >
                                    Mark Fulfilled
                                  </button>
                                )}
                                {!isInProgress && !isFulfilled && (
                                  <button
                                    onClick={() => handleUpdateRequestStatus(req.id, 'in_progress')}
                                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                                  >
                                    Mark In Progress
                                  </button>
                                )}
                                {isFulfilled && (
                                  <button
                                    onClick={() => handleUpdateRequestStatus(req.id, 'open')}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                                  >
                                    Re-open Need
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* FORM 1: PUBLIC "REPORT A NEED" */}
                <div className="bg-[#161f33] border border-[#26354f] rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-[#26354f] pb-3">
                    <PlusCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Report an Urgent Need (Public Form)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        No login required. Anyone in an affected ward can submit a request directly.
                      </p>
                    </div>
                  </div>

                  {needFormSuccess && (
                    <div className="bg-emerald-950 border border-emerald-700 p-3 rounded text-emerald-200 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Thank you! Your relief request has been recorded and published on the live feed.</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitNeed} className="space-y-4">
                    {/* Honeypot Field for Spam Prevention */}
                    <input
                      type="text"
                      name="honeypotCheck"
                      value={needForm.honeypotCheck}
                      onChange={(e) => setNeedForm({ ...needForm, honeypotCheck: e.target.value })}
                      style={{ display: 'none' }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name / Organization *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rameshwar Negi (Village Lead)"
                          value={needForm.requesterName}
                          onChange={(e) => setNeedForm({ ...needForm, requesterName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (10 digits) *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 98765 43210"
                          value={needForm.requesterPhone}
                          onChange={(e) => setNeedForm({ ...needForm, requesterPhone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Need Category *</label>
                        <select
                          value={needForm.needType}
                          onChange={(e) => setNeedForm({ ...needForm, needType: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        >
                          <option value="food">Food Rations</option>
                          <option value="water">Drinking Water</option>
                          <option value="medical">Medical & First Aid</option>
                          <option value="shelter">Shelter & Tarpaulins</option>
                          <option value="clothing">Clothing & Blankets</option>
                          <option value="rescue">Rescue & Winch</option>
                          <option value="other">Other Need</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Urgency Level *</label>
                        <select
                          value={needForm.urgency}
                          onChange={(e) => setNeedForm({ ...needForm, urgency: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        >
                          <option value="critical">Critical (Imminent Danger)</option>
                          <option value="high">High Urgency</option>
                          <option value="medium">Medium Urgency</option>
                          <option value="low">Low Urgency</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">People Affected *</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={needForm.peopleAffectedCount}
                          onChange={(e) => setNeedForm({ ...needForm, peopleAffectedCount: parseInt(e.target.value, 10) || 1 })}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Need Description *</label>
                      <textarea
                        rows="3"
                        required
                        placeholder="Describe specific items, exact location, or condition (e.g. 50 dry ration packets needed near Kedarnath bus stand for stranded families)."
                        value={needForm.description}
                        onChange={(e) => setNeedForm({ ...needForm, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingNeed}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingNeed ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          <span>Submit Need Request (No Account Required)</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </div>


              {/* RIGHT COLUMN: REGISTER HELPER & DONATION LINKS (5 COLS) */}
              <div className="lg:col-span-5 space-y-6">

                {/* FORM 2: "REGISTER AS A HELPER" */}
                <div className="bg-[#161f33] border border-[#26354f] rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-[#26354f] pb-3">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Register as a Helper / Volunteer
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        NGOs, individual volunteers, and local businesses can offer support.
                      </p>
                    </div>
                  </div>

                  {helperFormSuccess && (
                    <div className="bg-blue-950 border border-blue-700 p-3 rounded text-blue-200 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Helper profile registered! Pending official verification.</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitHelper} className="space-y-3">
                    {/* Honeypot Field */}
                    <input
                      type="text"
                      name="honeypotCheck"
                      value={helperForm.honeypotCheck}
                      onChange={(e) => setHelperForm({ ...helperForm, honeypotCheck: e.target.value })}
                      style={{ display: 'none' }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Name / Organization Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Red Cross Society / Garhwal Volunteer Group"
                        value={helperForm.name}
                        onChange={(e) => setHelperForm({ ...helperForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Type *</label>
                        <select
                          value={helperForm.type}
                          onChange={(e) => setHelperForm({ ...helperForm, type: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        >
                          <option value="ngo">Registered NGO</option>
                          <option value="individual">Individual Volunteer</option>
                          <option value="govt_agency">Govt / Armed Forces</option>
                          <option value="business">Local Business</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 98123 45678"
                          value={helperForm.phone}
                          onChange={(e) => setHelperForm({ ...helperForm, phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">What Can You Offer? *</label>
                      <textarea
                        rows="2"
                        required
                        placeholder="e.g. 4x4 Bolero vehicles, 50 warm blankets, medical kits, cooked food packs."
                        value={helperForm.whatTheyCanOffer}
                        onChange={(e) => setHelperForm({ ...helperForm, whatTheyCanOffer: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingHelper}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingHelper ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Register as Helper</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* VERIFIED RELIEF HELPERS LIST */}
                <div className="bg-[#161f33] border border-[#26354f] rounded-xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#26354f] pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Active Relief Helpers ({reliefStatus?.relief_providers?.length || 0})
                      </h3>
                    </div>
                  </div>

                  {(!reliefStatus?.relief_providers || reliefStatus.relief_providers.length === 0) ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">No registered helpers for this ward yet.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {reliefStatus.relief_providers.map((p) => (
                        <div key={p.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{p.name}</span>
                            {p.verified ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>SDMA VERIFIED</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                PENDING VERIFICATION
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{p.what_they_can_offer}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Phone: {isOfficial ? p.phone : mask_phone_number(p.phone)}</span>
                            {isOfficial && !p.verified && (
                              <button
                                onClick={() => handleVerifyProvider(p.id)}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
                              >
                                Verify Helper
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. "SUPPORT OFFICIAL RELIEF EFFORTS" (DONATION LINKS) */}
                <div className="bg-[#161f33] border border-[#26354f] rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-[#26354f] pb-3">
                    <Building2 className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Support Official Relief Efforts
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Curated list of registered government & accredited charity funds
                      </p>
                    </div>
                  </div>

                  {/* PROMINENT DISCLAIMER BOX */}
                  <div className="bg-blue-950/80 border border-blue-800 p-3 rounded-lg text-xs text-blue-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-300">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Financial Handling Notice</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-blue-200/90">
                      This platform does <strong>NOT</strong> collect or hold funds directly. The verified external links below direct to registered government funds (SDRF & PMNRF) and accredited disaster relief trusts.
                    </p>
                  </div>

                  {/* Donation Cards */}
                  <div className="space-y-3">
                    {donationLinks.map((dl) => (
                      <div key={dl.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2 hover:border-slate-700 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-white">{dl.organization_name}</h4>
                            <span className="text-[10px] text-purple-400 font-mono block font-semibold">{dl.organization_type}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{dl.description}</p>
                        <a
                          href={dl.donation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-900/60 rounded text-xs font-bold transition-all"
                        >
                          <span>Donate on Official Portal</span>
                          <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
