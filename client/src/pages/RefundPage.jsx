import { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";
import { ArrowLeft, RefreshCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function RefundPage() {
  const { api, backendUrl, token } = useContext(AppContext);
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const requestRefund = async () => {
    if (!invoiceId) return toast.error("Please enter an Invoice ID.");
    if (!reason) return toast.error("Please provide a reason for the refund.");

    try {
      setLoading(true);
      const { data } = await api.post(`${backendUrl}/api/billing/refund`, { 
        invoiceId, 
        reason 
      });
      
      if (data.success) {
        toast.success("Refund request submitted successfully");
        setInvoiceId("");
        setReason("");
      } else {
        toast.error(data.message || "Refund request failed");
      }
    } catch (err) {
      console.error("Refund request error:", err);
      toast.error(err.response?.data?.message || "Refund failed. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Header */}
      <div>
        <Link to="/billing" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Request Refund</h1>
        <p className="text-gray-500 mt-1">Submit a request for a transaction refund. Our team will review it within 48 hours.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-8">
        {/* Info Alert */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-900 font-bold text-sm">Important Note</p>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              Refunds are subject to our 14-day policy. Requests outside this window may be rejected. 
              Once processed, funds may take 5-10 business days to appear in your account.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Invoice ID</label>
            <input
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="e.g. INV-123456"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-6 py-4 text-gray-900 outline-none transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Reason for Refund</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe why you are requesting a refund..."
              rows={4}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-6 py-4 text-gray-900 outline-none transition-all placeholder:text-gray-300 resize-none"
            />
          </div>

          <button 
            onClick={requestRefund} 
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCcw className="w-6 h-6 animate-spin" />
            ) : (
              <>Submit Refund Request</>
            )}
          </button>
        </div>

        {/* Trust Badge */}
        <div className="pt-8 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Secure Refund Process</span>
        </div>
      </div>
    </div>
  );
}
