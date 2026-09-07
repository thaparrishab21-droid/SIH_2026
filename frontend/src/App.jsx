import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import IdentityAuthModal from './components/IdentityAuthModal';
import LiveAlertsSafetyView from './components/LiveAlertsSafetyView';
import VerifiedSheltersView from './components/VerifiedSheltersView';
import ReliefCharityView from './components/ReliefCharityView';
import EmergencyNumbersView from './components/EmergencyNumbersView';
import RequestDisasterHelpModal from './components/RequestDisasterHelpModal';
import { CheckCircle2, AlertOctagon, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'shelters' | 'charity' | 'emergency'
  
  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('flood_flash_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [helpModal, setHelpModal] = useState({ open: false, type: 'pump' });
  const [toastMessage, setToastMessage] = useState(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('flood_flash_user', JSON.stringify(user));
    showToast(`Welcome, ${user.full_name || user.username}! Identity verified.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('flood_flash_user');
    showToast('Logged out of Citizen Profile.');
  };

  const handleRequestSuccess = (ticket) => {
    showToast(`Dispatch Ticket ${ticket.id} generated! Team dispatched.`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-950 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-800 flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Dynamic Tab Body */}
      <main className="flex-1 pb-12">
        {activeTab === 'alerts' && (
          <LiveAlertsSafetyView
            onNavigateTab={setActiveTab}
            onOpenReportModal={() => setHelpModal({ open: true, type: 'pump' })}
          />
        )}

        {activeTab === 'shelters' && (
          <VerifiedSheltersView
            onOpenShuttleModal={() => setHelpModal({ open: true, type: 'shuttle' })}
          />
        )}

        {activeTab === 'charity' && (
          <ReliefCharityView />
        )}

        {activeTab === 'emergency' && (
          <EmergencyNumbersView />
        )}
      </main>

      {/* Modals */}
      <IdentityAuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <RequestDisasterHelpModal
        isOpen={helpModal.open}
        type={helpModal.type}
        onClose={() => setHelpModal({ open: false, type: 'pump' })}
        onSubmitSuccess={handleRequestSuccess}
      />

    </div>
  );
}
