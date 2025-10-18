
import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './AllAuditReports.css';


function AllAuditReports() {

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const id = user?.companyId;
  const [reports, setReports] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [safetyofficers, setSafetyOfficers] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [auditReports, setAuditReports] = useState([]);
  const [employees, setEmployees] = useState([]);

  const getAuditReports = async () => {
    try {
      // Fetch audit reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('audit_reports')
        .select('*')
        .order('date', { ascending: false });

      if (reportsError) {
        console.error('Error fetching audit reports:', reportsError);
        setError('Failed to load audit reports');
        return [];
      }

      // Fetch employees data
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('emp_code, first_name, last_name, job_title');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        setError('Failed to load employee data');
        return [];
      }

      // Create employee lookup map
      const employeeMap = {};
      employeesData.forEach(emp => {
        employeeMap[emp.emp_code] = emp;
      });

      // Merge reports with employee data
      const reportsWithEmployees = reportsData.map(report => ({
        ...report,
        employee: employeeMap[report.emp_code] || null
      }));

      setEmployees(employeesData);
      setAuditReports(reportsWithEmployees);
      console.log('Audit reports with employees:', reportsWithEmployees);
      return reportsWithEmployees;
    } catch (err) {
      console.error('Error fetching audit reports:', err);
      setError('Failed to load audit reports');
    }
  };

  useEffect(() => {
    const getSafetyOfficers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('safetyofficers')  // 👈 your table name
          .select('*')              // fetch all columns

        if (error) {
          console.error('Error fetching safety officers:', error)
          setError('Failed to load authorization data')
          return []
        }

        setSafetyOfficers(data)
        console.log('Safety officers:', data)
        
        // Check if current user's company ID exists in safety officers array

        const userAuthorized = data.some(officer => {
          console.log('===========officer===============');
          console.log('Officer emp_code:', officer.emp_code, 'type:', typeof officer.emp_code);
          console.log('User ID:', id, 'type:', typeof id);
          console.log('====================================');
          
        // Convert both to strings for comparison or use parseInt on id
        return String(officer.emp_code) === String(id) || officer.emp_code === parseInt(id);
      });
      setIsAuthorized(userAuthorized);
      
      // If authorized, fetch audit reports
      if (userAuthorized) {
        await getAuditReports();
      }      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      getSafetyOfficers()
    }
  }, [id]);

  // Show loading screen while fetching data
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading authorization data...</p>
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
            You are not authorized to view this page.
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
          <h1 className="page-title">All Audit Reports</h1>
          <span className="total-reports-count">Total: {auditReports.length} Reports</span>
        </div>
        <button
          className="home-button"
          onClick={() => navigate('/home')}
        >
          <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </button>
      </div>

      {/* Reports Cards */}
      {auditReports.length === 0 ? (
        <div className="empty-state">
          <h3>No Audit Reports Found</h3>
          <p>No audit reports have been submitted yet.</p>
        </div>
      ) : (
        <div className="reports-cards-container">
          {auditReports.map((report, index) => (
            <div key={index} className="audit-report-card">
              <div 
                className="card-clickable-area"
                onClick={() => navigate('/audit-report-details', { state: { report } })}
              >
                <div className="card-header">
                  <div className="employee-info">
                    <div className="employee-name">
                      {report.employee ? 
                        `${report.employee.first_name} ${report.employee.last_name}` : 
                        `Code: ${report.emp_code || 'N/A'}`
                      }
                    </div>
                    {report.employee && (
                      <div className="employee-job-title">
                        {report.employee.job_title}
                      </div>
                    )}
                  </div>
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

export default AllAuditReports
