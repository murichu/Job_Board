import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function Reconciliation() {
  const { backendUrl, api } = useContext(AppContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReconciliation = async () => {
      try {
        const { data } = await api.get(`${backendUrl}/api/admin/reconciliation`);
        if (data.success) {
          setItems(data.data || []);
        }
      } catch (error) {
        console.error("Reconciliation fetch error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReconciliation();
  }, [backendUrl, api]);

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 container mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reconciliation</h1>
            <p className="text-gray-500 text-sm mt-1">Cross-reference payment records with gateway status updates.</p>
        </div>
        <button className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Verification</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map(i => (
                            <tr key={i._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-mono text-gray-500">#{i._id.slice(-8)}</td>
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    KES {i.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        i.status === 'completed' || i.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {i.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {new Date(i.createdAt || Date.now()).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Match
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <p className="text-gray-500 italic">No items pending reconciliation.</p>
        </div>
      )}
    </div>
  );
}
