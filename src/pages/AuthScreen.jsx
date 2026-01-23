import React, { useState } from 'react';
import { login } from "../store/authSlice";
import { storeUser } from "../helper/authStorage";
import { useDispatch } from "react-redux";
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { signup, signin, resetPassword } from "../firebase/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import './AuthScreen.css';
const AuthScreen = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Start with login mode
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [validatingEmployee, setValidatingEmployee] = useState(false);

  // Function to validate if employee exists in employees_collection
  const validateEmployeeExists = async (companyId) => {
    try {
      const employeeDocRef = doc(db, 'employees_collection', companyId);
      const employeeDoc = await getDoc(employeeDocRef);
      return employeeDoc.exists();
    } catch (error) {
      console.error('Error checking employee:', error);
      return false;
    }
  };
  const dispatch = useDispatch();
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation (required for both login and signup)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (required for both login and signup)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    //
    const companyIdRegex = /^3[0-9]{4}$/;
    if (!formData.companyId) {
      newErrors.companyId = 'Company ID is required';
    } else if (!companyIdRegex.test(formData.companyId)) {
      newErrors.companyId = 'Company ID must be 5 digits   (e.g., 12345)';
    }

    // Signup-only validations
    if (!isLogin) {
      // Name validation
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Company ID validation
      const companyIdRegex = /^3[0-9]{4}$/;
      if (!formData.companyId) {
        newErrors.companyId = 'Company ID is required';
      } else if (!companyIdRegex.test(formData.companyId)) {
        newErrors.companyId = 'Company ID must be 5 digits  (e.g., 31234)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      setLoading(true);
      const email = formData.email;
      const password = formData.password;
      const companyId = formData.companyId;
      const result = await signin({ email, password, companyId });

      setLoading(false);
      if (result.status === "ok") {

        const dispatchPayload = {
          uid: result.message.uid,
          email: result.message.email,
          emailVerified: result.message.emailVerified,
          displayName: result.message.displayName,
          photoURL: result.message.photoURL,
          token: result.message.accessToken,
          companyId: result.companyId,
          isAdmin: result.isAdmin,
          isPrivileged: result.isPrivileged,
          department: result.department,
          jobTitle: result.jobTitle,
          stopcard: result.stopcard,
          inbox: result.inbox,
          fullName: result.fullName,
          isChief: result.isChief,
          isSupervisor: result.isSupervisor

        };

        // Store user in localStorage
        await storeUser(dispatchPayload);

        // Update Redux state
        dispatch(login(dispatchPayload));

        // Navigate to home screen after successful login
        navigate('/home');

      } else if (result.error && result.message.includes("user not found")) {
        window.alert("User not found. Please sign up first.");
        setIsLogin(false);
      } else {
        window.alert("Login failed: " + result.message);
      }

    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    const result = await resetPassword(formData.email);
    setLoading(false);

    if (result.status === "ok") {
      window.alert("Password reset email sent! Please check your inbox and spam/junk folder. If you don't see it, please wait a few minutes and check again.");
      setIsForgotPassword(false);
      setIsLogin(true);
    } else {
      window.alert("Error: " + result.message);
    }
  };

  const handleSignup = async () => {
    if (validateForm()) {
      setLoading(true);
      setValidatingEmployee(true);

      try {
        const email = formData.email;
        const password = formData.password;
        const displayName = formData.name;
        const companyId = formData.companyId;

        // First, validate if employee exists in employees_collection
        const employeeExists = await validateEmployeeExists(companyId);
        setValidatingEmployee(false);

        if (!employeeExists) {
          setErrors({ companyId: 'Employee ID not found. Please contact your administrator.' });
          setLoading(false);
          return;
        }

        // Proceed with signup if employee exists
        const result = await signup({ email, password, displayName, companyId });
        setLoading(false);

        if (result.status === "ok") {
          const dispatchPayload = {
            uid: result.message.uid,
            email: result.message.email,
            emailVerified: result.message.emailVerified,
            displayName: result.message.displayName,
            photoURL: result.message.photoURL,
            token: result.message.accessToken,
            isAdmin: false,
            isPrivileged: false,
            companyId,
            department: result.department,
            jobTitle: result.jobTitle,
            stopcard: result.stopcard,
            inbox: result.inbox,
            fullName: result.fullName,
            isChief: result.isChief,
            isSupervisor: result.isSupervisor

          };

          // Store user in localStorage
          await storeUser(dispatchPayload);

          // Update Redux state
          dispatch(login(dispatchPayload));

          window.alert(`Success! Welcome ${formData.name}! Your account has been created.`);
          navigate('/home'); // Navigate to home screen after successful signup
        } else if (result.error && result.message.includes("already in use")) {
          window.alert("User already exists. Please log in instead.");
          setIsLogin(true);
        } else {
          window.alert("Signup failed: " + result.message);
        }
      } catch (error) {
        console.error('Error during signup:', error);
        setValidatingEmployee(false);
        setLoading(false);
        window.alert('An error occurred during signup. Please try again.');
      }
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setErrors({});
    // Clear form data when switching modes
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyId: '',
    });
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setErrors({});
  };

  const formatCompanyId = (text) => {
    // Remove non-numeric characters and limit to 5 digits
    const numeric = text.replace(/[^0-9]/g, '');
    return numeric.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-scroll-view">
        {/* Header */}
        <div className="auth-header">
          <svg className="shield-icon" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          <h1 className="app-title-authscreen">Safety Plus</h1>
          <p className="subtitle">
            {isForgotPassword ? 'Reset Your Password' : (isLogin ? 'Welcome Back' : 'Create Your Account')}
          </p>
        </div>

        {/* Auth Form */}
        <div className="form-container-auth">

          {/* Name Input - Only for Signup */}
          {!isLogin && !isForgotPassword && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className={`input-container ${errors.name ? 'input-error' : ''}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill={colors.textSecondary}>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <input
                  type="text"
                  className="text-input"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </div>
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          {/* Email Input */}
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className={`input-container ${errors.email ? 'input-error' : ''}`}>
              <svg className="input-icon" viewBox="0 0 24 24" fill={colors.textSecondary}>
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <input
                type="email"
                className="text-input"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value.toLowerCase())}
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Password Input - Hide in forgot password mode */}
          {!isForgotPassword && (
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className={`input-container ${errors.password ? 'input-error' : ''}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill={colors.textSecondary}>
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  className="text-input"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-icon"
                >
                  <svg viewBox="0 0 24 24" fill={colors.textSecondary}>
                    {showPassword ? (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    ) : (
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
          )}

          {/* Confirm Password Input - Only for Signup */}
          {!isLogin && !isForgotPassword && (
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className={`input-container ${errors.confirmPassword ? 'input-error' : ''}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill={colors.textSecondary}>
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="text-input"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="eye-icon"
                >
                  <svg viewBox="0 0 24 24" fill={colors.textSecondary}>
                    {showConfirmPassword ? (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    ) : (
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                    )}
                  </svg>
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          )}

          {/* Company ID Input - Hide in forgot password mode */}
          {!isForgotPassword && (
            <div className="input-group">
              <label className="input-label">Company ID</label>
              <div className={`input-container ${errors.companyId ? 'input-error' : ''}`}>
                <svg className="input-icon" viewBox="0 0 24 24" fill={colors.textSecondary}>
                  <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                </svg>
                <input
                  type="text"
                  className="text-input"
                  value={formData.companyId}
                  onChange={(e) => updateFormData('companyId', formatCompanyId(e.target.value))}
                  placeholder="XXXXX (e.g., 31234)"
                  maxLength={5}
                />
              </div>
              {errors.companyId && <span className="error-text">{errors.companyId}</span>}
              <span className="help-text">5-digit ID  </span>
            </div>
          )}

          {/* Auth Button */}
          <button
            className="auth-button"
            onClick={isForgotPassword ? handleForgotPassword : (isLogin ? handleLogin : handleSignup)}
            disabled={loading || validatingEmployee}
          >
            {validatingEmployee ? 'Validating Employee...' :
              loading ? 'Please Wait...' :
                isForgotPassword ? 'Send Reset Email' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {/* Forgot Password Link - Only show in login mode */}
          {isLogin && !isForgotPassword && (
            <div className="forgot-password-container">
              <button type="button" onClick={toggleForgotPassword} className="forgot-password-link">
                Forgot Password?
              </button>
            </div>
          )}

          {/* Toggle Auth Mode */}
          {!isForgotPassword && (
            <div className="toggle-container">
              <span className="toggle-text">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button type="button" onClick={toggleAuthMode} className="toggle-link-btn">
                <span className="toggle-link">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </span>
              </button>
            </div>
          )}

          {/* Back to Login from Forgot Password */}
          {isForgotPassword && (
            <div className="toggle-container">
              <span className="toggle-text">Remember your password? </span>
              <button type="button" onClick={toggleForgotPassword} className="toggle-link-btn">
                <span className="toggle-link">Back to Sign In</span>
              </button>
            </div>
          )}

          {/* Footer */}
          {!isLogin && (
            <div className="footer">
              <p className="footer-text">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};



export default AuthScreen;