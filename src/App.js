import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { login } from './store/authSlice';
import { storeUser } from './helper/authStorage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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
import AccessDenied from './components/AccessDenied'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Permission-based Protected Route for StopCard features
const StopCardProtectedRoute = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    const checkStopCardPermission = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // If stopcard permission is already loaded and true, allow access
      if (user.stopcard === true) {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // If we have a companyId but no stopcard permission loaded, fetch from Firestore
      // if (user.companyId && user.stopcard !== true) {
      //   try {
      //     const { doc, getDoc } = await import('firebase/firestore');
      //     const { db } = await import('./firebase/firebaseConfig');
      //     const { updateUserProfile } = await import('./store/authSlice');
          
      //     const userDocRef = doc(db, 'employees_collection', user.companyId);
      //     const userDocSnap = await getDoc(userDocRef);
          
      //     if (userDocSnap.exists()) {
      //       const empData = userDocSnap.data();
      //       const fullName = `${empData.first_name || ''} ${empData.last_name || ''}`.trim();
            
      //       // Update Redux with employee data
      //       dispatch(updateUserProfile({
      //         department: empData.department || null,
      //         fullName: fullName || null,
      //         jobTitle: empData.job_title || null,
      //         stopcard: empData.stopcard === true,
      //         inbox: empData.inbox === true,
      //       }));
            
      //       // Check stopcard permission
      //       setHasPermission(empData.stopcard === true);
      //     } else {
      //       setHasPermission(false);
      //     }
      //   } catch (error) {
      //     console.error('Error checking stopcard permission:', error);
      //     setHasPermission(false);
      //   }
      // } else {
      //   setHasPermission(false);
      // }
      
      setLoading(false);
    };

    checkStopCardPermission();
  }, [user, dispatch]);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Checking permissions...</div>
      </div>
    );
  }
  
  if (!hasPermission) {
    return <AccessDenied feature="STOP Card features" />;
  }
  
  return children;
};

// Permission-based Protected Route for Inbox features
const InboxProtectedRoute = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    const checkInboxPermission = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // If inbox permission is already loaded and true, allow access
      if (user.inbox === true) {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // If we have a companyId but no inbox permission loaded, fetch from Firestore
      // if (user.companyId && user.inbox !== true) {
      //   try {
      //     const { doc, getDoc } = await import('firebase/firestore');
      //     const { db } = await import('./firebase/firebaseConfig');
      //     const { updateUserProfile } = await import('./store/authSlice');
          
      //     const userDocRef = doc(db, 'employees_collection', user.companyId);
      //     const userDocSnap = await getDoc(userDocRef);
          
      //     if (userDocSnap.exists()) {
      //       const empData = userDocSnap.data();
      //       const fullName = `${empData.first_name || ''} ${empData.last_name || ''}`.trim();
            
      //       // Update Redux with employee data
      //       dispatch(updateUserProfile({
      //         department: empData.department || null,
      //         fullName: fullName || null,
      //         jobTitle: empData.job_title || null,
      //         stopcard: empData.stopcard === true,
      //         inbox: empData.inbox === true,
      //       }));
            
      //       // Check inbox permission
      //       setHasPermission(empData.inbox === true);
      //     } else {
      //       setHasPermission(false);
      //     }
      //   } catch (error) {
      //     console.error('Error checking inbox permission:', error);
      //     setHasPermission(false);
      //   }
      // } else {
      //   setHasPermission(false);
      // }
      
      setLoading(false);
    };

    checkInboxPermission();
  }, [user, dispatch]);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Checking permissions...</div>
      </div>
    );
  }
  
  if (!hasPermission) {
    return <AccessDenied feature="Inbox features" />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const user = useSelector(state => state.auth.user);

  // Update browser tab title with user name globally
  useEffect(() => {
    if (user) {
      const userName = user?.displayName || user?.fullName || user?.email || 'User';
      document.title = `SafetyPlus - ${userName}`;
    } else {
      document.title = 'SafetyPlus';
    }
  }, [user]);

  // Check if app is running as PWA
  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone || 
                  document.referrer.includes('android-app://');
    
    if (isPWA) {
       // Request persistent storage to reduce data eviction by the OS
       if (navigator.storage && navigator.storage.persist) {
         navigator.storage.persist().catch(() => {});
       }
    }
  }, []);

  // Restore user from localStorage on app mount and also listen to Firebase auth state
  useEffect(() => {
    const restoreUser = async () => {
      try {
         const storedUser = await getUser();
        if (storedUser) {
           dispatch(login(storedUser));
        } else {
          // console.log('No user found in storage - redirecting to auth');
        }
      } catch (error) {
        console.error('Error restoring user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    restoreUser();

    // Also hydrate from Firebase if it has an existing session (important for PWA installs)
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // If Redux already has a user, skip
        const currentStored = await getUser();
        if (!currentStored) {
          // Try to enrich with companyId from users_by_uid mapping
          let enriched = {
            uid: fbUser.uid,
            email: fbUser.email,
            emailVerified: fbUser.emailVerified,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            token: fbUser.accessToken,
          };
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('./firebase/firebaseConfig');
            const mapSnap = await getDoc(doc(db, 'users_by_uid', fbUser.uid));
            if (mapSnap.exists()) {
              const data = mapSnap.data();
              enriched = {
                ...enriched,
                companyId: data.companyId,
                isAdmin: false,
                isPrivileged: false,
              };
            }
          } catch (e) {
            // Non-fatal; proceed with minimal info
          }
          dispatch(login(enriched));
          await storeUser(enriched);
        }
      }
    });
    
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
      unsubscribe && unsubscribe();
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
            <StopCardProtectedRoute>
              <StopCard />
            </StopCardProtectedRoute>
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
            <InboxProtectedRoute>
              <Inbox/>
            </InboxProtectedRoute>
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
