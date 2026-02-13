
import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: (passcode: string) => boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(passcode);
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      setPasscode('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns for a technical/secure feel */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3B82F6 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 border-4 border-blue-500/30">
            <span className="text-white text-3xl font-black tracking-tighter">MF</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Fleet Control</h1>
          <p className="text-blue-400/60 text-xs font-black uppercase tracking-[0.3em]">Administrative Gateway</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] text-center">Enter Administrative Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className={`w-full text-center text-3xl font-black tracking-[0.5em] py-5 bg-black/20 border-2 rounded-2xl outline-none transition-all text-white placeholder:text-white/10 ${
                  error ? 'border-red-500 bg-red-500/10' : 'border-white/10 focus:border-blue-500 focus:bg-black/40'
                }`}
                required
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-[10px] font-black text-center uppercase tracking-widest animate-pulse">
                  Invalid Credentials. Access Denied.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 uppercase text-xs tracking-[0.2em]"
            >
              Authorize Access
            </button>
          </form>
        </div>
        
        <div className="mt-12 text-center">
            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
              Protected by MotoFleet Security Protocols<br/>
              Unauthorized access is strictly prohibited.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
