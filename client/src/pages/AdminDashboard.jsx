import { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { AppContext } from "../context/AppContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Filler, Legend);

const COLORS = ["#2563eb", "#9333ea", "#10b981", "#f59e0b"];

export default function AdminDashboard() {
  const { backendUrl, api, userData } = useContext(AppContext);
  const [downloads, setDownloads] = useState([]);
  const [total, setTotal] = useState(0);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [liveUsers, setLiveUsers] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsRes, kpisRes] = await Promise.all([
          api.get(`${backendUrl}/api/user/resume/analytics`),
          api.get(`${backendUrl}/api/insights/kpis`),
        ]);
        if (analyticsRes.data.success) {
          setTotal(analyticsRes.data.totalDownloads);
          setDownloads((analyticsRes.data.recent || []).map(d => ({
            time: new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            count: 1,
          })));
        }
        if (kpisRes.data.success) {
          setPlatformStats(kpisRes.data.kpis);
          setLiveUsers(kpisRes.data.kpis.activeSessions || 0);
        }
      } catch (err) {
        console.error("AdminDashboard fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [backendUrl, api]);

  useEffect(() => {
    const socket = io(backendUrl);
    socket.on("download", () => {
      setTotal(prev => prev + 1);
      setDownloads(prev => [...prev.slice(-29), {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        count: 1,
      }]);
    });
    return () => { socket.off("download"); socket.disconnect(); };
  }, [backendUrl]);

  const kpiCards = platformStats ? [
    { label: "Total Revenue", value: `KES ${platformStats.revenue?.toLocaleString() || 0}`, icon: "💰", color: "blue", delta: "+8.2%", up: true },
    { label: "Registered Users", value: platformStats.users?.toLocaleString() || 0, icon: "👥", color: "purple", delta: "+12.5%", up: true },
    { label: "Live Sessions", value: liveUsers, icon: "⚡", color: "emerald", delta: "Real-time", up: true },
    { label: "Resume Downloads", value: total, icon: "📄", color: "amber", delta: "+3.1%", up: true },
  ] : [];

  const quickActions = [
    { label: "View Audit Logs", href: "/admin/audit-logs", icon: "🔍", desc: "Review admin activity" },
    { label: "Finance Overview", href: "/admin/finance", icon: "💳", desc: "Revenue & payments" },
    { label: "Fraud Detection", href: "/admin/fraud", icon: "🛡️", desc: "Suspicious activity" },
    { label: "Incident Board", href: "/incidents", icon: "🚨", desc: "System disruptions" },
    { label: "System Logs", href: "/logs", icon: "🖥️", desc: "Server-side events" },
    { label: "Email Analytics", href: "/admin/email-analytics", icon: "📧", desc: "Campaign metrics" },
  ];

  const pieData = platformStats ? [
    { name: "Revenue", value: platformStats.revenue || 0 },
    { name: "Sessions", value: platformStats.activeSessions || 0 },
    { name: "Users", value: platformStats.users || 0 },
    { name: "Downloads", value: total || 0 },
  ] : [];

  const lineData = {
    labels: downloads.map((item) => item.time),
    datasets: [{
      label: "Downloads",
      data: downloads.map((item) => item.count),
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.14)",
      borderWidth: 2.5,
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  };

  const doughnutData = {
    labels: pieData.map((item) => item.name),
    datasets: [{
      data: pieData.map((item) => item.value),
      backgroundColor: COLORS,
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#9ca3af", font: { size: 10 }, precision: 0 },
        grid: { color: "#f3f4f6" },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "52%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Administration</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Welcome back, {userData?.name?.split(" ")[0] || "Admin"} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening across your platform today.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-green-700 text-xs font-bold uppercase">Systems Online</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {["overview", "live-feed", "quick-actions"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-3"></div>
                <div className="h-7 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{card.icon}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    card.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  }`}>{card.delta}</span>
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Resume Download Activity</h2>
                <span className="text-xs text-gray-400">{downloads.length} events tracked</span>
              </div>
              <div className="h-64">
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Platform Distribution</h2>
              <div className="h-48">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{item.value?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "live-feed" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
              <h2 className="text-lg font-bold text-gray-900">Live Event Stream</h2>
              <span className="text-xs text-gray-400 ml-auto">{downloads.length} events in session</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...downloads].reverse().map((d, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl text-sm border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                  <span className="text-gray-400 font-mono text-xs w-20 shrink-0">{d.time}</span>
                  <span className="text-gray-700 font-medium">Resume downloaded</span>
                  <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">+1</span>
                </div>
              ))}
              {downloads.length === 0 && (
                <div className="py-12 text-center text-gray-400 italic">No events in the current session.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "quick-actions" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map(action => (
              <a
                key={action.label}
                href={action.href}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="text-3xl mb-3">{action.icon}</div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{action.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
                <div className="mt-4 flex items-center text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open →
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
