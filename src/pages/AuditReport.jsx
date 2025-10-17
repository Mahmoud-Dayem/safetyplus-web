import React, { useState ,useEffect} from 'react'
import { supabase } from './supabaseClient'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
 import './AuditReport.css';

function AuditReport() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const id = user?.companyId;

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')     // 👈 your table name
        .select('*')
        .eq('emp_code', id)
        .single();           // fetch all columns

      if (error) {
        console.error('Error fetching data:', error)
      } else {
        console.log('Employees table data:', data)
      }
    }

    fetchEmployees()
  }, [id])


  const [formData, setFormData] = useState({
    location: '',
    description: '',
    date: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      // Clear error
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: null }));
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
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

        // Upload image to Supabase Storage if selected
        if (selectedImage) {
          setUploadProgress(20);
          const fileExt = selectedImage.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
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
        // Insert into Supabase
        const { error } = await supabase
          .from('audit_reports')
          .insert([{
            location: formData.location.toUpperCase(),
            description: formData.description,
            date: formData.date,
            emp_code: user?.companyId,
            user_name: user?.displayName?.toUpperCase() || 'UNKNOWN',
            image_url: imageUrl,
          }]);

        if (error) throw error;

        setUploadProgress(100);
        alert('Audit report submitted successfully!');
        
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
            rows={5}
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
          <label htmlFor="image" style={{ color: colors.text }}>
            Upload Image (Optional)
          </label>
          
          {!imagePreview ? (
            <div className="image-upload-container">
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="image" className="image-upload-button">
                <svg viewBox="0 0 24 24" fill={colors.primary} width="24" height="24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>Click to upload image</span>
                <span className="upload-hint">Max 5MB • JPG, PNG, GIF</span>
              </label>
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
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
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
