import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";

const SEVERITY = {
  critical: { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", border: "border-l-red-500" },
  high: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500", border: "border-l-orange-500" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-400", border: "border-l-amber-400" },
  low: { label: "Low", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400", border: "border-l-blue-400" },
};

export default function IncidentDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [form, setForm] = useState({ title: "", message: "", severity: "medium", affectedService: "" });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${backendUrl}/api/incidents`);
      if (data.success) setIncidents(data.incidents || []);
    } catch (err) {
      console.error("IncidentDashboard fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [backendUrl, api]);

  const handleCreate = async () => {
    if (!form.title || !form.message) return toast.error("Title and message are required.");
    try {
      const { data } = await api.post(`${backendUrl}/api/incidents`, form);
      if (data.success) {
        toast.success("Incident created successfully");
        setShowModal(false);
        setForm({ title: "", message: "", severity: "medium", affectedService: "" });
        fetchIncidents();
      } else {
        toast.error(data.message || "Failed to create incident");
      }
    } catch (err) {
      toast.error("Failed to create incident");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const { data } = await api.patch(`${backendUrl}/api/incidents/${id}`, { status: newStatus });
      if (data.success) {
        toast.success(`Incident marked as ${newStatus}`);
        fetchIncidents();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      toast.error("Failed to update incident");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = incidents.filter(i => filterStatus === "all" || i.status === filterStatus);
  const active = incidents.filter(i => i.status !== "resolved").length;
  const resolved = incidents.filter(i => i.status === "resolved").length;

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
            <p className="text-gray-500 text-sm mt-1">Track and respond to platform service disruptions.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Incident
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: incidents.length, color: "gray" },
            { label: "Active", value: active, color: "amber" },
            { label: "Resolved", value: resolved, color: "green" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase">{s.label}</p>
              <p className={`text-3xl font-black mt-1 text-${s.color}-600`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "investigating", "monitoring", "resolved"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                filterStatus === status
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Incident List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(i => {
              const sev = SEVERITY[i.severity] || SEVERITY.medium;
              return (
                <div key={i._id} className={`p-5 rounded-2xl border-l-4 shadow-sm bg-white border-t border-r border-b border-gray-100 ${sev.border}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`}></div>
                        <h3 className="font-bold text-gray-900">{i.title}</h3>
                        {i.affectedService && (
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">{i.affectedService}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 ml-4">{new Date(i.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${sev.color}`}>{i.severity || "medium"}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        i.status === "resolved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>{i.status}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed ml-4">{i.message}</p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3">
                    {i.status !== "resolved" && (
                      <>
                        <button
                          disabled={updatingId === i._id}
                          onClick={() => handleUpdateStatus(i._id, "monitoring")}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-40"
                        >
                          Mark Monitoring
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          disabled={updatingId === i._id}
                          onClick={() => handleUpdateStatus(i._id, "resolved")}
                          className="text-xs font-bold text-green-600 hover:text-green-800 disabled:opacity-40"
                        >
                          Mark Resolved
                        </button>
                        <span className="text-gray-200">|</span>
                      </>
                    )}
                    <button className="text-xs font-bold text-gray-400 hover:text-gray-600">Archive</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">All systems green. No active incidents.</p>
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create New Incident</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Incident Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Payment Gateway Outage"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Affected Service</label>
                  <input
                    value={form.affectedService}
                    onChange={e => setForm(f => ({ ...f, affectedService: e.target.value }))}
                    placeholder="e.g. Billing API"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={4}
                  placeholder="Describe the incident in detail..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreate} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                  Create Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
