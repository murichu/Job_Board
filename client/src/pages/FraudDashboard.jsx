import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";

const RISK_LEVELS = {
  high: { label: "High Risk", color: "bg-red-100 text-red-700 border border-red-200", dot: "bg-red-500" },
  medium: { label: "Medium Risk", color: "bg-amber-100 text-amber-700 border border-amber-200", dot: "bg-amber-500" },
  low: { label: "Low Risk", color: "bg-yellow-100 text-yellow-700 border border-yellow-200", dot: "bg-yellow-400" },
};

export default function FraudDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewModal, setReviewModal] = useState(null); // selected transaction
  const [updatingId, setUpdatingId] = useState(null);

  const fetchFraudData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${backendUrl}/api/admin/fraud`);
      if (data.success) setData(data.payments || []);
    } catch (err) {
      console.error("FraudDashboard fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFraudData(); }, [backendUrl, api]);

  const handleFlag = async (id, action) => {
    setUpdatingId(id);
    try {
      const { data: res } = await api.patch(`${backendUrl}/api/admin/fraud/${id}/${action}`);
      if (res.success) {
        toast.success(`Transaction ${action === "clear" ? "cleared" : "escalated"} successfully`);
        fetchFraudData();
        setReviewModal(null);
      } else {
        toast.error(res.message || "Action failed");
      }
    } catch (err) {
      toast.error("Action failed — check API response");
    } finally {
      setUpdatingId(null);
    }
  };

  const getRisk = (p) => {
    if (p.resultCode && p.resultCode !== "0") return "high";
    if (!p.mpesaReceiptNumber) return "medium";
    return "low";
  };

  const filtered = data
    .map(p => ({ ...p, _risk: getRisk(p) }))
    .filter(p => {
      const matchesRisk = filterRisk === "all" || p._risk === filterRisk;
      const matchesSearch = (p.phone || "").includes(searchTerm) || (p.fraudReason || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRisk && matchesSearch;
    });

  const highCount = data.filter(p => getRisk(p) === "high").length;
  const medCount = data.filter(p => getRisk(p) === "medium").length;

  const exportCSV = () => {
    const headers = ["Phone", "Amount", "Fraud Reason", "Status", "Date"];
    const rows = data.map(p => [
      p.phone || "",
      p.amount || "",
      p.fraudReason || "",
      p.status || "",
      new Date(p.createdAt || Date.now()).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fraud Prevention Center</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor, review, and action suspicious billing activities.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Flagged", value: data.length, color: "gray" },
            { label: "High Risk", value: highCount, color: "red" },
            { label: "Medium Risk", value: medCount, color: "amber" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase">{s.label}</p>
              <p className={`text-3xl font-black mt-1 text-${s.color}-600`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by phone or reason..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2">
            {["all", "high", "medium", "low"].map(risk => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  filterRisk === risk ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Risk Level</th>
                    <th className="px-6 py-4">Transaction Source</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Reason for Flag</th>
                    <th className="px-6 py-4">Detected</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(p => {
                    const risk = RISK_LEVELS[p._risk] || RISK_LEVELS.low;
                    return (
                      <tr key={p._id} className="hover:bg-red-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${risk.dot}`}></div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${risk.color}`}>{risk.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.phone || "Unknown"}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {p.amount ? `KES ${p.amount.toLocaleString()}` : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate">
                          "{p.fraudReason || "Suspicious pattern"}"
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {new Date(p.createdAt || Date.now()).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setReviewModal(p)}
                            className="px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">System Secure</h3>
            <p className="text-gray-500 mt-1">No flagged transactions match the current filters.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-xl">🛡️</span> Transaction Review
              </h2>
              <button onClick={() => setReviewModal(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Phone Number", value: reviewModal.phone },
                { label: "Amount", value: reviewModal.amount ? `KES ${reviewModal.amount.toLocaleString()}` : "N/A" },
                { label: "M-Pesa Receipt", value: reviewModal.mpesaReceiptNumber || "Not available" },
                { label: "Result Code", value: reviewModal.resultCode || "N/A" },
                { label: "Result Description", value: reviewModal.resultDesc || "N/A" },
                { label: "Fraud Reason", value: reviewModal.fraudReason || "Suspicious activity pattern" },
                { label: "Date", value: new Date(reviewModal.createdAt || Date.now()).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
                  <span className="text-sm text-gray-800 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                disabled={updatingId === reviewModal._id}
                onClick={() => handleFlag(reviewModal._id, "clear")}
                className="flex-1 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Clear — Not Fraud
              </button>
              <button
                disabled={updatingId === reviewModal._id}
                onClick={() => handleFlag(reviewModal._id, "escalate")}
                className="flex-1 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
