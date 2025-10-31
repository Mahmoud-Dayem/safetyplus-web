import React, { useState, useEffect, useCallback } from 'react'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './inbox.css';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig';

function Inbox() {

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const id = user?.companyId;
  // const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));

  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditReports, setAuditReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('assigned');
  const [refreshing, setRefreshing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isChief, setIsChief] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const departments = useSelector((state) => state.departments.list);
  const [defaultFilterApplied, setDefaultFilterApplied] = useState(false);
  // const [viewMode, setViewMode] = useState('table'); // 'card' | 'table'

  // Completed reports state
  const [completedReports, setCompletedReports] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [completedReportsCached, setCompletedReportsCached] = useState(false);
  const [cachedCompletedFilters, setCachedCompletedFilters] = useState({ month: '', year: '' });

  const applyFilters = useCallback((reports, statusFilter, monthFilter, yearFilter) => {
    let filtered = reports;

    // Apply status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter(report => !report.completed && (!report.status || report.status === 'pending'));
    } else if (statusFilter === 'assigned') {
      filtered = filtered.filter(report => !report.completed && report.status === 'assigned');
    } else if (statusFilter === 'verifying') {
      filtered = filtered.filter(report => !report.completed && report.status === 'verifying');
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(report => report.completed);
    } else if (statusFilter === 'rectifying') {
      filtered = filtered.filter(report => !report.completed && report.status === 'rectifying');
    }

    // Apply date filters
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
      // Fetch audit reports from Firestore where send_to array contains current user's id
      const reportsQuery = query(
        collection(db, 'audit_reports'),
        where('send_to', 'array-contains', parseInt(id)),
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsData = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setAuditReports(reportsData);
      // Tentative default; may be adjusted after role detection below
      const currentMonth = String(new Date().getMonth() + 1);
      const currentYear = String(new Date().getFullYear())

      const filteredReports = applyFilters(reportsData, currentMonth, 'All', currentYear);
      setFilteredReports(filteredReports);
      return reportsData;
    } catch (err) {
      console.error('Error fetching inbox reports:', err);
      setError('Failed to load inbox reports');
    }
  }, [applyFilters, id]);

  const getCompletedReportsCount = useCallback(async () => {
    try {
      if (!id) {
        setCompletedCount(0);
        return 0;
      }

      // Get user's completion stats from the user_completion_stats collection
      const userStatsRef = doc(db, 'user_completion_stats', id.toString());
      const userStatsSnap = await getDoc(userStatsRef);

      if (!userStatsSnap.exists()) {
        setCompletedCount(0);
        return 0;
      }

      const userData = userStatsSnap.data();
      const completions = Array.isArray(userData?.completions) ? userData.completions : [];

      // Filter completions by selected month and year
      const year = parseInt(selectedYear === 'all' ? new Date().getFullYear() : selectedYear);
      const month = selectedMonth === 'All' ? null : parseInt(selectedMonth) - 1; // Convert to 0-based index

      let filteredCompletions = completions;

      if (selectedYear !== 'all' || selectedMonth !== 'All') {
        filteredCompletions = completions.filter(completion => {
          if (!completion.completedAt) return false;

          const completionDate = new Date(completion.completedAt);
          const completionYear = completionDate.getFullYear();
          const completionMonth = completionDate.getMonth();

          // Check year match
          if (selectedYear !== 'all' && completionYear !== year) return false;

          // Check month match
          if (selectedMonth !== 'All' && completionMonth !== month) return false;

          return true;
        });
      }

      const totalCount = filteredCompletions.length;
      setCompletedCount(totalCount);
      return totalCount;
    } catch (err) {
      console.error('Error counting completed reports:', err);
      setCompletedCount(0);
      return 0;
    }
  }, [selectedMonth, selectedYear, id]);

  // Function to fetch completed reports for display in main table
  const fetchCompletedReports = useCallback(async () => {
    try {
      setLoadingCompleted(true);

      if (!id) {
        setCompletedReports([]);
        return;
      }

      // Get user's completion stats from the user_completion_stats collection
      const userStatsRef = doc(db, 'user_completion_stats', id.toString());
      const userStatsSnap = await getDoc(userStatsRef);

      if (!userStatsSnap.exists()) {
        setCompletedReports([]);
        return;
      }

      const userData = userStatsSnap.data();
      const completions = Array.isArray(userData?.completions) ? userData.completions : [];

      // Filter completions by selected month and year
      const year = parseInt(selectedYear === 'all' ? new Date().getFullYear() : selectedYear);
      const month = selectedMonth === 'All' ? null : parseInt(selectedMonth) - 1; // Convert to 0-based index

      let filteredCompletions = completions;

      if (selectedYear !== 'all' || selectedMonth !== 'All') {
        filteredCompletions = completions.filter(completion => {
          if (!completion.completedAt) return false;

          const completionDate = new Date(completion.completedAt);
          const completionYear = completionDate.getFullYear();
          const completionMonth = completionDate.getMonth();

          // Check year match
          if (selectedYear !== 'all' && completionYear !== year) return false;

          // Check month match
          if (selectedMonth !== 'All' && completionMonth !== month) return false;

          return true;
        });
      }

      // Sort by completion date (newest first)
      filteredCompletions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      // Format completions to match the main table structure
      const formattedReports = filteredCompletions.map((completion, index) => ({
        id: completion.reportId || `completed-${index}`,
        // incident_type: completion.incidentType || 'N/A',
        location: completion.location || 'N/A',
        description: completion.description || 'N/A',
        created_at: completion.created_at || 'N/A',
        department: 'N/A',
        assigned_supervisor: completion.assigned_supervisor || 'N/A',
        completed_at: completion.completedAt,
        completed: true,
        status: 'completed',
        send_to: [parseInt(id)], // Current user was involved
        // completedBy: completion.completedBy || 'N/A'
      }));

      setCompletedReports(formattedReports);
    } catch (err) {
      console.error('Error fetching completed reports:', err);
      setCompletedReports([]);
    } finally {
      setLoadingCompleted(false);
    }
  }, [selectedMonth, selectedYear, id]);

  useEffect(() => {
    // Count completed reports when month, year, or id changes
    if (id) {
      getCompletedReportsCount();
    }
  }, [getCompletedReportsCount, id]);

  // Update filteredReports when completedReports changes and user is on completed filter
  useEffect(() => {
    if (selectedFilter === 'completed' && completedReports.length >= 0) {
      setFilteredReports(completedReports);
    }
  }, [completedReports, selectedFilter]);

  // Role detection: Supervisor via cached Redux flag (no Firestore read)
  useEffect(() => {
    setIsSupervisor(user?.isSupervisor === true);
  }, [user?.isSupervisor]);


  /*
   * Disabled temporarily: Supervisor role detection via Firestore
   * Kept here for reference/fallback. We're using the cached Redux flag instead.
   *
   * useEffect(() => {
   *   const checkSupervisor = async () => {
   *     try {
   *       if (!id) { setIsSupervisor(false); return; }
   *       const { doc, getDoc } = await import('firebase/firestore');
   *       const { db } = await import('../firebase/firebaseConfig');
   *       const supervisorsRef = doc(db, 'assigned_list', 'supervisors');
   *       const supervisorsSnap = await getDoc(supervisorsRef);
   *       if (!supervisorsSnap.exists()) { setIsSupervisor(false); return; }
   *       const data = supervisorsSnap.data();
   *       const list = Array.isArray(data?.supervisors_id) ? data.supervisors_id : [];
   *       setIsSupervisor(list.map(String).includes(String(id)));
   *     } catch (e) {
   *       console.error('Error checking supervisor role:', e);
   *       setIsSupervisor(false);
   *     }
   *   };
   *   checkSupervisor();
   * }, [id]);
   */

  // Role detection: Chief via cached departments list from Redux (no Firestore read)
  useEffect(() => {
    if (!id) { setIsChief(false); return; }
    const list = Array.isArray(departments) ? departments : [];
    const match = list.some((d) => String(d?.chief_code) === String(id));
    setIsChief(match);
  }, [departments, id]);

  /*
   * Disabled temporarily: Chief role detection via Firestore departments queries
   * Kept here for reference/fallback. We're using the cached departments list instead.
   *
   * useEffect(() => {
   *   const checkChief = async () => {
   *     try {
   *       if (!id) { setIsChief(false); return; }
   *       const { collection, getDocs, query, where } = await import('firebase/firestore');
   *       const { db } = await import('../firebase/firebaseConfig');
   *       const numId = parseInt(id);
   *       let snap = await getDocs(query(collection(db, 'departments'), where('chief_code', '==', numId)));
   *       if (snap.empty) {
   *         snap = await getDocs(query(collection(db, 'departments'), where('chief_code', '==', String(id))));
   *       }
   *       setIsChief(!snap.empty);
   *     } catch (e) {
   *       console.error('Error checking chief role:', e);
   *       setIsChief(false);
   *     }
   *   };
   *   checkChief();
   * }, [id]);
   */

  // Apply default filter once roles and reports are known
  useEffect(() => {
    if (defaultFilterApplied) return;
    if (!auditReports || auditReports.length === 0) return;

    if (isChief) {
      setSelectedFilter('assigned');
      setFilteredReports(applyFilters(auditReports, 'assigned', selectedMonth, selectedYear));
      setDefaultFilterApplied(true);
    } else if (isSupervisor) {
      setSelectedFilter('rectifying');
      setFilteredReports(applyFilters(auditReports, 'rectifying', selectedMonth, selectedYear));
      setDefaultFilterApplied(true);
    }
  }, [isChief, isSupervisor, auditReports, applyFilters, selectedMonth, selectedYear, defaultFilterApplied]);

  useEffect(() => {
    const loadInboxData = async () => {
      try {
        setLoading(true);
        // Fetch assigned reports for current user
        await getAuditReports();
      } catch (err) {
        console.error('Error loading inbox:', err)
        setError('Failed to load inbox data')
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadInboxData()
    } else {
      // If no ID yet (Redux not loaded), stop loading
      setLoading(false);
    }
  }, [id, getAuditReports]);

  // Show loading screen while fetching data or waiting for user
  if (loading || !id) {
    return (
      <div className="inbox-loading-container">
        <div className="inbox-loading-content">
          <div className="inbox-loading-spinner"></div>
          <p className="inbox-loading-text">{!id ? 'Loading user data...' : 'Loading inbox data...'}</p>
        </div>
      </div>
    )
  }

  // Show error if data failed to load
  if (error) {
    return (
      <div className="inbox-error-container">
        <div className="inbox-error-content">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  // Authorization is handled by InboxProtectedRoute wrapper, so we can proceed directly to rendering


  return (
    <div className="inbox-container">
      {/* Header */}
      <div className="inbox-header">
        <button
          className="inbox-back-button"
          onClick={() => navigate(-1)}
          style={{ backgroundColor: colors.primary }}
        >
          <svg viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
            <path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <div className="inbox-header-title-section">
          <div className="inbox-header-info">
            <span className="inbox-user-name"> {user?.displayName || user?.email || 'User'}</span>
            <span className="inbox-total-reports-count">Assigned to me: {auditReports.length} Reports</span>
          </div>
        </div>
        <div className="inbox-header-buttons">
          <button
            className="inbox-export-button"
            onClick={() => {
              try {
                const toExport = auditReports || [];
                const headers = [
                  'Report ID',
                  'Date',
                  'Created At',
                  'Location',
                  'Description',
                  'Status',
                  'Assigned Department',
                  'Assigned Supervisor',
                  'Completed At',
                  'Rectified By',
                ];
                const escape = (val) => {
                  const str = (val ?? '').toString();
                  return '"' + str.replace(/"/g, '""') + '"';
                };
                const rows = toExport.map((r) => {
                  const displayStatus = r?.completed ? 'completed' : (r?.status || 'pending');
                  const formattedDate = r?.date ? new Date(r.date).toLocaleDateString() : '';
                  const formattedCreated = r?.created_at ? new Date(r.created_at).toLocaleString() : '';
                  const completedAt = r?.completed_at ? new Date(r.completed_at).toLocaleString() : '';
                  return [
                    r?.id || '',
                    formattedDate,
                    formattedCreated,
                    r?.location || '',
                    r?.description || '',
                    displayStatus,
                    r?.assigned_department || '',
                    r?.assigned_supervisor || '',
                    completedAt,
                    r?.rectified_by || '',
                  ];
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
                link.download = `InboxReports_${yyyy}-${mm}-${dd}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error('Export error:', err);
                alert('Failed to export file.');
              }
            }}
            title="Export inbox reports to Excel"
            disabled={true}
          // disabled={!auditReports || auditReports.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7z" />
            </svg>
          </button>
          <button
            className="inbox-refresh-button"
            onClick={async () => {
              setRefreshing(true);
              try {
                if (selectedFilter === 'completed') {
                  // Refresh completed reports and count
                  await fetchCompletedReports();
                  await getCompletedReportsCount();
                  // Update cache state
                  setCompletedReportsCached(true);
                  setCachedCompletedFilters({ month: selectedMonth, year: selectedYear });
                } else {
                  // Refresh regular reports
                  const freshReports = await getAuditReports();
                  if (freshReports) {
                    const filteredReports = applyFilters(freshReports, selectedFilter, selectedMonth, selectedYear);
                    setFilteredReports(filteredReports);
                  }
                  // Also refresh completed count
                  await getCompletedReportsCount();
                }
              } catch (error) {
                console.error('Error refreshing data:', error);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            title="Refresh Data"
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20" className={refreshing ? 'inbox-spinning' : ''}>
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
            </svg>
          </button>
          <button
            className="inbox-home-button "
            onClick={() => navigate('/home')}
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="inbox-filter-buttons">
        {(isChief || !isSupervisor) && (
          <button
            className={`inbox-filter-button ${selectedFilter === 'assigned' ? 'active' : ''} ${isChief ? 'inbox-yellow' : ''}`}
            onClick={() => {
              setSelectedFilter('assigned');
              const filteredReports = applyFilters(auditReports, 'assigned', selectedMonth, selectedYear);
              setFilteredReports(filteredReports);
            }}
          >
            {isChief ? 'Inbox' : `Assigned to chief (${applyFilters(auditReports, 'assigned', selectedMonth, selectedYear).length})`}
            {!isChief && ''}
            {isChief && ` (${applyFilters(auditReports, 'assigned', selectedMonth, selectedYear).length})`}
          </button>
        )}
        <button
          className={`inbox-filter-button ${selectedFilter === 'rectifying' ? 'active' : ''} ${(!isChief && isSupervisor) ? 'inbox-green' : ''}`}
          onClick={() => {
            setSelectedFilter('rectifying');
            const filteredReports = applyFilters(auditReports, 'rectifying', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          {(!isChief && isSupervisor) ? 'Inbox' : 'Rectifying by Supervisor'} ({applyFilters(auditReports, 'rectifying', selectedMonth, selectedYear).length})
        </button>
        <button
          className={`inbox-filter-button ${selectedFilter === 'verifying' ? 'active' : ''}`}
          onClick={() => {
            setSelectedFilter('verifying');
            const filteredReports = applyFilters(auditReports, 'verifying', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          <span className="inbox-filter-text-full">Waiting for Verification ({applyFilters(auditReports, 'verifying', selectedMonth, selectedYear).length})</span>
          <span className="inbox-filter-text-short">Verifying ({applyFilters(auditReports, 'verifying', selectedMonth, selectedYear).length})</span>
        </button>
        <button
          className={`inbox-filter-button ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setSelectedFilter('all');
            const filteredReports = applyFilters(auditReports, 'all', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          All ({applyFilters(auditReports, 'all', selectedMonth, selectedYear).length})
        </button>
        <button
          className={`inbox-filter-button ${selectedFilter === 'completed' ? 'active' : ''}`}
          onClick={async () => {
            setSelectedFilter('completed');
            
            // Check if we have cached data for current filters
            const currentFilters = { month: selectedMonth, year: selectedYear };
            const filtersChanged = 
              cachedCompletedFilters.month !== currentFilters.month || 
              cachedCompletedFilters.year !== currentFilters.year;
            
            // Only fetch if not cached or filters changed
            if (!completedReportsCached || filtersChanged) {
              await fetchCompletedReports();
              setCompletedReportsCached(true);
              setCachedCompletedFilters(currentFilters);
            }
            // Don't set filteredReports here - let the useEffect handle it
          }}
          disabled={loadingCompleted}
        >
          {loadingCompleted ? 'Loading...' : `Completed (${completedCount})`}
        </button>


        {/* Date Filters in same row */}
        <div className="inbox-date-filters-inline">
          <div className="filter-group">
            <label className="inbox-filter-label">Year:</label>
            <select
              className="inbox-date-filter-select"
              value={selectedYear}
              onChange={async (e) => {
                setSelectedYear(e.target.value);
                if (selectedFilter === 'completed') {
                  // Re-fetch completed reports with new year filter
                  await fetchCompletedReports();
                  setCachedCompletedFilters({ month: selectedMonth, year: e.target.value });
                } else {
                  const filteredReports = applyFilters(auditReports, selectedFilter, selectedMonth, e.target.value);
                  setFilteredReports(filteredReports);
                }
              }}
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="inbox-filter-label">Month:</label>
            <select
              className="inbox-date-filter-select"
              value={selectedMonth}
              onChange={async (e) => {
                setSelectedMonth(e.target.value);
                if (selectedFilter === 'completed') {
                  // Re-fetch completed reports with new month filter
                  await fetchCompletedReports();
                  setCachedCompletedFilters({ month: e.target.value, year: selectedYear });
                } else {
                  const filteredReports = applyFilters(auditReports, selectedFilter, e.target.value, selectedYear);
                  setFilteredReports(filteredReports);
                }
              }}
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

        </div>
      </div>

      {/* Reports: Cards or Table */}
      {filteredReports.length === 0 ? (
        <div className="inbox-empty-state">
          <h3>No {selectedFilter === 'all' ? 'Assigned Reports' : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1) + ' Reports'} Found</h3>
          <p>{selectedFilter === 'all' ? 'No reports have been assigned to you yet.' : `No ${selectedFilter} reports found in your assignments.`}</p>
        </div>
      ) : (

        <div className="inbox-reports-table-wrapper">
          <table className="inbox-reports-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Description</th>
                <th>Created At</th>
                <th>Department</th>
                <th>Assigned Supervisor</th>
                <th>Status</th>
                <th>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const displayStatus = report.completed ? 'completed' : (report.status || 'pending');
                return (
                  <tr key={report.id}
                    className="inbox-report-row"
                    onClick={() => navigate('/audit-report-details-assigned', { state: { report } })}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{report.location || 'N/A'}</td>
                    <td>{report.description || 'No description'}</td>
                    {/* <td>{report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}</td> */}
                    <td>{report.created_at ? report.created_at : 'N/A'}</td>
                    <td>{report.assigned_department || '—'}</td>
                    <td>{report.assigned_supervisor || '—'}</td>
                    <td>
                      <span className={`inbox-status-badge ${displayStatus}`}>{displayStatus}</span>
                    </td>
                    <td>{report.completed_at ? new Date(report.completed_at).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

export default Inbox
