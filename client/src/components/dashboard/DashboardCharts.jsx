import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip as ChartJSTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ChartJSTooltip, Legend, Filler);

export function RevenueTrendChart({ data = [] }) {
  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: "Revenue",
        data: data.map((item) => item.revenue),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.18)",
        fill: true,
        tension: 0.35,
      },
    ],
  };

  return (
    <div className="h-80 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Revenue Trend</h3>
        <p className="text-sm text-slate-500">Monthly paid invoice revenue.</p>
      </div>
      <div className="h-[85%]">
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
      </div>
    </div>
  );
}

export function FinanceBreakdownChart({ stats = {} }) {
  const chartData = {
    labels: ["Gross", "Tax", "Net", "Refunds"],
    datasets: [
      {
        label: "Amount",
        data: [
          Number(stats.totalRevenue || 0),
          Number(stats.totalTax || 0),
          Number(stats.netRevenue || 0),
          Number(stats.refunded || 0),
        ],
        backgroundColor: ["#2563eb", "#8b5cf6", "#10b981", "#ef4444"],
        borderRadius: 10,
      },
    ],
  };

  return (
    <div className="h-80 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Finance Breakdown</h3>
        <p className="text-sm text-slate-500">Gross revenue, VAT, net, and refunds.</p>
      </div>
      <div className="h-[85%]">
        <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
      </div>
    </div>
  );
}

export function PaymentHealthChart({ stats = {} }) {
  const chartData = {
    labels: ["Paid invoices", "Pending invoices", "Failed invoices", "Suspicious payments"],
    datasets: [
      {
        data: [
          Number(stats.paidInvoices || 0),
          Number(stats.pendingInvoices || 0),
          Number(stats.failedInvoices || 0),
          Number(stats.suspiciousPayments || 0),
        ],
        backgroundColor: ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
      },
    ],
  };

  return (
    <div className="h-80 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Payment Health</h3>
        <p className="text-sm text-slate-500">Invoice and payment risk distribution.</p>
      </div>
      <div className="h-[85%]">
        <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
      </div>
    </div>
  );
}
