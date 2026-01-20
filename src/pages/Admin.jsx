import React, { useState, useEffect } from 'react'
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Admin.css';
import { collection, addDoc, setDoc, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig';

function Admin() {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const departments = useSelector((state) => state.departments.list);



    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        emp_code: '',
        job_title: '',
        email: '',
        phone: '',
        department: '',
        inbox: false,
        isChief: false,
        stopcard: false,
        isSupervisor: false
    });

    // const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [departmentDetails, setDepartmentDetails] = useState({
        chief_name: '',
        chief_code: '',
        dept_code: '',
        dept_name: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

    // Fetch departments on component mount
    // useEffect(() => {
    //     const fetchDepartments = async () => {
    //         try {
    //             const querySnapshot = await getDocs(collection(db, 'departments'));
    //             const deptList = [];
    //             querySnapshot.forEach((doc) => {
    //                 deptList.push({
    //                     id: doc.id,
    //                     ...doc.data()
    //                 });
    //             });
    //             setDepartments(deptList);
    //         } catch (error) {
    //             console.error('Error fetching departments:', error);
    //             alert('Failed to load departments');
    //         } finally {
    //             setIsLoadingDepartments(false);
    //         }
    //     };

    //     fetchDepartments();
    // }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleDepartmentChange = (e) => {
        const deptCode = e.target.value;
        setFormData(prev => ({ ...prev, department: deptCode }));

        // Find selected department and set details
        const dept = departments.find(d => d.dept_code === deptCode);
        if (dept) {
            setSelectedDepartment(dept);
            setDepartmentDetails({
                chief_name: dept.chief_name || '',
                chief_code: dept.chief_code || '',
                dept_code: dept.dept_code || '',
                dept_name: dept.dept_name || ''
            });
        } else {
            setSelectedDepartment(null);
            setDepartmentDetails({
                chief_name: '',
                chief_code: '',
                dept_code: '',
                dept_name: ''
            });
        }

        // Clear error
        if (errors.department) {
            setErrors(prev => ({ ...prev, department: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.emp_code) {
            newErrors.emp_code = 'Employee code is required';
        } else if (isNaN(formData.emp_code) || parseInt(formData.emp_code) <= 0) {
            newErrors.emp_code = 'Employee code must be a positive number';
        }

        if (!formData.job_title.trim()) {
            newErrors.job_title = 'Job title is required';
        }

        if (!formData.department) {
            newErrors.department = 'Department is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare data for submission
            const userData = {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                emp_code: String(formData.emp_code),
                job_title: formData.job_title.trim(),
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                // department: formData.department,
                // Department details
                chief: departmentDetails.chief_name,
                chief_id: departmentDetails.chief_code,
                dept_code: departmentDetails.dept_code,
                department: departmentDetails.dept_name,
                // Permissions
                inbox: formData.inbox,
                isChief: formData.isChief,
                isSupervisor: formData.isSupervisor,
                stopcard: formData.stopcard,
            };

            // Check if employee code already exists
            const empCodeRef = doc(db, 'employees_collection', userData.emp_code);
            const empCodeSnap = await getDoc(empCodeRef);

            if (empCodeSnap.exists()) {
                alert(`Employee code ${userData.emp_code} already exists! Please use a different employee code.`);
                setErrors({ emp_code: 'This employee code is already in use' });
                setIsSubmitting(false);
                return;
            }

            // Add to Firestore
            await setDoc(empCodeRef, userData);

            alert('User created successfully!');

            // Reset form
            setFormData({
                first_name: '',
                last_name: '',
                emp_code: '',
                job_title: '',
                email: '',
                phone: '',
                department: '',
                inbox: false,
                isChief: false,
                stopcard: false,
                isSupervisor: false
            });

            // Reset department details
            setSelectedDepartment(null);
            setDepartmentDetails({
                chief_name: '',
                chief_code: '',
                dept_code: '',
                dept_name: ''
            });

        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <button className="admin-back-button" onClick={() => navigate('/home')}>
                    <svg viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                    Back
                </button>
                <h1>Admin Panel</h1>
            </div>

            <div className="admin-form-container">
                <h2 className="admin-form-title">Create New User</h2>

                <form onSubmit={handleSubmit} className="admin-user-form">
                    <div className="admin-form-row">
                        <div className="admin-form-group">
                            <label htmlFor="first_name">
                                First Name <span className="admin-required">*</span>
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                className={errors.first_name ? 'admin-error' : ''}
                                placeholder="Enter first name"
                            />
                            {errors.first_name && <span className="admin-error-message">{errors.first_name}</span>}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="last_name">
                                Last Name <span className="admin-required">*</span>
                            </label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                className={errors.last_name ? 'admin-error' : ''}
                                placeholder="Enter last name"
                            />
                            {errors.last_name && <span className="admin-error-message">{errors.last_name}</span>}
                        </div>
                    </div>

                    <div className="admin-form-row">
                        <div className="admin-form-group">
                            <label htmlFor="emp_code">
                                Employee Code <span className="admin-required">*</span>
                            </label>
                            <input
                                type="number"
                                id="emp_code"
                                name="emp_code"
                                value={formData.emp_code}
                                onChange={handleInputChange}
                                className={errors.emp_code ? 'admin-error' : ''}
                                placeholder="Enter employee code"
                            />
                            {errors.emp_code && <span className="admin-error-message">{errors.emp_code}</span>}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="job_title">
                                Job Title <span className="admin-required">*</span>
                            </label>
                            <input
                                type="text"
                                id="job_title"
                                name="job_title"
                                value={formData.job_title}
                                onChange={handleInputChange}
                                className={errors.job_title ? 'admin-error' : ''}
                                placeholder="Enter job title"
                            />
                            {errors.job_title && <span className="admin-error-message">{errors.job_title}</span>}
                        </div>
                    </div>

                    <div className="admin-form-row">
                        <div className="admin-form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email (optional)"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Enter phone number (optional)"
                            />
                        </div>
                    </div>

                    <div className="admin-form-row">
                        <div className="admin-form-group">
                            <label htmlFor="department">
                                Department <span className="admin-required">*</span>
                            </label>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleDepartmentChange}
                                className={errors.department ? 'admin-error' : ''}
                            // disabled={isLoadingDepartments}
                            >
                                <option key="empty" value="">
                                    {false ? 'Loading departments...' : 'Select a department'}
                                </option>
                                {departments.map((dept) => (
                                    <option key={dept.dept_code} value={dept.dept_code}>
                                        {dept.dept_name}
                                    </option>
                                ))}
                            </select>
                            {errors.department && <span className="admin-error-message">{errors.department}</span>}
                        </div>
                    </div>

                    {selectedDepartment && (
                        <div className="admin-department-details">
                            <h3 className="admin-details-title">Department Details</h3>
                            <div className="admin-details-grid">
                                <div className="admin-detail-item">
                                    <span className="admin-detail-label">Department Name:</span>
                                    <span className="admin-detail-value">{departmentDetails.dept_name || 'N/A'}</span>
                                </div>
                                <div className="admin-detail-item">
                                    <span className="admin-detail-label">Department Code:</span>
                                    <span className="admin-detail-value">{departmentDetails.dept_code || 'N/A'}</span>
                                </div>
                                <div className="admin-detail-item">
                                    <span className="admin-detail-label">Chief Name:</span>
                                    <span className="admin-detail-value">{departmentDetails.chief_name || 'N/A'}</span>
                                </div>
                                <div className="admin-detail-item">
                                    <span className="admin-detail-label">Chief Code:</span>
                                    <span className="admin-detail-value">{departmentDetails.chief_code || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="admin-form-group">
                        <label className="admin-section-label">Permissions</label>
                        <div className="admin-checkbox-group">
                            <label className="admin-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="inbox"
                                    checked={formData.inbox}
                                    onChange={handleInputChange}
                                />
                                <span className="admin-checkbox-text">
                                    <strong>Inbox</strong> - User has inbox to receive reports
                                </span>
                            </label>

                            <label className="admin-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isChief"
                                    checked={formData.isChief}
                                    onChange={handleInputChange}
                                />
                                <span className="admin-checkbox-text">
                                    <strong>Chief</strong> - User is a chief
                                </span>
                            </label>
                            <label className="admin-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isSupervisor"
                                    checked={formData.isSupervisor}
                                    onChange={handleInputChange}
                                />
                                <span className="admin-checkbox-text">
                                    <strong>Supervisor</strong> - User is a supervisor
                                </span>
                            </label>

                            <label className="admin-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="stopcard"
                                    checked={formData.stopcard}
                                    onChange={handleInputChange}
                                />
                                <span className="admin-checkbox-text">
                                    <strong>Stop Card</strong> - User is privileged for stop card
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="admin-form-actions">
                        <button
                            type="submit"
                            className="admin-submit-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Admin