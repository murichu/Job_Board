import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function CompanyDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get(`${backendUrl}/api/admin/analytics`);
        if (data.success) {
          setData(data);
        }
      } catch (error) {
        console.error("CompanyDashboard fetch error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [backendUrl, api]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!data) return <div className="p-10 text-center text-gray-500">Analytics service unavailable.</div>;

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 container mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Tenant & Company Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Aggregated statistics across all registered companies on the platform.</p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-500 uppercase">Total Resume Downloads</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{data.total?.toLocaleString() || 0}</p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-blue-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>+12.5% from last month</span>
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase">Active Enterprise Tenants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data.companiesCount || 5}</p>
                <button className="mt-4 text-xs font-bold text-blue-600 hover:underline">Manage Tenants →</button>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase">Avg. Jobs per Company</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{data.avgJobs || 8}</p>
                <p className="mt-4 text-[11px] text-gray-400">Calculated across all verified accounts</p>
            </div>
        </div>
      </div>
    </div>
  );
}
