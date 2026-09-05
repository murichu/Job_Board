import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";
import { Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentTimeline() {
  const { api, backendUrl, token } = useContext(AppContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`${backendUrl}/api/admin/reconciliation`);
        if (data.success) {
          setEvents(data.data || []);
        }
      } catch (error) {
        console.error("PaymentTimeline error:", error);
        toast.error(error.response?.data?.message || "Failed to load payment timeline.");
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [api, backendUrl, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700">
      {/* Header */}
      <div>
        <Link to="/billing" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment Timeline</h1>
        <p className="text-gray-500 mt-1">Audit log of transaction states and reconciliation events.</p>
      </div>

      {/* Timeline List */}
      <div className="relative">
        <div className="absolute left-4.75 top-4 bottom-4 w-0.5 bg-gray-100"></div>
        
        {events.length > 0 ? (
          <div className="space-y-8">
            {events.map((e, idx) => (
              <div key={e._id} className="relative pl-12 group">
                {/* Node */}
                <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${
                  e.status === 'reconciled' || e.status === 'completed' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-amber-400 text-white'
                }`}>
                  {e.status === 'reconciled' || e.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>

                {/* Content */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(e.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      e.status === 'reconciled' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {e.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Transaction {e.transactionId || 'RECON-'+e._id.slice(-6).toUpperCase()}
                  </h3>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-2xl font-black text-gray-900">KES {e.amount?.toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <AlertCircle className="w-3 h-3" />
                      Verified by System
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
            <p className="text-gray-500 font-medium">No timeline events recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
