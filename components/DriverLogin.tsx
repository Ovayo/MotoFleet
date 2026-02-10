
import React, { useState } from 'react';

interface DriverLoginProps {
  onLogin: (contact: string) => boolean;
  onBackToAdmin: () => void;
}

const DriverLogin: React.FC<DriverLoginProps> = ({ onLogin, onBackToAdmin }) => {
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white text-3xl font-bold">MF</span>
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">Driver Portal</h1>
          <p className="text-gray-500">Access your portfolio using your registered contact number.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Number</label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="071 234 5678"
                className={`w-full text-center text-2xl font-black tracking-widest py-4 bg-gray-50 border-2 rounded-2xl outline-none transition-all ${
                  error ? 'border-red-500 bg-red-50' : 'border-gray-100 focus:border-green-500 focus:bg-white'
                }`}
                required
              />
              {error && (
                <p className="text-red-500 text-xs font-bold text-center mt-2 animate-bounce">
                  Number not found. Check and try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 transition-all transform active:scale-95"
            >
              Access My Portfolio
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-50 pt-6">
            <button 
              onClick={onBackToAdmin}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              ← Back to Admin Login
            </button>
          </div>
        </div>
        
        <p className="text-center mt-8 text-gray-400 text-xs">
          Having trouble? Contact your fleet administrator.
        </p>
      </div>
    </div>
  );
};

export default DriverLogin;
