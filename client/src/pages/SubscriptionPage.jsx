import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "../lib/toast";
import { Check, ShieldCheck, Zap, ArrowLeft, Gem } from "lucide-react";
import { Link } from "react-router-dom";

const PLANS = [
  {
    name: "Starter",
    price: "0",
    features: ["5 Job Postings", "Standard Support", "Basic Analytics"],
    color: "gray"
  },
  {
    name: "Professional",
    price: "4,999",
    features: ["20 Job Postings", "Priority Support", "Advanced Analytics", "Team Access"],
    color: "blue",
    popular: true
  },
  {
    name: "Enterprise",
    price: "12,999",
    features: ["Unlimited Jobs", "Dedicated Manager", "Custom Reports", "API Access"],
    color: "purple"
  }
];

export default function SubscriptionPage() {
  const { api, backendUrl, token } = useContext(AppContext);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`${backendUrl}/api/billing/subscription`);
        if (data.success) {
          setSubscription(data.sub || data.subscription);
        }
      } catch (error) {
        console.error("SubscriptionPage error:", error);
        toast.error(error.response?.data?.message || "Failed to load subscription details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [api, backendUrl, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-4">
        <Link to="/billing" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Billing
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Choose your plan</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
          Scale your hiring process with our flexible plans. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Current Plan Alert */}
      {subscription && (
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-900 font-bold">You are currently on the <span className="uppercase">{subscription.plan}</span> plan</p>
              <p className="text-blue-700/70 text-sm">Next billing cycle starts on {new Date(subscription.nextInvoiceAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Link to="/billing/history" className="text-blue-600 font-bold text-sm hover:underline">
            View billing history
          </Link>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PLANS.map((plan) => (
          <div 
            key={plan.name} 
            className={`relative flex flex-col bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-500 hover:translate-y-[-8px] ${
              plan.popular ? 'border-blue-600 shadow-2xl shadow-blue-100' : 'border-gray-100 shadow-sm hover:shadow-xl'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                plan.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                plan.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600'
              }`}>
                {plan.name === 'Starter' ? <Zap className="w-6 h-6" /> : 
                 plan.name === 'Enterprise' ? <Gem className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">KES {plan.price}</span>
                <span className="text-gray-400 font-bold">/mo</span>
              </div>
            </div>

            <ul className="space-y-4 mb-12 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                    <Check className="w-3 h-3" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`w-full py-4 rounded-2xl font-bold transition-all ${
              subscription?.plan?.toLowerCase() === plan.name.toLowerCase()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : plan.popular 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' 
                  : 'bg-gray-900 text-white hover:bg-black'
            }`}>
              {subscription?.plan?.toLowerCase() === plan.name.toLowerCase() ? 'Current Plan' : `Get ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
      
      <p className="text-center text-gray-400 text-sm italic">
        All plans include 14-day money-back guarantee. Prices exclude local VAT where applicable.
      </p>
    </div>
  );
}
