import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateDoc } from 'firebase/firestore';
 import { collection, getDocs, query, where,   setDoc,  doc, getDoc } from 'firebase/firestore'
 import { colors } from '../constants/color';

import { db } from '../firebase/firebaseConfig';

import './AuditReportDetailsInbox.css';

const AuditReportDetailsInbox = () => {
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
  const [isSupervisor, setIsSupervisor] = useState(false);
  const user = useSelector(state => state.auth.user);
const navigate = useNavigate();
  const fetchMessages = useCallback(async () => {
    try {
  
      const docId = report.id;
 
      const reportRef = doc(db, 'audit_reports', docId);
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) {
        console.error('Report not found in Firestore');
        return;
      }
      const reportData = reportSnap.data();
      setMessages(reportData?.messages || []);
      setReportStatus(reportData?.status || 'pending');
      setAssignedDepartment(reportData?.assigned_department || '');
      setIsCompleted(reportData?.completed || false);
       } catch (err) {
      console.error('Error fetching messages from Firestore:', err);
    }
  }, [report.id,assignedDepartment]);

  useEffect(() => {
    const fetchSupervisors = async () => {
      if (!assignedDepartment) {
        setIsChief(false);
        setEmployeesUnderChief([]);
 
        return;
      }
      setLoading(true);
      try {

        const deptRef = doc(db, 'departments', assignedDepartment);
        const deptSnap = await getDoc(deptRef);
        if (deptSnap.exists()) {
          const deptData = deptSnap.data();
          const isChiefInDepartments = String(deptData.chief_code) === String(user?.companyId);
          setIsChief(isChiefInDepartments);
    
           setEmployeesUnderChief(isChiefInDepartments && Array.isArray(deptData.supervisors) ? deptData.supervisors : []);
 
        } else {
          setIsChief(false);
          setEmployeesUnderChief([]);
        }
      } catch (err) {
        setIsChief(false);
        setEmployeesUnderChief([]);
        console.error('Error fetching department doc from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
    fetchSupervisors();
  }, [report.id, fetchMessages, user?.companyId, assignedDepartment]);

  // Check if current user is a Supervisor from assigned_list/supervisors
  useEffect(() => {
    const checkSupervisor = async () => {
      try {
        if (!user?.companyId) {
          setIsSupervisor(false);
          return;
        }
        const supervisorsRef = doc(db, 'assigned_list', 'supervisors');
        const supervisorsSnap = await getDoc(supervisorsRef);
        if (!supervisorsSnap.exists()) {
          setIsSupervisor(false);
          return;
        }
        const data = supervisorsSnap.data();
        const list = Array.isArray(data?.supervisors_id) ? data.supervisors_id : [];
        const isSup = list.map(String).includes(String(user.companyId));
        setIsSupervisor(isSup);
      } catch (err) {
        console.error('Error checking supervisor list:', err);
        setIsSupervisor(false);
      }
    };
    checkSupervisor();
  }, [user?.companyId]);

  return (
    <div className="details-content">
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
      {/* Chief Badge */}
      {isChief  && (
        <div className="chief-status-banner">
          <div className="chief-status-content">
            <svg viewBox="0 0 24 24" fill="#fff" width="20" height="20">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="chief-status-text">You are a Department Chief</span>
          </div>
        </div>
      )}
      {/* Supervisor Badge (only if not Chief) */}
      {!isChief && isSupervisor && (
        <div className="chief-status-banner">
          <div className="chief-status-content">
            <svg viewBox="0 0 24 24" fill="#fff" width="20" height="20">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="chief-status-text">You are a Supervisor</span>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="details-card">
        {/* Report Status */}
        <div className="details-section">
          <h3 className="section-title">Report Status</h3>
          <div className="info-row">
            <span className="info-label">Status:</span>
            <span className={`status-badge ${reportStatus}`}>
              {reportStatus}
              {assignedDepartment && (
                <span className="assigned-department">
                  {'   |Assigned to '}
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
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                 }}
                disabled={loading || isCompleted}
              >
                <option value="">Choose Supervisor...</option>
                {employeesUnderChief.map((employee) => (
                  <option key={employee.emp_code} value={String(employee.emp_code)}>
                    {employee.name}
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

        {/* user  Input */}
        <div className="details-section">
          {
            (reportStatus === 'assigned' || reportStatus === 'rectifying') && (
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


      {/* Action Button - Fixed at Bottom */}
      {!isCompleted && (
        <div className="send-message-bottom">
          {/* Show both buttons for chief users */}
          {isChief ? (
            <>
            <button
              className="send-message-button-bottom"
              onClick={async () => {
                // if (!safetyOfficer.trim()) {
                //   alert('Please enter a message before sending.');
                //   return;
                // }

                try {
                  setSending(true);

                  // Get current messages array from the report
                  const { getDoc, doc } = await import('firebase/firestore');
                  const { db } = await import('../firebase/firebaseConfig');
                  const reportRef = doc(db, 'audit_reports', report.id);
                  const reportSnap = await getDoc(reportRef);

                  if (!reportSnap.exists()) {
                    console.error('Report not found in Firestore');
                    alert('Failed to send message. Report not found.');
                    return;
                  }

                  const reportData = reportSnap.data();

                  // Create new message object
                  const newMessage = {
                    id: user?.displayName || user?.id || 'unknown',
                    message: safetyOfficer.trim(),
                    timestamp: new Date().toISOString()
                  };

                  // Add new message to existing messages array
                  const updatedMessages = reportData.messages || [];
                  updatedMessages.push(newMessage);

                  // Determine the next department to send the report to
                  let currentSentTo = reportData.send_to || [];
                  if (!Array.isArray(currentSentTo)) {
                    currentSentTo = [currentSentTo];
                  }

                  // If the report is being sent to a supervisor, add them to the send_to array
                  if (selectedEmployee && !currentSentTo.includes(selectedEmployee)) {
                    currentSentTo.push(selectedEmployee);
                  }

                  // Ensure all values in currentSentTo are integers
                  currentSentTo = currentSentTo.map(val => parseInt(val, 10));

                  // Update the report with new message and status to 'rectifying'
                  await updateDoc(reportRef, {
                    messages: updatedMessages,
                    send_to: currentSentTo,
                    status: 'rectifying'
                  });

                  alert('Report sent to supervisor successfully!');
                  setSafetyOfficer(''); // Clear the input
                  // fetchMessages(); // Refresh message history
                  navigate('/inbox'); // Go back to the previous page

                } catch (error) {
                  console.error('Error sending report:', error);
                  alert('An error occurred while sending the report.');
                } finally {
                  setSending(false);
                }
              }}
              disabled={sending ||  !selectedEmployee || isCompleted}
            >
              {isCompleted ? 'Report Completed' : (sending ? 'Sending...' : 'Assign to Supervisor')}
            </button>
            <button
              className="mark-complete-button-bottom"
              onClick={async () => {
                // if (!safetyOfficer.trim()) {
                //   alert('Please enter a message before marking as completed.');
                //   return;
                // }

                try {
                  setMarkingComplete(true);

                  // Get current messages array from the report
                  const { getDoc, doc } = await import('firebase/firestore');
                  const { db } = await import('../firebase/firebaseConfig');
                  const reportRef = doc(db, 'audit_reports', report.id);
                  const reportSnap = await getDoc(reportRef);

                  if (!reportSnap.exists()) {
                    console.error('Report not found in Firestore');
                    alert('Failed to mark as completed. Report not found.');
                    return;
                  }

                  const reportData = reportSnap.data();

                  // Create new message object
                  const newMessage2 = {
                    id: user?.displayName || user?.id || 'unknown',
                    message: safetyOfficer.trim() || 'Marked as completed by chief',
                    timestamp: new Date().toISOString()
                  };

                  // Add new message to existing messages array
                  const updatedMessages = reportData.messages || [];
                  updatedMessages.push(newMessage2);

                  // Update the report with new message and status to 'verifying'
                  await updateDoc(reportRef, {
                    messages: updatedMessages,
                    status: 'verifying'
                  });

                  alert('Report marked as completed and waiting for verification!');
                  setSafetyOfficer(''); // Clear the input
                  // fetchMessages(); // Refresh message history
                  navigate('/inbox'); // Go back to the previous page

                } catch (error) {
                  console.error('Error marking as completed:', error);
                  alert('An error occurred while marking as completed.');
                } finally {
                  setMarkingComplete(false);
                }
              }}
              disabled={markingComplete  || isCompleted || reportStatus === 'verifying'}
            >
              {isCompleted ? 'Report Completed' : (markingComplete ? 'Marking Complete...' : 'Mark as Completed')}
            </button>
          </>
        ) : (
          <button
            className="mark-complete-button-bottom"
            onClick={async () => {
              // if (!safetyOfficer.trim()) {
              //   alert('Please enter a message before marking as completed.');
              //   return;
              // }

              try {
                setMarkingComplete(true);

                // Get current messages array from the report
                const { getDoc, doc } = await import('firebase/firestore');
                const { db } = await import('../firebase/firebaseConfig');
                const reportRef = doc(db, 'audit_reports', report.id);
                const reportSnap = await getDoc(reportRef);

                if (!reportSnap.exists()) {
                  console.error('Report not found in Firestore');
                  alert('Failed to mark as completed. Report not found.');
                  return;
                }

                const reportData = reportSnap.data();

                // Create new message object
                const newMessage2 = {
                  id: user?.displayName || user?.id || 'unknown',
                  message: safetyOfficer.trim() || 'Marked as completed.',
                  timestamp: new Date().toISOString()
                };

                // Add new message to existing messages array
                const updatedMessages = reportData.messages || [];
                updatedMessages.push(newMessage2);

                // Update the report with new message and status to 'verifying'
                await updateDoc(reportRef, {
                  messages: updatedMessages,
                  status: 'verifying'
                });

                alert('Report marked as completed and waiting for verification!');
                setSafetyOfficer(''); // Clear the input
                // fetchMessages(); // Refresh message history
                navigate('/inbox')

              } catch (error) {
                console.error('Error marking as completed:', error);
                alert('An error occurred while marking as completed.');
              } finally {
                setMarkingComplete(false);
              }
            }}
            disabled={markingComplete || isCompleted || reportStatus === 'verifying'} 
          >
            {isCompleted ? 'Report Completed' : (markingComplete ? 'Marking Complete...' : 'Mark as Completed')}
          </button>
        )}
        </div>
      )}
    </div>
  );
};

export default AuditReportDetailsInbox;