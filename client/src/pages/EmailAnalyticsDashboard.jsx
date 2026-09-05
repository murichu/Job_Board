import { useEffect, useState, useContext } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { AppContext } from "../context/AppContext";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function EmailAnalyticsDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`${backendUrl}/api/email-analytics/stats`);
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("EmailAnalytics fetch error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [backendUrl, api]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!stats) return <div className="p-10 text-center text-gray-500">No email analytics data available.</div>;

  const data = [
    { name: "Delivered", value: stats.sent || 0, color: "#3b82f6" },
    { name: "Opened", value: stats.opened || 0, color: "#9333ea" },
    { name: "Clicked", value: stats.clicked || 0, color: "#10b981" },
    { name: "Failed", value: stats.failed || 0, color: "#ef4444" }
  ].filter(d => d.value > 0);

  const doughnutData = {
    labels: data.map((item) => item.name),
    datasets: [{
      data: data.map((item) => item.value),
      backgroundColor: data.map((item) => item.color),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 container mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Email Campaign Performance</h1>
                <p className="text-gray-500 text-sm mt-1">Real-time engagement metrics for system notifications and marketing emails.</p>
            </div>
            <div className="flex gap-2">
                <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Total Emails</span>
                    <p className="text-xl font-bold text-gray-900">{(stats.sent || 0) + (stats.failed || 0)}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="w-full h-75 sm:h-100">
                <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>

            <div className="space-y-4">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 transition-hover hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="font-semibold text-gray-700">{item.name}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{item.value.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">
                                {(((item.value / ((stats.sent || 1) + (stats.failed || 0))) * 100).toFixed(1))}% of total
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
