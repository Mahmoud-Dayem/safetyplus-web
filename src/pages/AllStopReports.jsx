import React, { useState, useEffect } from 'react';
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StopCardReportsService from '../firebase/stopCardReportsService';
import StopCardModal from '../components/StopCardModal';
import './AllStopReports.css';

const AllStopReports = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const name = user?.displayName;
  const id = user?.companyId;

  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reporterSummary, setReporterSummary] = useState([]);

  useEffect(() => {
    fetchReportsFromFirestore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load reports from localStorage cache
  // const loadCachedReports = async () => {
  //   try {
  //     if (id) {
  //       const cacheKey = `reports_${id}`;
  //       const cachedData = localStorage.getItem(cacheKey);
  //       if (cachedData) {
  //         const allReports = JSON.parse(cachedData);
  //         setReports(allReports);
  //       } else {
  //         setReports([]); // No cached data
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error loading cached reports:', error);
  //     setReports([]);
  //   }
  // };

  // Fetch fresh reports from Firestore and cache them
  const fetchReportsFromFirestore = async () => {
    try {
      setRefreshing(true);
      if (id) {
        const userReports = await StopCardReportsService.getAllStopCardReports(200);

        // Cache the reports
        // const cacheKey = `reports_${id}`;
        // localStorage.setItem(cacheKey, JSON.stringify(userReports));

        // Display reports
        setReports(userReports);
        
        // Calculate reporter summary
        const summary = calculateReporterSummary(userReports);
        setReporterSummary(summary);
 
      }
    } catch (error) {
      window.alert('Error: Failed to fetch reports from cloud. Please try again.');
      console.error('Error fetching reports:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate reporter summary statistics
  const calculateReporterSummary = (reportsData) => {
    const reporterMap = new Map();
    
    reportsData.forEach(report => {
      const reporterName = report.userInfo?.displayName || 'Unknown';
      const companyId = report.userInfo?.companyId || 'N/A';
      const key = `${reporterName}_${companyId}`;
      
      if (reporterMap.has(key)) {
        reporterMap.get(key).reportCount += 1;
      } else {
        reporterMap.set(key, {
          name: reporterName,
          companyId: companyId,
          reportCount: 1
        });
      }
    });
    
    // Convert to array and sort by report count (descending)
    return Array.from(reporterMap.values())
      .sort((a, b) => b.reportCount - a.reportCount);
  };

  const handleReportPress = (item) => {
    setSelectedReport(item);
    setVisible(true);
  };

  return (
    <div className="report-history-container">
      {/* Header */}
      <div className="report-history-header">
        <button
          className="report-history-back-button"
          onClick={() => navigate(-1)}
          style={{ backgroundColor: colors.primary }}
        >
          <svg viewBox="0 0 24 24" fill="#FFFFFF" width="36" height="36">
            <path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="header-title-container">
          <h1 className="header-title">Report History</h1>
          <div className="header-user-info-row">
            <span className="header-user-name">{name || 'User'}</span>
            <span className="header-separator">•</span>
            <span className="header-company-id">ID: {id || 'N/A'}</span>
            <span className="header-separator">•</span>
            <span className="header-reports-count">
              {refreshing ? 'Syncing...' : `${reports.length} Report${reports.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
        <div className="header-right-container">
          <button
            className="header-create-button"
            onClick={() => navigate('/stopcard')}
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <span className="header-create-text">New Report</span>
          </button>
          {/* <button
            className="refresh-button"
            onClick={fetchReportsFromFirestore}
            disabled={refreshing}
          >
            <svg
              className={refreshing ? 'spin-icon' : ''}
              viewBox="0 0 24 24"
              fill="#FFFFFF"
              width="20"
              height="20"
            >
              {refreshing ? (
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
              ) : (
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19l-3 3 3 3h-1.5v.5c0 3.04-2.46 5.5-5.5 5.5-1.48 0-2.82-.59-3.81-1.55l-1.46 1.46C7.96 21.14 9.88 22 12 22c4.42 0 8-3.58 8-8 0-.55-.08-1.08-.23-1.59l.58.58z"/>
              )}
            </svg>
          </button> */}
          <button
            className="report-history-home-button"
            onClick={() => {
               navigate('/home');
            }}
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="content">
        {/* Refreshing Indicator */}
        {refreshing && (
          <div className="refreshing-container">
            <div className="spinner"></div>
            <span className="refreshing-text">Fetching reports from cloud...</span>
          </div>
        )}

        {/* Reporter Summary Table */}
        {reporterSummary.length > 0 && !refreshing && (
          <div className="summary-section">
            <h3 className="summary-title">Reporter Summary</h3>
            <div className="summary-table-container">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Reporter Name</th>
                    <th>Company ID</th>
                    <th>Number of Reports</th>
                  </tr>
                </thead>
                <tbody>
                  {reporterSummary.map((reporter, index) => (
                    <tr key={index} className="summary-row">
                      <td className="summary-name-cell">
                        <span className="summary-reporter-name">
                          {reporter.name}
                        </span>
                      </td>
                      <td className="summary-id-cell">
                        <span className="summary-company-id">
                          {reporter.companyId}
                        </span>
                      </td>
                      <td className="summary-count-cell">
                        <span className="summary-report-count">
                          {reporter.reportCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Table */}
        {reports.length === 0 && !refreshing ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill={colors.textSecondary || '#8E8E93'} width="80" height="80">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <h3 className="empty-title">No Reports Found</h3>
            <p className="empty-subtitle">
              No safety reports found. Create your first report to get started!
            </p>
          </div>
        ) : (
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Company ID</th>
                  <th>Date</th>
                  <th>Site</th>
                  <th>Area</th>
                  <th>Shift</th>
                  <th>Safe Acts</th>
                  <th>Unsafe Acts</th>
                  <th>Actions %</th>
                  <th>Conditions %</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((item) => (
                  <tr 
                    key={item.id}
                    className="report-row"
                    onClick={() => handleReportPress(item)}
                  >
                    <td className="reporter-cell">
                      <div className="reporter-info">
                        <span className="reporter-name">
                          {item.userInfo?.displayName || 'Unknown'}
                        </span>
                 
                      </div>
                    </td>
                    <td className="company-id-cell">
                      {item.userInfo?.companyId || 'N/A'}
                    </td>
                    <td className="date-cell">
                      {item.siteInfo?.date || 'N/A'}
                    </td>
                    <td className="site-cell">
                      <span className="site-name">
                        {item.siteInfo?.site || 'Unknown Site'}
                      </span>
                    </td>
                    <td className="area-cell">
                      {item.siteInfo?.area || 'Unknown Area'}
                    </td>
                    <td className="shift-cell">
                      {item.siteInfo?.shift ? (
                        <span className="shift-badge-table">
                          {item.siteInfo.shift}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="safe-acts-cell">
                      <span className="count-badge safe">
                        {item.safetyActs?.safeActsCount || 0}
                      </span>
                    </td>
                    <td className="unsafe-acts-cell">
                      <span className="count-badge unsafe">
                        {item.safetyActs?.unsafeActsCount || 0}
                      </span>
                    </td>
                    <td className="completion-cell">
                      <span className="percentage-badge actions">
                        {item.completionRates?.actionsCompletion || 0}%
                      </span>
                    </td>
                    <td className="completion-cell">
                      <span className="percentage-badge conditions">
                        {item.completionRates?.conditionsCompletion || 0}%
                      </span>
                    </td>
                    <td className="duration-cell">
                      {item.observationData?.durationMinutes || 0} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport && (
          <StopCardModal
            data={selectedReport}
            visible={visible}
            setVisible={setVisible}
          />
        )}
      </div>
    </div>
  );
};

export default AllStopReports;
