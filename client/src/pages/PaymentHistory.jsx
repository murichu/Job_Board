import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";
import { ArrowLeft, Download, FileText, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentHistory() {
  const { api, backendUrl, token } = useContext(AppContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`${backendUrl}/api/billing/history`);
        if (data.success) {
          setPayments(data.payments || []);
        }
      } catch (error) {
        console.error("PaymentHistory error:", error);
        toast.error(error.response?.data?.message || "Failed to load payment history.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [api, backendUrl, token]);

  const filteredPayments = payments.filter(p => 
    p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.amount?.toString().includes(searchTerm)
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/billing" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment History</h1>
          <p className="text-gray-500 mt-1">Detailed log of all your past transactions and receipts.</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by ID, status, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm bg-transparent outline-none border-none focus:ring-0"
          />
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPayments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredPayments.map((p) => (
            <div key={p._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    p.status === 'completed' || p.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 uppercase tracking-tight">
                      {p.transactionId || 'TRANS-'+p._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-8">
                  <div className="text-right">
                    <p className="text-xl font-black text-gray-900">KES {p.amount?.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      p.status === 'completed' || p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  
                  <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No payment history found.</p>
        </div>
      )}
    </div>
  );
}
