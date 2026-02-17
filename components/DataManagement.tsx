
import React, { useState, useRef } from 'react';
import { Bike, Driver, Payment, MaintenanceRecord, TrafficFine, AccidentReport, Workshop, AutomatedNotification } from '../types';

interface DataManagementProps {
  fleetId: string;
  fleetName: string;
  data: {
    bikes: Bike[];
    drivers: Driver[];
    payments: Payment[];
    maintenance: MaintenanceRecord[];
    fines: TrafficFine[];
    accidents: AccidentReport[];
    workshops: Workshop[];
    notifications: AutomatedNotification[];
  };
  setters: {
    setBikes: (data: Bike[]) => void;
    setDrivers: (data: Driver[]) => void;
    setPayments: (data: Payment[]) => void;
    setMaintenance: (data: MaintenanceRecord[]) => void;
    setFines: (data: TrafficFine[]) => void;
    setAccidents: (data: AccidentReport[]) => void;
    setWorkshops: (data: Workshop[]) => void;
    setNotifications: (data: AutomatedNotification[]) => void;
  };
}

const DataManagement: React.FC<DataManagementProps> = ({ fleetId, fleetName, data, setters }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [sourceFleetId, setSourceFleetId] = useState('');
  const [showMagicLink, setShowMagicLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTrusted = localStorage.getItem('mf_trusted_env') === 'true';

  const handleExport = () => {
    setIsExporting(true);
    const exportData = {
      version: "2.5",
      timestamp: new Date().toISOString(),
      fleetId,
      fleetName,
      payload: data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `motofleet_${fleetId}_${new Date().toISOString().split('T')[0]}.mfcore`;
    link.click();
    
    setTimeout(() => {
      setIsExporting(false);
      setSyncMessage("Asset Core Extracted Successfully.");
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.payload) throw new Error("Invalid Asset Core Format");
        
        const confirm = window.confirm(`DANGER: This will OVERWRITE your current ${fleetName} workspace with data from ${json.fleetName} (${json.fleetId}). Continue?`);
        
        if (confirm) {
          const p = json.payload;
          setters.setBikes(p.bikes || []);
          setters.setDrivers(p.drivers || []);
          setters.setPayments(p.payments || []);
          setters.setMaintenance(p.maintenance || []);
          setters.setFines(p.fines || []);
          setters.setAccidents(p.accidents || []);
          setters.setWorkshops(p.workshops || []);
          setters.setNotifications(p.notifications || []);
          
          setSyncMessage(`Core Injected: ${json.fleetId} data synced to ${fleetId}.`);
        }
      } catch (err) {
        alert("CRITICAL ERROR: Failed to parse Asset Core file. Schema mismatch.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleLocalSync = () => {
    if (!sourceFleetId) return;
    
    const targetKeys = ['bikes', 'drivers', 'payments', 'maintenance', 'fines', 'accidents', 'workshops', 'notifications'];
    const recoveredPayload: any = {};
    let foundCount = 0;

    targetKeys.forEach(key => {
      const siloKey = `mf_v2_${sourceFleetId}_${key}`;
      const saved = localStorage.getItem(siloKey);
      if (saved) {
        recoveredPayload[key] = JSON.parse(saved);
        foundCount++;
      }
    });

    if (foundCount === 0) {
      alert(`Source Fleet ID "${sourceFleetId}" not found in current browser cache.`);
      return;
    }

    const confirm = window.confirm(`Found ${foundCount} datasets for "${sourceFleetId}". Pull this data into current workspace?`);
    if (confirm) {
      setters.setBikes(recoveredPayload.bikes || []);
      setters.setDrivers(recoveredPayload.drivers || []);
      setters.setPayments(recoveredPayload.payments || []);
      setters.setMaintenance(recoveredPayload.maintenance || []);
      setters.setFines(recoveredPayload.fines || []);
      setters.setAccidents(recoveredPayload.accidents || []);
      setters.setWorkshops(recoveredPayload.workshops || []);
      setters.setNotifications(recoveredPayload.notifications || []);
      setSyncMessage(`Local Sync Complete: Data migrated from ${sourceFleetId}.`);
    }
  };

  const toggleTrustedEnv = () => {
    if (isTrusted) {
      localStorage.removeItem('mf_trusted_env');
    } else {
      localStorage.setItem('mf_trusted_env', 'true');
    }
    window.location.reload();
  };

  const generateMagicLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const magicUrl = `${baseUrl}?access_key=MF-WORK-ENV-2026`;
    navigator.clipboard.writeText(magicUrl);
    setShowMagicLink(true);
    setTimeout(() => setShowMagicLink(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="bg-gray-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <span className="text-9xl">📡</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Fleet Core Terminal</h2>
            <p className="text-blue-400/60 text-[10px] font-black uppercase tracking-[0.4em]">High-Security Workspace Data Synchronization</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Export Section */}
            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 hover:border-blue-500/30 transition-all group">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl mb-6 shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">📤</div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-3">Extract Live Core</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">
                Pack all current bikes, operators, and financial ledgers into a portable .mfcore snapshot.
              </p>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isExporting ? 'bg-white/10 text-white/40' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'}`}
              >
                {isExporting ? "Compiling Matrix..." : "Begin Extraction"}
              </button>
            </div>

            {/* Import Section */}
            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 hover:border-emerald-500/30 transition-all group">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-xl mb-6 shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">📥</div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-3">Inject Core Data</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">
                Restore data from a previously extracted .mfcore file. Warning: This overwrites current state.
              </p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".mfcore,.json" onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all"
              >
                {isImporting ? "Decoding Stream..." : "Initiate Injection"}
              </button>
            </div>
          </div>

          {/* Local Sync (Cross-Fleet) */}
          <div className="pt-10 border-t border-white/5">
            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-6 flex items-center">
              <span className="mr-3">🔄</span> Cross-Workspace Pull (Same Browser)
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Enter Source Fleet ID (e.g. live_fleet_01)" 
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all"
                value={sourceFleetId}
                onChange={e => setSourceFleetId(e.target.value)}
              />
              <button 
                onClick={handleLocalSync}
                className="bg-white text-gray-950 px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
              >
                Pull Data
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-2">
              <span className="text-2xl animate-pulse">✨</span>
              <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">{syncMessage}</p>
              <button onClick={() => setSyncMessage(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-600 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
        <div className="space-y-6">
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Authorized Terminals</h4>
           <div className={`p-8 rounded-[2.5rem] border transition-all ${isTrusted ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-100 border-gray-200'}`}>
             <div className="flex items-start space-x-5">
               <span className="text-3xl">{isTrusted ? '🖥️' : '🔒'}</span>
               <div>
                 <h4 className={`font-black uppercase text-xs tracking-tight mb-1 ${isTrusted ? 'text-emerald-800' : 'text-gray-800'}`}>
                   {isTrusted ? 'Recognized Work Environment' : 'Secure Admin Device'}
                 </h4>
                 <p className={`text-[9px] font-bold uppercase leading-relaxed mb-6 ${isTrusted ? 'text-emerald-700/60' : 'text-gray-500'}`}>
                   {isTrusted 
                    ? 'This browser is identified as a trusted work terminal. Passcode login is bypassed.' 
                    : 'Provision this device to bypass login prompts on your next visit.'}
                 </p>
                 <div className="flex flex-wrap gap-2">
                   <button 
                    onClick={toggleTrustedEnv}
                    className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all ${isTrusted ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-gray-900 text-white hover:bg-black'}`}
                   >
                     {isTrusted ? 'Revoke Device Certificate' : 'Authorize This Device'}
                   </button>
                   
                   <button 
                    onClick={generateMagicLink}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center"
                   >
                     {showMagicLink ? '✅ Link Copied' : '🔗 Magic Access Link'}
                   </button>
                 </div>
                 {showMagicLink && (
                   <p className="mt-4 text-[8px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Magic access link copied to clipboard. Use it once on your work PC to authorize it.</p>
                 )}
               </div>
             </div>
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Terminal Registry Stats</h4>
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Total Assets</span>
                <span className="text-gray-800 font-black">{data.bikes.length} Units</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Active Operators</span>
                <span className="text-gray-800 font-black">{data.drivers.length} personnel</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Ledger Entries</span>
                <span className="text-gray-800 font-black">{data.payments.length} transactions</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase pt-4 border-t border-gray-50 tracking-widest">
                <span>Workspace Identity</span>
                <span className="text-blue-600 font-black uppercase">{fleetId}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
