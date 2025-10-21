import React, { useState, useEffect, useCallback } from 'react'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './AllAuditReports.css';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig';

function Inbox() {

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const id = user?.companyId;
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [auditReports, setAuditReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('assigned');
  const [refreshing, setRefreshing] = useState(false);
  const [isChief, setIsChief] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [defaultFilterApplied, setDefaultFilterApplied] = useState(false);

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
 
 

      // Fetch employees data
      // const { data: employeesData, error: employeesError } = await supabase
      //   .from('employees')
      //   .select('emp_code, first_name, last_name, job_title');

      // if (employeesError) {
      //   console.error('Error fetching employees:', employeesError);
      //   setError('Failed to load employee data');
      //   return [];
      // }

      // // Create employee lookup map
      // const employeeMap = {};
      // employeesData.forEach(emp => {
      //   employeeMap[emp.emp_code] = emp;
      // });

      // // Merge reports with employee data
      // const reportsWithEmployees = reportsData.map(report => ({
      //   ...report,
      //   employee: employeeMap[report.emp_code] || null
      // }));

      setAuditReports(reportsData);
  // Tentative default; may be adjusted after role detection below
  const filteredReports = applyFilters(reportsData, 'assigned', 'All', '2025');
  setFilteredReports(filteredReports);
       return reportsData;
    } catch (err) {
      console.error('Error fetching inbox reports:', err);
      setError('Failed to load inbox reports');
    }
  }, [applyFilters, id]);

  // Role detection: Supervisor via assigned_list/supervisors
  useEffect(() => {
    const checkSupervisor = async () => {
      try {
        if (!id) { setIsSupervisor(false); return; }
        const supervisorsRef = doc(db, 'assigned_list', 'supervisors');
        const supervisorsSnap = await getDoc(supervisorsRef);
        if (!supervisorsSnap.exists()) { setIsSupervisor(false); return; }
        const data = supervisorsSnap.data();
        const list = Array.isArray(data?.supervisors_id) ? data.supervisors_id : [];
        setIsSupervisor(list.map(String).includes(String(id)));
      } catch (e) {
        console.error('Error checking supervisor role:', e);
        setIsSupervisor(false);
      }
    };
    checkSupervisor();
  }, [id]);

  // Role detection: Chief via departments collection (chief_code == user id)
  useEffect(() => {
    const checkChief = async () => {
      try {
        if (!id) { setIsChief(false); return; }
        // Try numeric match first
        const numId = parseInt(id);
        let snap = await getDocs(query(collection(db, 'departments'), where('chief_code', '==', numId)));
        if (snap.empty) {
          // Fallback: try string match if stored as string in Firestore
          snap = await getDocs(query(collection(db, 'departments'), where('chief_code', '==', String(id))));
        }
        setIsChief(!snap.empty);
      } catch (e) {
        console.error('Error checking chief role:', e);
        setIsChief(false);
      }
    };
    checkChief();
  }, [id]);

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
        // For Inbox, any authenticated user can see their assigned reports
        setIsAuthorized(true);
        
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
    }
  }, [id, getAuditReports]);

  // Show loading screen while fetching data
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading inbox data...</p>
        </div>
      </div>
    )
  }

  // Show error if data failed to load
  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  // Check authorization after data is loaded
  if(!isAuthorized){

    return(
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <div className="unauthorized-icon">
            <svg viewBox="0 0 24 24" fill="#dc3545" width="80" height="80">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
          <h1 className="unauthorized-title">Access Denied</h1>
          <p className="unauthorized-message">
            You are not authorized to view the inbox.
          </p>
          <p className="unauthorized-submessage">
            Please contact your administrator if you believe this is an error.
          </p>
          <button 
            className="unauthorized-button"
            onClick={() => navigate('/home')}
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }


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
          <h1 className="page-title">Inbox</h1>
          <div className="header-info">
            <span className="user-name">Welcome, {user?.displayName || user?.email || 'User'}</span>
            <span className="total-reports-count">Assigned to me: {auditReports.length} Reports</span>
          </div>
        </div>
        <div className="header-buttons">
          <button
            className="refresh-button"
            onClick={async () => {
              setRefreshing(true);
              try {
                await getAuditReports();
                // Re-apply current filters after refresh
                const filteredReports = applyFilters(auditReports, selectedFilter, selectedMonth, selectedYear);
                setFilteredReports(filteredReports);
              } catch (error) {
                console.error('Error refreshing data:', error);
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            title="Refresh Data"
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20" className={refreshing ? 'spinning' : ''}>
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
          </button>
          <button
            className="home-button"
            onClick={() => navigate('/home')}
          >
            <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons-container">
        {(isChief || !isSupervisor) && (
          <button
            className={`filter-button ${selectedFilter === 'assigned' ? 'active' : ''} ${isChief ? 'inbox-yellow' : ''}`}
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
          className={`filter-button ${selectedFilter === 'rectifying' ? 'active' : ''} ${(!isChief && isSupervisor) ? 'inbox-green' : ''}`}
          onClick={() => {
            setSelectedFilter('rectifying');
            const filteredReports = applyFilters(auditReports, 'rectifying', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          {(!isChief && isSupervisor) ? 'Inbox' : 'Rectifying by Supervisor'} ({applyFilters(auditReports, 'rectifying', selectedMonth, selectedYear).length})
        </button>
        <button
          className={`filter-button ${selectedFilter === 'verifying' ? 'active' : ''}`}
          onClick={() => {
            setSelectedFilter('verifying');
            const filteredReports = applyFilters(auditReports, 'verifying', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          <span className="filter-text-full">Waiting for Verification ({applyFilters(auditReports, 'verifying', selectedMonth, selectedYear).length})</span>
          <span className="filter-text-short">Verifying ({applyFilters(auditReports, 'verifying', selectedMonth, selectedYear).length})</span>
        </button>
        <button
          className={`filter-button ${selectedFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            setSelectedFilter('completed');
            const filteredReports = applyFilters(auditReports, 'completed', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          Completed ({applyFilters(auditReports, 'completed', selectedMonth, selectedYear).length})
        </button>
        <button
          className={`filter-button ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setSelectedFilter('all');
            const filteredReports = applyFilters(auditReports, 'all', selectedMonth, selectedYear);
            setFilteredReports(filteredReports);
          }}
        >
          All ({applyFilters(auditReports, 'all', selectedMonth, selectedYear).length})
        </button>
        
        {/* Date Filters in same row */}
        <div className="date-filters-inline">
          <div className="filter-group">
            <label className="filter-label">Year:</label>
            <select 
              className="date-filter-select"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                const filteredReports = applyFilters(auditReports, selectedFilter, selectedMonth, e.target.value);
                setFilteredReports(filteredReports);
              }}
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Month:</label>
            <select 
              className="date-filter-select"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                const filteredReports = applyFilters(auditReports, selectedFilter, e.target.value, selectedYear);
                setFilteredReports(filteredReports);
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
        </div>
      </div>

      {/* Reports Cards */}
      {filteredReports.length === 0 ? (
        <div className="empty-state">
          <h3>No {selectedFilter === 'all' ? 'Assigned Reports' : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1) + ' Reports'} Found</h3>
          <p>{selectedFilter === 'all' ? 'No reports have been assigned to you yet.' : `No ${selectedFilter} reports found in your assignments.`}</p>
        </div>
      ) : (
        <div className="reports-cards-container">
          {filteredReports.map((report, index) => (
            <div key={index} className="audit-report-card">
              <div className="card-status-bar">
                <span className={`card-status-badge ${report.status}`}>
                  { report.status }
                </span>
              </div>
              <div 
                className="card-clickable-area"
                onClick={() => navigate('/audit-report-details-assigned', { state: { report } })}
              >
                <div className="card-header">
 
                  <div className="report-date">
                    {report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="location-section">
                    <svg viewBox="0 0 24 24" fill="#666" width="16" height="16">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span className="location-text">{report.location || 'N/A'}</span>
                  </div>
                  
                  <div className="description-section">
                    <p className="description-text">
                      {report.description ? 
                        (report.description.length > 80 ? 
                          report.description.substring(0, 80) + '...' : 
                          report.description
                        ) : 'No description available'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {report.image_url && (
                <div className="card-image">
                  <img 
                    src={report.image_url} 
                    alt="Audit report" 
                    className="report-thumbnail"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(report.image_url, '_blank');
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Inbox
