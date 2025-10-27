import React, { useState } from 'react'
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './AuditReport.css';
import { setDoc, doc, arrayUnion, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

function AuditReport() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const department = user?.department;
  const fullName = user?.fullName;
  const jobTitle = user?.jobTitle;
  const [formData, setFormData] = useState({
    location: '',
    description: '',
    corrective_action: '',
    incident_type: '',
    date: '',
    
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [managementAuditLocation, setManagementAuditLocation] = useState('');
  const incident_type_list = ['Unsafe Condition', 'Unsafe Act', 'Near Miss', 'Environment Concern', 'Management Audit'];
  const auditLocation =[
    'Limestone Crusher Bldg, Operator Room, 211BC1/2 area and 1P1',
    'Quarry & QWS Building Sorrounding, Fuel Station ',
    'Surge Bin, Limestone Storage (stacker / Reclaimer) and Water source  Pump area',
    'Clay Storage (Stacker/Reclaimer side) yard and Hazardous Substance Holding area',
    'Gypsum Storage yard and 7P1',
    'STP, Diesel Station and Light Vehicle shop',
    'Additive Crusher Compressor Room, Additive & Gypsum Crusher',
    '2P1 and Water Treatment Plant',
    'Raw Material Transport Bldg',
    'Power Plant facility',
    'Raw Mill & Reject BE Building Reject ',
    'RM Cyclone Building & RM Fan area',
    'Preheater ID Fan, 3P1 and Main Baghouse',
    'HFO/LFO Tanks & Pump area and LFO & HFO unloading area',
    'Kiln Compressor Room and Boiler Room',
    'Preheater (Top to Bottom)  and Raw Mix Silo top',
    'Kiln & Cooler Area and ESP',
    '491DP1, Off spec Silo top and Clinker Silo Top',
    'Outside Feeding & Clinker Transport Building',
    'Cement Mill & CM Feed Building',
    '5P1 and Cement Silo Top to Bottom',
    'CCR Building & 4P1',
    'Refractory Store, RM Silo &  Cooler Ground area',
    'Packing Plant and Cement Silo Ground area',
    'Weighbridge area, Sales Gates and Sales Building',
    'Technical Building and Canteen',
    'Main Gate and Contractor accommodation',
    'Warehouse facility & Workshop area'
  ]

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleIncidentTypeSelect = (type) => {
    const previousType = formData.incident_type;
    updateFormData('incident_type', type);
    
    if (type === 'Management Audit') {
      // Always show modal for Management Audit (user might want to change location)
      setShowLocationModal(true);
    } else {
      // If switching away from Management Audit, save current location and clear field
      if (previousType === 'Management Audit' && formData.location) {
        setManagementAuditLocation(formData.location);
      }
      updateFormData('location', '');
    }
  };

  const handleLocationSelect = (location) => {
    updateFormData('location', location);
    setManagementAuditLocation(location); // Remember this selection
    setShowLocationModal(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Clear error and hide options
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: null }));
      }
      setShowImageOptions(false);
    }
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Same validation as file upload
      if (!file.type.startsWith('image/')) {
        alert('Please capture a valid image');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Clear error and hide options
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: null }));
      }
      setShowImageOptions(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setShowImageOptions(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.incident_type) {
      newErrors.incident_type = 'Please select an incident type';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      // Check if date is within the last 7 days
      const selectedDate = new Date(formData.date);
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      } else if (selectedDate < sevenDaysAgo) {
        newErrors.date = 'Date must be within the last 7 days';
      }
    }

    if (!formData.corrective_action.trim()) {
      newErrors.corrective_action = 'Correction action is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setLoading(true);
      setUploadProgress(0);

      try {

        let imageUrl = null;


        // Generate unique docId first (will be used for both Firestore doc and image filename)
        const docId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // Upload image to Cloudinary if selected
        if (selectedImage) {
          setUploadProgress(10);
          
          try {
            // Upload to Cloudinary with progress tracking and same filename format as Supabase
            imageUrl = await uploadImageToCloudinary(
              selectedImage,
              (progress) => {
                // Map Cloudinary progress (0-100) to our progress range (10-70)
                const mappedProgress = 10 + (progress * 0.6);
                setUploadProgress(Math.round(mappedProgress));
              },
              `audit_reports_hcc/${user?.companyId}`, // Organize by user/company
              docId // Pass docId for filename: docId_randomString
            );
            
            setUploadProgress(70);
             
          } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }
        }


        setUploadProgress(80);
        // Insert into Firestore (audit_reports collection)
        // eslint-disable-next-line no-undef
        // const firestore = window.firebase && window.firebase.firestore ? window.firebase.firestore() : null;
        // if (!firestore) {
        //   throw new Error('Firestore is not initialized. Make sure Firebase is loaded and initialized.');
        // }

        const auditReportData = {
          location: formData.location.toUpperCase(),
          description: formData.description,
          date: formData.date,
          emp_code: user?.companyId,
          user_name: user?.displayName?.toUpperCase() || 'UNKNOWN',
          image_url: imageUrl,
          created_at: new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh', hour12: false }),
          // Employee-specific fields from Redux
          department: department || '',
          full_name: fullName || '',
          job_title: jobTitle || '',
          // New fields
          status: 'pending',
          messages: [], // array of map/object
          send_to: [], // array of string
          assigned_department: '', // string
          completed: false,
          completed_at: null,
          rectified_by: '',
          corrective_action: formData.corrective_action,
          incident_type: formData.incident_type,

        };
        // await firestore.collection('audit_reports').add(auditReportData);
        // await firestore.collection('audit_reports').doc(docId).set(auditReportData);
        await setDoc(doc(db, 'audit_reports', docId), auditReportData);

        // Also append a compact history entry into employees_collection/{employeeId}.my_reports
        try {
          const employeeId = String(user?.companyId || '');
          if (employeeId) {
            const historyRef = doc(db, 'employees_collection', employeeId);
            const historyEntry = {
              date: formData.date,
              location: formData.location.toUpperCase(),
              report_type: 'audit',
              report_id: docId,
            };
            // Use setDoc with merge and arrayUnion to avoid a read and create doc/field if missing
            await setDoc(
              historyRef,
              { my_reports: arrayUnion(historyEntry) },
              { merge: true }
            );
          } else {
            console.warn('Skipping history update: user.companyId is missing');
          }
        } catch (histErr) {
          console.error('Failed to append to employees_collection.my_reports:', histErr);
          // Non-fatal: report is already saved; continue flow
        }

        // Append full report data to daily aggregate document in audit_reports_daily/{YYYY-MM-DD}
        try {
          const today = new Date().toISOString().split('T')[0];
          const dailyRef = doc(db, 'audit_reports_daily', today);
          // Use full auditReportData (same shape as saved in audit_reports) and include id
          const fullDailyEntry = { id: docId, ...auditReportData };
          const dailySnap = await getDoc(dailyRef);
          if (dailySnap.exists()) {
            await updateDoc(dailyRef, { reports: arrayUnion(fullDailyEntry) });
          } else {
            await setDoc(dailyRef, { date: today, reports: [fullDailyEntry] });
          }
        } catch (dailyErr) {
          console.error('Failed to append to audit_reports_daily:', dailyErr);
          // Non-fatal: main report already saved
        }

        setUploadProgress(100);
        // Show alert and navigate to home after user clicks OK
        alert('Audit report submitted successfully!');
        navigate('/home');
        // Reset form
        setFormData({ location: '', description: '', date: '', corrective_action: '', incident_type: '' });
        setManagementAuditLocation(''); // Clear remembered location
        removeImage();
      } catch (error) {
        console.error('Error submitting audit report:', error);
        alert(`Failed to submit audit report: ${error.message}`);
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    }
  };

  return (
    <div className="audit-report-container">
      <div className="audit-report-header">
        <div className="audit-report-topbar">
          <button
            className="back-button"
            onClick={() => navigate('/home')}
            style={{ backgroundColor: colors.primary }}
          >
            ← Back
          </button>
          <button
            className="history-button"
            onClick={() => navigate('/AuditHistoryReports')}
            style={{ backgroundColor: colors.primary }}
          >
            History
          </button>
        </div>
        <h1 className="audit-report-title" style={{ color: colors.text }}>Conduct Audit Report</h1>
      </div>

      <div className="audit-report-form">
        {/* Incident Type Selector */}
        <div className="form-group">
          <label style={{ color: colors.text, marginBottom: '10px' }}>
            Incident Type *
          </label>
          <div className="incident-type-selector">
            {incident_type_list.map((type) => (
              <button
                key={type}
                type="button"
                className={`incident-type-button ${
                  formData.incident_type === type ? 'active' : ''
                }`}
                onClick={() => handleIncidentTypeSelect(type)}
                style={{
                  backgroundColor:
                    formData.incident_type === type
                      ? colors.primary
                      : '#f0f0f0',
                  color:
                    formData.incident_type === type
                      ? 'white'
                      : colors.text,
                  borderColor:
                    formData.incident_type === type
                      ? colors.primary
                      : errors.incident_type
                      ? colors.error
                      : '#d1d1d6',
                }}
              >
                {type}
              </button>
            ))}
          </div>
          {errors.incident_type && (
            <span className="error-text" style={{ color: colors.error }}>
              {errors.incident_type}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="location" style={{ color: colors.text }}>
            Location *
          </label>
          <input
            id="location"
            type="text"
            placeholder="Enter location"
            value={formData.location}
            onChange={(e) => updateFormData('location', e.target.value)}
            style={{
              borderColor: errors.location ? colors.error : colors.border
            }}
          />
          {errors.location && (
            <span className="error-text" style={{ color: colors.error }}>
              {errors.location}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="date" style={{ color: colors.text }}>
            Date * (Last 7 days only)
          </label>
          <input
            id="date"
            type="date"
            value={formData.date}
            min={(() => {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return sevenDaysAgo.toISOString().split('T')[0];
            })()}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => updateFormData('date', e.target.value)}
            style={{
              borderColor: errors.date ? colors.error : colors.border
            }}
          />
          {errors.date && (
            <span className="error-text" style={{ color: colors.error }}>
              {errors.date}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description" style={{ color: colors.text }}>
            Description *
          </label>
          <textarea
            id="description"
            placeholder="Enter detailed description of the audit..."
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            rows={2}
            style={{
              borderColor: errors.description ? colors.error : colors.border
            }}
          />
          {errors.description && (
            <span className="error-text" style={{ color: colors.error }}>
              {errors.description}
            </span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="corrective_action" style={{ color: colors.text }}>
            Corrective Action *
          </label>
          <textarea
            id="correction-action"
            placeholder="Enter Corrective Action..."
            value={formData.corrective_action}
            onChange={(e) => updateFormData('corrective_action', e.target.value)}
            rows={2}
            style={{
              borderColor: errors.corrective_action ? colors.error : colors.border
            }}
          />
          {errors.corrective_action && (
            <span className="error-text" style={{ color: colors.error }}>
              {errors.corrective_action}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="image" style={{ color: colors.text }}>
            Upload Image (Optional)
          </label>

          {!imagePreview ? (
            <div className="image-upload-container">
              {!showImageOptions ? (
                <button
                  type="button"
                  className="image-upload-button"
                  onClick={() => setShowImageOptions(true)}
                >
                  <svg viewBox="0 0 24 24" fill={colors.primary} width="24" height="24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                  <span>Add Image</span>
                  <span className="upload-hint">Max 5MB • JPG, PNG, GIF</span>
                </button>
              ) : (
                <div className="image-options">
                  <input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <input
                    id="image-camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    style={{ display: 'none' }}
                  />

                  <label htmlFor="image-file" className="option-button file-option">
                    <svg viewBox="0 0 24 24" fill={colors.primary} width="20" height="20">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    <span>Choose File</span>
                  </label>

                  <label htmlFor="image-camera" className="option-button camera-option">
                    <svg viewBox="0 0 24 24" fill={colors.primary} width="20" height="20">
                      <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z" />
                    </svg>
                    <span>Take Photo</span>
                  </label>

                  <button
                    type="button"
                    className="cancel-option"
                    onClick={() => setShowImageOptions(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                onClick={removeImage}
                className="remove-image-button"
                style={{ backgroundColor: colors.error }}
              >
                <svg viewBox="0 0 24 24" fill="#fff" width="20" height="20">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
                Remove Image
              </button>
            </div>
          )}
          {errors.image && (
            <span className="error-text" style={{ color: colors.error }}>
              {errors.image}
            </span>
          )}
        </div>

        {loading && uploadProgress > 0 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${uploadProgress}%`,
                  backgroundColor: colors.primary
                }}
              />
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.textSecondary : colors.primary
          }}
        >
          {loading ? 'Submitting...' : 'Submit Audit Report'}
        </button>
      </div>

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: colors.text, margin: 0 }}>Select Audit Location</h3>
              <button 
                className="modal-close-button"
                onClick={() => setShowLocationModal(false)}
                style={{ color: colors.text }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="location-list">
                {auditLocation.map((location, index) => {
                  const isSelected = location === managementAuditLocation || location === formData.location;
                  return (
                    <button
                      key={index}
                      className={`location-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleLocationSelect(location)}
                      style={{
                        backgroundColor: isSelected ? colors.primary : '#f8f9fa',
                        color: isSelected ? 'white' : colors.text,
                        borderColor: isSelected ? colors.primary : colors.border,
                        fontWeight: isSelected ? '600' : 'normal'
                      }}
                    >
                      {location}
                      {isSelected && (
                        <span style={{ marginLeft: '8px', fontSize: '14px' }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowLocationModal(false)}
                style={{ 
                  backgroundColor: colors.textSecondary,
                  color: 'white'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditReport
