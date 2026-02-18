
import React, { useState, useRef, useMemo } from 'react';
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
  const [showRescueTerminal, setShowRescueTerminal] = useState(false);
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

  const handleLocalSync = (idToSync?: string) => {
    const targetId = idToSync || sourceFleetId;
    if (!targetId) return;
    
    const targetKeys = ['bikes', 'drivers', 'payments', 'maintenance', 'fines', 'accidents', 'workshops', 'notifications'];
    const recoveredPayload: any = {};
    let foundCount = 0;

    // Check various common naming patterns
    const prefixes = [`mf_v2_${targetId}_`, `fleet_${targetId}_`, `motofleet_`, ''];

    targetKeys.forEach(key => {
      for (const prefix of prefixes) {
        const siloKey = prefix.includes(targetId) || prefix === '' ? `${prefix}${key}` : null;
        if (!siloKey) continue;
        
        const saved = localStorage.getItem(siloKey);
        if (saved && saved !== '[]' && saved !== '{}' && saved !== 'null') {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              recoveredPayload[key] = parsed;
              foundCount++;
              break; // Found the best match for this key
            }
          } catch(e) {}
        }
      }
    });

    if (foundCount === 0) {
      alert(`Source Identifier "${targetId}" not found in current browser cache with any valid data.`);
      return;
    }

    const confirm = window.confirm(`Found ${foundCount} datasets associated with "${targetId}". Pull this data into current workspace (${fleetId})? This merges data.`);
    if (confirm) {
      if (recoveredPayload.bikes) setters.setBikes([...data.bikes, ...recoveredPayload.bikes.filter((b: any) => !data.bikes.find(ex => ex.id === b.id))]);
      if (recoveredPayload.drivers) setters.setDrivers([...data.drivers, ...recoveredPayload.drivers.filter((d: any) => !data.drivers.find(ex => ex.id === d.id))]);
      if (recoveredPayload.payments) setters.setPayments([...data.payments, ...recoveredPayload.payments.filter((p: any) => !data.payments.find(ex => ex.id === p.id))]);
      if (recoveredPayload.maintenance) setters.setMaintenance([...data.maintenance, ...recoveredPayload.maintenance.filter((m: any) => !data.maintenance.find(ex => ex.id === m.id))]);
      if (recoveredPayload.fines) setters.setFines([...data.fines, ...recoveredPayload.fines.filter((f: any) => !data.fines.find(ex => ex.id === f.id))]);
      if (recoveredPayload.accidents) setters.setAccidents([...data.accidents, ...recoveredPayload.accidents.filter((a: any) => !data.accidents.find(ex => ex.id === a.id))]);
      if (recoveredPayload.workshops) setters.setWorkshops([...data.workshops, ...recoveredPayload.workshops.filter((w: any) => !data.workshops.find(ex => ex.id === w.id))]);
      
      setSyncMessage(`Local Sync Complete: Migrated ${foundCount} datasets.`);
      setShowRescueTerminal(false);
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

  // Diagnostic: Find all keys that look like they belong to the app
  const legacyItems = useMemo(() => {
    const items: Record<string, { keys: string[], totalEntries: number }> = {};
    Object.keys(localStorage).forEach(key => {
      if (key.includes('moto') || key.includes('fleet') || key.includes('mf_')) {
        // Try to extract a fleet ID from keys like mf_v2_ID_bikes
        let owner = 'Global/Unsorted';
        if (key.startsWith('mf_v2_')) {
          owner = key.split('_')[2] || 'Unknown';
        } else if (key.startsWith('fleet_')) {
          owner = key.split('_')[1] || 'Unknown';
        }

        if (!items[owner]) items[owner] = { keys: [], totalEntries: 0 };
        items[owner].keys.push(key);
        
        try {
          const val = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(val)) items[owner].totalEntries += val.length;
        } catch(e) {}
      }
    });
    return Object.entries(items).filter(([id]) => id !== fleetId);
  }, [fleetId]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="bg-gray-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <span className="text-9xl">📡</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Fleet Core Terminal</h2>
              <p className="text-blue-400/60 text-[10px] font-black uppercase tracking-[0.4em]">High-Security Workspace Data Synchronization</p>
            </div>
            <button 
              onClick={() => setShowRescueTerminal(!showRescueTerminal)}
              className="bg-red-600/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
            >
              Rescue Orphaned Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

          {showRescueTerminal && (
            <div className="mt-8 p-8 bg-black/60 border border-red-500/30 rounded-[2.5rem] animate-in zoom-in duration-300">
               <h4 className="text-red-500 font-black uppercase text-xs tracking-widest mb-6 flex items-center">
                 <span className="mr-3">🚨</span> Deep Storage Recovery Terminal
               </h4>
               <p className="text-white/50 text-[10px] uppercase font-bold mb-8 leading-relaxed">
                 We detected existing MotoFleet data signatures from other workspaces or older versions in this browser. 
                 If your data is missing, it is likely stored under a different Fleet ID.
               </p>
               
               <div className="space-y-4">
                  {legacyItems.length === 0 ? (
                    <p className="text-center py-6 text-white/20 text-[10px] font-black uppercase tracking-widest italic">No orphaned data signatures found in this browser.</p>
                  ) : (
                    legacyItems.map(([id, info]) => (
                      <div key={id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-red-500/30 transition-all">
                        <div>
                          <p className="text-white font-black text-xs uppercase tracking-tight">{id}</p>
                          <p className="text-[9px] text-white/30 font-bold uppercase mt-0.5">{info.totalEntries} Total Records across {info.keys.length} silos</p>
                        </div>
                        <button 
                          onClick={() => handleLocalSync(id)}
                          className="px-6 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-red-500"
                        >
                          Restore & Merge
                        </button>
                      </div>
                    ))
                  )}
               </div>
               
               <div className="mt-8 pt-8 border-t border-white/5">
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-4">Manual Identifier Recovery</p>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Enter remembered Fleet ID..." 
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-red-500/50 transition-all"
                      value={sourceFleetId}
                      onChange={e => setSourceFleetId(e.target.value)}
                    />
                    <button 
                      onClick={() => handleLocalSync()}
                      className="bg-white text-gray-950 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
                    >
                      Attempt Rescue
                    </button>
                  </div>
               </div>
            </div>
          )}

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
