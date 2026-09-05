import { useEffect, useState, useContext } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { AppContext } from "../context/AppContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AnalyticsDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get(`${backendUrl}/api/insights/kpis`);
        if (data.success) {
          setData(data);
        }
      } catch (error) {
        console.error("AnalyticsDashboard fetch error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [backendUrl, api]);

  const exportToCSV = () => {
    if (!data) return;
    const headers = ["Period", "Revenue (KES)", "Invoices Count"];
    const rows = (data.monthlyRevenue || []).map(m => [
      `${m._id.month}/${m._id.year}`,
      m.revenue,
      m.invoices
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!data) return <div className="p-10 text-center text-gray-500">Analytics service temporarily unavailable.</div>;

  const { kpis, monthlyRevenue } = data;
  const chartData = (monthlyRevenue || []).map(m => ({
    month: `${m._id.month}/${m._id.year.toString().slice(-2)}`,
    revenue: m.revenue
  }));

  const barData = {
    labels: chartData.map((item) => item.month),
    datasets: [{
      label: "Revenue (KES)",
      data: chartData.map((item) => item.revenue),
      backgroundColor: "#2563eb",
      borderRadius: 6,
      barThickness: 35,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `KES ${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#9ca3af",
          font: { size: 11 },
          callback: (value) => `KES ${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`,
        },
        grid: { color: "#f3f4f6" },
      },
    },
  };

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 container mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-500 text-sm mt-1">Key Performance Indicators and financial growth metrics.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={exportToCSV}
                className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
            </button>
            <span className="px-3 py-2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-xl uppercase tracking-tighter border border-blue-100 flex items-center">Real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
            { label: "Gross Revenue", value: `KES ${kpis?.revenue?.toLocaleString()}`, icon: '💰' },
            { label: "Total Platform Users", value: kpis?.users?.toLocaleString(), icon: '👥' },
            { label: "Active Live Sessions", value: kpis?.activeSessions?.toLocaleString(), icon: '⚡' }
        ].map(item => (
            <div key={item.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{item.value || 0}</p>
                </div>
                <div className="text-2xl bg-gray-50 w-12 h-12 flex items-center justify-center rounded-xl">{item.icon}</div>
            </div>
        ))}
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Growth Trend</h2>
        <div className="h-72 sm:h-96">
            <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}
