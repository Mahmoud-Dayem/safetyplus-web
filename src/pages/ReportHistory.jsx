//this page shows stop card report statistics with monthly breakdown from employee's my_reports array
import React, { useState, useEffect } from 'react';
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import './AuditHistoryReports.css';

const ReportHistory = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const id = user?.companyId;

  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyCounts, setMonthlyCounts] = useState(new Array(12).fill(0));
  const [totalReports, setTotalReports] = useState(0);

  const fetchReports = async () => {
    if (!id) {
      setError('User ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch employee document from employees_collection
      const employeeDocRef = doc(db, "employees_collection", id);
      const employeeDoc = await getDoc(employeeDocRef);
      
      if (!employeeDoc.exists()) {
        setError('Employee not found');
        setLoading(false);
        return;
      }
      
      const employeeData = employeeDoc.data();
      const myReports = employeeData.my_reports || [];
      
      // Filter for stop reports only
      const stopReports = myReports.filter(report => report.report_type === "STOP");
      
      const selectedYearInt = parseInt(selectedYear, 10);
      
      // Initialize monthly counts array
      const monthlyCountsData = new Array(12).fill(0);
      
      // Count reports by month for the selected year
      stopReports.forEach(report => {
        if (report.date) {
          const reportDate = new Date(report.date);
          if (reportDate.getFullYear() === selectedYearInt) {
            const monthIndex = reportDate.getMonth(); // 0-based
            monthlyCountsData[monthIndex]++;
          }
        }
      });
      
      setMonthlyCounts(monthlyCountsData);
      
      // Calculate total for the year
      const yearTotal = monthlyCountsData.reduce((sum, count) => sum + count, 0);
      setTotalReports(yearTotal);
      
    } catch (err) {
      console.error('Error fetching report counts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports on component mount and when id or selectedYear changes
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedYear]);

  // Months list
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-based
  const currentYear = currentDate.getFullYear();

  // Calculate monthly statistics using precomputed counts
  const monthlyStats = months.map((monthName, index) => {
    const count = monthlyCounts[index] || 0;
    const isCurrentYear = parseInt(selectedYear, 10) === currentYear;
    const isPastOrCurrentMonth = !isCurrentYear || index <= currentMonth;
    
    return {
      month: monthName,
      count,
      isPastOrCurrentMonth
    };
  });

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
        <h1 style={{ color: colors.text }}>Stop Card Report Statistics</h1>
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
              {[String(currentYear), String(currentYear + 1)].map((y) => (
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
  );
};

export default ReportHistory;