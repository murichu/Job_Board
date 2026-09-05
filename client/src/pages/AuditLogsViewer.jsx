import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function AuditLogsViewer() {
  const { backendUrl, api } = useContext(AppContext);
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { q, action, from, to, page, limit };
      const { data } = await api.get(`${backendUrl}/api/admin/audit-logs`, { params });
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("fetchLogs error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const timer = setTimeout(() => {
        fetchLogs();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [q, action, from, to, page, backendUrl, api]);

  const exportCSV = () => {
    const headers = ["Date", "User", "Action", "IP", "Details"];
    const rows = logs.map(l => [
      new Date(l.createdAt).toISOString(),
      l.userId?.email || l.userId?.name || "",
      l.action,
      l.ip || "",
      JSON.stringify(l.metadata || {})
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-w-0 bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Compliance & Security</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">Audit Logs</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Review and monitor all administrative actions across the platform.</p>
          </div>
          <button 
            type="button" 
            onClick={exportCSV} 
            className="shrink-0 rounded-xl bg-gray-900 hover:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Search</label>
                <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Email, name or action..." className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
            </div>
            <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Action Type</label>
                <select value={action} onChange={(e)=>setAction(e.target.value)} className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer">
                    <option value="all">All Actions</option>
                    <option value="REFUND_APPROVED">Refund Approved</option>
                    <option value="REFUND_REJECTED">Refund Rejected</option>
                    <option value="LOGIN">Login Activity</option>
                    <option value="INVITE_SENT">Team Invites</option>
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">From Date</label>
                <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
            </div>
            <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">To Date</label>
                <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Loading logs...</td></tr>
                ) : logs.length > 0 ? logs.map(l => (
                  <tr key={l._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{l.userId?.email || l.userId?.name || 'System'}</td>
                    <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{l.action}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{l.ip || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs truncate max-w-xs">{JSON.stringify(l.metadata || {})}</td>
                  </tr>
                )) : (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">No logs found matching your criteria</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <button 
            disabled={page<=1 || loading} 
            onClick={()=>setPage(p=>p-1)} 
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <p className="text-xs font-bold text-gray-400 uppercase">Page {page} of {totalPages}</p>
          <button 
            disabled={page>=totalPages || loading} 
            onClick={()=>setPage(p=>p+1)} 
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
