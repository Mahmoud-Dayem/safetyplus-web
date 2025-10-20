//this page for individual audit report history viewing with filters
import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './AuditHistoryReports.css';
import { collection, getDocs, query, where, orderBy,setDoc,addDoc,doc } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig';

function AuditHistoryReports() {

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const id = user?.companyId;

  const [reports, setReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetch audit reports from firestore
  async function getEmployeeByCode(empCode) {
    // Build a query
    const q = query(
      collection(db, "employees"),
      where("emp_code", "==", empCode)
    );

    // Run the query
    const querySnapshot = await getDocs(q);

    // Loop through results
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} =>`, doc.data());
    });
  }
  ////


  const fetchReports = async () => {
    if (!id) {
      setError('User ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // const { data, error } = await supabase
      //   .from('audit_reports')
      //   .select('*')
      //   .eq('emp_code', id)
      //   .order('created_at', { ascending: false });
      const q = query(
        collection(db, "audit_reports"),
        where("emp_code", "==", id)
      );

      // Run the query
      const data = await getDocs(q);
      console.log('============data=============');
      data.forEach((doc) => {
        console.log(doc.id, '=>', doc.data());
      });
      console.log('====================================');


      // if (error) throw error;

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Months list for filter
  const months = [
    'All',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Compute Year-To-Date (YTD) count from Jan 1st of current year
  const ytdCount = (() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    return reports.filter((r) => {
      const d = r?.date ? new Date(r.date) : (r?.created_at ? new Date(r.created_at) : null);
      if (!d || isNaN(d)) return false;
      return d >= startOfYear;
    }).length;
  })();

  // Apply year and month filters to displayed reports
  const filteredReports = (() => {
    let list = reports;
    if (selectedYear !== 'All') {
      const yearNum = parseInt(selectedYear, 10);
      list = list.filter((r) => {
        const d = r?.date ? new Date(r.date) : (r?.created_at ? new Date(r.created_at) : null);
        if (!d || isNaN(d)) return false;
        return d.getFullYear() === yearNum;
      });
    }
    if (selectedMonth !== 'All') {
      const monthIndex = months.indexOf(selectedMonth) - 1; // 0-based month
      list = list.filter((r) => {
        const d = r?.date ? new Date(r.date) : (r?.created_at ? new Date(r.created_at) : null);
        if (!d || isNaN(d)) return false;
        return d.getMonth() === monthIndex;
      });
    }
    return list;
  })();

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
        <h1 style={{ color: colors.text }}>Audit Report History</h1>
        <div className="header-controls">
          <div className="ytd-counter" title="Reports since Jan 1">
            <span className="ytd-label">YTD</span>
            <span className="ytd-value" style={{ color: colors.headerTitle }}>{ytdCount}</span>
          </div>
          <div className="month-filter">
            <label htmlFor="monthSelect" className="sr-only">Filter by month</label>
            <select
              id="monthSelect"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="year-filter">
            <label htmlFor="yearSelect" className="sr-only">Filter by year</label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {['All', '2025', '2026'].map((y) => (
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
            <p>Loading reports...</p>
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
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill={colors.textSecondary} width="64" height="64">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            <p>No audit reports found</p>
            <button
              onClick={() => navigate('/audit-report')}
              className="create-button"
              style={{ backgroundColor: colors.primary }}
            >
              Create First Report
            </button>
          </div>
        ) : (
          <div className="reports-grid">
            {filteredReports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="card-header">
                  <div className="location-badge" style={{ backgroundColor: colors.primaryLight }}>
                    <svg viewBox="0 0 24 24" fill="#fff" width="16" height="16">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>{report.location}</span>
                  </div>
                  <span className="date-text" style={{ color: colors.textSecondary }}>
                    {formatDate(report.date)}
                  </span>
                </div>

                <div className="card-body">
                  <p className="description-text" style={{ color: colors.text }}>
                    {report.description}
                  </p>
                </div>

                {report.image_url && (
                  <div className="card-image">
                    <img src={report.image_url} alt="Audit" />
                  </div>
                )}

                {/* <div className="card-footer">
                  <span className="footer-text" style={{ color: colors.textSecondary }}>
                    By: {report.user_name || 'Unknown'}
                  </span>
                  <span className="footer-text" style={{ color: colors.textSecondary }}>
                    ID: {report.emp_code}
                  </span>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditHistoryReports
