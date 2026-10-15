import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  Tooltip
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('6m');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    API.get('/admin/dashboard', { params: { range: timeFilter } })
      .then(({ data }) => {
        if (isActive) setDashboard(data);
      })
      .catch((requestError) => {
        if (isActive) setError(requestError.response?.data?.message || 'Could not load dashboard data.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [timeFilter, refreshKey]);

  
  const salesData = dashboard?.salesData || [];
  const customerData = dashboard?.customerData || [];
  const donutData = dashboard?.bestSellingData || [];
  const recentOrders = dashboard?.recentOrders || [];
  const bestSellingTotal = donutData.reduce((sum, product) => sum + Number(product.sales || 0), 0);
  const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const periodLabel = timeFilter === '30d' ? 'LAST 30 DAYS' : timeFilter === '1y' ? 'LAST YEAR' : 'LAST 6 MONTHS';
  const handleRangeChange = (event) => {
    setLoading(true);
    setError('');
    setTimeFilter(event.target.value);
  };
  const DONUT_COLORS = ['#3f51b5', '#64b5f6', '#bbdefb'];

  

  return (
    <div className="dashboard-container">
     
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div className="header-actions">
          <select
            className="time-filter-select"
            value={timeFilter}
            onChange={handleRangeChange}
          >
            <option value="6m">Last 6 months</option>
            <option value="30d">Last 30 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setLoading(true); setError(''); setRefreshKey((key) => key + 1); }}>Retry</button>
        </div>
      )}

     
      <div className="stats-grid">
        
        <div className="stat-card">
          <div className="stat-card-info">
            <div>
              <h3>Total Sales</h3>
              <p className="sub-text">{periodLabel}</p>
            </div>
            <div className="stat-value">{loading && !dashboard ? '...' : currency(dashboard?.stats.totalSales)}</div>
          </div>
          <div className="chart-wrapper-large">
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={salesData}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => currency(value)} />
                <Bar dataKey="sales" fill="#4285F4" radius={[3, 3, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

       
        <div className="stat-card">
          <div className="stat-card-info">
            <div>
              <h3>Customers</h3>
              <p className="sub-text">NEW CUSTOMERS · {periodLabel}</p>
            </div>
            <div className="stat-value">{loading && !dashboard ? '...' : Number(dashboard?.stats.customers || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="chart-wrapper-large">
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={customerData}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4285F4" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="stat-card">
          <div className="stat-card-info">
            <div>
              <h3>Orders</h3>
              <p className="sub-text">ORDERS · {periodLabel}</p>
            </div>
            <div className="stat-value">{loading && !dashboard ? '...' : Number(dashboard?.stats.orders || 0).toLocaleString('en-IN')}</div>
          </div>
          <p className="orders-period-note">Orders placed during this period</p>
        </div>
      </div>

      
      <div className="bottom-grid">
        
        <div className="content-card best-selling-card">
          <h3>Best Selling</h3>
          <p className="sub-text">TOP PRODUCTS · {periodLabel}</p>

          <div className="total-sales-badge">
            <strong>{currency(bestSellingTotal)}</strong> <span>— Top product sales</span>
          </div>

          <div className="best-selling-tags">
            {donutData.length ? donutData.map((product) => (
              <div className="tag-item" key={product.name}>{product.name} — <strong>{product.value} sold</strong></div>
            )) : <p className="dashboard-empty">No product sales in this period.</p>}
          </div>

          <div className="donut-chart-wrapper-large">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} sold`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        <div className="content-card recent-orders-card">
          <div className="card-header-flex">
            <h3>Recent Orders</h3>
            <button className="btn-view-all" onClick={() => navigate('/admin/orders')}>View All</button>
          </div>

          <table className="orders-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.item}</td>
                  <td>{new Date(order.date).toLocaleDateString('en-GB')}</td>
                  <td>{currency(order.total)}</td>
                  <td>
                    <span className={`status-pill ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && !recentOrders.length && (
                <tr><td colSpan="4" className="dashboard-empty-row">No recent orders in this period.</td></tr>
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;