//only view by safety officer
import React, { useState, useEffect } from 'react';
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StopCardReportsService from '../firebase/stopCardReportsService';
import StopCardModal from '../components/StopCardModal';
import './AllAuditReports.css';

/* Additional styles for suggestions column */
const additionalStyles = `
.suggestions-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestions-text {
  font-size: 0.9em;
  color: #666;
}

.suggestions-cell:hover {
  overflow: visible;
  white-space: normal;
  word-wrap: break-word;
  background: #f9f9f9;
  position: relative;
  z-index: 10;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 0.85em;
  color: #ffffff;
  font-weight: 500;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 0.9em;
  min-width: 120px;
}

.filter-select option {
  background: #2c2c2c;
  color: #ffffff;
}

.export-button, .home-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  font-size: 0.9em;
  font-weight: 500;
}

.export-button:hover:not(:disabled), .home-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.export-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.wide-button {
  min-width: 120px;
  padding: 12px 24px;
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .header-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .export-button, .home-button {
    width: 100%;
    justify-content: center;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = additionalStyles;
  document.head.appendChild(styleSheet);
}

const AllStopReports = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const name = user?.displayName;
  const id = user?.companyId;

  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));

  useEffect(() => {
    fetchReportsFromFirestore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch fresh reports from Firestore and cache them
  const fetchReportsFromFirestore = async () => {
    try {
      setRefreshing(true);
      if (id) {
        const userReports = await StopCardReportsService.getAllStopCardReports(200);
        console.log('All reports fetched:', userReports.length);

        // Clear any cached data for this ID
        const cacheKey = `reports_${id}`;
        try {
          localStorage.removeItem(cacheKey);
        } catch (clearError) {
          console.error('Error clearing cache:', clearError);
        }

        // Cache the fresh data
        try {
          localStorage.setItem(cacheKey, JSON.stringify(userReports));
        } catch (cacheError) {
          console.error('Error caching reports:', cacheError);
        }

        setReports(userReports);
      } else {
        window.alert('Error: User ID not found');
      }
    } catch (error) {
      window.alert('Error: Failed to fetch reports from cloud. Please try again.');
      console.error('Error fetching reports:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReportPress = (item) => {
    setSelectedReport(item);
    setVisible(true);
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      const toExport = filteredReports || [];
      
      // Define headers for the Excel file
      const headers = [
        'Employee Name',
        'Company ID',
        'Department',
        'Date',
        'Site',
        'Area',
        'Shift',
        'People Conducted',
        'People Observed',
        'Safe Acts',
        'Unsafe Acts',
        'Actions %',
        'Conditions %',
        'Duration (min)',
        'Suggestions for Improvement'
      ];
      
      // Escape function for CSV values
      const escape = (val) => {
        const str = (val ?? '').toString();
        // Escape double quotes by doubling them, wrap in quotes
        return '"' + str.replace(/"/g, '""') + '"';
      };
      
      // Map data to CSV rows
      const rows = toExport.map((item) => {
        return [
          item.userInfo?.displayName || 'Unknown',
          item.userInfo?.companyId || 'N/A',
          item.userInfo?.department || 'N/A',
          item.siteInfo?.date || 'N/A',
          item.siteInfo?.site || 'Unknown Site',
          item.siteInfo?.area || 'Unknown Area',
          item.siteInfo?.shift || 'N/A',
          item.observationData?.peopleConducted || 0,
          item.observationData?.peopleObserved || 0,
          item.safetyActs?.safeActsCount || 0,
          item.safetyActs?.unsafeActsCount || 0,
          item.completionRates?.actionsCompletion || 0,
          item.completionRates?.conditionsCompletion || 0,
          item.observationData?.durationMinutes || 0,
          item.improvements?.suggestions || 'None'
        ];
      });
      
      // Create CSV content
      const csvContent = [headers, ...rows]
        .map(cols => cols.map(escape).join(','))
        .join('\r\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      
      // Include filter info in filename if applicable
      let filterInfo = '';
      if (selectedYear !== 'all' || selectedMonth !== 'all') {
        const yearPart = selectedYear !== 'all' ? selectedYear : 'AllYears';
        const monthPart = selectedMonth !== 'all' ? `Month${selectedMonth}` : 'AllMonths';
        filterInfo = `_${yearPart}_${monthPart}`;
      }
      
      link.download = `StopCardReports_${yyyy}-${mm}-${dd}${filterInfo}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export file. Please try again.');
    }
  };

  // Filter reports based on selected year and month
  const filteredReports = reports.filter((report) => {
    const reportDate = report.siteInfo?.date;
    if (!reportDate) return false;
    
    const date = new Date(reportDate);
    const reportYear = date.getFullYear();
    const reportMonth = date.getMonth() + 1;
    
    const yearMatch = selectedYear === 'all' || reportYear === parseInt(selectedYear);
    const monthMatch = selectedMonth === 'all' || reportMonth === parseInt(selectedMonth);
    
    return yearMatch && monthMatch;
  });

  // Month options
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Year options
  const years = [
    { value: 'all', label: 'All Years' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
    { value: '2027', label: '2027' }
  ];

  return (
    <div className="audit-reports-container">
      {/* Header */}
      <div className="audit-reports-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          style={{ backgroundColor: colors.primary }}
        >
          <svg viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
            <path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="header-title-section">
          <h1 className="page-title">All Stop Card Reports</h1>
          <div className="header-info">
            <span className="user-name">Welcome, {name || 'User'}</span>
            <span className="total-reports-count">Showing: {filteredReports.length} of {reports.length} Reports</span>
          </div>
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="yearSelect">Year:</label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="filter-select"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="monthSelect">Month:</label>
            <select
              id="monthSelect"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="header-buttons">
          <button
            className="export-button"
            onClick={exportToExcel}
            title="Export to Excel"
            disabled={filteredReports.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Export
          </button>
          <button
            className="home-button wide-button"
            onClick={() => navigate('/home')}
            title="Go to Home"
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Home
          </button>
        </div>
      </div>

      {/* Loading/Refreshing Indicator */}
      {refreshing && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      )}

      {/* Reports Table */}
      {filteredReports.length === 0 && !refreshing ? (
        <div className="empty-state">
          <div className="empty-content">
            <h3>No Reports Found</h3>
            <p>{reports.length === 0 ? 'No stop card reports found. Create your first report to get started.' : 'No reports match the selected filters. Try adjusting your filter criteria.'}</p>
          </div>
        </div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Company ID</th>
                <th>Department</th>
                <th>Date</th>
                <th>Site</th>
                <th>Area</th>
                <th>Shift</th>
                <th>People Conducted</th>
                <th>People Observed</th>
                <th>Safe Acts</th>
                <th>Unsafe Acts</th>
                <th>Actions %</th>
                <th>Conditions %</th>
                <th>Duration</th>
                <th>Suggestions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((item) => (
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
                  <td className="department-cell">
                    {item.userInfo?.department || 'N/A'}
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
                    {item.siteInfo?.shift || 'N/A'}
                  </td>
                  <td className="people-conducted-cell">
                    {item.observationData?.peopleConducted || 0}
                  </td>
                  <td className="people-observed-cell">
                    {item.observationData?.peopleObserved || 0}
                  </td>
                  <td className="safe-acts-cell">
                    <span className="count-value">
                      {item.safetyActs?.safeActsCount || 0}
                    </span>
                  </td>
                  <td className="unsafe-acts-cell">
                    <span className="count-value">
                      {item.safetyActs?.unsafeActsCount || 0}
                    </span>
                  </td>
                  <td className="completion-cell">
                    <span className="percentage-value">
                      {item.completionRates?.actionsCompletion || 0}%
                    </span>
                  </td>
                  <td className="completion-cell">
                    <span className="percentage-value">
                      {item.completionRates?.conditionsCompletion || 0}%
                    </span>
                  </td>
                  <td className="duration-cell">
                    {item.observationData?.durationMinutes || 0} min
                  </td>
                  <td className="suggestions-cell">
                    <span className="suggestions-text">
                      {item.improvements?.suggestions || 'None'}
                    </span>
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
  );
};

export default AllStopReports;