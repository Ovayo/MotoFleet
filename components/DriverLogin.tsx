
import React, { useState } from 'react';

interface DriverLoginProps {
  onLogin: (contact: string) => boolean;
}

const DriverLogin: React.FC<DriverLoginProps> = ({ onLogin }) => {
  const [contact, setContact] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(contact);
    if (!success) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Refractive elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-500/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-md w-full">
        <div className="text-center mb-14">
          <div className="bg-green-600 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-200 border-4 border-white transition-transform hover:scale-110 duration-500 cursor-pointer">
            <span className="text-white text-3xl font-black tracking-tighter">MF</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter uppercase">Operator Portfolio</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">Secure Identity Verification</p>
        </div>

        <div className="bg-white/70 backdrop-blur-3xl p-10 md:p-12 rounded-[4rem] shadow-2xl border border-white/60">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4 text-center">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered Contact Link</label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="000 000 0000"
                className={`w-full text-center text-3xl font-black tracking-[0.2em] py-6 bg-gray-50/50 border-none rounded-[2rem] outline-none transition-all shadow-inner placeholder:text-gray-200 ${
                  error ? 'text-red-500' : 'text-gray-900 focus:bg-white'
                }`}
                required
              />
              {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Identifier not found in registry
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-green-100 transition-all transform active:scale-95 uppercase text-[11px] tracking-[0.2em]"
            >
              Authorize Secure Link
            </button>
          </form>
        </div>
        
        <p className="text-center mt-12 text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] px-10 leading-relaxed">
          Access protected by MotoFleet Cloud Architecture.<br/>
          Contact Fleet Command for recovery.
        </p>
      </div>
    </div>
  );
};

export default DriverLogin;
