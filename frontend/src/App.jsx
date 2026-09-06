import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SummaryStrip from './components/SummaryStrip';
import MapView from './components/MapView';
import WardDetailPanel from './components/WardDetailPanel';
import TriggerAlertModal from './components/TriggerAlertModal';
import DisseminationLog from './components/DisseminationLog';
import SystemHealth from './components/SystemHealth';
import ReliefRecoveryView from './components/ReliefRecoveryView';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';

import LoginModal from './components/LoginModal';

import { 
  getWards, 
  getWardDetail, 
  getWardReadings, 
  simulateReading, 
  getAlerts,
  getSafeZones,
  getCurrentUserProfile,
  downloadWardPdfReport,
  connectWebSocket,
  setAuthToken
} from './api';

import { AlertOctagon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'alerts' | 'health'
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [alerts, setAlerts] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  
  // Auth & RBAC State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('flood_flash_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Operational state: Loading & Error handling
  const [isWardsLoading, setIsWardsLoading] = useState(true);
  const [wardsError, setWardsError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isLoadingReadings, setIsLoadingReadings] = useState(false);

  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState(null);

  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // 1. Fetch Wards list from Backend API
  const fetchWardsData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsWardsLoading(true);
    else setIsRefetching(true);
    setWardsError(null);

    try {
      const data = await getWards();
      setWards(data);
      setLastUpdated(new Date());

      // If no selected ward yet, select the first ward or one with high risk
      if (data.length > 0) {
        setSelectedWard((prev) => {
          if (!prev) return data[0];
          // Keep current selected ward updated with new summary info
          const updated = data.find((w) => w.id === prev.id || w.rawId === prev.rawId);
          return updated ? { ...prev, ...updated } : prev;
        });
      }
    } catch (err) {
      console.error("Error fetching wards:", err);
      setWardsError(err.message || "Could not connect to ward telemetry server.");
    } finally {
      setIsWardsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  // 2. Fetch Detailed Info & Time Series for Selected Ward
  const fetchSelectedWardDetails = useCallback(async (ward) => {
    if (!ward) return;
    setIsLoadingReadings(true);
    try {
      const numericId = ward.rawId || (typeof ward.id === 'string' ? parseInt(ward.id.replace(/\D/g, ''), 10) : ward.id);
      
      // Fetch full ward details & 72h time-series in parallel
      const [fullDetail, readingsChart] = await Promise.all([
        getWardDetail(numericId).catch(() => ward),
        getWardReadings(numericId, 72).catch(() => [])
      ]);

      setSelectedWard((prev) => {
        if (!prev || (prev.id !== ward.id && prev.rawId !== ward.rawId)) return prev;
        return {
          ...prev,
          ...fullDetail,
          timeSeries: readingsChart
        };
      });
    } catch (err) {
      console.error("Error loading ward details:", err);
    } finally {
      setIsLoadingReadings(false);
    }
  }, []);

  // 3. Fetch Alerts Log
  const fetchAlertsData = useCallback(async () => {
    setIsAlertsLoading(true);
    setAlertsError(null);
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setAlertsError(err.message || "Could not load alert history log.");
    } finally {
      setIsAlertsLoading(false);
    }
  }, []);

  // Initial Load, Auth Sync, Safe Zones, Polling & Real-time WebSockets
  useEffect(() => {
    fetchWardsData(false);
    fetchAlertsData();

    // Check user profile on launch
    getCurrentUserProfile()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('flood_flash_user', JSON.stringify(user));
        }
      })
      .catch(() => {
        // Token invalid or expired
        setCurrentUser(null);
        localStorage.removeItem('flood_flash_user');
      });

    // Fetch Safe Zones GIS data
    getSafeZones()
      .then(setSafeZones)
      .catch((err) => console.error("Could not load safe zones:", err));

    // Connect Real-Time WebSocket stream
    const unsubscribeWs = connectWebSocket(
      (wsEvent) => {
        setWsConnected(true);
        console.log("⚡ Real-Time WS Event:", wsEvent);
        if (wsEvent.event === 'risk_update' || wsEvent.event === 'alert_triggered') {
          const isAlert = wsEvent.event === 'alert_triggered';
          const icon = isAlert ? '🚨 DISASTER ALERT TRIGGERED' : '⚡ REAL-TIME RISK ELEVATION';
          setToastMessage(
            `${icon}: ${wsEvent.ward_name} is now ${wsEvent.risk_level.toUpperCase()} (Score: ${wsEvent.risk_score})`
          );
          setTimeout(() => setToastMessage(null), 8000);

          fetchWardsData(true);
          fetchAlertsData();
        } else if (wsEvent.event === 'incident_activated') {
          setToastMessage(`🚨 INCIDENT ACTIVATED: ${wsEvent.ward_name}. Relief portal is now LIVE.`);
          setTimeout(() => setToastMessage(null), 8000);
          fetchWardsData(true);
        } else if (wsEvent.event === 'relief_request_added') {
          setToastMessage(`🆘 NEW RELIEF REQUEST: ${wsEvent.ward_name} reported ${wsEvent.need_type.toUpperCase()} need (${wsEvent.urgency.toUpperCase()} urgency).`);
          setTimeout(() => setToastMessage(null), 6000);
        }
      },
      (err) => {
        setWsConnected(false);
      }
    );

    // Fallback Polling Interval (Every 30s)
    const interval = setInterval(() => {
      fetchWardsData(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      if (typeof unsubscribeWs === 'function') {
        unsubscribeWs();
      }
    };
  }, [fetchWardsData, fetchAlertsData]);

  // When selected ward changes, load its time-series readings
  useEffect(() => {
    if (selectedWard && (!selectedWard.timeSeries || selectedWard.timeSeries.length === 0)) {
      fetchSelectedWardDetails(selectedWard);
    }
  }, [selectedWard, fetchSelectedWardDetails]);

  // When active tab changes to 'alerts', refresh alert log
  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlertsData();
    }
  }, [activeTab, fetchAlertsData]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      
      if (e.key === 'Escape') {
        setIsTriggerModalOpen(false);
        setIsShortcutsOpen(false);
        setIsLoginModalOpen(false);
      } else if (e.key === '1' || e.key === 'm' || e.key === 'M') {
        setActiveTab('map');
      } else if (e.key === '2' || e.key === 'l' || e.key === 'L') {
        setActiveTab('alerts');
      } else if (e.key === '3' || e.key === 'r' || e.key === 'R') {
        setActiveTab('relief');
      } else if (e.key === '4' || e.key === 'h' || e.key === 'H') {
        setActiveTab('health');
      } else if (e.key === '?' || e.key === '/') {
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Logout
  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('flood_flash_user');
    setCurrentUser(null);
    setToastMessage('Logged out successfully.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Demo Trick: Live Simulation Trigger
  const handleSimulateSpike = async (wardId) => {
    try {
      const targetId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
      
      // Inject torrential rainfall simulation (240mm 72h rain, 88% soil moisture, 55mm 1h rate)
      const res = await simulateReading(targetId, {
        rainfall_1h_mm: 55.0,
        rainfall_24h_mm: 180.0,
        rainfall_72h_mm: 240.0,
        soil_moisture_pct: 88.0,
        slope_angle_deg: 40.0
      });

      // Immediately refetch wards & selected ward data (don't wait for polling cycle!)
      await fetchWardsData(true);
      if (selectedWard) {
        await fetchSelectedWardDetails(selectedWard);
      }
      await fetchAlertsData();

      // Show prominent operational toast
      const wardName = res.message ? res.message.split('recorded for ')[1]?.split('.')[0] : 'Ward';
      setToastMessage(
        `🚨 LIVE DEMO SPIKE EXECUTED: ${wardName} risk escalated to ${res.new_risk_level.toUpperCase()} (Score: ${res.risk_score})! Auto-alert triggered.`
      );
      setTimeout(() => setToastMessage(null), 7000);
    } catch (err) {
      console.error("Simulation spike failed:", err);
      setToastMessage(`Failed to execute simulation spike: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Handle PDF report generation & download
  const handleDownloadPdfReport = async (wardId) => {
    try {
      const numericId = typeof wardId === 'string' ? parseInt(wardId.replace(/\D/g, ''), 10) : wardId;
      const targetWard = selectedWard || wards.find((w) => w.rawId === numericId || w.id === wardId);
      const wardNameStr = targetWard ? targetWard.name.replace(/\s+/g, '_') : `Ward_${numericId}`;
      setToastMessage(`Generating PDF Incident Report for ${targetWard?.name || wardId}...`);
      await downloadWardPdfReport(numericId, `${wardNameStr}_Incident_Report.pdf`);
      setToastMessage(`✅ Report Downloaded: ${wardNameStr}_Incident_Report.pdf`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error("PDF Download error:", err);
      setToastMessage(`Failed to generate PDF report: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Handle emergency alert trigger attempt (with Auth check)
  const handleOpenTriggerAlertModal = () => {
    if (!currentUser) {
      setToastMessage('🔐 Official Authentication Required: Please log in as a District Official to trigger multi-channel alerts.');
      setIsLoginModalOpen(true);
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }
    if (currentUser.role !== 'district_official') {
      setToastMessage('🚫 Access Denied: Observer role has read-only access. Only District Officials can broadcast emergency alerts.');
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }
    setIsTriggerModalOpen(true);
  };

  // Handle emergency alert trigger confirmation
  const handleConfirmTrigger = async (dispatchData) => {
    await fetchAlertsData();
    const count = dispatchData.recipientsCount || 5;
    setToastMessage(
      `🚨 EMERGENCY DISASTER ALERT TRANSMITTED to ${count} recipient(s) in ${dispatchData.wardName} (WhatsApp + SMS)`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none ${highContrast ? 'bg-slate-950 text-white' : 'bg-[#0b1120] text-slate-100'}`}>
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        wsConnected={wsConnected}
      />

      {/* Summary Telemetry Strip */}
      <SummaryStrip
        wards={wards}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        highContrast={highContrast}
        lastUpdated={lastUpdated}
        isRefetching={isRefetching}
      />

      {/* Main Operational Body */}
      <main className="flex-1 flex min-h-0 relative overflow-hidden">
        {activeTab === 'map' && (
          <MapView
            wards={wards}
            selectedWard={selectedWard}
            onSelectWard={(ward) => {
              setSelectedWard(ward);
              fetchSelectedWardDetails(ward);
            }}
            activeFilter={activeFilter}
            highContrast={highContrast}
            isLoading={isWardsLoading}
            error={wardsError}
            onRetry={() => fetchWardsData(false)}
            onSimulateSpike={handleSimulateSpike}
            safeZones={safeZones}
          />
        )}

        {activeTab === 'alerts' && (
          <DisseminationLog
            alerts={alerts}
            isLoading={isAlertsLoading}
            error={alertsError}
            onRetry={fetchAlertsData}
            highContrast={highContrast}
          />
        )}

        {activeTab === 'relief' && (
          <ReliefRecoveryView
            wards={wards}
            selectedWard={selectedWard}
            onSelectWard={setSelectedWard}
            currentUser={currentUser}
            highContrast={highContrast}
            setToastMessage={setToastMessage}
          />
        )}

        {activeTab === 'health' && (
          <SystemHealth
            highContrast={highContrast}
          />
        )}


        {/* Slide-in Ward Detail Panel (Shown on Map view if ward selected) */}
        {activeTab === 'map' && selectedWard && (
          <WardDetailPanel
            ward={selectedWard}
            onClose={() => setSelectedWard(null)}
            onTriggerAlert={handleOpenTriggerAlertModal}
            onSimulateSpike={handleSimulateSpike}
            onDownloadPdf={handleDownloadPdfReport}
            isLoadingReadings={isLoadingReadings}
            highContrast={highContrast}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Role-Based Authentication Modal */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('flood_flash_user', JSON.stringify(user));
            setIsLoginModalOpen(false);
            setToastMessage(`Welcome back, ${user.name} (${user.role.toUpperCase()})`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* Emergency Trigger Dialog Modal */}
      {isTriggerModalOpen && selectedWard && (
        <TriggerAlertModal
          ward={selectedWard}
          onClose={() => setIsTriggerModalOpen(false)}
          onConfirmTrigger={handleConfirmTrigger}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}

      {/* Operational Broadcast Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 z-50 bg-red-950 border border-red-500 text-red-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 max-w-xl">
          <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold font-mono leading-tight">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

