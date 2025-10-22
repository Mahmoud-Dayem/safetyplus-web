import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './AuditReport.css';
import { setDoc, doc } from 'firebase/firestore';
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
  const incident_type_list = ['Unsafe Condition', 'Unsafe Act', 'Near Miss', 'Environment Concern', 'Management Audit'];


  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
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

        // Upload image to Supabase Storage if selected
        if (selectedImage) {
          setUploadProgress(20);
          const fileExt = selectedImage.name.split('.').pop();
          const fileName = `${docId}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `${user?.companyId}/${fileName}`;

          setUploadProgress(40);
          const { error: uploadError } = await supabase.storage
            .from('auditBucket')
            .upload(filePath, selectedImage, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }

          setUploadProgress(60);
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('auditBucket')
            .getPublicUrl(filePath);

          imageUrl = urlData.publicUrl;
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

        setUploadProgress(100);
        // Show alert and navigate to home after user clicks OK
        alert('Audit report submitted successfully!');
        navigate('/home');
        // Reset form
        setFormData({ location: '', description: '', date: '' });
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
                onClick={() => updateFormData('incident_type', type)}
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
            Date *
          </label>
          <input
            id="date"
            type="date"
            value={formData.date}
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
    </div>
  )
}

export default AuditReport
