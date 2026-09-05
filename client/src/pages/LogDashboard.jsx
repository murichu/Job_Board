import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function LogDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get(`${backendUrl}/api/logs/logs`);
        if (data.success) {
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error("LogDashboard fetch error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [backendUrl, api]);

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time stream of server-side events and access logs.</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors">
                Clear Console
            </button>
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors">
                Pause Stream
            </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 border-b border-gray-800">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Terminal Output</span>
        </div>
        <div className="p-4 sm:p-6 space-y-2 overflow-y-auto max-h-[70vh] min-h-[40vh] font-mono text-[11px] sm:text-xs custom-scrollbar bg-[#0d1117]">
            {loading ? (
                <div className="text-gray-500 animate-pulse">Establishing secure connection to log stream...</div>
            ) : logs.length > 0 ? logs.map((l, i) => (
                <div key={i} className="flex gap-3 py-1 group">
                    <span className="text-gray-600 shrink-0 select-none">[{new Date(l.timestamp || Date.now()).toLocaleTimeString()}]</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] h-fit uppercase font-bold shrink-0 ${
                        l.level === 'error' ? 'bg-red-950 text-red-400' : 
                        l.level === 'warn' ? 'bg-amber-950 text-amber-400' : 
                        'bg-blue-950 text-blue-400'
                    }`}>
                        {l.level || 'info'}
                    </span>
                    <div className="text-gray-300 break-all whitespace-pre-wrap leading-relaxed">
                        <span className="text-blue-400 font-bold">{l.source || 'server'}: </span>
                        {typeof l.message === 'string' ? l.message : JSON.stringify(l)}
                    </div>
                </div>
            )) : (
                <div className="text-gray-600 italic">No logs available in the current buffer.</div>
            )}
        </div>
      </div>
    </div>
  );
}
