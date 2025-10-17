import React, { useState ,useEffect} from 'react'
import { supabase } from './supabaseClient'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
 import './AuditReport.css';

function AuditReport() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const name = user?.displayName;
  const id = user?.companyId;

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')     // 👈 your table name
        .select('*')
        .eq('emp_code', id)
                   // fetch all columns

      if (error) {
        console.error('Error fetching data:', error)
      } else {
        console.log('Departments table data:', data)
      }
    }

    fetchEmployees()
  }, [])


  const [formData, setFormData] = useState({
    location: '',
    description: '',
    date: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
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
      try {
        // Your submission logic here
        console.log('Submitting audit report:', {
          ...formData,
          companyId: user?.companyId,
          userName: user?.displayName,
        });

        // Example: Insert into Supabase
        // const { data, error } = await supabase
        //   .from('audit_reports')
        //   .insert([{
        //     location: formData.location,
        //     description: formData.description,
        //     date: formData.date,
        //     company_id: user?.companyId,
        //     user_name: user?.displayName,
        //   }]);

        // if (error) throw error;

        alert('Audit report submitted successfully!');
        // Reset form
        setFormData({ location: '', description: '', date: '' });
      } catch (error) {
        console.error('Error submitting audit report:', error);
        alert('Failed to submit audit report. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="audit-report-container">
      <div className="audit-report-header">
        <button
          className="back-button"
          onClick={() => navigate('/home')}
          style={{ backgroundColor: colors.primary }}
        >
          ← Back
        </button>
        <h1 style={{ color: colors.text }}>Conduct Audit Report</h1>
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
            rows={8}
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
