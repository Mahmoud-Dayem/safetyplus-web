//this page shows audit report statistics with monthly breakdown
import React, { useState } from 'react'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './AuditHistoryReports.css';
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig';

function AuditHistoryReports() {

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const id = user?.companyId;

  const [reports, setReports] = useState([]);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    if (!id) {
      setError('User ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const q = query(
        collection(db, "audit_reports"),
        where("emp_code", "==", id)
      );

      const data = await getDocs(q);
      const reportsArray = data.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsArray);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports on component mount and when id changes
  React.useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Months list
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-based
  const currentYear = currentDate.getFullYear();

  // Filter reports for selected year
  const yearlyReports = reports.filter((r) => {
    const d = r?.date ? new Date(r.date) : (r?.created_at ? new Date(r.created_at) : null);
    if (!d || isNaN(d)) return false;
    return d.getFullYear() === parseInt(selectedYear, 10);
  });

  // Calculate monthly statistics
  const monthlyStats = months.map((monthName, index) => {
    const count = yearlyReports.filter((r) => {
      const d = r?.date ? new Date(r.date) : (r?.created_at ? new Date(r.created_at) : null);
      if (!d || isNaN(d)) return false;
      return d.getMonth() === index;
    }).length;

    const isCurrentYear = parseInt(selectedYear, 10) === currentYear;
    const isPastOrCurrentMonth = !isCurrentYear || index <= currentMonth;
    
    return {
      month: monthName,
      count,
      isPastOrCurrentMonth
    };
  });

  // Total reports for selected year
  const totalReports = yearlyReports.length;

  // Get count color based on value
  const getCountColor = (count) => {
    if (count === 0) return '#ff4444'; // red
    if (count === 1) return '#ffa500'; // orange/yellow
    return '#22c55e'; // green
  };

  return (
    <div className="audit-history-container">
      <div className="audit-history-header">
        <button
          className="back-button"
          onClick={() => navigate('/home')}
          style={{ backgroundColor: colors.primary }}
        >
          ← Back
        </button>
        <h1 style={{ color: colors.text }}>Audit Report Statistics</h1>
        <div className="header-controls">
          <div className="total-counter" title={`Total Reports in ${selectedYear}`}>
            <span className="total-label">Total Reports</span>
            <span className="total-value" style={{ color: colors.headerTitle }}>{totalReports}</span>
          </div>
          <div className="year-filter">
            <label htmlFor="yearSelect" className="sr-only">Filter by year</label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {[ String(currentYear), String(currentYear + 1)].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="audit-history-content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading statistics...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p style={{ color: colors.error }}>Error: {error}</p>
            <button
              onClick={fetchReports}
              className="retry-button"
              style={{ backgroundColor: colors.primary }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="statistics-table-wrapper">
            <table className="statistics-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Reports Count</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((stat, index) => (
                  <tr 
                    key={stat.month} 
                    className={`stats-row ${stat.isPastOrCurrentMonth ? 'past-current' : 'future'}`}
                  >
                    <td className="month-cell">{stat.month}</td>
                    <td className="count-cell">
                      <span 
                        className="count-value"
                        style={{ color: getCountColor(stat.count) }}
                      >
                        {stat.count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditHistoryReports
