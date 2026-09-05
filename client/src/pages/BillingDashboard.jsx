import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";
import { CreditCard, History, Zap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function BillingDashboard() {
  const { api, backendUrl, token } = useContext(AppContext);
  const [sub, setSub] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [subRes, invRes] = await Promise.all([
          api.get(`${backendUrl}/api/billing/subscription`),
          api.get(`${backendUrl}/api/billing/invoices`)
        ]);
        
        if (subRes.data.success) setSub(subRes.data.sub);
        if (invRes.data.success) setInvoices(invRes.data.invoices || []);
      } catch (error) {
        console.error("BillingDashboard error:", error);
        toast.error(error.response?.data?.message || "Failed to load billing data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api, backendUrl, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-gray-200 mx-4 my-8">
        <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">No active subscription</h2>
        <p className="text-gray-500 mt-2 mb-6">Unlock premium features by subscribing to a plan.</p>
        <Link to="/billing/subscription" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all">
          View Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Billing</h1>
          <p className="text-gray-500 mt-1">Manage your subscription, invoices, and payment methods.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/billing/history" className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <History className="w-4 h-4" />
            History
          </Link>
          <Link to="/billing/subscription" className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-100">
            <Zap className="w-4 h-4" />
            Upgrade
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subscription Overview */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <CreditCard className="w-32 h-32 text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
                Active Plan
              </span>
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                sub.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {sub.status}
              </span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">{sub.plan}</h2>
            <p className="text-gray-500">Next billing date: <span className="font-bold text-gray-900">{new Date(sub.nextInvoiceAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span></p>
            
            <div className="mt-8 pt-8 border-t border-gray-50 flex flex-wrap gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</p>
                <p className="text-xl font-bold text-gray-900">KES {sub.amount?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Billing Cycle</p>
                <p className="text-xl font-bold text-gray-900">Monthly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl shadow-blue-900/10">
          <div>
            <h3 className="text-lg font-bold mb-4">Account Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Job Posts</span>
                  <span className="font-bold">8 / 20</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[40%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Team Seats</span>
                  <span className="font-bold">3 / 5</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[60%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <button className="mt-8 w-full bg-white text-gray-900 py-3 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all">
            Manage Add-ons
          </button>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Invoices</h2>
          <Link to="/billing/history" className="text-sm font-bold text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          {invoices.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Invoice</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-4">
                      <p className="font-bold text-gray-900 text-sm">{inv.invoiceNumber || 'INV-'+inv._id.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-600">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 font-bold text-gray-900 text-sm">
                      KES {inv.amount?.toLocaleString()}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm italic">No recent invoices found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
