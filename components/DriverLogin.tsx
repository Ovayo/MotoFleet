
import React, { useState } from 'react';

interface DriverLoginProps {
  onLogin: (contact: string) => boolean;
  onSwitchRole?: (role: 'admin' | 'driver' | 'mechanic') => void;
}

const DriverLogin: React.FC<DriverLoginProps> = ({ onLogin, onSwitchRole }) => {
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
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10B981 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white text-3xl font-bold">MF</span>
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2 tracking-tight uppercase">Driver Portal</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Access your portfolio using your terminal contact</p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-gray-100 relative">
          {onSwitchRole && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex justify-center">
              <div className="bg-white border border-gray-100 rounded-full p-1 flex gap-1 shadow-xl">
                <button 
                  type="button"
                  onClick={() => onSwitchRole('admin')}
                  className="text-gray-400 hover:text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors"
                >
                  Admin Terminal
                </button>
                <button 
                  type="button"
                  className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg"
                >
                  Driver Hub
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 text-center">Identity Verification</label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="071 234 5678"
                className={`w-full text-center text-2xl font-black tracking-widest py-5 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${
                  error ? 'border-red-500 bg-red-50' : 'border-gray-50 focus:border-emerald-500 focus:bg-white'
                }`}
                required
              />
              {error && (
                <p className="text-red-500 text-[10px] font-black text-center mt-3 uppercase tracking-widest animate-bounce">
                  Terminal ID not found. Verify with Fleet Admin.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-200 transition-all transform active:scale-95 uppercase text-[10px] tracking-[0.2em]"
            >
              Access My Hub
            </button>
          </form>
        </div>
        
        <p className="text-center mt-12 text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em]">
          Secure Gateway Protocol v2.5<br/>
          Integrated Cloud Logistics System
        </p>
      </div>
    </div>
  );
};

export default DriverLogin;
