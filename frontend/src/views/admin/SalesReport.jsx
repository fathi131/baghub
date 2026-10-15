import React, { useEffect, useMemo, useState } from 'react';
import API from '../../api/axios';
import './SalesReport.css';

const initialSummary = {
  netRevenue: 0,
  totalOrders: 0,
  totalDiscount: 0,
  refundedAmount: 0,
  couponDeduction: 0
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));

const SalesReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesData, setSalesData] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (selectedPeriod = period, selectedStart = startDate, selectedEnd = endDate) => {
    try {
      setLoading(true);
      const params = { period: selectedPeriod };
      if (selectedPeriod === 'custom') {
        if (selectedStart) params.startDate = selectedStart;
        if (selectedEnd) params.endDate = selectedEnd;
      }

      const res = await API.get('/admin/sales/report', { params });
      setSalesData(res.data?.orders || []);
      setSummary(res.data?.summary || initialSummary);
    } catch (error) {
      console.error('Error fetching sales report', error);
      setSalesData([]);
      setSummary(initialSummary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredSales = useMemo(() => {
    if (!Array.isArray(salesData)) return [];

    return salesData.filter((item) => {
      const username = (item?.username || '').toLowerCase();
      const paymentMethod = (item?.paymentMethod || '').toLowerCase();
      const status = (item?.status || '').toLowerCase();
      const orderId = (item?.orderId || '').toString().toLowerCase();
      const term = (searchTerm || '').toLowerCase();

      return (
        username.includes(term) ||
        paymentMethod.includes(term) ||
        status.includes(term) ||
        orderId.includes(term)
      );
    });
  }, [salesData, searchTerm]);

  const getStatusClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'delivered':
        return 'status-delivered';
      case 'processing':
      case 'shipped':
      case 'out for delivery':
        return 'status-processing';
      case 'cancelled':
      case 'returned':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const handleApplyFilter = () => {
    fetchReport(period, startDate, endDate);
  };

  const downloadExcel = () => {
    if (!salesData.length) return;

    const headers = ['Order ID', 'Customer', 'Address', 'Quantity', 'Subtotal', 'Discount', 'Payment', 'Status', 'Date'];
    const rows = salesData.map((item) => [
      item?.orderId || '',
      item?.username || '',
      item?.address || '',
      item?.quantity || 0,
      item?.price || 0,
      item?.discounted || 0,
      item?.paymentMethod || '',
      item?.status || '',
      item?.date || ''
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sales-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (!salesData.length) return;

    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) return;

    const rows = salesData
      .map(
        (item) => `
          <tr>
            <td>${item?.orderId || '-'}</td>
            <td>${item?.username || '-'}</td>
            <td>${item?.address || '-'}</td>
            <td>${item?.quantity || 0}</td>
            <td>${formatCurrency(item?.price)}</td>
            <td>${formatCurrency(item?.discounted)}</td>
            <td>${item?.paymentMethod || '-'}</td>
            <td>${item?.status || '-'}</td>
          </tr>
        `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f5f5f5; }
            h2 { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h2>BagHub Sales Report</h2>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="sales-report-container" style={{ padding: '24px' }}>
      <h2>Sales Report</h2>

      <div className="summary-cards-grid">
        <div className="metric-card">
          <span className="metric-title">Net Revenue</span>
          <h3 className="metric-value">{formatCurrency(summary.netRevenue)}</h3>
        </div>

        <div className="metric-card">
          <span className="metric-title">Total Orders</span>
          <h3 className="metric-value">{summary.totalOrders}</h3>
        </div>

        <div className="metric-card">
          <span className="metric-title">Discount / Coupons</span>
          <h3 className="metric-value">{formatCurrency(summary.totalDiscount)}</h3>
        </div>
      </div>

      <div className="report-card">
        <div className="report-toolbar">
          <h3>Sales Report</h3>

          <div className="filter-row">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>

            {period === 'custom' && (
              <>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="date-input" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="date-input" />
              </>
            )}

            <button className="btn-filter" onClick={handleApplyFilter} disabled={loading}>
              {loading ? 'Loading...' : 'Apply'}
            </button>
          </div>

          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="toolbar-actions">
            <button className="btn-export" onClick={downloadExcel}>Excel</button>
            <button className="btn-export" onClick={downloadPDF}>PDF</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="sales-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Order ID</th>
                <th>Username</th>
                <th>Address</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Discounted</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '20px', textAlign: 'center' }}>No sales found for this period.</td>
                </tr>
              ) : (
                filteredSales.map((item, index) => (
                  <tr key={item._id || item.orderId || index}>
                    <td>{index + 1}</td>
                    <td>{item.orderId || '-'}</td>
                    <td>{item.username || '-'}</td>
                    <td className="address-cell">{item.address || '-'}</td>
                    <td>{item.quantity || 0}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{formatCurrency(item.discounted)}</td>
                    <td>{item.paymentMethod || '-'}</td>
                    <td className={`status-cell ${getStatusClass(item.status)}`}>{item.status || '-'}</td>
                    <td>{item.date || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;