
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bike, Driver, Payment, MaintenanceRecord, TrafficFine, AccidentReport } from '../types';

interface FleetOracleProps {
  data: {
    bikes: Bike[];
    drivers: Driver[];
    payments: Payment[];
    maintenance: MaintenanceRecord[];
    fines: TrafficFine[];
    accidents: AccidentReport[];
  };
}

const FleetOracle: React.FC<FleetOracleProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response, isLoading]);

  const askOracle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are the "MotoFleet Oracle", a high-end logistics AI assistant. 
        Analyze the following fleet data and answer the user's question concisely.
        
        FLEET SUMMARY:
        - Total Bikes: ${data.bikes.length}
        - Total Drivers: ${data.drivers.length}
        - Total Fines: ${data.fines.length}
        - Total Accidents: ${data.accidents.length}
        - Total Revenue: R${data.payments.reduce((a, b) => a + b.amount, 0)}
        - Maintenance Spend: R${data.maintenance.reduce((a, b) => a + b.cost, 0)}
        
        SPECIFIC DATA (JSON):
        ${JSON.stringify({
          bikes: data.bikes.map(b => ({ id: b.id, model: b.makeModel, status: b.status })),
          drivers: data.drivers.map(d => ({ name: d.name, city: d.city, target: d.weeklyTarget })),
          recent_accidents: data.accidents.slice(-5).map(a => ({ date: a.date, loc: a.location })),
          recent_fines: data.fines.slice(-5).map(f => ({ amount: f.amount, status: f.status }))
        })}

        USER QUESTION: "${query}"
        
        Provide a professional, data-driven answer. Use South African Rand (R) for currency.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setResponse(result.text || "I'm unable to process that request at the moment.");
    } catch (err) {
      setResponse("Oracle link severed. Please check your system configuration.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all z-[100] border-4 border-white animate-bounce"
        title="Ask Fleet Oracle"
      >
        🔮
      </button>

      {/* Oracle Terminal Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-gray-950 w-full max-w-lg rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Fleet Oracle</h3>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mt-1">Gemini AI Intelligence</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white text-4xl leading-none">&times;</button>
            </div>

            <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto min-h-[300px] max-h-[500px] space-y-6 no-scrollbar">
              {!response && !isLoading ? (
                <div className="text-center py-10 space-y-4">
                  <div className="text-5xl opacity-20">📡</div>
                  <p className="text-white/40 text-[11px] font-black uppercase tracking-widest px-10">
                    "How much did we spend on repairs last month?" or "Who is my most reliable driver?"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl">
                    <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest mb-2">Inquiry</p>
                    <p className="text-white font-bold">{query}</p>
                  </div>
                  {isLoading ? (
                    <div className="flex items-center space-x-3 text-blue-500">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest ml-2">Consulting Data Matrix...</span>
                    </div>
                  ) : (
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 animate-in fade-in">
                      <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-3">Response</p>
                      <p className="text-white/90 text-sm leading-relaxed font-medium">
                        {response}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={askOracle} className="p-8 bg-black/40 border-t border-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ask the Oracle anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl font-black text-lg shadow-xl hover:bg-blue-500 transition-all disabled:opacity-30"
                >
                  🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FleetOracle;
