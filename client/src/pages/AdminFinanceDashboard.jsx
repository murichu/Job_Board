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

export default function AdminFinanceDashboard() {
  const { backendUrl, api } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, logsRes] = await Promise.all([
          api.get(`${backendUrl}/api/admin/finance/dashboard`),
          api.get(`${backendUrl}/api/admin/finance/audit-logs`)
        ]);
        
        if (statsRes.data.success) setStats(statsRes.data.stats);
        if (logsRes.data.success) setLogs(logsRes.data.logs);
      } catch (error) {
        console.error("Finance Dashboard fetch error:", error.message);
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
  
  if (!stats) return <div className="p-10 text-center text-gray-500">Failed to load financial data.</div>;

  const chartData = [
    { name: "Gross Revenue", value: stats.totalRevenue, color: "#2563eb" },
    { name: "Tax (VAT)", value: stats.totalTax, color: "#9333ea" },
    { name: "Refunds", value: stats.refunded, color: "#ef4444" },
    { name: "Net Profit", value: stats.netRevenue, color: "#10b981" }
  ];

  const barData = {
    labels: chartData.map((item) => item.name),
    datasets: [{
      data: chartData.map((item) => item.value),
      backgroundColor: chartData.map((item) => item.color),
      borderRadius: 6,
      barThickness: 42,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `$${Number(context.parsed.y).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`,
        },
        grid: { color: "#f3f4f6" },
      },
    },
  };

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 container mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Financial Administration</h1>
        <span className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full">Live Data</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: stats.totalRevenue, color: "blue" },
          { label: "Tax Collected", value: stats.totalTax, color: "purple" },
          { label: "Refunds Paid", value: stats.refunded, color: "red" },
          { label: "Net Revenue", value: stats.netRevenue, color: "emerald" }
        ].map((item) => (
          <div key={item.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 text-${item.color}-600`}>
                ${item.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Financial Distribution</h2>
            <div className="h-72">
                <Bar data={barData} options={barOptions} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Audit Logs</h2>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-72 pr-2 custom-scrollbar">
                {logs.length > 0 ? logs.map(log => (
                    <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm border border-gray-100">
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{log.action}</p>
                            <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`font-mono font-bold ${log.amount < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {log.amount < 0 ? '-' : '+'}${Math.abs(log.amount).toLocaleString()}
                        </span>
                    </div>
                )) : (
                    <div className="h-full flex items-center justify-center text-gray-400 italic">No logs found</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
