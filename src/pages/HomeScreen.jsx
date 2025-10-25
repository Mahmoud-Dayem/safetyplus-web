import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeUser } from "../helper/authStorage";
import { colors } from '../constants/color';
import { useNavigate } from 'react-router-dom';
import { logout, updateUserProfile } from '../store/authSlice';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const name = user?.displayName;
  const id = user?.companyId;

  // Fetch employee document and update Redux store
  useEffect(() => {
    const fetchUserDocument = async () => {
      if (!id) {
         return;
      }

      try {
        const userDocRef = doc(db, 'employees_collection', id);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const empData = userDocSnap.data();
 
          // Combine first_name and last_name with space between
          const fullName = `${empData.first_name || ''} ${empData.last_name || ''}`.trim();

          // Dispatch to Redux to store department, fullName, jobTitle, and permissions
          dispatch(updateUserProfile({
            department: empData.department || null,
            fullName: fullName || null,
            jobTitle: empData.job_title || null,
            stopcard: empData.stopcard === true, // default to false if not specified
            inbox: empData.inbox === true, // default to false if not specified
          }));
        } else {
         }
      } catch (error) {
        console.error('Error fetching user document:', error);
      }
    };

    fetchUserDocument();
  }, [id, dispatch]);

  // No Home banner needed; StopCard handles alerts before navigation


  const navigateToStopCard = () => {
    navigate('/stopcard');
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      'Are you sure you want to logout? You will need to sign in again.'
    );

    if (confirmed) {
      (async () => {
        try {
          // Clear AsyncStorage
          dispatch(logout());
          await removeUser();

          // Navigate to Auth screen
          navigate('/auth', { replace: true });
        } catch (error) {
          console.error('Logout error:', error);
        }
      })();
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="header-section">
          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <svg className="logout-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            <span className="logout-text">Logout</span>
          </button>

          {/* Compact User Info */}
          <div className="compact-user-info">
            <p className="welcome-text">Welcome back!</p>
            <h2 className="user-name-compact">{name.toUpperCase()}</h2>
            <span className="company-id-compact">ID: {id}</span>
          </div>

          <svg className="shield-checkmark" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          <h1 className="app-title">Safety Plus</h1>
          <p className="subtitle">Workplace Safety Management</p>
        </div>

        <div className="button-section">
          {user?.stopcard && (
            <button
              className="stop-card-button"
              onClick={navigateToStopCard}
            >
              <svg className="button-icon" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <div className="button-text-container">
                <span className="button-title">Start STOP Card</span>
                <span className="button-subtitle">Safety Task Observation Program</span>
              </div>
              <svg className="chevron-icon" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          )}

          <button
            className="audit-button"
            onClick={() => navigate('/audits')}
          >
            <svg className="button-icon" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
            </svg>
            <div className="button-text-container">
              <span className="button-title">Conduct Audit Report</span>
              <span className="button-subtitle">Comprehensive safety audit assessment</span>
            </div>
            <svg className="chevron-icon" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>

          {user?.inbox && (
            <button
              className="reports-button"
              onClick={() => navigate('/inbox')}
            >
              <svg className="button-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                <path d="M19 3H4.99c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.88 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H5V5h14v10z" />
              </svg>
              <div className="button-text-container">
                <span className="reports-button-title">Inbox</span>
                <span className="reports-button-subtitle">Check Assigned Reports </span>
              </div>
              <svg className="chevron-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          )}
          {
            user?.isAdmin && (
              <>

                <button
                  className="reports-button"
                  onClick={() => navigate('/viewallstopreports')}
                >
                  <svg className="button-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <div className="button-text-container">
                    <span className="reports-button-title">Plant STOP Reports </span>
                    <span className="reports-button-subtitle">Review All past safety observations</span>
                  </div>
                  <svg className="chevron-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                </button>
                         <button
                  className="reports-button"
                  onClick={() => navigate('/viewallauditreports')}
                >
                  <svg className="button-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <div className="button-text-container">
                    <span className="reports-button-title">Plant Audit Reports </span>
                    <span className="reports-button-subtitle">Check All Audit Safety Observations</span>
                  </div>
                  <svg className="chevron-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                </button>
                {/* <button
                  className="analytics-button"
                  onClick={() => navigate('/data-analytics')}
                >
                  <svg className="button-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                  </svg>
                  <div className="button-text-container">
                    <span className="reports-button-title">Data Analytics</span>
                    <span className="reports-button-subtitle">View insights and statistics</span>
                  </div>
                  <svg className="chevron-icon" viewBox="0 0 24 24" fill={colors.primary || '#FF9500'}>
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                </button> */}
              </>

            )
          }


        </div>

        <div className="footer-section">
 
          <p className="footer-text">
            Conduct safety observations and generate reports
          </p>
        </div>
      </div>
    </div>
  );
};



export default HomeScreen;