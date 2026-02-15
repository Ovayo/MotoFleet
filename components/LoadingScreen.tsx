
import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isFast?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isFast = false }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = isFast 
    ? ["Updating Matrix...", "Syncing...", "Ready."] 
    : [
        "Initializing Fleet Telemetry...",
        "Verifying Asset Registry...",
        "Syncing Financial Ledgers...",
        "Securing Gateway Protocols...",
        "Optimizing Dashboard Modules..."
      ];

  useEffect(() => {
    const delay = isFast ? 150 : 450;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, delay);
    return () => clearInterval(interval);
  }, [isFast, messages.length]);

  return (
    <div className={`fixed inset-0 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center z-[9999] overflow-hidden transition-opacity duration-300 ${isFast ? 'animate-in fade-in duration-300' : ''}`}>
      {/* Background Ambient Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] pointer-events-none ${isFast ? 'w-[300px] h-[300px] bg-blue-600/5' : 'w-[500px] h-[500px] bg-blue-600/10'}`}></div>
      
      {/* Precision Grid Pattern */}
      {!isFast && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
      )}

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className={`relative mb-10 ${isFast ? 'w-16 h-16' : 'w-24 h-24'}`}>
          <div className="absolute inset-0 rounded-[2rem] border-4 border-blue-500/20 animate-pulse"></div>
          <div className={`absolute inset-0 rounded-[2rem] border-t-4 border-blue-500 animate-spin ${isFast ? 'duration-500' : 'duration-700'}`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 ${isFast ? 'w-10 h-10' : 'w-16 h-16'}`}>
              <span className={`text-white font-black tracking-tighter ${isFast ? 'text-lg' : 'text-2xl'}`}>MF</span>
            </div>
          </div>
        </div>

        {/* Brand Text */}
        {!isFast && (
          <div className="text-center space-y-2 mb-12">
            <h1 className="text-white text-2xl font-black uppercase tracking-widest">MotoFleet</h1>
            <p className="text-blue-400/40 text-[9px] font-black uppercase tracking-[0.4em]">Integrated Logistics Engine</p>
          </div>
        )}

        {/* Dynamic Loading Text */}
        <div className="h-6 flex items-center justify-center">
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
            {messages[messageIndex]}
          </p>
        </div>

        {/* High-Precision Progress Bar */}
        <div className="w-48 h-[2px] bg-white/5 rounded-full mt-6 overflow-hidden">
          <div className={`h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] ${isFast ? 'animate-progress-fast' : 'animate-progress'}`}></div>
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
        .animate-progress-fast {
          animation: progress 0.8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
