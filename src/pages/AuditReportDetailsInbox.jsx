import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from './supabaseClient';
import { colors } from '../constants/color';
import './AuditReportDetailsInbox.css';

const AuditReportDetailsInbox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const report = location.state?.report;

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChief, setIsChief] = useState(false);
  const [employeesUnderChief, setEmployeesUnderChief] = useState([]);
  const [safetyOfficer, setSafetyOfficer] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [reportStatus, setReportStatus] = useState('pending');
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const user = useSelector(state => state.auth.user);

  const fetchMessages = useCallback(async () => {
    try {
      // Fetch current messages, status, assigned department, and completed status from the report
      const { data: reportData, error } = await supabase
        .from('audit_reports')
        .select('messages, status, assigned_department, completed')
        .eq('id', report.id)
        .single();

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(reportData?.messages || []);
 

      setReportStatus(reportData?.status || 'pending');
 
      setAssignedDepartment(reportData?.assigned_department || '');
      setIsCompleted(reportData?.completed || false);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [report.id]);

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setLoading(true);

        // Check if user is chief in departments table
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departments')
          .select('chief_code')
          .eq('chief_code', user?.companyId);

        if (departmentsError) {
          console.error('Error fetching departments:', departmentsError);
        }

        const isChiefInDepartments = departmentsData && departmentsData.length > 0;
 
        // Fetch supervisors data
        const { data: supervisorsData, error: supervisorsError } = await supabase
          .from('supervisors')
          .select('emp_code, chief_code, emp_name, chief_name');

        if (supervisorsError) {
          console.error('Error fetching supervisors:', supervisorsError);
          return;
        }

 
        // Check if current user ID is a chief_code in supervisors table
        const userIsChiefInSupervisors = supervisorsData.some(supervisor =>
          String(supervisor.chief_code) === String(user?.companyId)
        );

        // User is chief if they are chief in either departments or supervisors table
        const userIsChief = isChiefInDepartments || userIsChiefInSupervisors;
        setIsChief(userIsChief);

        if (userIsChief) {
          // Get employees under this chief
          const employeesUnderMe = supervisorsData.filter(supervisor =>
            String(supervisor.chief_code) === String(user?.companyId)
          );
          setEmployeesUnderChief(employeesUnderMe);
         }  

       } catch (err) {
        console.error('Error fetching supervisors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisors();
    fetchMessages();
  }, [report.id, fetchMessages, user?.companyId]);

  if (!report) {
    return (
      <div className="details-container">
        <div className="error-message">
          <h2>Report not found</h2>
          <p>The requested audit report could not be found.</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="details-container">
      {/* Header */}
      <div className="details-header">
        <button
          className="details-back-button"
          onClick={() => navigate(-1)}
          style={{ backgroundColor: colors.primary }}
        >
          <svg viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
            <path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h1 className="details-title">Audit Report Details</h1>
        <button
          className="details-home-button"
          onClick={() => navigate('/home')}
        >
          <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>
      </div>

      {/* Chief Status Display */}
      {isChief && (
        <div style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(40, 167, 69, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px', gap: '12px' }}>
            <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>You are a Department Chief</span>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="details-content">
        <div className="details-card">
          {/* Employee Information */}


          {/* Report Status */}
          <div className="details-section">
            <h3 className="section-title">Report Status</h3>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className={`status-badge ${reportStatus}`}>
                {reportStatus}
                {/* {reportStatus === 'assigned' ? 'Assigned' : 'Pending'} */}
                {assignedDepartment && (
                  <span className="assigned-department">
                    {' By Safety |Assigned to '}
                    {assignedDepartment}
                  </span>
                )}
              </span>
            </div>

            {isCompleted && (
              <div className="completion-notice">
                <span className="completed-badge">✓ Completed</span>
              </div>
            )}
          </div>

          {/* Location & Date */}
          <div className="details-section">
            <h3 className="section-title">Location & Date</h3>
            <div className="info-row">
              <span className="info-label">Location:</span>
              <span className="info-value">
                <svg viewBox="0 0 24 24" fill="#666" width="16" height="16" className="location-icon">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {report.location || 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Date:</span>
              <span className="info-value">
                <svg viewBox="0 0 24 24" fill="#666" width="16" height="16" className="date-icon">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
                {report.date ? new Date(report.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="details-section">
            <h3 className="section-title">Description</h3>
            <div className="description-content">
              <p className="full-description">
                {report.description || 'No description available'}
              </p>
            </div>
          </div>

          {/* Image Section */}
          {report.image_url && (
            <div className="details-section">
              <h3 className="section-title">Attached Image</h3>
              <div className="image-container">
                <img
                  src={report.image_url}
                  alt="Audit report"
                  className="details-image"
                  onClick={() => window.open(report.image_url, '_blank')}
                />
                <p className="image-caption">Click image to view full size</p>
              </div>
            </div>
          )}

          {/* Report Metadata */}
          <div className="details-section">
            <h3 className="section-title">Report Information</h3>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">Report ID:</span>
                <span className="metadata-value">{report.id || 'N/A'}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Created:</span>
                <span className="metadata-value">
                  {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Employee Selector */}
          <div className="details-section">
            <h3 className="section-title">Employee Assignment</h3>
            <div className="department-selector-container">
              <label className="selector-label" htmlFor="employee-select">
                {isCompleted ? 'Final Employee:' : (isChief ? 'Select Employee:' : 'No employees to assign')}
              </label>
              {isChief ? (
                <select
                  id="employee-select"
                  className="department-select"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  disabled={loading || isCompleted}
                >
                  <option value="">Choose an employee...</option>
                  {employeesUnderChief.map((employee) => (
                    <option key={employee.emp_code} value={employee.emp_code}>
                      {employee.emp_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="no-assignment-available">
                  <p>You are not authorized to assign employees.</p>
                </div>
              )}

              {isCompleted && (
                <div className="completion-notice-dept">
                  <span className="notice-text">
                    ✓ This report has been completed and is now closed. No further modifications are allowed.
                  </span>
                </div>
              )}

              {selectedEmployee && (
                <div className="selected-department-info">
                  {(() => {
                    const selected = employeesUnderChief.find(emp => emp.emp_code === selectedEmployee);
                    return selected ? (
                      <div className="department-details">
                        <div className="dept-info-row">
                          <span className="dept-label">Selected Employee:</span>
                          <span className="dept-value">{selected.emp_name}</span>
                        </div>

                        <div className="dept-info-row">
                          <span className="dept-label">Employee Code:</span>
                          <span className="dept-value">{selected.emp_code}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {loading && (
                <div className="loading-departments">
                  Loading departments...
                </div>
              )}
            </div>
          </div>

          {/* Safety Officer Input */}


          {/* Message History */}
          <div className="details-section">
            <h3 className="section-title">Message History</h3>
            <div className="message-history-container">
              {messages.length === 0 ? (
                <p className="no-messages">No messages yet.</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="message-item">
                    <div className="message-header">
                      <span className="message-sender">Sender: {msg.id}</span>
                      <span className="message-date">
                        {new Date(msg.timestamp).toLocaleDateString()} {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                    {msg.department && (
                      <div className="message-department">
                        Department: {msg.department.name} ({msg.department.dept_code})
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="details-section">
            {
              reportStatus === 'assigned' && (
                <>
                  <h3 className="section-title">Assignment Message</h3>
                  <div className="safety-officer-container">

                    <input
                      id="safety-officer-input"
                      type="text"
                      className="safety-officer-input"
                      value={safetyOfficer}
                      onChange={(e) => {
                        setSafetyOfficer(e.target.value);
                       }}
                      placeholder={isCompleted ? "Report completed - messaging disabled" : " write a message..."}
                      disabled={isCompleted}
                    />
                  </div>
                </>

              )
            }

          </div>
        </div>

      </div>


      {/* Action Button - Fixed at Bottom */}
      <div className="send-message-bottom">
        {isChief ? (
          /* Chief users: Send Message button */
          <button
            className="send-message-button-bottom"
            onClick={async () => {
              if (!selectedEmployee) {
                alert('Please select an employee before sending the message.');
                return;
              }

              if (!safetyOfficer.trim()) {
                alert('Please enter a message before sending.');
                return;
              }

              try {
                setSending(true);

                // Get current messages and sent_to arrays from the report
                const { data: currentReport, error: fetchError } = await supabase
                  .from('audit_reports')
                  .select('messages, sent_to')
                  .eq('id', report.id)
                  .single();

                if (fetchError) {
                  console.error('Error fetching current report:', fetchError);
                  alert('Failed to fetch current report data.');
                  return;
                }

                // Create new message object
                const newMessage = {
                  id: user?.displayName || user?.id || 'unknown',
                  message: safetyOfficer.trim(),
                  timestamp: new Date().toISOString()
                };

                // Add new message to existing messages array
                const updatedMessages = currentReport.messages || [];
                updatedMessages.push(newMessage);

                // Find the selected employee data from supervisors table
                const selectedEmployeeData = employeesUnderChief.find(emp =>
                  String(emp.emp_code) === String(selectedEmployee)
                );

                if (!selectedEmployeeData) {
                  alert('Selected employee not found in supervisors data.');
                  console.error('Could not find employee with emp_code:', selectedEmployee);
                  return;
                }

                // Update sent_to array with selected employee's emp_code
                const currentSentTo = currentReport.sent_to || [];
                const employeeCode = parseInt(selectedEmployee);

                // Add employee code to sent_to array if it isn't already there
                if (!currentSentTo.includes(employeeCode)) {
                  currentSentTo.push(employeeCode);
                }

                // Update the report with new messages array, sent_to array, and status
                const { error: updateError } = await supabase
                  .from('audit_reports')
                  .update({
                    messages: updatedMessages,
                    sent_to: currentSentTo,
                    status: 'assigned'
                  })
                  .eq('id', report.id);

                if (updateError) {
                  console.error('Error updating report:', updateError);
                  alert('Failed to send message.');
                  return;
                }

                 alert('Message sent successfully!');
                setSafetyOfficer(''); // Clear the input
                fetchMessages(); // Refresh message history

              } catch (error) {
                console.error('Error sending message:', error);
                alert('An error occurred while sending the message.');
              } finally {
                setSending(false);
              }
            }}
            disabled={sending || !safetyOfficer.trim() || !selectedEmployee || isCompleted}
          >
            {isCompleted ? 'Report Completed' : (sending ? 'Sending...' : 'Send Message')}
          </button>
        ) : (
          /* Non-chief users (final stage): Mark as Completed button */
          <button
            className="mark-complete-button-bottom"
            onClick={async () => {
              if (!safetyOfficer.trim()) {
                alert('Please enter a message before marking as completed.');
                return;
              }

              try {
                setMarkingComplete(true);

                // Get current messages array from the report
                const { data: currentReport, error: fetchError } = await supabase
                  .from('audit_reports')
                  .select('messages')
                  .eq('id', report.id)
                  .single();

                if (fetchError) {
                  console.error('Error fetching current report:', fetchError);
                  alert('Failed to fetch current report data.');
                  return;
                }

                // Create new message object
                const newMessage = {
                  id: user?.displayName || user?.id || 'unknown',
                  message: safetyOfficer.trim(),
                  timestamp: new Date().toISOString()
                };

                // Add new message to existing messages array
                const updatedMessages = currentReport.messages || [];
                updatedMessages.push(newMessage);

                // Update the report with new message and status to 'verifying'
                const { error: updateError } = await supabase
                  .from('audit_reports')
                  .update({
                    messages: updatedMessages,
                    status: 'verifying'
                  })
                  .eq('id', report.id);

                if (updateError) {
                  console.error('Error updating report:', updateError);
                  alert('Failed to mark as completed.');
                  return;
                }

                 alert('Report marked as completed successfully!');
                setSafetyOfficer(''); // Clear the input
                fetchMessages(); // Refresh message history

              } catch (error) {
                console.error('Error marking as completed:', error);
                alert('An error occurred while marking as completed.');
              } finally {
                setMarkingComplete(false);
              }
            }}
            disabled={markingComplete || !safetyOfficer.trim() || isCompleted}
          >
            {isCompleted ? 'Report Completed' : (markingComplete ? 'Marking Complete...' : 'Mark as Completed')}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuditReportDetailsInbox;