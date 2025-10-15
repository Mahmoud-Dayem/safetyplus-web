import React from 'react';
import { colors } from '../constants/color';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Render custom error UI
      return (
        <div className="error-boundary-container">
          <div className="error-container">
            <h1 className="error-title">🚨 App Error</h1>
            <p className="error-message">
              Something went wrong. Please check the details below:
            </p>
            
            <div className="error-details">
              <h3 className="error-label">Error:</h3>
              <pre className="error-text">
                {this.state.error && this.state.error.toString()}
              </pre>
              
              <h3 className="error-label">Stack Trace:</h3>
              <pre className="error-text">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
            
            <button 
              className="retry-button"
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              <span className="retry-text">Try Again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;