import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AuthScreen from './pages/AuthScreen';
import HomeScreen from './pages/HomeScreen';
import StopCard from './pages/StopCard';
import ReportHistory from './pages/ReportHistory';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

function App() {
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
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        {/* Catch all - redirect to auth */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
