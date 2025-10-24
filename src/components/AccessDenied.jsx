import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../constants/color';

const AccessDenied = ({ feature }) => {
  const navigate = useNavigate();

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        textAlign: 'center'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '40px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill={colors.error || '#ff4444'} 
          width="64" 
          height="64"
          style={{ marginBottom: '20px' }}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        
        <h1 style={{ color: colors.text || '#333', marginBottom: '16px' }}>
          Access Denied
        </h1>
        
        <p style={{ color: colors.textSecondary || '#666', marginBottom: '24px' }}>
          You don't have permission to access {feature || 'this feature'}. 
          Please contact your administrator if you believe this is an error.
        </p>
        
        <button
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: colors.primary || '#FF9500',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.9'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;