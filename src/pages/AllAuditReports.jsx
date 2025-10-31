
//only view by safety all reports
import React, { useState, useEffect, useCallback } from 'react'
// import { supabase } from './supabaseClient'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './AllAuditReports.css';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig';

function AllAuditReports() {

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const id = user?.companyId;
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [auditReports, setAuditReports] = useState([]);
  const [completedReports, setCompletedReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [completedReportsFilter, setCompletedReportsFilter] = useState({ month: '', year: '' });
 
  const applyFilters = useCallback((reports, statusFilter, monthFilter, yearFilter) => {
    let filtered = reports;

    // Apply status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter(report => !report.completed && (!report.status || report.status === 'pending'));
    } else if (statusFilter === 'assigned') {
      // Show both assigned and rectifying in this combined view
      filtered = filtered.filter(report => !report.completed && (report.status === 'assigned' || report.status === 'rectifying'));
    } else if (statusFilter === 'verifying') {
      filtered = filtered.filter(report => !report.completed && report.status === 'verifying');
    } else if (statusFilter === 'completed') {
      // For completed reports, we no longer filter from the main collection
      // as they are now fetched separately from audit_reports_closed
      return reports; // Return as-is since completed reports are already filtered by date in getCompletedReports
    }

    // Apply date filters for non-completed reports
    if (yearFilter !== 'all' || monthFilter !== 'All') {
      filtered = filtered.filter(report => {
        if (!report.date) return false;
        const reportDate = new Date(report.date);
        const reportYear = reportDate.getFullYear();
        const reportMonth = reportDate.getMonth() + 1; // 1-12

        const yearMatch = yearFilter === 'all' || reportYear === parseInt(yearFilter);
        const monthMatch = monthFilter === 'All' || reportMonth === parseInt(monthFilter);

        return yearMatch && monthMatch;
      });
    }

    return filtered;
  }, []);



  const getAuditReports = useCallback(async () => {
    try {
      // Fetch audit reports from Firestore (each report now contains full_name, department, job_title)
      const reportsSnapshot = await getDocs(query(
        collection(db, 'audit_reports'),
        orderBy('date', 'desc')
      ));
      const reportsData = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setAuditReports(reportsData);
      // Apply default filters (pending status, current month, current year)
      const currentMonth = String(new Date().getMonth() + 1);
      const currentYear = String(new Date().getFullYear())
      const filteredReports = applyFilters(reportsData, 'pending', currentMonth, currentYear);
      setFilteredReports(filteredReports);
      return reportsData;
    } catch (err) {
      console.error('Error fetching audit reports:', err);
      setError('Failed to load audit reports');
    }
  }, [applyFilters]);

  const getCompletedReports = useCallback(async (monthFilter, yearFilter) => {
    try {
      setLoadingCompleted(true);
      const allCompletedReports = [];
      
      // Calculate date range based on month and year filters
      let startDate, endDate;
      
      if (yearFilter === 'all') {
        // If year is 'all', fetch all years - this could be expensive, but we'll limit it
        const currentYear = new Date().getFullYear();
        startDate = new Date(currentYear - 2, 0, 1); // Start from 2 years ago
        endDate = new Date(currentYear, 11, 31); // End at current year
      } else {
        const year = parseInt(yearFilter);
        if (monthFilter === 'All') {
          // Fetch entire year
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31);
        } else {
          // Fetch specific month
          const month = parseInt(monthFilter) - 1; // Convert to 0-based index
          startDate = new Date(year, month, 1);
          endDate = new Date(year, month + 1, 0); // Last day of the month
        }
      }

      // Generate list of date keys to fetch
      const dateKeys = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        dateKeys.push(`${yyyy}-${mm}-${dd}`);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fetch all documents for the date range
      for (const dateKey of dateKeys) {
        try {
          const closedDocRef = doc(db, 'audit_reports_closed', dateKey);
          const closedDocSnap = await getDoc(closedDocRef);
          
          if (closedDocSnap.exists()) {
            const closedData = closedDocSnap.data();
            const reports = Array.isArray(closedData?.reports) ? closedData.reports : [];
            allCompletedReports.push(...reports);
          }
        } catch (docError) {
          console.error(`Error fetching completed reports for ${dateKey}:`, docError);
          // Continue with other dates even if one fails
        }
      }

      // Sort by completion date (most recent first)
      allCompletedReports.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.date || 0);
        const dateB = new Date(b.completed_at || b.date || 0);
        return dateB - dateA;
      });

      setCompletedReports(allCompletedReports);
      // Track which filter combination we loaded
      setCompletedReportsFilter({ month: monthFilter, year: yearFilter });
      return allCompletedReports;
    } catch (err) {
      console.error('Error fetching completed reports:', err);
      setError('Failed to load completed reports');
      return [];
    } finally {
      setLoadingCompleted(false);
    }
  }, []);

  useEffect(() => {
    const getSafetyOfficers = async () => {
      try {


        setLoading(true);
        setIsAuthorized(false);
        // get safety officers and check authorization
        const docRef = doc(db, "safetyofficers", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // console.log("Document data:", docSnap.data());
          setIsAuthorized(true);
   
        } else {
          // console.log("No such document!");
          setIsAuthorized(false);
        }

        //
        // const { data, error } = await supabase
        //   .from('safetyofficers')  // 👈 your table name
        //   .select('*')              // fetch all columns

        // if (error) {
        //   console.error('Error fetching safety officers:', error)
        //   setError('Failed to load authorization data')
        //   return []


        // Check if current user's company ID exists in safety officers array

        //   const userAuthorized = data.some(officer => {


        //   // Convert both to strings for comparison or use parseInt on id
        //   return String(officer.emp_code) === String(id) || officer.emp_code === parseInt(id);
        // });
        // setIsAuthorized(userAuthorized);

        // If authorized, fetch audit reports
        // if (isAuthorized) {
        //   console.log('==========xxx isAuthorized xxx=============');
        //   console.log(isAuthorized);
        //   console.log('====================================');
          await getAuditReports();
          // Note: Completed reports are now fetched only when the completed button is clicked
        // }
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      getSafetyOfficers()
    }
  }, [id, getAuditReports, selectedMonth, selectedYear]);

  // Show loading screen while fetching data
  if (loading) {
    return (
      <div className="all-audit-reports-loading-container">
        <div className="all-audit-reports-loading-content">
          <div className="all-audit-reports-loading-spinner"></div>
          <p className="all-audit-reports-loading-text">Loading authorization data...</p>
        </div>
      </div>
    )
  }

  // Show error if data failed to load
  if (error) {
    return (
      <div className="all-audit-reports-error-container">
        <div className="all-audit-reports-error-content">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  // Check authorization after data is loaded
  if (!isAuthorized) {

    return (
      <div className="all-audit-reports-unauthorized-container">
        <div className="all-audit-reports-unauthorized-content">
          <div className="all-audit-reports-unauthorized-icon">
            <svg viewBox="0 0 24 24" fill="#dc3545" width="80" height="80">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
          </div>
          <h1 className="all-audit-reports-unauthorized-title">Access Denied</h1>
          <p className="all-audit-reports-unauthorized-message">
            You are not authorized to view this page.
          </p>
          <p className="all-audit-reports-unauthorized-submessage">
            Please contact your administrator if you believe this is an error.
          </p>
          <button
            className="all-audit-reports-unauthorized-button"
            onClick={() => navigate('/home')}
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="all-audit-reports-container">
      {/* Header */}
      <div className="all-audit-reports-header">
        <button
          className="all-audit-reports-back-button"
          onClick={() => navigate(-1)}
          style={{ backgroundColor: colors.primary }}
        >
          <svg viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
            <path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <div className="all-audit-reports-header-title-section">
          <h1 className="all-audit-reports-page-title">All Audit Reports</h1>
          <div className="all-audit-reports-header-info">
            <span className="all-audit-reports-user-name">Welcome, {user?.displayName || user?.email || 'User'}</span>
            <span className="all-audit-reports-total-reports-count">Total: {auditReports.length} Reports</span>
          </div>
        </div>
        <div className="all-audit-reports-header-buttons">
          <button
            className="all-audit-reports-export-button"
            onClick={async () => {
              try {
                // Always export both regular reports and completed reports
                let allReportsToExport = [];
                
                // Add regular audit reports
                const regularReports = auditReports || [];
                allReportsToExport.push(...regularReports);
                
                // Add completed reports (fetch if not already loaded)
                let completedReportsToAdd = completedReports || [];
                if (completedReportsToAdd.length === 0) {
                  // Fetch completed reports for current month/year if not already loaded
                  completedReportsToAdd = await getCompletedReports(selectedMonth, selectedYear);
                }
                allReportsToExport.push(...completedReportsToAdd);
                
                // Remove duplicates by ID (in case a report exists in both collections)
                const uniqueReports = allReportsToExport.reduce((acc, current) => {
                  const existingReport = acc.find(report => report.id === current.id);
                  if (!existingReport) {
                    acc.push(current);
                  }
                  return acc;
                }, []);
                
                // Sort by date (most recent first)
                uniqueReports.sort((a, b) => {
                  const dateA = new Date(a.completed_at || a.date || 0);
                  const dateB = new Date(b.completed_at || b.date || 0);
                  return dateB - dateA;
                });
                
                // Static headers (messages removed); include chief/supervisor comments
                const headers = [
                  'Report ID',
                  'Incident Type',
                  'Requested date',
                  'Closed date',
                  'Employee',
                  'Employee Name',
                  'Employee Department',
                  'Location Description',
                  'Description',
                  'Corrective Action',
                  'Responsible Department',
                  'Department Head',
                  'Department Head Comm',
                  'Responsible Department Supervisor',
                  'Department Supervisor Comment',
                ];
                // Final status column
                headers.push('Status');
                const escape = (val) => {
                  const str = (val ?? '').toString();
                  // Escape double quotes by doubling them, wrap in quotes
                  return '"' + str.replace(/"/g, '""') + '"';
                };
                const rows = uniqueReports.map((r) => {
                  const displayStatus = r?.completed ? 'completed' : (r?.status || 'pending');
                  const formattedDate = r?.date ? new Date(r.date).toLocaleDateString() : '';
                  const completedAt = r?.completed_at ? new Date(r.completed_at).toLocaleString() : '';
                  const base = [
                    r?.id || '',
                    r?.incident_type || '',
                    formattedDate,
                    completedAt,
                    r?.emp_code || '',
                    r?.user_name || r?.full_name || '',
                    r?.department || '',
                    r?.location || '',
                    r?.description || '',
                    r?.corrective_action || '',
                    r?.assigned_department || '',
                    r?.assigned_chief || '',
                    r?.chief_comment || '',
                    r?.assigned_supervisor || '',
                    r?.supervisor_comment || '',
                  ];
                  
                  base.push(displayStatus);
                  return base;
                });
                const csvContent = [headers, ...rows]
                  .map(cols => cols.map(escape).join(','))
                  .join('\r\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                
                // Filename indicates all reports (active + completed)
                link.download = `AllAuditReports_Complete_${yyyy}-${mm}-${dd}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error('Export error:', err);
                alert('Failed to export file.');
              }
            }}
            title="Export all reports (active + completed) to Excel"
            disabled={(!auditReports || auditReports.length === 0) && (!completedReports || completedReports.length === 0)}
          >
            {/* Download icon */}
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7z" />
            </svg>
          </button>
          <button
            className="all-audit-reports-refresh-button"
            onClick={async () => {
              setRefreshing(true);
              try {
                if (selectedFilter === 'completed') {
                  // Clear cache and refresh completed reports from audit_reports_closed
                  setCompletedReports([]);
                  setCompletedReportsFilter({ month: '', year: '' });
                  const completedReportsData = await getCompletedReports(selectedMonth, selectedYear);
                  setFilteredReports(completedReportsData);
                } else {
                  // Refresh regular audit reports
                  const freshReports = await getAuditReports();
                  // Re-apply current filters to the fresh data
                  if (freshReports) {
                    const filteredReports = applyFilters(freshReports, selectedFilter, selectedMonth, selectedYear);
                    setFilteredReports(filteredReports);
                  }
                }
              } catch (error) {
                console.error('Error refreshing data:', error);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing || (loadingCompleted && selectedFilter === 'completed')}
            title="Refresh Data"
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20" className={(refreshing || (loadingCompleted && selectedFilter === 'completed')) ? 'all-audit-reports-spinning' : ''}>
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
            </svg>
          </button>
          <button
            className="all-audit-reports-home-button"
            onClick={() => navigate('/home')}
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="all-audit-reports-filter-buttons-container">
        <button
          className={`all-audit-reports-filter-button ${selectedFilter === 'pending' ? 'all-audit-reports-active' : ''}`}
          onClick={() => {
            setSelectedFilter('pending');
            const filteredReports = applyFilters(auditReports, 'pending', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          Pending ({applyFilters(auditReports, 'pending', selectedMonth, selectedYear).length})
        </button>

        <button
          className={`all-audit-reports-filter-button ${selectedFilter === 'verifying' ? 'all-audit-reports-active' : ''}`}
          onClick={() => {
            setSelectedFilter('verifying');
            const filteredReports = applyFilters(auditReports, 'verifying', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          Waiting for Verification ({applyFilters(auditReports, 'verifying', selectedMonth, selectedYear).length})
        </button>
                <button
          className={`all-audit-reports-filter-button ${selectedFilter === 'assigned' ? 'all-audit-reports-active' : ''}`}
          onClick={() => {
            setSelectedFilter('assigned');
            const filteredReports = applyFilters(auditReports, 'assigned', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          Assigned/Rectifying ({applyFilters(auditReports, 'assigned', selectedMonth, selectedYear).length})
        </button>
        <button
          className={`all-audit-reports-filter-button ${selectedFilter === 'all' ? 'all-audit-reports-active' : ''}`}
          onClick={() => {
            setSelectedFilter('all');
            const filteredReports = applyFilters(auditReports, 'all', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          All ({applyFilters(auditReports, 'all', selectedMonth, selectedYear).length})
        </button>
        <button
          className={`all-audit-reports-filter-button ${selectedFilter === 'completed' ? 'all-audit-reports-active' : ''}`}
          onClick={async () => {
            setSelectedFilter('completed');
            // Check if we already have completed reports for current month/year
            const needsFetch = completedReports.length === 0 || 
                             completedReportsFilter.month !== selectedMonth || 
                             completedReportsFilter.year !== selectedYear;
            
            if (needsFetch) {
              // Fetch completed reports from audit_reports_closed collection
              const completedReportsData = await getCompletedReports(selectedMonth, selectedYear);
              setFilteredReports(completedReportsData);
            } else {
              // Use already cached completed reports
              setFilteredReports(completedReports);
            }
          }}
          disabled={loadingCompleted}
        >
          {loadingCompleted ? 'Loading...' : `Completed (${completedReports.length})`}
        </button>

        {/* Date Filters in same row */}
        <div className="all-audit-reports-date-filters-inline">
          <div className="all-audit-reports-filter-group">
            <label className="all-audit-reports-filter-label">Year:</label>
            <select
              className="all-audit-reports-date-filter-select"
              value={selectedYear}
              onChange={async (e) => {
                setSelectedYear(e.target.value);
                if (selectedFilter === 'completed') {
                  // Check if we need to fetch new data for the new year
                  const needsFetch = completedReportsFilter.month !== selectedMonth || 
                                   completedReportsFilter.year !== e.target.value;
                  
                  if (needsFetch) {
                    // Fetch completed reports with new year filter
                    const completedReportsData = await getCompletedReports(selectedMonth, e.target.value);
                    setFilteredReports(completedReportsData);
                  } else {
                    // Use cached data
                    setFilteredReports(completedReports);
                  }
                } else {
                  // Apply filters to regular audit reports
                  const filteredReports = applyFilters(auditReports, selectedFilter, selectedMonth, e.target.value);
                  setFilteredReports(filteredReports);
                }
              }}
              disabled={loadingCompleted && selectedFilter === 'completed'}
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div className="all-audit-reports-filter-group">
            <label className="all-audit-reports-filter-label">Month:</label>
            <select
              className="all-audit-reports-date-filter-select"
              value={selectedMonth}
              onChange={async (e) => {
                setSelectedMonth(e.target.value);
                if (selectedFilter === 'completed') {
                  // Check if we need to fetch new data for the new month
                  const needsFetch = completedReportsFilter.month !== e.target.value || 
                                   completedReportsFilter.year !== selectedYear;
                  
                  if (needsFetch) {
                    // Fetch completed reports with new month filter
                    const completedReportsData = await getCompletedReports(e.target.value, selectedYear);
                    setFilteredReports(completedReportsData);
                  } else {
                    // Use cached data
                    setFilteredReports(completedReports);
                  }
                } else {
                  // Apply filters to regular audit reports
                  const filteredReports = applyFilters(auditReports, selectedFilter, e.target.value, selectedYear);
                  setFilteredReports(filteredReports);
                }
              }}
              disabled={loadingCompleted && selectedFilter === 'completed'}
            >
              <option value="All">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* View toggle button */}
          {/* <div className="all-audit-reports-filter-group">
            <label className="all-audit-reports-filter-label">View:</label>
            <button
              type="button"
              className="all-audit-reports-toggle-view-button"
              onClick={() => setViewMode(prev => (prev === 'card' ? 'table' : 'card'))}
              title={viewMode === 'card' ? 'Switch to Table View' : 'Switch to Card View'}
            >
              {viewMode === 'card' ? 'Table View' : 'Card View'}
            </button>
          </div> */}
        </div>
      </div>

      {/* Reports: Cards or Table */}
      {filteredReports.length === 0 ? (
        <div className="all-audit-reports-empty-state">
          <h3>No {selectedFilter === 'all' ? 'Audit Reports' : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1) + ' Reports'} Found</h3>
          <p>{selectedFilter === 'all' ? 'No audit reports have been submitted yet.' : `No ${selectedFilter} reports found. Try selecting a different filter.`}</p>
        </div>
      ) : 
         
          
            <div className="all-audit-reports-table-wrapper">
              <table className="all-audit-reports-table">
                <thead>
                  <tr>
                    <th>Incident Type</th>
                    <th>Date</th>
                    <th>Completed At</th>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Employee Department</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Corrective Action</th>
                    <th>Assigned Department</th>
                    <th>Assigned Chief</th>
                    <th>Assigned Supervisor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCompleted && selectedFilter === 'completed' ? (
                    <tr>
                      <td colSpan="13" className="all-audit-reports-loading-row">
                        <div className="all-audit-reports-loading-completed">
                          <div className="all-audit-reports-loading-spinner"></div>
                          <span>Loading completed reports...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      const displayStatus = report.completed ? 'completed' : (report.status || 'pending');
                      return (
                <tr key={report.id}
                  className="all-audit-reports-row"
                              onClick={() => navigate('/audit-report-details', { state: { report } })}
                              style={{ cursor: 'pointer' }}
                          >
                            <td>{report.incident_type || 'N/A'}</td>
                            <td>{report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}</td>
                            <td>{report.completed_at ? new Date(report.completed_at).toLocaleString() : '—'}</td>
                            <td>{report.emp_code || 'N/A'}</td>
                            <td>{report.user_name || report.full_name || 'N/A'}</td>
                            <td>{report.department || 'N/A'}</td>
                            <td>{report.location || 'N/A'}</td>
                            <td>{report.description || 'No description'}</td>
                            <td>{report.corrective_action || 'N/A'}</td>
                            <td>{report.assigned_department || 'N/A'}</td>
                            <td>{report.assigned_chief || 'N/A'}</td>
                            <td>{report.assigned_supervisor || 'N/A'}</td>
                            <td>
                              <span className={`all-audit-reports-status-badge ${displayStatus}`}>{displayStatus}</span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          
        
      }
    </div>
  )
}

export default AllAuditReports
