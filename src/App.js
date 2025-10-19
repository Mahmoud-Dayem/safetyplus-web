import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { login } from './store/authSlice';
import { getUser } from './helper/authStorage';
import AuthScreen from './pages/AuthScreen';
import HomeScreen from './pages/HomeScreen';
import StopCard from './pages/StopCard';
import ReportHistory from './pages/ReportHistory';
import './App.css';
import AuditReport from './pages/AuditReport';
import AuditHistoryReports from './pages/AuditHistoryReports'
import Inbox from './pages/Inbox';
import AllStopReports from './pages/AllStopReports'
import AllAuditReports from './pages/AllAuditReports'
import AuditReportDetails from './pages/AuditReportDetails'
import AuditReportDetailsInbox from './pages/AuditReportDetailsInbox'
import DataAnalytics from './pages/DataAnalytics'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  // Check if app is running as PWA
  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone || 
                  document.referrer.includes('android-app://');
    
    if (isPWA) {
      console.log('App is running as PWA');
      // Add PWA-specific initialization here if needed
    }
  }, []);

  // Restore user from localStorage on app mount
  useEffect(() => {
    const restoreUser = async () => {
      try {
        console.log('Attempting to restore user from storage...');
        const storedUser = await getUser();
        if (storedUser) {
          console.log('User found in storage:', storedUser.email);
          dispatch(login(storedUser));
        } else {
          console.log('No user found in storage - redirecting to auth');
        }
      } catch (error) {
        console.error('Error restoring user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    restoreUser();
    
    // Also listen for storage changes (in case user logs in from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'safetyplus_user_auth' && e.newValue) {
        try {
          const user = JSON.parse(e.newValue);
          dispatch(login(user));
        } catch (error) {
          console.error('Error parsing storage user:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);

  // Show loading state while checking localStorage
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/auth" element={<AuthScreen />} />
        
        {/* Protected Routes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stopcard" 
          element={
            <ProtectedRoute>
              <StopCard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <ReportHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audits" 
          element={
            <ProtectedRoute>
              <AuditReport/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/AuditHistoryReports" 
          element={
            <ProtectedRoute>
              <AuditHistoryReports/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/inbox" 
          element={
            <ProtectedRoute>
              <Inbox/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/viewallstopreports" 
          element={
            <ProtectedRoute>
              <AllStopReports/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/viewallauditreports" 
          element={
            <ProtectedRoute>
              <AllAuditReports/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit-report-details" 
          element={
            <ProtectedRoute>
              <AuditReportDetails/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit-report-details-assigned" 
          element={
            <ProtectedRoute>
              <AuditReportDetailsInbox/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/data-analytics" 
          element={
            <ProtectedRoute>
              <DataAnalytics/>
            </ProtectedRoute>
          } 
        />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        {/* Catch all - redirect to auth */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
