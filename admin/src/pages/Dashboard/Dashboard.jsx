import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import { toast } from "react-toastify";

export default function Dashboard({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${url}/api/order/analytics`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        toast.error("Failed to load analytics");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [url]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="db-spinner"></div>
        <p>Analyzing order data...</p>
      </div>
    );
  }

  if (!data) return null;

  const {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    revenueTrend,
    categoryTrend,
    recentOrders
  } = data;

  // Render SVG Line Chart points
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxRevenue = Math.max(...revenueTrend.map((t) => t.revenue), 100);
  const activeWidth = chartWidth - paddingX * 2;
  const activeHeight = chartHeight - paddingY * 2;

  const chartPoints = revenueTrend.map((t, idx) => {
    const x = paddingX + (idx / (revenueTrend.length - 1)) * activeWidth;
    const y = chartHeight - paddingY - (t.revenue / maxRevenue) * activeHeight;
    return { x, y, date: t.date, val: t.revenue };
  });

  const linePath = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = chartPoints.length > 0
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight - paddingY} L ${chartPoints[0].x} ${chartHeight - paddingY} Z`
    : "";

  return (
    <div className="dashboard">
      <div className="page-intro">
        <span className="page-intro-eyebrow">Diner Operations</span>
        <h1>Dashboard & Analytics</h1>
        <p>Monitor your restaurant's performance, track sales metrics, and view recent customer activity.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">💰</div>
          <div className="stat-info">
            <span className="stat-label">Total Revenue</span>
            <h3 className="stat-value">${totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper">📦</div>
          <div className="stat-info">
            <span className="stat-label">Orders Handled</span>
            <h3 className="stat-value">{totalOrders}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper">📈</div>
          <div className="stat-info">
            <span className="stat-label">Avg Order Value</span>
            <h3 className="stat-value">${averageOrderValue.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-row">
        {/* Sales Trend SVG Chart */}
        <div className="chart-card-wrapper sales-trend-card">
          <div className="card-header">
            <h3>Revenue Trend (Last 7 Days)</h3>
          </div>
          <div className="chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="sales-svg-chart">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                </linearGradient>
                <filter id="shadow-line" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="var(--accent)" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingY + ratio * activeHeight;
                const value = Math.round(maxRevenue * (1 - ratio));
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text x={paddingX - 10} y={y + 4} className="chart-axis-label text-right">
                      ${value}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#chart-grad)" />}

              {/* Stroke Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#shadow-line)"
                />
              )}

              {/* Interactive Tooltip Dots */}
              {chartPoints.map((p, idx) => (
                <g key={idx} className="chart-marker-group">
                  <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="var(--accent)" strokeWidth="3" />
                  <circle cx={p.x} cy={p.y} r="10" fill="transparent" className="hover-trigger" />
                  
                  {/* Tooltip Overlay */}
                  <g className="chart-tooltip">
                    <rect x={p.x - 35} y={p.y - 38} width="70" height="24" rx="6" fill="var(--text)" />
                    <text x={p.x} y={p.y - 22} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                      ${p.val}
                    </text>
                  </g>
                  
                  {/* X Axis Labels */}
                  <text x={p.x} y={chartHeight - 8} textAnchor="middle" className="chart-axis-label">
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Category distribution share */}
        <div className="chart-card-wrapper category-distribution-card">
          <div className="card-header">
            <h3>Menu Share by Revenue</h3>
          </div>
          <div className="categories-list">
            {categoryTrend.length > 0 ? (
              categoryTrend.map((item, idx) => {
                const percentage = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
                return (
                  <div key={idx} className="category-share-item">
                    <div className="category-share-header">
                      <span className="category-name">{item.category}</span>
                      <span className="category-value">
                        ${item.value.toLocaleString()} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="category-progress-bar-bg">
                      <div
                        className="category-progress-bar-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-data-msg">No sales data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders activity tracker */}
      <div className="recent-orders-card">
        <div className="card-header">
          <h3>Recent Paid Orders</h3>
        </div>
        <div className="recent-orders-table-wrapper">
          <table className="recent-orders-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Items Count</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order, idx) => (
                  <tr key={idx}>
                    <td>
                      {order.address.firstName} {order.address.lastName}
                    </td>
                    <td>
                      {new Date(order.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td>{order.items.length} items</td>
                    <td className="amount-col">${order.amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-tag ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No paid transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
