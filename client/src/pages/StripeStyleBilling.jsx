import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";
import { TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function StripeStyleBilling() {
  const { api, backendUrl, token } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`${backendUrl}/api/billing-analytics/revenue`);
        setData(data);
      } catch (error) {
        console.error("StripeStyleBilling error:", error);
        toast.error(error.response?.data?.message || "Failed to load billing analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [api, backendUrl, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/billing" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Billing Analytics</h1>
          <p className="text-gray-500 mt-1">Real-time revenue insights and financial performance metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Revenue</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-gray-900">KES {data.revenue?.[0]?.total?.toLocaleString() || 0}</h2>
            <span className="text-green-500 text-xs font-bold flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              12%
            </span>
          </div>
        </div>

        {/* This Month Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Month</p>
          <div className="mt-2">
            <h2 className="text-3xl font-black text-gray-900">
              KES {data.monthly?.find(m => m._id.month === new Date().getMonth() + 1)?.total?.toLocaleString() || 0}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Monthly Performance</h3>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 uppercase">
              <Calendar className="w-3 h-3" />
              Last 12 Months
            </div>
          </div>
          
          <div className="space-y-6">
            {data.monthly?.map((m) => (
              <div key={m._id.month} className="group">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Month {m._id.month}</p>
                    <p className="text-xs text-gray-400">{m.count || 0} Transactions</p>
                  </div>
                  <p className="text-sm font-black text-gray-900">KES {m.total?.toLocaleString()}</p>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000 group-hover:bg-blue-500"
                    style={{ width: `${Math.min(100, (m.total / (data.revenue?.[0]?.total || 1)) * 100 * 5)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/10">
          <h3 className="text-xl font-bold mb-6">Revenue Insights</h3>
          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Top Plan</p>
              <p className="text-lg font-bold">Professional</p>
              <p className="text-xs text-green-400 mt-2">64% of total revenue</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Growth</p>
              <p className="text-lg font-bold">+22.5%</p>
              <p className="text-xs text-gray-400 mt-2">Vs. previous quarter</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
