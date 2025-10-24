// for safety supervisor
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { colors } from '../constants/color';
import './AuditReportDetails.css';
import { setDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig';

const AuditReportDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const report = location.state?.report;
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [loading, setLoading] = useState(false);
    // const [chiefs, setChiefs] = useState({}); // Not used currently
    const [safetyOfficer, setSafetyOfficer] = useState('');
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState([]);
    const [reportStatus, setReportStatus] = useState('pending');
    const [assignedDepartment, setAssignedDepartment] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [markingComplete, setMarkingComplete] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);
    const user = useSelector(state => state.auth.user);
    const [assignedChief, setAssignedChief] = useState('');

    const fetchMessages = useCallback(async () => {
        try {
            // Fetch current messages, status, assigned department, and completed status from Firestore
            const docRef = doc(db, 'audit_reports', report.id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                console.error('Audit report not found:', report.id);
                return;
            }
            const reportData = docSnap.data();
            setMessages(reportData?.messages || []);
            setReportStatus(reportData?.status || 'pending');
            setAssignedDepartment(reportData?.assigned_department || '');
            setIsCompleted(reportData?.completed || false);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    }, [report.id]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoading(true);
                // Fetch departments from single Firestore document
                const docRef = doc(db, 'departments', 'all_departments');
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Convert departments object to array and sort by dept_name
                    const deptArray = Object.values(data.departments || {}).sort((a, b) => 
                        a.dept_name.localeCompare(b.dept_name)
                    );
                    setDepartments(deptArray);
                } else {
                    console.error('Departments document not found');
                    setDepartments([]);
                }
            } catch (err) {
                console.error('Error fetching departments:', err);
                setDepartments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        fetchDepartments();
    }, [report.id, fetchMessages]);

    // Update assignedChief when selectedDepartment changes
    useEffect(() => {
        const selected = departments.find(d => d.dept_name === selectedDepartment);
        setAssignedChief(selected ? selected.chief_name : '');
    }, [selectedDepartment, departments]);

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

            {/* Report Content */}
            <div className="details-content">
                <div className="details-card">
                    {/* Employee Information */}
                    <div className="details-section">
                        <h3 className="section-title">Employee Information</h3>
                        <div className="info-row">
                            <span className="info-label">Employee Name:</span>
                            <span className="info-value">
                                {report.full_name ?
                                    report.full_name :
                                    'N/A'
                                }
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Job Title:</span>
                            <span className="info-value">
                                {report?.job_title || 'N/A'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Employee Code:</span>
                            <span className="employee-code-badge">{report.emp_code || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Department:</span>
                            <span className="employee-code-badge">{report.department || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Report Status */}
                    <div className="details-section">
                        <h3 className="section-title">Report Status</h3>
                        <div className="info-row">
                            <span className="info-label">Status:</span>
                            <span className={`status-badge ${reportStatus}`}>
                                {reportStatus}
                                {assignedDepartment && (
                                    <span className="assigned-department">
                                        {'| Assigned to '}
                                        {departments.find(d => d.dept_code === assignedDepartment)?.name || assignedDepartment}
                                    </span>
                                )}
                            </span>
                        </div>
                        {reportStatus === 'pending' && !isCompleted && (
                            <div className="mark-complete-container">
                                <button
                                    className="mark-complete-button"
                                    onClick={async () => {
                                        // Show confirmation dialog
                                        const confirmed = window.confirm(
                                            'Are you sure you want to mark this report as completed? This action cannot be undone.'
                                        );
                                        if (!confirmed) {
                                            return; // User cancelled
                                        }
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
                                            // Update Firestore document for this report
                                            const { setDoc, doc, getDoc } = await import('firebase/firestore');
                                            const { db } = await import('../firebase/firebaseConfig');
                                            const reportRef = doc(db, 'audit_reports', report.id);
                                            // Get current report data to preserve all fields
                                            const reportSnap = await getDoc(reportRef);
                                            if (!reportSnap.exists()) {
                                                alert('Report not found in Firestore.');
                                                setMarkingComplete(false);
                                                return;
                                            }
                                            const currentData = reportSnap.data();
                                            await setDoc(reportRef, {
                                                ...currentData,
                                                completed: true,
                                                status: 'completed',
                                                completed_at: new Date().toLocaleString(),
                                                rectified_by: user?.displayName || user?.email || user?.id || 'unknown',
                                            });
                                            setIsCompleted(true);
                                            alert('Report marked as completed successfully!');
                                            // Navigate back to previous page
                                            navigate(-1);
                                        } catch (error) {
                                            console.error('Error marking as completed:', error);
                                            alert('An error occurred while marking as completed.');
                                        } finally {
                                            setMarkingComplete(false);
                                        }
                                    }}
                                    disabled={markingComplete}
                                >
                                    {markingComplete ? 'Marking Complete...' : 'Mark as Completed'}
                                </button>



                            </div>
                        )}
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

                    {/* Incident Type */}
                    <div className="details-section">
                        <h3 className="section-title">Incident Type</h3>
                        <div className="info-row">
                            <span className="info-value incident-type-badge">
                                {report.incident_type || 'N/A'}
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
                    <div className="details-section">
                        <h3 className="section-title">Corrective Action</h3>
                        <div className="description-content">
                            <p className="full-description">
                                {report.corrective_action || 'No corrective action specified'}
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
                                    draggable={false}
                                    onClick={(e) => { e.preventDefault(); }}
                                    onContextMenu={(e) => { e.preventDefault(); }}
                                />

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

                    {/* Department Selector */}
                    <div className="details-section">
                        <h3 className="section-title">Department Assignment</h3>
                        <div className="department-selector-container">
                            <label className="selector-label" htmlFor="department-select">
                                {isCompleted ? 'Final Department:' : 'Select Department:'}
                            </label>
                            <select
                                id="department-select"
                                className="department-select"
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                disabled={loading || isCompleted || reportStatus === 'verifying' || reportStatus === 'rectifying' || (reportStatus === 'assigned' && !isReassigning)}
                                style={{
                                    borderColor: selectedDepartment ? colors.primary : colors.border,
                                    borderWidth: '2px',
                                    outline: 'none'
                                }}
                            >
                                <option value="">Choose a department...</option>
                                {departments.map((dept) => (
                                    <option key={dept.dept_code} value={dept.dept_name}>
                                        {dept.dept_name}
                                    </option>
                                ))}
                            </select>

                            {reportStatus === 'assigned' && (
                                <button
                                    className="reassign-button"
                                    onClick={() => {
                                        setIsReassigning(!isReassigning);
                                        if (!isReassigning) {
                                            // Reset selected department to current assigned when starting reassignment
                                            setSelectedDepartment(assignedDepartment);
                                        }
                                    }}
                                >
                                    {isReassigning ? 'Cancel Reassignment' : 'Reassign Department'}
                                </button>
                            )}

                            {isCompleted && (
                                <div className="completion-notice-dept">
                                    <span className="notice-text">
                                        ✓ This report has been completed and is now closed. No further modifications are allowed.
                                    </span>
                                </div>
                            )}

                            {selectedDepartment && (
                                <div className="selected-department-info">
                                    {(() => {
                                        const selected = departments.find(d => d.dept_name === selectedDepartment);
                                        return selected ? (
                                            <div className="department-details">
                                                <div className="dept-info-row">
                                                    <span className="dept-label">Department:</span>
                                                    <span className="dept-value">{selected.dept_name}</span>
                                                </div>

                                                <div className="dept-info-row">
                                                    <span className="dept-label">Department Chief:</span>
                                                    <span className="dept-value">
                                                        {
                                                            (selected.chief_code ? ` ${selected.chief_name}` : 'N/A')
                                                        }
                                                    </span>
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
                        <h3 className="section-title">Safety Officer Assignment</h3>
                        <div className="safety-officer-container">
                            <label className="selector-label" htmlFor="safety-officer-input">
                                Safety Officer Comment:
                            </label>
                            <input
                                id="safety-officer-input"
                                type="text"
                                className="safety-officer-input"
                                value={safetyOfficer}
                                onChange={(e) => {
                                    setSafetyOfficer(e.target.value);
                                }}
                                placeholder={isCompleted ? "Report completed - messaging disabled" : " Safety officer message..."}
                                disabled={isCompleted}
                            />
                        </div>
                    </div>
                </div>

            </div>


            {/* Assign to department Send Message Button - Fixed at Bottom */}
            {
                reportStatus === 'pending' && !isCompleted && (
                    <div className="send-message-bottom">
                        <button
                            className="send-message-button-bottom"

                            onClick={async () => {
                                if (!selectedDepartment) {
                                    alert('Please select a department before sending the message.');
                                    return;
                                }
                                try {
                                    setSending(true);
                                    // Get current messages and sent_to arrays from Firestore
                                    const docRef = doc(db, 'audit_reports', report.id);
                                    const docSnap = await getDoc(docRef);
                                    if (!docSnap.exists()) {
                                        console.error('Error fetching current report: not found');
                                        alert('Failed to fetch current report data.');
                                        return;
                                    }
                                    const currentReport = docSnap.data();

                                    // Get selected department info
                                    const selectedDept = departments.find(d => d.dept_name === selectedDepartment);

                                    // Create new message object
                                    const newMessage = {
                                        id: user?.displayName || user?.id || 'unknown',
                                        message: safetyOfficer.trim(),
                                        timestamp: new Date().toISOString()
                                    };

                                    // Add new message to existing messages array
                                    const updatedMessages = currentReport.messages || [];
                                    updatedMessages.push(newMessage);

                                    // Clear previous send_to array and set to new department's chief only
                                    const currentSentTo = [];
                                    const chiefCode = selectedDept?.chief_code;

                                    // Add chief_code to sent_to array if it exists
                                    if (chiefCode) {
                                        currentSentTo.push(parseInt(chiefCode));
                                    }

                                    // Update the report with new messages array, sent_to array, status, and assigned department

                                    try {
                                        console.log('===========assignedChief==============');
                                        console.log(assignedChief);
                                        console.log('====================================');
                                        await setDoc(doc(db, 'audit_reports', report.id), {
                                            ...currentReport,
                                            messages: updatedMessages,
                                            send_to: currentSentTo,
                                            status: 'assigned',
                                            assigned_department: selectedDepartment,
                                            assigned_chief: assignedChief,
                                            assigned_supervisor: '', // Clear supervisor when assigning to new department
                                        });
                                    } catch (updateError) {
                                        console.error('Error updating report:', updateError);
                                        alert('Failed to send message.');
                                        return;
                                    }

                                    alert('Message sent successfully!');
                                    setSafetyOfficer(''); // Clear the input
                                    navigate('/viewallauditreports'); // Navigate back to list after assignment

                                } catch (error) {
                                    console.error('Error sending message:', error);
                                    alert('An error occurred while sending the message.');
                                } finally {
                                    setSending(false);
                                }
                            }}
                            disabled={sending || !selectedDepartment || isCompleted}
                        >
                            {isCompleted ? 'Report Completed' : (sending ? 'Sending...' : 'Assign Department')}
                        </button>
                    </div>


                )
            }
            {
                reportStatus === 'verifying' && (
                    <div className="send-message-bottom">
                        <div className="verification-buttons">
                            <button
                                className="accept-button"
                                onClick={async () => {

                                    // if (!safetyOfficer.trim()) {
                                    //     // Highlight the input field
                                    //     const inputField = document.getElementById('safety-officer-input');
                                    //     if (inputField) {
                                    //         inputField.focus();
                                    //         inputField.classList.add('highlight-required');
                                    //         setTimeout(() => {
                                    //             inputField.classList.remove('highlight-required');
                                    //         }, 3000);
                                    //     }
                                    // }

                                    try {
                                        setSending(true);

                                        // Get current messages array from Firestore
                                        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
                                        const { db } = await import('../firebase/firebaseConfig');
                                        const reportRef = doc(db, 'audit_reports', report.id);
                                        const reportSnap = await getDoc(reportRef);

                                        if (!reportSnap.exists()) {
                                            console.error('Report not found in Firestore');
                                            alert('Failed to fetch current report data.');
                                            return;
                                        }

                                        const reportData = reportSnap.data();

                                        // Create new message object - use custom message or default acceptance message
                                        const messageText = safetyOfficer.trim() || 'Verified and Accepted by safety officer';
                                        const newMessage = {
                                            id: user?.displayName || user?.id || 'unknown',
                                            message: messageText,
                                            timestamp: new Date().toISOString()
                                        };

                                        // Add new message to existing messages array
                                        const updatedMessages = reportData.messages || [];
                                        updatedMessages.push(newMessage);

                                        // Update the report with new message, completed status, and change status to completed
                                        await updateDoc(reportRef, {
                                            messages: updatedMessages,
                                            status: 'completed',
                                            completed: true
                                        });

                                        alert('Report accepted and completed successfully!');
                                        setSafetyOfficer(''); // Clear the input
                                        // fetchMessages(); // Refresh message history
                                        navigate('/viewallauditreports'); // Navigate back to home after acceptance

                                    } catch (error) {
                                        console.error('Error accepting report:', error);
                                        alert('An error occurred while accepting the report.');
                                    } finally {
                                        setSending(false);
                                    }
                                }}
                                disabled={sending || isCompleted}
                            >
                                {sending ? 'Processing...' : 'Accept'}
                            </button>

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

                                        // Get current messages array from Firestore
                                        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
                                        const { db } = await import('../firebase/firebaseConfig');
                                        const reportRef = doc(db, 'audit_reports', report.id);
                                        const reportSnap = await getDoc(reportRef);

                                        if (!reportSnap.exists()) {
                                            console.error('Report not found in Firestore');
                                            alert('Failed to fetch current report data.');
                                            return;
                                        }

                                        const reportData = reportSnap.data();

                                        // Create new message object with rejection reason
                                        const newMessage = {
                                            id: user?.displayName || user?.id || 'unknown',
                                            message: safetyOfficer.trim(),
                                            timestamp: new Date().toISOString()
                                        };

                                        // Add new message to existing messages array
                                        const updatedMessages = reportData.messages || [];
                                        updatedMessages.push(newMessage);

                                        // Update the report with new message and change status back to assigned
                                        await updateDoc(reportRef, {
                                            messages: updatedMessages,
                                            status: 'rectifying'
                                        });

                                        alert('Report rejected and sent back for revision.');
                                        setSafetyOfficer(''); // Clear the input
                                        // fetchMessages(); // Refresh message history
                                        navigate('/viewallauditreports'); // Navigate back to inbox after rejection

                                    } catch (error) {
                                        console.error('Error rejecting report:', error);
                                        alert('An error occurred while rejecting the report.');
                                    } finally {
                                        setSending(false);
                                    }
                                }}
                                disabled={sending || isCompleted}
                            >
                                {sending ? 'Processing...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                )
            }
            {
                reportStatus === 'assigned' && isReassigning && (
                    <div className="send-message-bottom">
                        <button
                            className="send-message-button-bottom"
                            onClick={async () => {
                                if (!selectedDepartment) {
                                    alert('Please select a department before sending the message.');
                                    return;
                                }

                                // Allow reassignment without a comment; we'll use a default message if empty

                                try {
                                    setSending(true);

                                    // Get current report data from Firestore
                                    const reportRef = doc(db, 'audit_reports', report.id);
                                    const reportSnap = await getDoc(reportRef);
                                    if (!reportSnap.exists()) {
                                        console.error('Error fetching current report: not found');
                                        alert('Failed to fetch current report data.');
                                        return;
                                    }
                                    const currentReport = reportSnap.data();

                                    // Get selected department info (selector stores dept_name)
                                    const selectedDept = departments.find(d => d.dept_name === selectedDepartment);

                                    // Create new message object
                                    const messageText = safetyOfficer.trim() || `Reassigned to ${selectedDept?.dept_name || selectedDepartment}`;
                                    const newMessage = {
                                        id: user?.displayName || user?.id || 'unknown',
                                        message: messageText,
                                        timestamp: new Date().toISOString()
                                    };

                                    // Add new message to existing messages array
                                    const updatedMessages = currentReport.messages || [];
                                    updatedMessages.push(newMessage);

                                    // Reset sent_to to only the new department's chief
                                    const currentSentTo = [];
                                    const chiefCode = selectedDept?.chief_code;
                                    if (chiefCode) {
                                        currentSentTo.push(parseInt(chiefCode, 10));
                                    }

                                    // Update the report in Firestore
                                    const { updateDoc } = await import('firebase/firestore');
                                    await updateDoc(reportRef, {
                                        messages: updatedMessages,
                                        send_to: currentSentTo,
                                        assigned_department: selectedDepartment,
                                        status: 'assigned',
                                        assigned_chief: assignedChief,
                                        assigned_supervisor: '', // Clear supervisor when reassigning to new department
                                    });

                                    alert('Report reassigned successfully!');
                                    setSafetyOfficer(''); // Clear the input
                                    setIsReassigning(false); // Exit reassignment mode
                                    navigate('/viewallauditreports'); // Navigate back to list after reassignment

                                } catch (error) {
                                    console.error('Error reassigning report:', error);
                                    alert('An error occurred while reassigning the report.');
                                } finally {
                                    setSending(false);
                                }
                            }}
                            disabled={sending || !selectedDepartment || selectedDepartment === assignedDepartment || isCompleted}
                        >
                            {isCompleted ? 'Report Completed' : (sending ? 'Reassigning...' : 'Reassign to Department')}
                        </button>
                    </div>
                )
            }

        </div>
    );
};

export default AuditReportDetails;