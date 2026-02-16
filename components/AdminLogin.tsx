
import React, { useState, useEffect } from 'react';

interface AdminLoginProps {
  onLogin: (passcode: string, fleetId: string, fleetName?: string) => boolean;
  onSuperAdminLogin: () => void;
  onSwitchRole?: (role: 'admin' | 'driver' | 'mechanic') => void;
}

interface RegisteredFleet {
  id: string;
  name: string;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onSuperAdminLogin, onSwitchRole }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [passcode, setPasscode] = useState('');
  const [fleetId, setFleetId] = useState('');
  const [fleetName, setFleetName] = useState('');
  const [trustEnvironment, setTrustEnvironment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [registry, setRegistry] = useState<RegisteredFleet[]>(() => {
    const saved = localStorage.getItem('motofleet_master_registry');
    return saved ? JSON.parse(saved) : [{ id: 'fleet_001', name: 'Demo Fleet' }];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Super Admin Backdoor
    if (passcode === 'superadmin2026') {
      if (trustEnvironment) {
        localStorage.setItem('mf_trusted_env', 'true');
      }
      onSuperAdminLogin();
      return;
    }

    if (mode === 'register') {
      const exists = registry.some(f => f.id.toLowerCase() === fleetId.toLowerCase());
      if (exists) {
        setError("Fleet ID already in use. Please choose another.");
        return;
      }
      
      const newFleet = { id: fleetId.toLowerCase().replace(/\s/g, '_'), name: fleetName };
      const newRegistry = [...registry, newFleet];
      setRegistry(newRegistry);
      localStorage.setItem('motofleet_master_registry', JSON.stringify(newRegistry));
      
      if (trustEnvironment) {
        localStorage.setItem('mf_trusted_env', 'true');
      }
      onLogin(passcode, newFleet.id, newFleet.name);
    } else {
      const fleet = registry.find(f => f.id.toLowerCase() === fleetId.toLowerCase());
      if (!fleet) {
        setError("Unknown Fleet ID. Register below if new.");
        return;
      }
      
      const success = onLogin(passcode, fleet.id, fleet.name);
      if (success) {
        if (trustEnvironment) {
          localStorage.setItem('mf_trusted_env', 'true');
        } else {
          localStorage.removeItem('mf_trusted_env');
        }
      } else {
        setError("Invalid Passcode. Access Denied.");
        setPasscode('');
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-950 flex flex-col items-center justify-start md:justify-center p-6 pt-12 md:pt-6 relative overflow-x-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 pb-8">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/40 border-4 border-blue-500/30 group hover:scale-110 transition-transform cursor-pointer">
            <span className="text-white text-3xl font-black tracking-tighter">MF</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">
            {mode === 'login' ? 'Fleet Terminal' : 'Fleet Onboarding'}
          </h1>
          <p className="text-blue-400/60 text-[10px] font-black uppercase tracking-[0.4em]">
            {mode === 'login' ? 'Secure Administrative Gateway' : 'Initialize New Logistics Node'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 md:p-10 rounded-[3.5rem] shadow-2xl border border-white/10 relative">
          {onSwitchRole && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-full flex justify-center">
              <div className="bg-gray-900 border border-white/10 rounded-full p-1 flex gap-1 shadow-2xl backdrop-blur-md">
                <button 
                  type="button"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg"
                >
                  Admin
                </button>
                <button 
                  type="button"
                  onClick={() => onSwitchRole('driver')}
                  className="text-gray-500 hover:text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors"
                >
                  Driver Hub
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {mode === 'register' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] ml-1">Business Name</label>
                <input
                  type="text"
                  value={fleetName}
                  onChange={(e) => setFleetName(e.target.value)}
                  placeholder="e.g. Rapid Moto Deliveries"
                  className="w-full px-6 py-4 bg-black/30 border border-white/10 rounded-2xl outline-none transition-all text-white placeholder:text-white/10 focus:border-blue-500/50 focus:bg-black/50 font-bold"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] ml-1">Fleet Identifier</label>
              <input
                type="text"
                value={fleetId}
                onChange={(e) => setFleetId(e.target.value)}
                placeholder="e.g. jhb_north_01"
                className="w-full px-6 py-4 bg-black/30 border border-white/10 rounded-2xl outline-none transition-all text-white placeholder:text-white/10 focus:border-blue-500/50 focus:bg-black/50 font-bold"
                required={mode === 'register'}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] ml-1">Master Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className={`w-full text-center text-2xl font-black tracking-[0.4em] py-5 bg-black/30 border-2 rounded-2xl outline-none transition-all text-white placeholder:text-white/10 ${
                  error ? 'border-red-500 bg-red-500/10' : 'border-white/10 focus:border-blue-500 focus:bg-black/50'
                }`}
                required
              />
            </div>

            <div className="flex items-center space-x-3 px-1">
              <input 
                type="checkbox" 
                id="trust-env"
                className="w-4 h-4 rounded border-white/10 bg-black/30 text-blue-600 focus:ring-blue-500/20"
                checked={trustEnvironment}
                onChange={(e) => setTrustEnvironment(e.target.checked)}
              />
              <label htmlFor="trust-env" className="text-[9px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Trust this work environment (Skip login next time)</label>
            </div>

            {error && (
              <p className="text-red-400 text-[10px] font-black text-center uppercase tracking-widest animate-pulse py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 uppercase text-[10px] tracking-[0.2em]"
            >
              {mode === 'login' ? 'Authorize Session' : 'Initialize Infrastructure'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-gray-400 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              {mode === 'login' ? 'New Fleet? Register Business' : 'Existing Fleet? Access Portal'}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
              MotoFleet Multi-Tenant Grid<br/>
              Cloud isolation active for all identifiers.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
