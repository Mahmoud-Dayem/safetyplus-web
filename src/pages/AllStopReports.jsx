//only view by safety officer
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
        'Area',
        'Shift',
        'People Conducted',
        'People Observed',
        'Safe Acts Count',
        'Safe Acts List',
        'Unsafe Acts Count', 
        'Unsafe Acts List',
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
        // Format safe acts list with numbering
        const safeActsList = item.safetyActs?.safeActsList || [];
        const safeActsFormatted = safeActsList.length > 0 
          ? safeActsList.map((act, index) => `${index + 1}. ${act}`).join('; ')
          : 'None';
        
        // Format unsafe acts list with numbering
        const unsafeActsList = item.safetyActs?.unsafeActsList || [];
        const unsafeActsFormatted = unsafeActsList.length > 0 
          ? unsafeActsList.map((act, index) => `${index + 1}. ${act}`).join('; ')
          : 'None';
        
        return [
          item.userInfo?.displayName || 'Unknown',
          item.userInfo?.companyId || 'N/A',
          item.userInfo?.department || 'N/A',
          item.siteInfo?.date || 'N/A',
          item.siteInfo?.area || 'Unknown Area',
          item.siteInfo?.shift || 'N/A',
          item.observationData?.peopleConducted || 0,
          item.observationData?.peopleObserved || 0,
          item.safetyActs?.safeActsCount || 0,
          safeActsFormatted,
          item.safetyActs?.unsafeActsCount || 0,
          unsafeActsFormatted,
          item.completionRates?.actionsCompletion || 0,
          item.completionRates?.conditionsCompletion || 0,
          item.observationData?.durationMinutes || 0,
          item.feedback?.suggestions || 'None'
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
    <div className="stop-container">
      {/* Header */}
      <div className="stop-header">
        <button
          className="stop-back-button"
          onClick={() => navigate(-1)}
          style={{ backgroundColor: colors.primary }}
        >
          <svg viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
            <path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className="stop-header-title-section">
          <h1 className="stop-page-title">All Stop Card Reports</h1>
          <div className="stop-header-info">
            <span className="stop-user-name">Welcome, {name || 'User'}</span>
            <span className="stop-total-reports-count">Showing: {filteredReports.length} of {reports.length} Reports</span>
          </div>
        </div>
        <div className="stop-filter-controls">
          <div className="stop-filter-group">
            <label htmlFor="yearSelect">Year:</label>
            <select
              id="yearSelect"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="stop-filter-select"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
          <div className="stop-filter-group">
            <label htmlFor="monthSelect">Month:</label>
            <select
              id="monthSelect"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="stop-filter-select"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="stop-header-buttons">
          <button
            className="stop-export-button"
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
            className="stop-home-button"
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
        <div className="stop-loading-container">
          <div className="stop-spinner"></div>
          <p>Loading reports...</p>
        </div>
      )}

      {/* Reports Table */}
      {filteredReports.length === 0 && !refreshing ? (
        <div className="stop-empty-state">
          <div className="stop-empty-content">
            <h3>No Reports Found</h3>
            <p>{reports.length === 0 ? 'No stop card reports found. Create your first report to get started.' : 'No reports match the selected filters. Try adjusting your filter criteria.'}</p>
          </div>
        </div>
      ) : (
        <div className="stop-reports-table-container">
          <table className="stop-reports-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company ID</th>
                <th>Department</th>
                <th>Date</th>
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
                  className="stop-report-row"
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
                    <div className="acts-cell-content">
                      <span className="count-value">
                        {item.safetyActs?.safeActsCount || 0}
                      </span>
                      {item.safetyActs?.safeActsList && item.safetyActs.safeActsList.length > 0 && (
                        <div className="acts-list">
                          {item.safetyActs.safeActsList.slice(0, 2).map((act, index) => (
                            <div key={index} className="act-item">
                              {index + 1}. {act}
                            </div>
                          ))}
                          {item.safetyActs.safeActsList.length > 2 && (
                            <div className="more-acts">+{item.safetyActs.safeActsList.length - 2} more...</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="unsafe-acts-cell">
                    <div className="acts-cell-content">
                      <span className="count-value">
                        {item.safetyActs?.unsafeActsCount || 0}
                      </span>
                      {item.safetyActs?.unsafeActsList && item.safetyActs.unsafeActsList.length > 0 && (
                        <div className="acts-list">
                          {item.safetyActs.unsafeActsList.slice(0, 2).map((act, index) => (
                            <div key={index} className="act-item">
                              {index + 1}. {act}
                            </div>
                          ))}
                          {item.safetyActs.unsafeActsList.length > 2 && (
                            <div className="more-acts">+{item.safetyActs.unsafeActsList.length - 2} more...</div>
                          )}
                        </div>
                      )}
                    </div>
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
                      {item.feedback?.suggestions || 'None'}
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