// for safety supervisor
import React, { useState, useEffect } from 'react';
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
    // Departments are cached in Redux/localStorage; no Firestore fetch here
    const cachedDepartments = useSelector(state => state.departments.list);
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
    const [editingField, setEditingField] = useState(null); // 'description' or 'corrective_action'
    const [editValues, setEditValues] = useState({
        description: '',
        corrective_action: ''
    });
    const [savingEdit, setSavingEdit] = useState(false);

    // Helper function to update user completion counters (year-based)
    const updateUserCompletionStats = async (reportData) => {
        try {
            const sendToUsers = Array.isArray(reportData.send_to) ? reportData.send_to : [];

            if (sendToUsers.length === 0) {
                return;
            }

            const { updateDoc, increment } = await import('firebase/firestore');
            const currentYear = new Date().getFullYear();
            const yearField = `completions_${currentYear}`;

            // Update completion counter for each user in send_to array
            for (const userId of sendToUsers) {
                try {
                    const userStatsRef = doc(db, 'user_completion_stats', String(userId));

                    // Check if document exists
                    const userStatsSnap = await getDoc(userStatsRef);

                    if (userStatsSnap.exists()) {
                        // Document exists → increment year counter
                        await updateDoc(userStatsRef, {
                            [yearField]: increment(1),
                            lastUpdated: new Date().toISOString(),
                            totalCount: increment(1)
                        });
                    } else {
                        // Document does not exist → create new with initial counter
                        await setDoc(userStatsRef, {
                            userId: String(userId),
                            [yearField]: 1,
                            totalCount: 1,
                            createdAt: new Date().toISOString(),
                            lastUpdated: new Date().toISOString()
                        });
                    }

                } catch (userError) {
                    console.error(`❌ Error updating completion stats for user ${userId}:`, userError);
                    // Continue with other users even if one fails
                }
            }
        } catch (error) {
            console.error('❌ Error in updateUserCompletionStats:', error);
        }
    };

    // Initialize from navigation-passed report to avoid a redundant Firestore read
    useEffect(() => {
        if (!report) return;
        setMessages(Array.isArray(report.messages) ? report.messages : []);
        setReportStatus(report.status || 'pending');
        setAssignedDepartment(report.assigned_department || '');
        setIsCompleted(!!report.completed);
    }, [report]);



    useEffect(() => {
        // Populate local state from cached Redux departments (0 reads)
        const list = Array.isArray(cachedDepartments) ? [...cachedDepartments] : [];
        list.sort((a, b) => String(a?.dept_name || '').localeCompare(String(b?.dept_name || '')));
        setDepartments(list);
        setLoading(false);
    }, [cachedDepartments]);

    // Update assignedChief when selectedDepartment changes
    useEffect(() => {
        const selected = departments.find(d => d.dept_name === selectedDepartment);
        setAssignedChief(selected ? selected.chief_name : '');
    }, [selectedDepartment, departments]);

    // Handle edit mode for description and corrective action
    const startEditingField = (fieldName) => {
        setEditingField(fieldName);
        setEditValues({
            ...editValues,
            [fieldName]: report[fieldName] || ''
        });
    };

    const cancelEdit = () => {
        setEditingField(null);
        setEditValues({
            description: '',
            corrective_action: ''
        });
    };

    const saveEdit = async (fieldName) => {
        try {
            setSavingEdit(true);
            const { updateDoc } = await import('firebase/firestore');
            const reportRef = doc(db, 'audit_reports', report.id);

            // Update the field in Firestore
            await updateDoc(reportRef, {
                [fieldName]: editValues[fieldName]
            });

            // Update the local report object
            report[fieldName] = editValues[fieldName];

            setEditingField(null);
            alert(`${fieldName === 'description' ? 'Description' : 'Corrective Action'} updated successfully!`);
        } catch (error) {
            console.error(`Error saving ${fieldName}:`, error);
            alert(`Failed to update ${fieldName}. Please try again.`);
        } finally {
            setSavingEdit(false);
        }
    };

    if (!report) {
        return (
            <div className="audit-details-container">
                <div className="audit-details-error-message">
                    <h2>Report not found</h2>
                    <p>The requested audit report could not be found.</p>
                    <button onClick={() => navigate(-1)} className="audit-details-back-btn">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="audit-details-container">
            {/* Header */}
            <div className="audit-details-header">
                <button
                    className="audit-details-back-button"
                    onClick={() => navigate(-1)}
                    style={{ backgroundColor: colors.primary }}
                >
                    <svg viewBox="0 0 24 24" fill="#FFFFFF" width="24" height="24">
                        <path d="M19 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                </button>
                <h1 className="audit-details-title">Audit Report Details</h1>
                <button
                    className="audit-details-home-button"
                    onClick={() => navigate('/home')}
                >
                    <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                </button>
            </div>

            {/* Report Content */}
            <div className="audit-details-content">
                <div className="audit-details-card">
                    {/* Employee Information */}
                    <div className="audit-details-section">
                        <h3 className="audit-details-section-title">Employee Information</h3>
                        <div className="audit-details-info-row">
                            <span className="audit-details-info-label">Employee Name:</span>
                            <span className="audit-details-info-value">
                                {report.full_name ?
                                    report.full_name :
                                    'N/A'
                                }
                            </span>
                        </div>
                        <div className="audit-details-info-row">
                            <span className="audit-details-info-label">Job Title:</span>
                            <span className="audit-details-info-value">
                                {report?.job_title || 'N/A'}
                            </span>
                        </div>
                        <div className="audit-details-info-row">
                            <span className="audit-details-info-label">Employee Code:</span>
                            <span className="audit-details-employee-code-badge">{report.emp_code || 'N/A'}</span>
                        </div>
                        <div className="audit-details-info-row">
                            <span className="audit-details-info-label">Department:</span>
                            <span className="audit-details-employee-code-badge">{report.department || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Report Status */}
                    <div className="audit-details-section">
                        <h3 className="audit-details-section-title">Report Status</h3>
                        <div className="audit-details-info-row">
                            <span className="audit-details-info-label">Status:</span>
                            <span className={`audit-details-status-badge ${reportStatus}`}>
                                {reportStatus}
                                {assignedDepartment && (
                                    <span className="audit-details-assigned-department">
                                        {'| Assigned to '}
                                        {departments.find(d => d.dept_code === assignedDepartment)?.name || assignedDepartment}
                                    </span>
                                )}
                            </span>
                        </div>

                        {/* // mark as completed button */}
                        {reportStatus === 'pending' && !isCompleted && (
                            <div className="audit-details-mark-complete-container">
                                <button
                                    className="audit-details-mark-complete-button"
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
                                                inputField.classList.add('audit-details-highlight-required');
                                                setTimeout(() => {
                                                    inputField.classList.remove('audit-details-highlight-required');
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

                                            // Save original send_to array before any modifications alfredo id is 31674
                                            const originalSendTo = currentData.send_to ? [...currentData.send_to] : [];

                                            // Add completion info with safety officer comment
                                            const completionMessage = safetyOfficer.trim() || 'Marked as completed by safety officer';
                                            const newMessage = {
                                                id: user?.displayName || user?.id || 'unknown',
                                                message: completionMessage,
                                                timestamp: new Date().toISOString()
                                            };

                                            // Add completion message to existing messages array
                                            const updatedMessages = currentData.messages || [];
                                            updatedMessages.push(newMessage);

                                            // Update main report with completion data
                                            const { updateDoc } = await import('firebase/firestore');
                                            await updateDoc(reportRef, {
                                                messages: updatedMessages,
                                                completed: true,
                                                status: 'completed',
                                                completed_at: new Date().toISOString(),
                                                rectified_by: user?.displayName || user?.email || user?.id || 'unknown',
                                            });

                                            // Archive to audit_reports_closed before deletion
                                            let closedWriteSuccess = false;

                                            try {
                                                const { arrayUnion, updateDoc } = await import('firebase/firestore');

                                                // Get today's date string: YYYY-MM-DD
                                                const today = new Date().toISOString().split("T")[0];

                                                // Reference to today's document in audit_reports_closed
                                                const closedDocRef = doc(db, "audit_reports_closed", today);

                                                // Prepare completed report data
                                                const completedReport = {
                                                    id: report.id,
                                                    completed_at: new Date().toLocaleString(),
                                                    completed_by: user?.displayName || user?.email || user?.id || 'unknown',
                                                    ...currentData,
                                                    messages: updatedMessages,
                                                    status: 'completed',
                                                    completed: true
                                                };

                                                // Check if today's document exists in audit_reports_closed
                                                const closedDocSnap = await getDoc(closedDocRef);

                                                if (closedDocSnap.exists()) {
                                                    // Document exists → append completed report
                                                    await updateDoc(closedDocRef, {
                                                        reports: arrayUnion(completedReport),
                                                    });
                                                } else {
                                                    // Document does not exist → create new with first completed report
                                                    await setDoc(closedDocRef, {
                                                        date: today,
                                                        reports: [completedReport],
                                                    });
                                                }

                                                closedWriteSuccess = true;
                                            } catch (closedError) {
                                                console.error("❌ Error saving to audit_reports_closed:", closedError);
                                                alert('Failed to save to audit_reports_closed. Report will not be deleted from main collection.');
                                                return; // Don't proceed with deletion
                                            }



                                            // Only delete from audit_reports if both writes succeeded
                                            if (closedWriteSuccess) {
                                                try {
                                                    const { deleteDoc } = await import('firebase/firestore');
                                                    await deleteDoc(reportRef);

                                                    // Update user completion stats for all users in send_to array
                                                    // Use data with original send_to array before any modifications
                                                    const dataForStats = {
                                                        ...currentData,
                                                        send_to: originalSendTo
                                                    };
                                                    await updateUserCompletionStats(dataForStats);
                                                } catch (deleteError) {
                                                    console.error("❌ Error deleting report from audit_reports:", deleteError);
                                                    alert('Report was archived successfully but could not be deleted from main collection.');
                                                }
                                            }

                                            // Send completed report data to Google Sheets "completed" sheet
                                            try {
                                                const googleSheetsUrl = process.env.REACT_APP_AUDIT_GOOGLE_SHEETS_URL;
                                                console.log('🔍 Mark Complete - Google Sheets URL:', googleSheetsUrl);

                                                if (googleSheetsUrl && googleSheetsUrl !== 'https://script.google.com/macros/s/YOUR_AUDIT_SCRIPT_ID/exec') {
                                                    const completedReportData = {
                                                        action: 'completed',
                                                        newStatus: true,
                                                        sheet: 'completed',
                                                        report_id: report.id,
                                                        emp_code: currentData.emp_code,
                                                        user_name: currentData.user_name,
                                                        department: currentData.department,
                                                        job_title: currentData.job_title,
                                                        location: currentData.location,
                                                        description: currentData.description,
                                                        corrective_action: currentData.corrective_action,
                                                        incident_type: currentData.incident_type,
                                                        date: currentData.date,
                                                        completed_at: new Date().toISOString(),
                                                        completed_by: user?.displayName || user?.email || user?.id || 'unknown',
                                                        completion_message: completionMessage,
                                                        image_url: currentData.image_url,
                                                        created_at: currentData.created_at
                                                    };

                                                    console.log('📤 Mark Complete - Sending data to Google Sheets:', completedReportData);

                                                    const response = await fetch(googleSheetsUrl, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        body: JSON.stringify(completedReportData),
                                                        // mode: 'cors'
                                                    });

                                                    console.log('✅ Mark Complete - Google Sheets response status:', response.status);
                                                    console.log('✅ Completed report successfully sent to Google Sheets "completed" sheet');
                                                }
                                            } catch (googleSheetsError) {
                                                console.error('Failed to send completed report to Google Sheets:', googleSheetsError);
                                                // Non-fatal error - don't block the user flow
                                            } setIsCompleted(true);
                                            alert('Report marked as completed, archived, and removed from active collection successfully!');
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
                            <div className="audit-details-completion-notice">
                                <span className="audit-details-completed-badge">✓ Completed</span>
                            </div>
                        )}
                    </div>

                    {/* Location & Date */}
                    <div className="audit-details-section">
                        <h3 className="audit-details-section-title">Location & Date</h3>
                        <div className="audit-details-info-row">
                            <span className="audit-details-info-label">Location:</span>
                            <span className="audit-details-info-value">
                                <svg viewBox="0 0 24 24" fill="#666" width="16" height="16" className="audit-details-location-icon">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                {report.location || 'N/A'}
                            </span>
                        </div>
                        <div className="audit-details-info-row">
                            <span className="audit-details-info-label">Date:</span>
                            <span className="audit-details-info-value">
                                <svg viewBox="0 0 24 24" fill="#666" width="16" height="16" className="audit-details-date-icon">
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
                    <div className="audit-details-section">
                        <h3 className="audit-details-section-title">Incident Type</h3>
                        <div className="audit-details-info-row">
                            <span className="audit-details-info-value audit-details-incident-type-badge">
                                {report.incident_type || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="audit-details-section">
                        <div className="audit-details-section-header">
                            <h3 className="audit-details-section-title">Description</h3>
                            {editingField !== 'description' && (
                                <button
                                    className="audit-details-edit-button"
                                    onClick={() => startEditingField('description')}
                                    title="Edit Description"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                                        <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {editingField === 'description' ? (
                            <div className="audit-details-edit-container">
                                <textarea
                                    className="audit-details-edit-textarea"
                                    value={editValues.description}
                                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                                    placeholder="Enter description..."
                                    rows={5}
                                />
                                <div className="audit-details-edit-actions">
                                    <button
                                        className="audit-details-save-button"
                                        onClick={() => saveEdit('description')}
                                        disabled={savingEdit}
                                    >
                                        {savingEdit ? 'Saving...' : '✓ Save'}
                                    </button>
                                    <button
                                        className="audit-details-cancel-button"
                                        onClick={cancelEdit}
                                        disabled={savingEdit}
                                    >
                                        ✕ Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="audit-details-description-content">
                                <p className="audit-details-full-description">
                                    {report.description || 'No description available'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Corrective Action */}
                    <div className="audit-details-section">
                        <div className="audit-details-section-header">
                            <h3 className="audit-details-section-title">Corrective Action</h3>
                            {editingField !== 'corrective_action' && (
                                <button
                                    className="audit-details-edit-button"
                                    onClick={() => startEditingField('corrective_action')}
                                    title="Edit Corrective Action"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                                        <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {editingField === 'corrective_action' ? (
                            <div className="audit-details-edit-container">
                                <textarea
                                    className="audit-details-edit-textarea"
                                    value={editValues.corrective_action}
                                    onChange={(e) => setEditValues({ ...editValues, corrective_action: e.target.value })}
                                    placeholder="Enter corrective action..."
                                    rows={5}
                                />
                                <div className="audit-details-edit-actions">
                                    <button
                                        className="audit-details-save-button"
                                        onClick={() => saveEdit('corrective_action')}
                                        disabled={savingEdit}
                                    >
                                        {savingEdit ? 'Saving...' : '✓ Save'}
                                    </button>
                                    <button
                                        className="audit-details-cancel-button"
                                        onClick={cancelEdit}
                                        disabled={savingEdit}
                                    >
                                        ✕ Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="audit-details-description-content">
                                <p className="audit-details-full-description">
                                    {report.corrective_action || 'No corrective action specified'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Image Section */}
                    {(Array.isArray(report.image_url_store) && report.image_url_store.length > 0) ? (
                        <div className="audit-details-section">
                            <h3 className="audit-details-section-title">Attached Images</h3>
                            <div className="audit-details-image-container audit-details-image-grid">
                                {report.image_url_store.map((imgUrl, idx) => (
                                    <img
                                        key={idx}
                                        src={imgUrl}
                                        alt={`Audit report ${idx + 1}`}
                                        className="audit-details-image audit-details-image-thumb"
                                        draggable={false}
                                        onClick={e => e.preventDefault()}
                                        onContextMenu={e => e.preventDefault()}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : report.image_url ? (
                        <div className="audit-details-section">
                            <h3 className="audit-details-section-title">Attached Image</h3>
                            <div className="audit-details-image-container">
                                <img
                                    src={report.image_url}
                                    alt="Audit report"
                                    className="audit-details-image"
                                    draggable={false}
                                    onClick={e => e.preventDefault()}
                                    onContextMenu={e => e.preventDefault()}
                                />
                            </div>
                        </div>
                    ) : null}

                    {/* Report Metadata */}
                    <div className="audit-details-section">
                        <h3 className="audit-details-section-title">Report Information</h3>
                        <div className="audit-details-metadata-grid">
                            <div className="audit-details-metadata-item">
                                <span className="audit-details-metadata-label">Report ID:</span>
                                <span className="audit-details-metadata-value">{report.id || 'N/A'}</span>
                            </div>
                            <div className="audit-details-metadata-item">
                                <span className="audit-details-metadata-label">Created:</span>
                                <span className="audit-details-metadata-value">
                                    {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Department Selector */}
                    <div className="audit-details-section">
                        <h3 className="audit-details-section-title">Department Assignment</h3>
                        <div className="audit-details-department-selector-container">
                            <label className="audit-details-selector-label" htmlFor="department-select">
                                {isCompleted ? 'Final Department:' : 'Select Department:'}
                            </label>
                            <select
                                id="department-select"
                                className="audit-details-department-select"
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
                                    className="audit-details-reassign-button"
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
                                <div className="audit-details-completion-notice-dept">
                                    <span className="audit-details-notice-text">
                                        ✓ This report has been completed and is now closed. No further modifications are allowed.
                                    </span>
                                </div>
                            )}

                            {selectedDepartment && (
                                <div className="audit-details-selected-department-info">
                                    {(() => {
                                        const selected = departments.find(d => d.dept_name === selectedDepartment);
                                        return selected ? (
                                            <div className="audit-details-department-details">
                                                <div className="audit-details-dept-info-row">
                                                    <span className="audit-details-dept-label">Department:</span>
                                                    <span className="audit-details-dept-value">{selected.dept_name}</span>
                                                </div>

                                                <div className="audit-details-dept-info-row">
                                                    <span className="audit-details-dept-label">Department Chief:</span>
                                                    <span className="audit-details-dept-value">
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
                                <div className="audit-details-loading-departments">
                                    Loading departments...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Safety Officer Input */}


                    {/* Message History */}
                    <div className="audit-details-section">
                        <h3 className="audit-details-section-title">Message History</h3>
                        <div className="audit-details-message-history-container">
                            {messages.length === 0 ? (
                                <p className="audit-details-no-messages">No messages yet.</p>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className="audit-details-message-item">
                                        <div className="audit-details-message-header">
                                            <span className="audit-details-message-sender">Sender: {msg.id}</span>

                                        </div>
                                        <div className="audit-details-message-content">{msg.message}</div>
                                        {msg.department && (
                                            <div className="audit-details-message-department">
                                                Department: {msg.department.name} ({msg.department.dept_code})
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="audit-details-section">
                        <h3 className="audit-details-section-title">Safety Officer Assignment</h3>
                        <div className="audit-details-safety-officer-container">
                            <label className="audit-details-selector-label" htmlFor="safety-officer-input">
                                Safety Officer Comment:
                            </label>
                            <input
                                id="safety-officer-input"
                                type="text"
                                className="audit-details-safety-officer-input"
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
                    <div className="audit-details-send-message-bottom">
                        <button
                            className="audit-details-send-message-button-bottom"

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
                            {isCompleted ? 'Report Completed' : (sending ? 'Sending...' : 'Assign')}
                        </button>
                        <button
                            className="audit-details-reassign-button audit-details-reject-button"
                            onClick={async () => {
                                if (!safetyOfficer.trim()) {
                                    const inputField = document.getElementById('safety-officer-input');
                                    if (inputField) {
                                        inputField.focus();
                                        inputField.classList.add('audit-details-highlight-required');
                                        setTimeout(() => {
                                            inputField.classList.remove('audit-details-highlight-required');
                                        }, 3000);
                                    }
                                    return;
                                }

                                console.log('Reject message:', safetyOfficer.trim());

                                try {
                                    setSending(true);

                                    const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
                                    const { db } = await import('../firebase/firebaseConfig');
                                    const reportRef = doc(db, 'audit_reports', report.id);

                                    const newMessage = {
                                        id: user?.displayName || user?.id || 'unknown',
                                        message: safetyOfficer.trim(),
                                        timestamp: new Date().toISOString(),
                                    };

                                    await updateDoc(reportRef, {
                                        messages: arrayUnion(newMessage),
                                        status: 'rejected',
                                    });

                                    alert('Report rejected successfully.');
                                    setSafetyOfficer('');
                                    navigate('/viewallauditreports');
                                } catch (error) {
                                    console.error('Error rejecting report:', error);
                                    alert('An error occurred while rejecting the report.');
                                } finally {
                                    setSending(false);
                                }
                            }}
                        >
                            Reject
                        </button>
                    </div>


                )
            }
            {/* // accept button safety officer */}
            {
                reportStatus === 'verifying' && (
                    <div className="audit-details-send-message-bottom">
                        <div className="audit-details-verification-buttons">
                            <button
                                className="audit-details-accept-button"
                                onClick={async () => {



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

                                        // Save original send_to array before any modifications
                                        const originalSendToAccept = reportData.send_to ? [...reportData.send_to] : [];

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

                                        // Also save to audit_reports_closed collection
                                        let closedWriteSuccess = false;

                                        try {
                                            const { arrayUnion, setDoc } = await import('firebase/firestore');

                                            // Get today's date string: YYYY-MM-DD
                                            const today = new Date().toISOString().split("T")[0];

                                            // Reference to today's document in audit_reports_closed
                                            const closedDocRef = doc(db, "audit_reports_closed", today);

                                            // Prepare completed report data
                                            const completedReport = {
                                                id: report.id,
                                                // completed_at: new Date().toISOString(),
                                                // completed_by: user?.displayName || user?.email || user?.id || 'unknown',
                                                ...reportData,
                                                messages: updatedMessages,
                                                status: 'completed',
                                                completed: true
                                            };

                                            // Check if today's document exists in audit_reports_closed
                                            const closedDocSnap = await getDoc(closedDocRef);

                                            if (closedDocSnap.exists()) {
                                                // Document exists → append completed report
                                                await updateDoc(closedDocRef, {
                                                    reports: arrayUnion(completedReport),
                                                });
                                            } else {
                                                // Document does not exist → create new with first completed report
                                                await setDoc(closedDocRef, {
                                                    date: today,
                                                    reports: [completedReport],
                                                });
                                            }

                                            closedWriteSuccess = true;
                                        } catch (closedError) {
                                            console.error("❌ Error saving to audit_reports_closed:", closedError);
                                            alert('Failed to save to audit_reports_closed. Report will not be deleted from main collection.');
                                            return; // Don't proceed with deletion
                                        }


                                        // Only delete from audit_reports if both writes succeeded
                                        if (closedWriteSuccess) {
                                            try {
                                                const { deleteDoc } = await import('firebase/firestore');
                                                await deleteDoc(reportRef);

                                                // Update user completion stats for all users in send_to array
                                                // Use data with original send_to array before any modifications
                                                const dataForStatsAccept = {
                                                    ...reportData,
                                                    send_to: originalSendToAccept
                                                };
                                                await updateUserCompletionStats(dataForStatsAccept);
                                            } catch (deleteError) {
                                                console.error("❌ Error deleting report from audit_reports:", deleteError);
                                                alert('Report was archived successfully but could not be deleted from main collection.');
                                            }
                                        }

                                        // Send completed report data to Google Sheets "completed" sheet
                                        try {
                                            const googleSheetsUrl = process.env.REACT_APP_AUDIT_GOOGLE_SHEETS_URL;
                                            if (googleSheetsUrl && googleSheetsUrl !== 'https://script.google.com/macros/s/YOUR_AUDIT_SCRIPT_ID/exec') {
                                                const completedReportData = {
                                                    action: 'completed',
                                                    report_id: report.id,
                                                    emp_code: reportData.emp_code,
                                                    user_name: reportData.user_name,
                                                    department: reportData.department,
                                                    job_title: reportData.job_title,
                                                    location: reportData.location,
                                                    description: reportData.description,
                                                    corrective_action: reportData.corrective_action,
                                                    incident_type: reportData.incident_type,
                                                    date: reportData.date,
                                                    completed_at: new Date().toISOString(),
                                                    completed_by: user?.displayName || user?.email || user?.id || 'unknown',
                                                    completion_message: messageText,
                                                    image_url: reportData.image_url,
                                                    created_at: reportData.created_at
                                                };

                                                await fetch(googleSheetsUrl, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify(completedReportData),
                                                    mode: 'no-cors'
                                                });

                                                console.log('Completed report successfully sent to Google Sheets "completed" sheet');
                                            }
                                        } catch (googleSheetsError) {
                                            console.error('Failed to send completed report to Google Sheets:', googleSheetsError);
                                            // Non-fatal error - don't block the user flow
                                        }

                                        alert('Report accepted, completed, and archived successfully!');
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
                            {/* // handle reject button  */}
                            <button
                                className="audit-details-reject-button"
                                onClick={async () => {
                                    if (!safetyOfficer.trim()) {
                                        // Highlight the input field
                                        const inputField = document.getElementById('safety-officer-input');
                                        if (inputField) {
                                            inputField.focus();
                                            inputField.classList.add('audit-details-highlight-required');
                                            setTimeout(() => {
                                                inputField.classList.remove('audit-details-highlight-required');
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
            {/* //reassign button */}
            {
                reportStatus === 'assigned' && isReassigning && (
                    <div className="audit-details-send-message-bottom">
                        <button
                            className="audit-details-send-message-button-bottom"
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
                        {/* <button
                            className="audit-details-reassign-button audit-details-reject-button"
                            onClick={() => {
                                console.log('Reject button clicked');
                            }}
                        >
                            Reject
                        </button> */}
                    </div>
                )
            }

        </div>
    );
};

export default AuditReportDetails;