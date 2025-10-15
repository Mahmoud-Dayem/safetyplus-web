import React, { useState, useMemo, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { colors } from "../constants/color";
import { useNavigate } from 'react-router-dom';
import ItemCheck from "../components/ItemCheck";
import { useSelector } from "react-redux";
import './StopCard.css';

// Replace Constants.expoConfig.extra with environment variables
const googleSheetsUrl = process.env.REACT_APP_GOOGLE_SHEETS_URL || '';

const StopCard = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState('actions'); // 'actions', 'conditions', or 'report'
  const name = user?.displayName;
  const id = user?.companyId;
  const site_list = [
    "LimeStone Crusher& Storage",
    "Additives Crusher & Storage",
    "Corrective Crusher& Storage",
    "Raw Mill & Feeding Area",
    "kiln"
  ];

  // Report form state
  const [reportForm, setReportForm] = useState({
    safeActsObserved: [''],
    unsafeActsObserved: [''],
    date: new Date(),
    site: '',
    area: '',
    shift: 'General',
    duration: '',
    peopleConducted: '',
    peopleObserved: '',
    suggestions: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const actions = useMemo(() => [
    {
      label: "Reactions of People",
      icon: "people-outline",
      questions: [
        { q: "Adjusting Personal Protective Equipment", status: false },
        { q: "Changing Position", status: false },
        { q: "Rearranging Jobs", status: false },
        { q: "Stopping job", status: false },
        { q: "Attaching Grounds", status: false },
        { q: "Performing Lockouts", status: false }
      ]
    },
    {
      label: "Positions of People (Injury Causes)",
      icon: "warning-outline",
      questions: [
        { q: "Striking Against or Being Struck by Objects", status: false },
        { q: "Caught In, On, or Between Objects", status: false },
        { q: "Falling", status: false },
        { q: "Contacting Temperatures Extremes", status: false },
        { q: "Contacting Electric Current", status: false },
        { q: "Inhaling, Absorbing, or Swallowing a Hazardous Substance", status: false },
        { q: "Repetitive Motions", status: false },
        { q: "Awkward  Positions/ Static Posture", status: false },
      ]
    },
    {
      label: "Personal Protective Equipment(Head to Toe Check)",
      icon: "shield-outline",
      questions: [
        { q: "Head", status: false },
        { q: "Eyes and Face", status: false },
        { q: "Ears", status: false },
        { q: "Respiratory System", status: false },
        { q: "Arms and Hands", status: false },
        { q: "Trunk", status: false },
        { q: "Legs and Feet", status: false },
      ]
    },
    {
      label: "Tools and Equipment",
      icon: "construct-outline",
      questions: [
        { q: "Right for the Job", status: false },
        { q: "Used Correctly", status: false },
        { q: "In Safe Conditions", status: false },
      ]
    },
    {
      label: "Procedures",
      icon: "document-text-outline",
      questions: [
        { q: "Available", status: false },
        { q: "Adequate", status: false },
        { q: "Known", status: false },
        { q: "Understood", status: false },
        { q: "Followed", status: false },
      ]
    },
    {
      label: "Orderliness (Standards)",
      icon: "library-outline",
      questions: [
        { q: "Known", status: false },
        { q: "Understood", status: false },
        { q: "Followed", status: false },
      ]
    },
  ], []);

  const conditions = useMemo(() => [
    {
      label: "Tools and Equipment",
      icon: "build-outline",
      questions: [
        { q: "Right for the job", status: false },
        { q: "Is Safe Condition", status: false }
      ]
    },
    {
      label: "Structures and Work Areas",
      icon: "business-outline",
      questions: [
        { q: "Clean", status: false },
        { q: "Orderly", status: false },
        { q: "Right for the Job", status: false },
        { q: "In Safe Condition", status: false },
      ]
    },
    {
      label: "Environment (Is It)",
      icon: "earth-outline",
      questions: [
        { q: "Clean", status: false },
        { q: "Orderly", status: false },
        { q: "In Safe Condition", status: false },
      ]
    },
    {
      label: "Orderliness (Standards)",
      icon: "checkmark-done-outline",
      questions: [
        { q: "Available", status: false },
        { q: "Adequate", status: false },
      ]
    },
  ], []);

  // State to track status of all questions across actions and conditions
  const initialActionStatus = useMemo(() => {
    const initialStatus = {};
    actions.forEach((item, itemIndex) => {
      item.questions.forEach((question, questionIndex) => {
        initialStatus[`action_${itemIndex}_question_${questionIndex}`] = question.status;
      });
    });
    return initialStatus;
  }, [actions]);

  const [actionStatus, setActionStatus] = useState(initialActionStatus);

  const initialConditionStatus = useMemo(() => {
    const initialStatus = {};
    conditions.forEach((item, itemIndex) => {
      item.questions.forEach((question, questionIndex) => {
        initialStatus[`condition_${itemIndex}_question_${questionIndex}`] = question.status;
      });
    });
    return initialStatus;
  }, [conditions]);

  const [conditionStatus, setConditionStatus] = useState(initialConditionStatus);

  // Functions for Actions
  const updateActionStatus = useCallback((itemIndex, questionIndex, status) => {
    setActionStatus(prevStatus => ({
      ...prevStatus,
      [`action_${itemIndex}_question_${questionIndex}`]: status
    }));
  }, []);

  const areAllActionsChecked = useCallback((itemIndex) => {
    const item = actions[itemIndex];
    return item.questions.every((_, questionIndex) =>
      actionStatus[`action_${itemIndex}_question_${questionIndex}`]
    );
  }, [actions, actionStatus]);

  const toggleAllActions = useCallback((itemIndex, status) => {
    const updatedStatus = { ...actionStatus };
    actions[itemIndex].questions.forEach((_, questionIndex) => {
      updatedStatus[`action_${itemIndex}_question_${questionIndex}`] = status;
    });
    setActionStatus(updatedStatus);
  }, [actions, actionStatus]);

  // Functions for Conditions
  const updateConditionStatus = useCallback((itemIndex, questionIndex, status) => {
    setConditionStatus(prevStatus => ({
      ...prevStatus,
      [`condition_${itemIndex}_question_${questionIndex}`]: status
    }));
  }, []);

  const areAllConditionsChecked = useCallback((itemIndex) => {
    const item = conditions[itemIndex];
    return item.questions.every((_, questionIndex) =>
      conditionStatus[`condition_${itemIndex}_question_${questionIndex}`]
    );
  }, [conditions, conditionStatus]);

  const toggleAllConditions = useCallback((itemIndex, status) => {
    const updatedStatus = { ...conditionStatus };
    conditions[itemIndex].questions.forEach((_, questionIndex) => {
      updatedStatus[`condition_${itemIndex}_question_${questionIndex}`] = status;
    });
    setConditionStatus(updatedStatus);
  }, [conditions, conditionStatus]);

  // Function to update report form
  const updateReportForm = useCallback((field, value) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Function to handle numeric input validation
  const handleNumericInput = useCallback((field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    updateReportForm(field, numericValue);
  }, [updateReportForm]);

  const addSafeAct = useCallback(() => {
    setReportForm(prev => ({
      ...prev,
      safeActsObserved: [...prev.safeActsObserved, '']
    }));
  }, []);

  const addUnsafeAct = useCallback(() => {
    setReportForm(prev => ({
      ...prev,
      unsafeActsObserved: [...prev.unsafeActsObserved, '']
    }));
  }, []);

  const updateSafeAct = useCallback((index, value) => {
    setReportForm(prev => {
      const newSafeActs = [...prev.safeActsObserved];
      newSafeActs[index] = value;
      return { ...prev, safeActsObserved: newSafeActs };
    });
  }, []);

  const updateUnsafeAct = useCallback((index, value) => {
    setReportForm(prev => {
      const newUnsafeActs = [...prev.unsafeActsObserved];
      newUnsafeActs[index] = value;
      return { ...prev, unsafeActsObserved: newUnsafeActs };
    });
  }, []);

  const removeSafeAct = (index) => {
    if (reportForm.safeActsObserved.length > 1) {
      setReportForm(prev => ({
        ...prev,
        safeActsObserved: prev.safeActsObserved.filter((_, i) => i !== index)
      }));
    }
  };

  const removeUnsafeAct = (index) => {
    if (reportForm.unsafeActsObserved.length > 1) {
      setReportForm(prev => ({
        ...prev,
        unsafeActsObserved: prev.unsafeActsObserved.filter((_, i) => i !== index)
      }));
    }
  };

  // Function to calculate summary statistics
  const calculateSummary = useCallback(() => {
    const totalActionQuestions = actions.reduce((total, item) => total + item.questions.length, 0);
    const completedActionQuestions = actions.reduce((total, item, itemIndex) => {
      return total + item.questions.filter((_, questionIndex) =>
        actionStatus[`action_${itemIndex}_question_${questionIndex}`]
      ).length;
    }, 0);

    const totalConditionQuestions = conditions.reduce((total, item) => total + item.questions.length, 0);
    const completedConditionQuestions = conditions.reduce((total, item, itemIndex) => {
      return total + item.questions.filter((_, questionIndex) =>
        conditionStatus[`condition_${itemIndex}_question_${questionIndex}`]
      ).length;
    }, 0);

    return {
      actions: {
        completed: completedActionQuestions,
        total: totalActionQuestions,
        percentage: totalActionQuestions > 0 ? Math.round((completedActionQuestions / totalActionQuestions) * 100) : 0
      },
      conditions: {
        completed: completedConditionQuestions,
        total: totalConditionQuestions,
        percentage: totalConditionQuestions > 0 ? Math.round((completedConditionQuestions / totalConditionQuestions) * 100) : 0
      },
      safeActs: reportForm.safeActsObserved.filter(act => act.trim().length > 0).length,
      unsafeActs: reportForm.unsafeActsObserved.filter(act => act.trim().length > 0).length,
      duration: parseInt(reportForm.duration) || 0,
      peopleConducted: parseInt(reportForm.peopleConducted) || 0,
      peopleObserved: parseInt(reportForm.peopleObserved) || 0
    };
  }, [actions, conditions, actionStatus, conditionStatus, reportForm]);

  // Function to send data to Google Sheets
  const sendToGoogleSheets = async (reportData) => {
    try {
      const GOOGLE_SCRIPT_URL = googleSheetsUrl;
      if (!GOOGLE_SCRIPT_URL) {
        throw new Error('Google Sheets URL not configured');
      }
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        return { success: true, message: 'Report sent successfully' };
      } else {
        throw new Error('Failed to send report');
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Function to send data to Firestore
  const sendToFirestore = async (reportData) => {
    try {
      const docRef = await addDoc(collection(db, 'stopCardReports'), {
        reportId: reportData.reportId,
        timestamp: serverTimestamp(),
        submittedAt: new Date().toISOString(),
        userInfo: {
          email: user?.email || 'unknown@company.com',
          displayName: name || 'Unknown User',
          companyId: id || 'unknown',
          uid: user?.uid || 'unknown'
        },
        siteInfo: {
          site: reportData.site,
          area: reportData.area,
          date: reportData.date,
          shift: reportData.shift
        },
        observationData: {
          durationMinutes: reportData.durationMinutes,
          peopleConducted: reportData.peopleConducted,
          peopleObserved: reportData.peopleObserved
        },
        safetyActs: {
          safeActsCount: reportData.safeActsCount,
          safeActsList: reportForm.safeActsObserved.filter(act => act.trim() !== ''),
          unsafeActsCount: reportData.unsafeActsCount,
          unsafeActsList: reportForm.unsafeActsObserved.filter(act => act.trim() !== '')
        },
        completionRates: {
          actionsCompletion: reportData.actionsCompletion,
          conditionsCompletion: reportData.conditionsCompletion
        },
        assessmentData: {
          actions: actions.map((item, itemIndex) => ({
            category: item.label,
            questions: item.questions.map((question, questionIndex) => ({
              question: question.q,
              status: actionStatus[`action_${itemIndex}_question_${questionIndex}`] || false
            }))
          })),
          conditions: conditions.map((item, itemIndex) => ({
            category: item.label,
            questions: item.questions.map((question, questionIndex) => ({
              question: question.q,
              status: conditionStatus[`condition_${itemIndex}_question_${questionIndex}`] || false
            }))
          }))
        },
        feedback: {
          suggestions: reportData.suggestions || ''
        },
        metadata: {
          appVersion: '1.0.0',
          platform: 'web',
          submissionMethod: 'stopcard_form'
        }
      });

      return {
        success: true,
        message: 'Data saved to Firestore successfully',
        documentId: docRef.id
      };
    } catch (error) {
      return {
        success: false,
        message: `Firestore error: ${error.message}`
      };
    }
  };

  // Function to prepare data for Google Sheets
  const prepareSheetData = useCallback(() => {
    const summary = calculateSummary();
    const timestamp = new Date().toISOString();
    const reportId = `STOP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const safeActsList = reportForm.safeActsObserved
      .filter(act => act.trim() !== '')
      .join(', ');

    const unsafeActsList = reportForm.unsafeActsObserved
      .filter(act => act.trim() !== '')
      .join(', ');

    const actionsDetails = actions.map((item, itemIndex) => ({
      category: item.label,
      icon: item.icon,
      questions: item.questions.map((question, questionIndex) => ({
        question: question.q,
        status: actionStatus[`action_${itemIndex}_question_${questionIndex}`] || false
      }))
    }));

    const conditionsDetails = conditions.map((item, itemIndex) => ({
      category: item.label,
      icon: item.icon,
      questions: item.questions.map((question, questionIndex) => ({
        question: question.q,
        status: conditionStatus[`condition_${itemIndex}_question_${questionIndex}`] || false
      }))
    }));

    return {
      timestamp,
      reportId,
      userEmail: user?.email || 'unknown@company.com',
      companyId: user?.companyId || id || 'unknown',
      site: reportForm.site,
      area: reportForm.area,
      date: reportForm.date.toISOString().split('T')[0],
      shift: reportForm.shift,
      durationMinutes: parseInt(reportForm.duration) || 0,
      peopleConducted: parseInt(reportForm.peopleConducted) || 0,
      peopleObserved: parseInt(reportForm.peopleObserved) || 0,
      safeActsCount: summary.safeActs,
      safeActsList,
      unsafeActsCount: summary.unsafeActs,
      unsafeActsList,
      actionsCompletion: summary.actions.percentage,
      conditionsCompletion: summary.conditions.percentage,
      actionsDetails: JSON.stringify(actionsDetails),
      conditionsDetails: JSON.stringify(conditionsDetails),
      suggestions: reportForm.suggestions || ''
    };
  }, [actions, conditions, actionStatus, conditionStatus, reportForm, calculateSummary, user, id]);

  // Validation function for report form
  const validateReportForm = () => {
    const errors = [];

    const totalActionQuestions = actions.reduce((total, item) => total + item.questions.length, 0);
    const completedActionQuestions = actions.reduce((total, item, itemIndex) => {
      return total + item.questions.filter((_, questionIndex) =>
        actionStatus[`action_${itemIndex}_question_${questionIndex}`]
      ).length;
    }, 0);
    const actionsCompletionRate = totalActionQuestions > 0 ? (completedActionQuestions / totalActionQuestions) * 100 : 0;

    const totalConditionQuestions = conditions.reduce((total, item) => total + item.questions.length, 0);
    const completedConditionQuestions = conditions.reduce((total, item, itemIndex) => {
      return total + item.questions.filter((_, questionIndex) =>
        conditionStatus[`condition_${itemIndex}_question_${questionIndex}`]
      ).length;
    }, 0);
    const conditionsCompletionRate = totalConditionQuestions > 0 ? (completedConditionQuestions / totalConditionQuestions) * 100 : 0;

    if (actionsCompletionRate < 50) {
      errors.push(`Actions completion must be at least 50% (currently ${Math.round(actionsCompletionRate)}%)`);
    }

    if (conditionsCompletionRate < 50) {
      errors.push(`Conditions completion must be at least 50% (currently ${Math.round(conditionsCompletionRate)}%)`);
    }

    const hasValidSafeActs = reportForm.safeActsObserved.some(act => act.trim() !== '');
    if (!hasValidSafeActs) {
      errors.push('At least one safe act must be observed');
    }

    const hasValidUnsafeActs = reportForm.unsafeActsObserved.some(act => act.trim() !== '');
    if (!hasValidUnsafeActs) {
      errors.push('At least one unsafe act must be observed');
    }

    if (!reportForm.site.trim()) {
      errors.push('Site is required');
    }

    if (!reportForm.area.trim()) {
      errors.push('Area is required');
    }

    if (!reportForm.duration.trim()) {
      errors.push('Duration is required');
    }

    if (!reportForm.peopleConducted.trim()) {
      errors.push('Number of people conducted is required');
    }

    if (!reportForm.peopleObserved.trim()) {
      errors.push('Number of people observed is required');
    }

    return errors;
  };

  // Function to log all status including report form
  const logStatus = async () => {
    if (isSending) return;

    const validationErrors = validateReportForm();
    if (validationErrors.length > 0) {
      window.alert(
        `Incomplete Form\n\nPlease fill in all required fields:\n\n• ${validationErrors.join('\n• ')}`
      );
      return;
    }

    setIsSending(true);

    try {
      const sheetData = prepareSheetData();

      const [sheetsResult, firestoreResult] = await Promise.allSettled([
        sendToGoogleSheets(sheetData),
        sendToFirestore(sheetData)
      ]);

      const sheetsSuccess = sheetsResult.status === 'fulfilled' && sheetsResult.value.success;
      const firestoreSuccess = firestoreResult.status === 'fulfilled' && firestoreResult.value.success;

      let alertTitle, alertMessage;

      if (sheetsSuccess && firestoreSuccess) {
        alertTitle = 'Success!';
        alertMessage = 'Your STOP Card report has been submitted successfully.';
      } else if (sheetsSuccess || firestoreSuccess) {
        alertTitle = 'Partial Success';
        const successfulSystem = sheetsSuccess ? 'Google Sheets' : 'Firestore database';
        const failedSystem = sheetsSuccess ? 'Firestore' : 'Google Sheets';
        alertMessage = `Report saved to ${successfulSystem} successfully, but failed to save to ${failedSystem}. Your data is secure.`;
      } else {
        alertTitle = 'Submission Error';
        alertMessage = 'Failed to submit report to both systems. Please check your internet connection and try again.';
      }

      if (window.confirm(`${alertTitle}\n\n${alertMessage}\n\nView Summary?`)) {
        setShowSummaryModal(true);
      }
    } catch (error) {
      if (window.confirm(`Error\n\nAn unexpected error occurred while sending the report. Please try again.\n\nView Summary?`)) {
        setShowSummaryModal(true);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="stop-card-container">
      {/* Header */}
      <div className="stop-card-header">
        <div className="header-left">
          <div className="header-icon-container">
            <svg className="header-icon" viewBox="0 0 24 24" fill="#fff">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
        </div>
        <div className="header-title-container">
          <h1 className="header-main-title">STOP Card</h1>
          <div className="header-user-info-row">
            <span className="header-user-name">{name || 'User'}</span>
            <span className="header-separator">•</span>
            <span className="header-company-id">ID: {id || 'N/A'}</span>
          </div>
        </div>
        <div className="header-right-container">
          <button className="home-button" onClick={() => navigate('/home')}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="#fff">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button
          className={`tab ${activeTab === 'actions' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          <span className={`tab-text ${activeTab === 'actions' ? 'active-tab-text' : ''}`}>
            Actions
          </span>
        </button>
        <button
          className={`tab ${activeTab === 'conditions' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('conditions')}
        >
          <span className={`tab-text ${activeTab === 'conditions' ? 'active-tab-text' : ''}`}>
            Conditions
          </span>
        </button>
        <button
          className={`tab ${activeTab === 'report' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          <span className={`tab-text ${activeTab === 'report' ? 'active-tab-text' : ''}`}>
            Report
          </span>
        </button>
      </div>

      <div className="scroll-view">
        {activeTab === 'actions' && (
          <div className="grid-container">
            {actions.map((item, itemIndex) => (
              <div key={itemIndex} className="grid-item">
                <ItemCheck
                  item={item}
                  itemIndex={itemIndex}
                  type="action"
                  questionStatus={actionStatus}
                  updateQuestionStatus={updateActionStatus}
                  areAllQuestionsChecked={areAllActionsChecked}
                  toggleAllQuestions={toggleAllActions}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'conditions' && (
          <div className="grid-container">
            {conditions.map((item, itemIndex) => (
              <div key={itemIndex} className="grid-item">
                <ItemCheck
                  item={item}
                  itemIndex={itemIndex}
                  type="condition"
                  questionStatus={conditionStatus}
                  updateQuestionStatus={updateConditionStatus}
                  areAllQuestionsChecked={areAllConditionsChecked}
                  toggleAllQuestions={toggleAllConditions}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="form-container">
            {/* Safe Acts Observed */}
            <div className="input-group">
              <div className="label-with-button">
                <label className="input-label">Safe acts observed</label>
                <button onClick={addSafeAct} className="add-button">
                  <svg viewBox="0 0 24 24" fill={colors.primary || '#FF9500'} width="20" height="20">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
              {reportForm.safeActsObserved.map((act, index) => (
                <div key={index} className="input-with-remove">
                  <input
                    className="text-input"
                    style={{ flex: 1 }}
                    value={act}
                    onChange={(e) => updateSafeAct(index, e.target.value)}
                    placeholder={`Safe act ${index + 1}`}
                  />
                  {reportForm.safeActsObserved.length > 1 && (
                    <button
                      onClick={() => removeSafeAct(index)}
                      className="remove-button"
                    >
                      <svg viewBox="0 0 24 24" fill="#FF3B30" width="20" height="20">
                        <path d="M19 13H5v-2h14v2z"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Unsafe Acts Observed */}
            <div className="input-group">
              <div className="label-with-button">
                <label className="input-label">Unsafe acts observed</label>
                <button onClick={addUnsafeAct} className="add-button">
                  <svg viewBox="0 0 24 24" fill={colors.primary || '#FF9500'} width="20" height="20">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
              {reportForm.unsafeActsObserved.map((act, index) => (
                <div key={index} className="input-with-remove">
                  <input
                    className="text-input"
                    style={{ flex: 1 }}
                    value={act}
                    onChange={(e) => updateUnsafeAct(index, e.target.value)}
                    placeholder={`Unsafe act ${index + 1}`}
                  />
                  {reportForm.unsafeActsObserved.length > 1 && (
                    <button
                      onClick={() => removeUnsafeAct(index)}
                      className="remove-button"
                    >
                      <svg viewBox="0 0 24 24" fill="#FF3B30" width="20" height="20">
                        <path d="M19 13H5v-2h14v2z"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Date */}
            <div className="input-group">
              <label className="input-label">Date</label>
              <button
                className="date-picker-button"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <span className="date-text">
                  {reportForm.date.toDateString()}
                </span>
                <svg viewBox="0 0 24 24" fill={colors.primary} width="20" height="20">
                  <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                </svg>
              </button>

              {showDatePicker && (
                <div className="date-picker-container">
                  <div className="date-picker-header">
                    <button onClick={() => setShowDatePicker(false)} className="cancel-button-text">
                      Cancel
                    </button>
                    <button onClick={() => setShowDatePicker(false)} className="done-button-text">
                      Done
                    </button>
                  </div>
                  <div className="date-picker-content">
                    <div className="date-picker-row">
                      <button
                        className="date-button"
                        onClick={() => {
                          const newDate = new Date(reportForm.date);
                          newDate.setDate(newDate.getDate() - 1);
                          updateReportForm('date', newDate);
                        }}
                      >
                        <span className="date-button-text">-</span>
                      </button>
                      <span className="current-date">
                        {reportForm.date.toLocaleDateString()}
                      </span>
                      <button
                        className="date-button"
                        onClick={() => {
                          const newDate = new Date(reportForm.date);
                          newDate.setDate(newDate.getDate() + 1);
                          updateReportForm('date', newDate);
                        }}
                      >
                        <span className="date-button-text">+</span>
                      </button>
                    </div>
                    <div className="quick-date-buttons">
                      <button
                        className="quick-button"
                        onClick={() => updateReportForm('date', new Date())}
                      >
                        <span className="quick-button-text">Today</span>
                      </button>
                      <button
                        className="quick-button"
                        onClick={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          updateReportForm('date', yesterday);
                        }}
                      >
                        <span className="quick-button-text">Yesterday</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Site */}
            <div className="input-group">
              <label className="input-label">Site</label>
              <button
                className="dropdown-button"
                onClick={() => setShowSiteDropdown(true)}
              >
                <span className={!reportForm.site ? 'placeholder-text' : ''}>
                  {reportForm.site || "Select site"}
                </span>
                <svg viewBox="0 0 24 24" fill={colors.textSecondary || '#8E8E93'} width="20" height="20">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
            </div>

            {/* Area */}
            <div className="input-group">
              <label className="input-label">Area</label>
              <input
                className="text-input"
                value={reportForm.area}
                onChange={(e) => updateReportForm('area', e.target.value)}
                placeholder="Enter area"
              />
            </div>

            {/* Shift Dropdown */}
            <div className="input-group">
              <label className="input-label">Shift</label>
              <div className="dropdown-container">
                {['General', 'A', 'B', 'C'].map((shift) => (
                  <button
                    key={shift}
                    className={`dropdown-option ${reportForm.shift === shift ? 'selected-option' : ''}`}
                    onClick={() => updateReportForm('shift', shift)}
                  >
                    <span className={`dropdown-text ${reportForm.shift === shift ? 'selected-text' : ''}`}>
                      {shift}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="input-group">
              <label className="input-label">Duration (minutes)</label>
              <input
                className="text-input"
                value={reportForm.duration}
                onChange={(e) => handleNumericInput('duration', e.target.value)}
                placeholder="Enter duration in minutes"
                type="text"
                inputMode="numeric"
                maxLength={4}
              />
            </div>

            {/* People Conducted */}
            <div className="input-group">
              <label className="input-label">Number of people conducted</label>
              <input
                className="text-input"
                value={reportForm.peopleConducted}
                onChange={(e) => handleNumericInput('peopleConducted', e.target.value)}
                placeholder="Enter number"
                type="text"
                inputMode="numeric"
                maxLength={3}
              />
            </div>

            {/* People Observed */}
            <div className="input-group">
              <label className="input-label">Number of people observed</label>
              <input
                className="text-input"
                value={reportForm.peopleObserved}
                onChange={(e) => handleNumericInput('peopleObserved', e.target.value)}
                placeholder="Enter number"
                type="text"
                inputMode="numeric"
                maxLength={3}
              />
            </div>

            {/* User Suggestions */}
            <div className="input-group">
              <label className="input-label">Suggestions for improvement</label>
              <textarea
                className="text-input multiline-input"
                value={reportForm.suggestions}
                onChange={(e) => updateReportForm('suggestions', e.target.value)}
                placeholder="Enter your suggestions for safety improvements, recommendations, or observations..."
                rows={4}
              />
            </div>

            <button
              className={`log-button ${isSending ? 'log-button-disabled' : ''}`}
              onClick={logStatus}
              disabled={isSending}
            >
              {isSending ? (
                <div className="sending-container">
                  <div className="sending-spinner"></div>
                  <span className="log-button-text">Sending...</span>
                </div>
              ) : (
                <span className="log-button-text">Send Report</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="summary-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">STOP Card Summary</h2>
              <button
                className="close-button"
                onClick={() => setShowSummaryModal(false)}
              >
                <svg viewBox="0 0 24 24" fill={colors.text} width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="modal-content-scroll">
              {(() => {
                const summary = calculateSummary();
                return (
                  <div>
                    {/* Completion Overview */}
                    <div className="summary-section">
                      <h3 className="section-title">Completion Overview</h3>
                      <div className="pie-chart-container">
                        <div className="pie-chart-wrapper">
                          <h4 className="chart-title">Actions</h4>
                          <div className="pie-chart">
                            <div
                              className="pie-slice"
                              style={{
                                background: `conic-gradient(${colors.success || '#30D158'} ${summary.actions.percentage}%, #E5E5EA 0)`,
                              }}
                            />
                            <div className="pie-center">
                              <span className="percentage-text">{summary.actions.percentage}%</span>
                            </div>
                          </div>
                          <p className="chart-subtitle">
                            {summary.actions.completed}/{summary.actions.total} Complete
                          </p>
                        </div>

                        <div className="pie-chart-wrapper">
                          <h4 className="chart-title">Conditions</h4>
                          <div className="pie-chart">
                            <div
                              className="pie-slice"
                              style={{
                                background: `conic-gradient(${colors.primary || '#FF9500'} ${summary.conditions.percentage}%, #E5E5EA 0)`,
                              }}
                            />
                            <div className="pie-center">
                              <span className="percentage-text">{summary.conditions.percentage}%</span>
                            </div>
                          </div>
                          <p className="chart-subtitle">
                            {summary.conditions.completed}/{summary.conditions.total} Complete
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Safety Observations Bar Chart */}
                    <div className="summary-section">
                      <h3 className="section-title">Safety Observations</h3>
                      <div className="bar-chart-container">
                        <div className="bar-item">
                          <span className="bar-label">Safe Acts</span>
                          <div className="bar-background">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${Math.min((summary.safeActs / Math.max(summary.safeActs, summary.unsafeActs, 1)) * 100, 100)}%`,
                                backgroundColor: colors.success || '#30D158'
                              }}
                            />
                          </div>
                          <span className="bar-value">{summary.safeActs}</span>
                        </div>

                        <div className="bar-item">
                          <span className="bar-label">Unsafe Acts</span>
                          <div className="bar-background">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${Math.min((summary.unsafeActs / Math.max(summary.safeActs, summary.unsafeActs, 1)) * 100, 100)}%`,
                                backgroundColor: colors.error || '#FF3B30'
                              }}
                            />
                          </div>
                          <span className="bar-value">{summary.unsafeActs}</span>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="summary-section">
                      <h3 className="section-title">Report Statistics</h3>
                      <div className="stats-container">
                        <div className="stat-item">
                          <span className="stat-value">{summary.duration}</span>
                          <span className="stat-label">Minutes</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{summary.peopleConducted}</span>
                          <span className="stat-label">Conducted</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-value">{summary.peopleObserved}</span>
                          <span className="stat-label">Observed</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="share-button"
                      onClick={() => {
                        setShowSummaryModal(false);
                        navigate('/home');
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="#FFFFFF" width="20" height="20">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                      </svg>
                      <span className="share-button-text">Home</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Site Dropdown Modal */}
      {showSiteDropdown && (
        <div className="dropdown-overlay-modal" onClick={() => setShowSiteDropdown(false)}>
          <div className="dropdown-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-header-modal">
              <h3 className="dropdown-title">Select Site</h3>
              <button
                className="close-button"
                onClick={() => setShowSiteDropdown(false)}
              >
                <svg viewBox="0 0 24 24" fill={colors.text || '#1C1C1E'} width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="dropdown-list">
              {site_list.map((site, index) => (
                <button
                  key={index}
                  className={`dropdown-item ${reportForm.site === site ? 'selected-dropdown-item' : ''}`}
                  onClick={() => {
                    updateReportForm('site', site);
                    setShowSiteDropdown(false);
                  }}
                >
                  <span className={`dropdown-item-text ${reportForm.site === site ? 'selected-dropdown-item-text' : ''}`}>
                    {site}
                  </span>
                  {reportForm.site === site && (
                    <svg viewBox="0 0 24 24" fill={colors.primary || '#FF9500'} width="20" height="20">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StopCard;
