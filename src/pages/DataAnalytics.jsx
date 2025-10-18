import React from 'react'
import { useNavigate } from 'react-router-dom'
import './DataAnalytics.css'

function DataAnalytics() {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/home');
  };

  return (
    <div className="under-construction-container">
      <div className="under-construction-content">
        <div className="construction-icon">
          🚧
        </div>
        <h1 className="construction-title">Under Construction</h1>
        <p className="construction-message">
          This page is currently being developed. Please check back soon!
        </p>
        <div className="construction-animation">
          <div className="gear gear-1">⚙️</div>
          <div className="gear gear-2">⚙️</div>
        </div>
        <button className="back-to-home-btn" onClick={handleBackToHome}>
          🏠 Back to Home
        </button>
      </div>
    </div>
  )
}

export default DataAnalytics
