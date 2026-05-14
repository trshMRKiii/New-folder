import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiService } from "../../lib/api-service";
import "../../styles/Dashboard.css";
import schedule from "../../../backend/schedules.json";

const peso = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return "₱0.00";
  return (
    "₱" +
    num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-icon">{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsData, chartJson] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getReportChart(),
        ]);
        setStats(statsData);
        // Last 14 days for dashboard chart
        const data = (chartJson.chart_data || []).slice(-14);
        setChartData(data);
      } catch (e) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="col-header">
        <div className="col-header-left">
          <div className="col-header-accent" />
          <div>
            <h1 className="col-title">Dashboard</h1>
            <p className="col-subtitle">
              Overview of today's collection and activity
            </p>
          </div>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
      ) : (
        <>
          {/* ─── Today's Batch Cards ──────────────────────────────────────────── */}
          <div>
            <div className="dashboard-section-label">Today's Collections</div>
            <div className="stat-cards-row">
              <StatCard
                label="Batch 1 (AM)"
                value={stats?.batch1_today?.count ?? 0}
                sub={peso(stats?.batch1_today?.total ?? 0)}
              />
              <StatCard
                label="Batch 2 (PM)"
                value={stats?.batch2_today?.count ?? 0}
                sub={peso(stats?.batch2_today?.total ?? 0)}
              />
              <StatCard
                label="Today Total"
                value={stats?.today_total?.count ?? 0}
                sub={peso(stats?.today_total?.total ?? 0)}
              />
            </div>
          </div>

          {/* ─── Overall Stats ────────────────────────────────────────────────── */}
          <div className="dashboard-section">
            <div className="dashboard-section-label">Overall</div>
            <div className="stat-cards-row">
              <StatCard
                label="Active Vehicles"
                value={stats?.active_vehicles ?? 0}
              />
              <StatCard
                label="Active Drivers"
                value={stats?.active_drivers ?? 0}
              />
            </div>
          </div>

          {/* ─── Line Chart ──────────────────────────────────────────────────── */}
          <div className="chart-card">
            <div className="chart-card-header">
              <span className="chart-card-title">
                Collections Per Day — Batch 1 vs Batch 2
              </span>
              <span className="chart-card-badge">Last 14 days</span>
            </div>
            {chartData.length === 0 ? (
              <div className="chart-empty">No data available for chart.</div>
            ) : (
              <div className="chart-card-body">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(201,168,76,0.15)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#c9a84c" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#c9a84c" }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid rgba(201,168,76,0.3)",
                        background: "var(--bg-surface)",
                        color: "var(--text-primary)",
                      }}
                      formatter={(value, name) =>
                        name.includes("total")
                          ? `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                          : `${value} tickets`
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />

                    <Line
                      type="monotone"
                      dataKey="batch1_count"
                      name="Batch 1 — Tickets"
                      stroke="#c9a84c"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="batch2_count"
                      name="Batch 2 — Tickets"
                      stroke="#2d3e5f"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="batch1_total"
                      name="Batch 1 — Amount (₱)"
                      stroke="rgba(201,168,76,0.45)"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="batch2_total"
                      name="Batch 2 — Amount (₱)"
                      stroke="rgba(45,62,95,0.45)"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
