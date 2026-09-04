import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthorityDashboard from './pages/AuthorityDashboard';
import CitizenDashboard from './pages/CitizenDashboard';
import ModelInfoPage from './pages/ModelInfoPage';
import AdminDashboard from './pages/AdminDashboard';
import { getSimulationStatus, stepSimulation, resetSimulation } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('authority');
  const [simStatus, setSimStatus] = useState(null);

  const fetchSim = async () => {
    try {
      const res = await getSimulationStatus();
      setSimStatus(res);
    } catch (err) {
      console.error("Error fetching simulation status:", err);
    }
  };

  useEffect(() => {
    fetchSim();
  }, []);

  const handleStepSim = async (stepNumber = null) => {
    try {
      const res = await stepSimulation(stepNumber);
      setSimStatus(res);
    } catch (err) {
      console.error("Error stepping simulation:", err);
    }
  };

  const handleResetSim = async () => {
    try {
      const res = await resetSimulation();
      setSimStatus(res);
    } catch (err) {
      console.error("Error resetting simulation:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Command Center Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        simStatus={simStatus}
        onStepSim={handleStepSim}
        onResetSim={handleResetSim}
      />

      {/* Main Page View Router */}
      <main className="flex-1">
        {activeTab === 'authority' && (
          <AuthorityDashboard
            simStatus={simStatus}
            onStepSim={handleStepSim}
            onResetSim={handleResetSim}
          />
        )}

        {activeTab === 'citizen' && (
          <CitizenDashboard simStatus={simStatus} />
        )}

        {activeTab === 'model' && (
          <ModelInfoPage />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 AI-Powered Flash Flood & Landslide Early Warning System (SIH Software Project)</p>
          <p className="text-cyan-400 font-medium">100% Software System | No Hardware Required</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
