import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import StopCardReportsService from '../firebase/stopCardReportsService';
import StopCardReportsServiceV2 from '../firebase/stopCardReportsServiceV2';
import { colors } from '../constants/color';
import './SchemaComparison.css';

const SchemaComparison = () => {
  const user = useSelector(state => state.auth.user);
  const id = user?.companyId;
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    v1: { stats: null, reports: [], error: null },
    v2: { stats: null, reports: [], error: null }
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const runComparison = async () => {
    if (!id) return;
    
    setLoading(true);
    const newResults = {
      v1: { stats: null, reports: [], error: null },
      v2: { stats: null, reports: [], error: null }
    };

    try {
      // Test V1 Schema (Original)
      console.log('🔍 Testing V1 Schema...');
      const startTimeV1 = performance.now();
      
      try {
        const v1Reports = await StopCardReportsService.getUserReports(id, 10);
        const v1MonthlyCounts = await StopCardReportsService.getUserMonthlyCounts(id, selectedYear);
        const endTimeV1 = performance.now();
        
        newResults.v1 = {
          stats: {
            reportCount: v1Reports.length,
            queryTime: Math.round(endTimeV1 - startTimeV1),
            monthlyCounts: v1MonthlyCounts,
            yearTotal: v1MonthlyCounts.reduce((sum, count) => sum + count, 0)
          },
          reports: v1Reports.slice(0, 3), // Show first 3 for preview
          error: null
        };
        console.log('✅ V1 Schema test completed');
      } catch (error) {
        console.error('❌ V1 Schema error:', error);
        newResults.v1.error = error.message;
      }

      // Test V2 Schema (Optimized)
      console.log('🔍 Testing V2 Schema...');
      const startTimeV2 = performance.now();
      
      try {
        const v2Reports = await StopCardReportsServiceV2.getUserReports(id, 10);
        const v2MonthlyCounts = await StopCardReportsServiceV2.getUserMonthlyCounts(id, selectedYear);
        const v2Stats = await StopCardReportsServiceV2.getSchemaStats();
        const endTimeV2 = performance.now();
        
        newResults.v2 = {
          stats: {
            reportCount: v2Reports.length,
            queryTime: Math.round(endTimeV2 - startTimeV2),
            monthlyCounts: v2MonthlyCounts,
            yearTotal: v2MonthlyCounts.reduce((sum, count) => sum + count, 0),
            schemaStats: v2Stats
          },
          reports: v2Reports.slice(0, 3), // Show first 3 for preview
          error: null
        };
        console.log('✅ V2 Schema test completed');
      } catch (error) {
        console.error('❌ V2 Schema error:', error);
        newResults.v2.error = error.message;
      }

    } catch (globalError) {
      console.error('❌ Global comparison error:', globalError);
    }

    setResults(newResults);
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      runComparison();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedYear]);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="schema-comparison-container">
      <div className="comparison-header">
        <h2>Schema Performance Comparison</h2>
        <div className="controls">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <button 
            onClick={runComparison} 
            disabled={loading}
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? 'Testing...' : 'Run Test'}
          </button>
        </div>
      </div>

      <div className="comparison-grid">
        {/* V1 Schema Results */}
        <div className="schema-card v1">
          <h3>V1 Schema (Original)</h3>
          <div className="subtitle">One document per report</div>
          
          {results.v1.error ? (
            <div className="error">Error: {results.v1.error}</div>
          ) : results.v1.stats ? (
            <div className="stats">
              <div className="stat">
                <label>Query Time:</label>
                <span className="time">{results.v1.stats.queryTime}ms</span>
              </div>
              <div className="stat">
                <label>Reports Found:</label>
                <span>{results.v1.stats.reportCount}</span>
              </div>
              <div className="stat">
                <label>{selectedYear} Total:</label>
                <span>{results.v1.stats.yearTotal}</span>
              </div>
              
              <div className="monthly-breakdown">
                <h4>Monthly Counts:</h4>
                <div className="monthly-grid">
                  {months.map((month, index) => (
                    <div key={month} className="month-stat">
                      <span className="month">{month}</span>
                      <span className="count">{results.v1.stats.monthlyCounts[index]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="loading">Loading V1 data...</div>
          )}
        </div>

        {/* V2 Schema Results */}
        <div className="schema-card v2">
          <h3>V2 Schema (Optimized)</h3>
          <div className="subtitle">One document per day</div>
          
          {results.v2.error ? (
            <div className="error">Error: {results.v2.error}</div>
          ) : results.v2.stats ? (
            <div className="stats">
              <div className="stat">
                <label>Query Time:</label>
                <span className="time performance-gain">
                  {results.v2.stats.queryTime}ms
                  {results.v1.stats && (
                    <small>
                      ({Math.round(((results.v1.stats.queryTime - results.v2.stats.queryTime) / results.v1.stats.queryTime) * 100)}% faster)
                    </small>
                  )}
                </span>
              </div>
              <div className="stat">
                <label>Reports Found:</label>
                <span>{results.v2.stats.reportCount}</span>
              </div>
              <div className="stat">
                <label>{selectedYear} Total:</label>
                <span>{results.v2.stats.yearTotal}</span>
              </div>
              
              {results.v2.stats.schemaStats && (
                <div className="schema-efficiency">
                  <h4>Schema Efficiency:</h4>
                  <div className="efficiency-stats">
                    <div className="stat">
                      <label>Total Documents:</label>
                      <span>{results.v2.stats.schemaStats.totalDocuments}</span>
                    </div>
                    <div className="stat">
                      <label>Total Reports:</label>
                      <span>{results.v2.stats.schemaStats.totalReports}</span>
                    </div>
                    <div className="stat">
                      <label>Avg Reports/Doc:</label>
                      <span>{results.v2.stats.schemaStats.averageReportsPerDocument.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="monthly-breakdown">
                <h4>Monthly Counts:</h4>
                <div className="monthly-grid">
                  {months.map((month, index) => (
                    <div key={month} className="month-stat">
                      <span className="month">{month}</span>
                      <span className="count">{results.v2.stats.monthlyCounts[index]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="loading">Loading V2 data...</div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      {results.v1.stats && results.v2.stats && (
        <div className="performance-summary">
          <h3>Performance Summary</h3>
          <div className="summary-stats">
            <div className="improvement">
              <label>Speed Improvement:</label>
              <span className="percentage">
                {Math.round(((results.v1.stats.queryTime - results.v2.stats.queryTime) / results.v1.stats.queryTime) * 100)}% faster
              </span>
            </div>
            <div className="improvement">
              <label>Document Reduction:</label>
              <span className="percentage">
                {results.v2.stats.schemaStats ? 
                  Math.round(((results.v2.stats.schemaStats.totalReports - results.v2.stats.schemaStats.totalDocuments) / results.v2.stats.schemaStats.totalReports) * 100) : 0
                }% fewer documents
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaComparison;