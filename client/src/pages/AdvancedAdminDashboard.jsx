import { useEffect, useState, useContext } from "react";
import KpiCard from "../components/dashboard/KpiCard";
import { AppContext } from "../context/AppContext";

export default function AdvancedAdminDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`${backendUrl}/api/dashboard/admin-finance`);
        if (data.success) setData(data);
      } catch (error) {
        console.error("AdvancedAdminDashboard fetch error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [backendUrl, api]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!data) return <div className="p-10 text-center text-gray-500">Failed to load system overview.</div>;

  const stats = data.stats || {};

  return (
    <div className="p-4 sm:p-6 space-y-8 container mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Advanced Admin Overiew</h1>
        <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard title="Gross Revenue" value={`KES ${stats.totalRevenue?.toLocaleString()}`} />
        <KpiCard title="Net Revenue" value={`KES ${stats.netRevenue?.toLocaleString()}`} />
        <KpiCard title="Refunded" value={`KES ${stats.refunded?.toLocaleString()}`} />
        <KpiCard title="Failed Payments" value={stats.failedPayments || 0} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-900">Recent System Invoices</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs uppercase text-gray-400 font-semibold bg-gray-50/30">
                        <th className="px-6 py-4">Invoice ID</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {(data.recentInvoices || []).map((inv) => (
                        <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono text-gray-500">#{inv._id.slice(-8)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">KES {inv.amount?.toLocaleString()}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                                    inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {inv.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold">View Details</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {(!data.recentInvoices || data.recentInvoices.length === 0) && (
            <div className="p-8 text-center text-gray-400 italic">No recent invoices recorded</div>
        )}
      </div>
    </div>
  );
}
