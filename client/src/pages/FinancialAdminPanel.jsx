import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function FinancialAdminPanel() {
  const { backendUrl, api } = useContext(AppContext);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`${backendUrl}/api/refund`);
      if (data.success) {
        setRefunds(data.requests || []);
      }
    } catch (error) {
      console.error("FinancialAdminPanel fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [backendUrl, api]);

  const updateStatus = async (id, action) => {
    try {
      const { data } = await api.patch(`${backendUrl}/api/refund/${id}/${action}`);
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error("UpdateStatus error:", error.message);
    }
  };

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 container mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Refund Review Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Approve or reject financial refund requests from users.</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending Review</span>
                <p className="text-xl font-bold text-amber-700">
                    {refunds.filter(r => r.status === 'pending_review').length}
                </p>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : refunds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {refunds.map(r => (
            <div key={r._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Requester</p>
                    <p className="font-bold text-gray-900 truncate">{r.userId?.name || 'Anonymous'}</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.userId?.email || 'No email provided'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    r.status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
                    r.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    r.status === 'processed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                    {r.status?.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-y border-gray-50">
                    <span className="text-sm text-gray-500">Refund Amount</span>
                    <span className="text-lg font-black text-gray-900">KES {r.amount?.toLocaleString()}</span>
                </div>
                
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Reason</p>
                    <p className="text-sm text-gray-600 line-clamp-3 italic">"{r.reason || 'No reason provided.'}"</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {r.status === "pending_review" && (
                  <>
                    <button 
                        onClick={() => updateStatus(r._id, "approve")} 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                        Approve
                    </button>
                    <button 
                        onClick={() => updateStatus(r._id, "reject")} 
                        className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                        Reject
                    </button>
                  </>
                )}

                {r.status === "approved" && (
                  <button 
                    onClick={() => updateStatus(r._id, "mark-processed")} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Mark as Processed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <p className="text-gray-500">No refund requests found.</p>
        </div>
      )}
    </div>
  );
}
