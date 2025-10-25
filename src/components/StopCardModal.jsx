import React from 'react';
import './StopCardModal.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('StopCardModal render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="modal-container">
          <div className="modal-header">
            <h2 className="header-text">STOP Card Details</h2>
          </div>
          <div style={{ padding: '16px' }}>
            <p style={{ fontWeight: '600', marginBottom: '8px' }}>Something went wrong.</p>
            <p style={{ color: '#666' }}>{String(this.state.error?.message || 'Unknown error')}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function humanize(s) {
  return (s || '')
    .toString()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderAssessmentSection(title, groups) {
  if (!Array.isArray(groups) || groups.length === 0) return null;
  return (
    <div className="section">
      <h3 className="section-title">{title}</h3>
      {groups.map((group, gi) => {
        const questions = Array.isArray(group?.questions) ? group.questions : [];
        if (!group && questions.length === 0) return null;
        return (
          <div key={`${title}-g-${gi}`} className="group">
            {!!group?.category && (
              <h4 className="group-title">{group.category}</h4>
            )}
            {questions.map((q, qi) => {
              const ok = !!q?.status;
              return (
                <div key={`${title}-g-${gi}-q-${qi}`} className="qa-row">
                  <svg className="qa-icon" viewBox="0 0 24 24" fill={ok ? '#28a745' : '#dc3545'} width="18" height="18">
                    {ok ? (
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    ) : (
                      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                    )}
                  </svg>
                  <span className="qa-text">{q?.question || '—'}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderLegacySection(title, obj) {
  if (!obj || typeof obj !== 'object') return null;
  const entries = Object.entries(obj);
  if (!entries.length) return null;
  return (
    <div className="section">
      <h3 className="section-title">{title}</h3>
      <div className="group">
        {entries.map(([key, val]) => {
          const ok = !!val;
          return (
            <div key={`${title}-${key}`} className="qa-row">
              <svg className="qa-icon" viewBox="0 0 24 24" fill={ok ? '#28a745' : '#dc3545'} width="18" height="18">
                {ok ? (
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                ) : (
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                )}
              </svg>
              <span className="qa-text">{humanize(key)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const StopCardModal = ({ data, visible, setVisible }) => {
  const site = data?.siteInfo?.site || 'Unknown Site';
  const area = data?.siteInfo?.area || 'Unknown Area';
  const shift = data?.siteInfo?.shift || '—';
  const date = data?.siteInfo?.date || '—';
  const actionsCompletion = data?.completionRates?.actionsCompletion ?? null;
  const conditionsCompletion = data?.completionRates?.conditionsCompletion ?? null;
  const duration = data?.observationData?.durationMinutes ?? '—';
  const peopleConducted = data?.observationData?.peopleConducted ?? '—';
  const peopleObserved = data?.observationData?.peopleObserved ?? '—';
  const feedback = data?.feedback?.suggestions || 'No suggestions';
  
  // Get safe acts and unsafe acts lists
  const safeActsList = data?.safetyActs?.safeActsList || [];
  const unsafeActsList = data?.safetyActs?.unsafeActsList || [];
  const safeActsCount = data?.safetyActs?.safeActsCount || 0;
  const unsafeActsCount = data?.safetyActs?.unsafeActsCount || 0;

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => setVisible(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <ErrorBoundary>
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="header-text">STOP Card Details</h2>
              <button className="close-button" onClick={() => setVisible(false)}>
                <span className="close-text">Close</span>
              </button>
            </div>

            <div className="modal-scroll-content">
              <div className="card">
                <h3 className="card-title">{site}</h3>
                <p className="card-subtitle">Area: {area} {shift ? `| Shift: ${shift}` : ''}</p>
                <p>Date: {date}</p>
                {actionsCompletion != null && (
                  <p>Actions Completion: {actionsCompletion}%</p>
                )}
                {conditionsCompletion != null && (
                  <p>Conditions Completion: {conditionsCompletion}%</p>
                )}
                <p>Duration: {duration} mins</p>
                <p>People Conducted: {peopleConducted}</p>
                <p>People Observed: {peopleObserved}</p>
                <p className="feedback">Feedback: {feedback}</p>
              </div>

              {/* Safe Acts Section */}
              {safeActsCount > 0 && (
                <div className="section">
                  <h3 className="section-title">Safe Acts Observed ({safeActsCount})</h3>
                  <div className="group">
                    {safeActsList.map((act, index) => (
                      <div key={`safe-act-${index}`} className="qa-row">
                        <svg className="qa-icon" viewBox="0 0 24 24" fill="#28a745" width="18" height="18">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span className="qa-text">{index + 1}. {act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unsafe Acts Section */}
              {unsafeActsCount > 0 && (
                <div className="section">
                  <h3 className="section-title">Unsafe Acts Observed ({unsafeActsCount})</h3>
                  <div className="group">
                    {unsafeActsList.map((act, index) => (
                      <div key={`unsafe-act-${index}`} className="qa-row">
                        <svg className="qa-icon" viewBox="0 0 24 24" fill="#dc3545" width="18" height="18">
                          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                        </svg>
                        <span className="qa-text">{index + 1}. {act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data?.assessmentData ? (
                <>
                  {renderAssessmentSection('Actions', data.assessmentData?.actions)}
                  {renderAssessmentSection('Conditions', data.assessmentData?.conditions)}
                </>
              ) : (
                <>
                  {renderLegacySection('Actions', data?.actions)}
                  {renderLegacySection('Conditions', data?.conditions)}
                </>
              )}
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default StopCardModal;
