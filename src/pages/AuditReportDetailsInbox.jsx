import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { colors } from '../constants/color';

// Firestore db is dynamically imported in action handlers to avoid unused imports

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
  // Initialize from report passed via navigation (no Firestore fetch needed)
  useEffect(() => {
    if (!report) return;
    setMessages(Array.isArray(report.messages) ? report.messages : []);
    setReportStatus(report.status || 'pending');
    setAssignedDepartment(report.assigned_department || '');
    setIsCompleted(!!report.completed);
  }, [report]);

  // Determine chief/supervisors from cached departments in Redux (no Firestore read)
  const departments = useSelector(state => state.departments.list);
  const departmentsLoading = useSelector(state => state.departments.loading);
  
  useEffect(() => {
    if (!assignedDepartment) {
      setIsChief(false);
      setEmployeesUnderChief([]);
      return;
    }
    
    // Wait for departments to be loaded before checking
    if (departmentsLoading || !Array.isArray(departments) || departments.length === 0) {
      return;
    }
    
    setLoading(true);
    try {
      const deptData = departments.find(
        d => String(d?.dept_name) === String(assignedDepartment)
      );
      if (deptData) {
        const isChiefInDepartments = String(deptData.chief_code) === String(user?.companyId);
        setIsChief(isChiefInDepartments);
        setEmployeesUnderChief(isChiefInDepartments && Array.isArray(deptData.supervisors) ? deptData.supervisors : []);
      } else {
        setIsChief(false);
        setEmployeesUnderChief([]);
      }
    } finally {
      setLoading(false);
    }
  }, [assignedDepartment, departments, departmentsLoading, user?.companyId]);

  // Check if current user is a Supervisor using cached Redux flag (no Firestore fetch)
  useEffect(() => {
    if (user?.isSupervisor === true) {
      setIsSupervisor(true);
    } else {
      setIsSupervisor(false);
    }
  }, [user?.isSupervisor]);

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
      {/* {isChief && (
        <div className="chief-status-banner">
          <div className="chief-status-content">
            <svg viewBox="0 0 24 24" fill="#fff" width="20" height="20">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="chief-status-text">You are a Department Chief</span>
          </div>
        </div>
      )} */}
      {/* Supervisor Badge (only if not Chief) */}
      {/* {!isChief && isSupervisor && (
        <div className="chief-status-banner">
          <div className="chief-status-content">
            <svg viewBox="0 0 24 24" fill="#fff" width="20" height="20">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="chief-status-text">You are a Supervisor</span>
          </div>
        </div>
      )} */}

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
        {/* Corrective Action */}
        <div className="audit-details-section">
          <h3 className="audit-details-section-title">Corrective Action</h3>
          <div className="audit-details-description-content">
            <p className="audit-details-full-description">
              {report.corrective_action || 'No corrective action specified'}
            </p>
          </div>
        </div>

        {/* Image Section */}
        {report.image_url && (
          <div className="details-section">
            <h3 className="section-title">Attached Image</h3>
            <div className="image-container shareable">
              <img
                src={report.image_url}
                alt="Audit report"
                className="details-image"
                draggable={false}
                onClick={(e) => { e.preventDefault(); }}
                onContextMenu={(e) => { e.preventDefault(); }}
              />
              <button
                type="button"
                className="image-share-button"
                title="Share to WhatsApp"
                onClick={async () => {
                  const lines = [];
                  if (report.location) lines.push(`Location: ${report.location}`);
                  if (report.description) lines.push(`Description: ${report.description}`);
                  const textMessage = lines.join('\n');
                  try {
                    // Try Web Share API with image file (mobile browsers like Chrome on Android)
                    if (report.image_url && navigator.canShare) {
                      const resp = await fetch(report.image_url, { mode: 'cors' });
                      if (resp.ok) {
                        const blob = await resp.blob();
                        const mime = blob.type || 'image/jpeg';
                        const ext = mime.split('/')[1] || 'jpg';
                        const file = new File([blob], `audit-report.${ext}`, { type: mime });
                        if (navigator.canShare({ files: [file] })) {
                          await navigator.share({
                            files: [file],
                            text: textMessage,
                            title: 'Audit Report'
                          });
                          return;
                        }
                      }
                    }
                    // Fallback: WhatsApp text share with link
                    const fallbackText = textMessage + (report.image_url ? `\n${report.image_url}` : '');
                    const url = `https://wa.me/?text=${encodeURIComponent(fallbackText)}`;
                    window.open(url, '_blank');
                  } catch (err) {
                    console.error('Share failed:', err);
                    alert('Unable to share. Your browser may not support file sharing.');
                  }
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff" aria-hidden="true">
                  <path d="M20.52 3.48A11.85 11.85 0 0012.07 0C5.6 0 .35 5.25.35 11.72c0 2.06.54 4.07 1.57 5.86L0 24l6.62-1.9a11.68 11.68 0 005.45 1.39h.01c6.47 0 11.72-5.25 11.72-11.72 0-3.13-1.22-6.07-3.28-8.29zM12.07 21.3h-.01a9.6 9.6 0 01-4.89-1.34l-.35-.21-3.93 1.12 1.1-3.83-.23-.39a9.56 9.56 0 01-1.47-5.09c0-5.28 4.29-9.57 9.57-9.57a9.54 9.54 0 016.77 2.8 9.54 9.54 0 012.8 6.77c0 5.29-4.29 9.57-9.56 9.57zm5.47-7.16c-.3-.15-1.78-.88-2.06-.98-.28-.1-.49-.15-.7.15-.2.3-.8.98-.98 1.18-.18.2-.36.22-.66.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.34.45-.52.15-.18.2-.3.3-.51.1-.2.05-.38-.02-.53-.07-.15-.7-1.69-.96-2.31-.25-.6-.5-.52-.7-.53l-.6-.01c-.2 0-.53.08-.81.38-.28.3-1.06 1.04-1.06 2.54 0 1.5 1.09 2.95 1.24 3.15.15.2 2.15 3.28 5.22 4.6.73.31 1.3.49 1.74.62.73.23 1.4.2 1.93.12.59-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.07-.13-.27-.2-.56-.35z" />
                </svg>
              </button>
              <p className="image-caption">Share image via WhatsApp</p>
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
                disabled={loading || isCompleted || reportStatus === 'verifying' || reportStatus === 'rectifying'}
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
            ((reportStatus === 'assigned' && isChief )|| (reportStatus === 'rectifying' &&isSupervisor)) && (
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
 

                  try {
                    setSending(true);

                    // Create new message object
                    const newMessage = {
                      id: user?.displayName || user?.id || 'unknown',
                      message: safetyOfficer.trim(),
                      timestamp: new Date().toISOString()
                    };

                    // Determine supervisor name for assigned_supervisor field
                    const supervisor = (Array.isArray(employeesUnderChief) ? employeesUnderChief : []).find(
                      (e) => String(e.emp_code) === String(selectedEmployee)
                    );
                    const supervisorName = supervisor?.emp_name || supervisor?.name || String(selectedEmployee);

                    // Update the report with new message and status to 'rectifying'
                    const { doc } = await import('firebase/firestore');
                    const { db } = await import('../firebase/firebaseConfig');
                    const reportRef = doc(db, 'audit_reports', report.id);
                    await updateDoc(reportRef, {
                      messages: arrayUnion(newMessage),
                      send_to: arrayUnion(parseInt(selectedEmployee, 10)),
                      status: 'rectifying',
                      assigned_supervisor: supervisorName,
                      chief_comment: safetyOfficer.trim()
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
                disabled={sending || !selectedEmployee || isCompleted || reportStatus === 'verifying'}
              >
                {isCompleted ? 'Report Completed' : (sending ? 'Sending...' : 'Assign to Supervisor')}
              </button>
              <button
                className="mark-complete-button-bottom"
                onClick={async () => {
                  if (!safetyOfficer.trim()) {
                    alert('Please enter a message before marking as completed.');
                    return;
                  }

                  try {
                    setMarkingComplete(true);

                    // Create new message object
                    const newMessage2 = {
                      id: user?.displayName || user?.id || 'unknown',
                      message: safetyOfficer.trim() || 'Marked as completed by chief',
                      timestamp: new Date().toISOString()
                    };
                    const { doc } = await import('firebase/firestore');
                    const { db } = await import('../firebase/firebaseConfig');
                    const reportRef = doc(db, 'audit_reports', report.id);
                    await updateDoc(reportRef, {
                      messages: arrayUnion(newMessage2),
                      status: 'verifying',
                      completed_at: new Date().toLocaleString(),
                      rectified_by: user?.displayName || user?.email || user?.id || 'unknown',
                      chief_comment: safetyOfficer.trim()
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
                disabled={markingComplete || isCompleted || reportStatus === 'verifying'}
              >
                {isCompleted ? 'Report Completed' : (markingComplete ? 'Marking Complete...' : 'Mark as Completed')}
              </button>
              {/* reject by chief */}
              <button
                className="reject-button"
                onClick={async () => {
                  if (!safetyOfficer.trim()) {
                    // Highlight the input field
                    const inputField = document.getElementById('safety-officer-input');
                    if (inputField) {
                      inputField.focus();
                      inputField.classList.add('highlight-required');
                      setTimeout(() => {
                        inputField.classList.remove('highlight-required');
                      }, 3000);
                    }
                    return;
                  }

                  try {
                    setSending(true);
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('../firebase/firebaseConfig');
                    const reportRef = doc(db, 'audit_reports', report.id);

                    // Create new message object with rejection reason
                    const newMessage = {
                      id: user?.displayName || user?.id || 'unknown',
                      message: `${safetyOfficer.trim()} | Rejected by Chief `,
                      timestamp: new Date().toISOString()
                    };
                    if (isChief) {
                      // Chief rejection: clear send_to and reset assignments without reading the doc
                      await updateDoc(reportRef, {
                        messages: arrayUnion(newMessage),
                        status: 'pending',
                        chief_comment: safetyOfficer.trim(),
                        send_to: [],
                        assigned_department: '',
                        assigned_chief: '',
                        assigned_supervisor: ''
                      });
                    } else {
                      // Supervisor rejection: remove only current user's ID from send_to
                      await updateDoc(reportRef, {
                        messages: arrayUnion(newMessage),
                        status: 'assigned',
                        supervisor_comment: safetyOfficer.trim(),
                        send_to: arrayRemove(parseInt(user?.companyId)),
                        assigned_supervisor: ''
                      });
                    }

                    alert('Report rejected and sent back to  for revision.');
                    setSafetyOfficer(''); // Clear the input
                    // fetchMessages(); // Refresh message history
                    navigate('/inbox'); // Navigate back to inbox after rejection

                  } catch (error) {
                    console.error('Error rejecting report:', error);
                    alert('An error occurred while rejecting the report.');
                  } finally {
                    setSending(false);
                  }
                }}
                disabled={sending || isCompleted || reportStatus === 'verifying' || reportStatus === 'rectifying'}
              >
                {sending ? 'Processing...' : 'Reject'}
              </button>
            </>
          ) : (
            <>
              {/* //accept and close the report */}
              <button
                className="mark-complete-button-bottom"
                onClick={async () => {
 
                  if (!safetyOfficer.trim()) {
                    // Highlight the input field
                    const inputField = document.getElementById('safety-officer-input');
                    if (inputField) {
                      inputField.focus();
                      inputField.classList.add('highlight-required');
                      setTimeout(() => {
                        inputField.classList.remove('highlight-required');
                      }, 3000);
                    }
                    return;
                  }


                  try {
                    setMarkingComplete(true);

                    // Create new message object
                    const newMessage2 = {
                      id: user?.displayName || user?.id || 'unknown',
                      message: safetyOfficer.trim() || 'Marked as completed.',
                      timestamp: new Date().toISOString()
                    };

                    // Update the report with new message and status to 'verifying' (no prior read)
                    const { doc } = await import('firebase/firestore');
                    const { db } = await import('../firebase/firebaseConfig');
                    const reportRef = doc(db, 'audit_reports', report.id);
                    await updateDoc(reportRef, {
                      messages: arrayUnion(newMessage2),
                      status: 'verifying',
                      completed_at: new Date().toLocaleString(),
                      rectified_by: user?.displayName || user?.email || user?.id || 'unknown',
                      supervisor_comment: safetyOfficer.trim()
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

              {/* reject by supervisor */}
              <button
                className="reject-button"
                onClick={async () => {
                  if (!safetyOfficer.trim()) {
                    // Highlight the input field
                    const inputField = document.getElementById('safety-officer-input');
                    if (inputField) {
                      inputField.focus();
                      inputField.classList.add('highlight-required');
                      setTimeout(() => {
                        inputField.classList.remove('highlight-required');
                      }, 3000);
                    }
                    return;
                  }

                  try {
                    setSending(true);
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('../firebase/firebaseConfig');
                    const reportRef = doc(db, 'audit_reports', report.id);

                    // Create new message object with rejection reason
                    const newMessage = {
                      id: user?.displayName || user?.id || 'unknown',
                      message: `${safetyOfficer.trim()} | Rejected by Supervisor `,
                      timestamp: new Date().toISOString()
                    };
                    // Supervisor rejection: remove only current user's ID and clear assigned_supervisor
                    await updateDoc(reportRef, {
                      messages: arrayUnion(newMessage),
                      status: 'assigned',
                      supervisor_comment: safetyOfficer.trim(),
                      send_to: arrayRemove(parseInt(user?.companyId)),
                      assigned_supervisor: ''
                    });

                    alert('Report rejected and sent back for revision.');
                    setSafetyOfficer(''); // Clear the input
                    // fetchMessages(); // Refresh message history
                    navigate('/inbox'); // Navigate back to inbox after rejection

                  } catch (error) {
                    console.error('Error rejecting report:', error);
                    alert('An error occurred while rejecting the report.');
                  } finally {
                    setSending(false);
                  }
                }}
                disabled={sending || isCompleted || reportStatus === 'verifying'}
              >
                {sending ? 'Processing...' : 'Reject'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditReportDetailsInbox;