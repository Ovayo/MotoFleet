
import React, { useState, useEffect } from 'react';

const LoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Initializing Fleet Telemetry...",
    "Verifying Asset Registry...",
    "Syncing Financial Ledgers...",
    "Securing Gateway Protocols...",
    "Optimizing Dashboard Modules..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Precision Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="relative w-24 h-24 mb-10">
          <div className="absolute inset-0 rounded-[2rem] border-4 border-blue-500/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-[2rem] border-t-4 border-blue-500 animate-spin duration-700"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <span className="text-white text-2xl font-black tracking-tighter">MF</span>
            </div>
          </div>
        </div>

        {/* Brand Text */}
        <div className="text-center space-y-2 mb-12">
          <h1 className="text-white text-2xl font-black uppercase tracking-widest">MotoFleet</h1>
          <p className="text-blue-400/40 text-[9px] font-black uppercase tracking-[0.4em]">Integrated Logistics Engine</p>
        </div>

        {/* Dynamic Loading Text */}
        <div className="h-6 flex items-center justify-center">
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
            {messages[messageIndex]}
          </p>
        </div>

        {/* High-Precision Progress Bar */}
        <div className="w-48 h-[2px] bg-white/5 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-progress"></div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
