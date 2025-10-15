import React, { useState, useLayoutEffect, useMemo, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from 'expo-constants';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../constants/color";
import { useNavigation } from "@react-navigation/native";
import ItemCheck from "../components/ItemCheck";
import { useSelector } from "react-redux";


const StopCard = () => {
  const navigation = useNavigation();
  const user = useSelector(state=>state.auth.user)
  const [activeTab, setActiveTab] = useState('actions'); // 'actions', 'conditions', or 'report'
  const name = user?.displayName;
  const id = user?.companyId;
  const site_list =[
    "LimeStone Crusher& Storage",
    "Additives Crusher & Storage",
    "Corrective Crusher& Storage",
    "Raw Mill & Feeding Area",
    "kiln"
 
  ]
  // Report form state
  const [reportForm, setReportForm] = useState({
    safeActsObserved: [''],
    unsafeActsObserved: [''],
    date: new Date(), // Today's date as Date object
    site: '',
    area: '',
    shift: 'General', // Default shift
    duration: '', // Duration in minutes
    peopleConducted: '',
    peopleObserved: '',
    suggestions: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const {
    googleSheetsUrl
  } = Constants.expoConfig.extra;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.primary || "#FF9500",
        height: 110, // Increased height for better spacing
        shadowColor: 'transparent', // iOS remove shadow line
        elevation: 0, // Android remove shadow
        borderBottomWidth: 0, // Remove bottom hairline
      },
      headerShadowVisible: false, // RN v6: remove bottom shadow
      headerTintColor: "#fff",
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerMainTitle}>STOP Card</Text>
          <View style={styles.headerUserInfoRow}>
            <Text style={styles.headerUserName}>{name || 'User'}</Text>
            <Text style={styles.headerSeparator}>•</Text>
            <Text style={styles.headerCompanyId}>ID: {id || 'N/A'}</Text>
          </View>
        </View>
      ),
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="clipboard-outline" size={28} color="#fff" />
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, name, id]);

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
    // Remove any non-numeric characters
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
    // Calculate actions completion
    const totalActionQuestions = actions.reduce((total, item) => total + item.questions.length, 0);
    const completedActionQuestions = actions.reduce((total, item, itemIndex) => {
      return total + item.questions.filter((_, questionIndex) =>
        actionStatus[`action_${itemIndex}_question_${questionIndex}`]
      ).length;
    }, 0);

    // Calculate conditions completion
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
        // Basic Info
        reportId: reportData.reportId,
        timestamp: serverTimestamp(),
        submittedAt: new Date().toISOString(),
        
        // User Info
        userInfo: {
          email: user?.email || 'unknown@company.com',
          displayName: name || 'Unknown User',
          companyId: id || 'unknown',
          uid: user?.uid || 'unknown'
        },
        
        // Report Form Data
        siteInfo: {
          site: reportData.site,
          area: reportData.area,
          date: reportData.date,
          shift: reportData.shift
        },
        
        // Observation Data
        observationData: {
          durationMinutes: reportData.durationMinutes,
          peopleConducted: reportData.peopleConducted,
          peopleObserved: reportData.peopleObserved
        },
        
        // Safety Acts
        safetyActs: {
          safeActsCount: reportData.safeActsCount,
          safeActsList: reportForm.safeActsObserved.filter(act => act.trim() !== ''),
          unsafeActsCount: reportData.unsafeActsCount,
          unsafeActsList: reportForm.unsafeActsObserved.filter(act => act.trim() !== '')
        },
        
        // Completion Rates
        completionRates: {
          actionsCompletion: reportData.actionsCompletion,
          conditionsCompletion: reportData.conditionsCompletion
        },
        
        // Detailed Assessment Data
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
        
        // User Feedback
        feedback: {
          suggestions: reportData.suggestions || ''
        },
        
        // Metadata
        metadata: {
          appVersion: '1.0.0',
          platform: 'mobile',
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

    // Prepare safe acts list
    const safeActsList = reportForm.safeActsObserved
      .filter(act => act.trim() !== '')
      .join(', ');

    // Prepare unsafe acts list  
    const unsafeActsList = reportForm.unsafeActsObserved
      .filter(act => act.trim() !== '')
      .join(', ');

    // Prepare actions details
    const actionsDetails = actions.map((item, itemIndex) => ({
      category: item.label,
      icon: item.icon,
      questions: item.questions.map((question, questionIndex) => ({
        question: question.q,
        status: actionStatus[`action_${itemIndex}_question_${questionIndex}`] || false
      }))
    }));

    // Prepare conditions details
    const conditionsDetails = conditions.map((item, itemIndex) => ({
      category: item.label,
      icon: item.icon,
      questions: item.questions.map((question, questionIndex) => ({
        question: question.q,
        status: conditionStatus[`condition_${itemIndex}_question_${questionIndex}`] || false
      }))
    }));

    return {
      // Basic info
      timestamp,
      reportId,
      userEmail: user?.email || 'unknown@company.com',
      companyId: user?.companyId || id || 'unknown',

      // Report form data
      site: reportForm.site,
      area: reportForm.area,
      date: reportForm.date.toISOString().split('T')[0],
      shift: reportForm.shift,
      durationMinutes: parseInt(reportForm.duration) || 0,
      peopleConducted: parseInt(reportForm.peopleConducted) || 0,
      peopleObserved: parseInt(reportForm.peopleObserved) || 0,

      // Safety acts
      safeActsCount: summary.safeActs,
      safeActsList,
      unsafeActsCount: summary.unsafeActs,
      unsafeActsList,

      // Completion rates
      actionsCompletion: summary.actions.percentage,
      conditionsCompletion: summary.conditions.percentage,

      // Detailed data (JSON strings for Google Sheets)
      actionsDetails: JSON.stringify(actionsDetails),
      conditionsDetails: JSON.stringify(conditionsDetails),

      // User feedback
      suggestions: reportForm.suggestions || ''
    };
  }, [actions, conditions, actionStatus, conditionStatus, reportForm, calculateSummary]);

  // Validation function for report form
  const validateReportForm = () => {
    const errors = [];
    
    // Calculate actions completion percentage
    const totalActionQuestions = actions.reduce((total, item) => total + item.questions.length, 0);
    const completedActionQuestions = actions.reduce((total, item, itemIndex) => {
      return total + item.questions.filter((_, questionIndex) =>
        actionStatus[`action_${itemIndex}_question_${questionIndex}`]
      ).length;
    }, 0);
    const actionsCompletionRate = totalActionQuestions > 0 ? (completedActionQuestions / totalActionQuestions) * 100 : 0;
    
    // Calculate conditions completion percentage
    const totalConditionQuestions = conditions.reduce((total, item) => total + item.questions.length, 0);
    const completedConditionQuestions = conditions.reduce((total, item, itemIndex) => {
      return total + item.questions.filter((_, questionIndex) =>
        conditionStatus[`condition_${itemIndex}_question_${questionIndex}`]
      ).length;
    }, 0);
    const conditionsCompletionRate = totalConditionQuestions > 0 ? (completedConditionQuestions / totalConditionQuestions) * 100 : 0;
    
    // Check actions completion (must be at least 50%)
    if (actionsCompletionRate < 50) {
      errors.push(`Actions completion must be at least 50% (currently ${Math.round(actionsCompletionRate)}%)`);
    }
    
    // Check conditions completion (must be at least 50%)
    if (conditionsCompletionRate < 50) {
      errors.push(`Conditions completion must be at least 50% (currently ${Math.round(conditionsCompletionRate)}%)`);
    }
    
    // Check safe acts observed (at least one non-empty)
    const hasValidSafeActs = reportForm.safeActsObserved.some(act => act.trim() !== '');
    if (!hasValidSafeActs) {
      errors.push('At least one safe act must be observed');
    }
    
    // Check unsafe acts observed (at least one non-empty)
    const hasValidUnsafeActs = reportForm.unsafeActsObserved.some(act => act.trim() !== '');
    if (!hasValidUnsafeActs) {
      errors.push('At least one unsafe act must be observed');
    }
    
    // Check required fields
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
    
    // if (!reportForm.suggestions.trim()) {
    //   errors.push('Suggestions for improvement are required');
    // }
    
    return errors;
  };

  // Function to log all status including report form
  const logStatus = async () => {
    // Prevent double submission
    if (isSending) return;
    
    // Validate report form
    const validationErrors = validateReportForm();
    if (validationErrors.length > 0) {
      Alert.alert(
        'Incomplete Form', 
        `Please fill in all required fields:\n\n• ${validationErrors.join('\n• ')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsSending(true);
    
    try {
      const completeReport = {
        timestamp: new Date().toISOString(),
        actions: actions.map((item, itemIndex) => ({
          category: item.label,
          questions: item.questions.map((question, questionIndex) => ({
            question: question.q,
            status: actionStatus[`action_${itemIndex}_question_${questionIndex}`]
          }))
        })),
        conditions: conditions.map((item, itemIndex) => ({
          category: item.label,
          questions: item.questions.map((question, questionIndex) => ({
            question: question.q,
            status: conditionStatus[`condition_${itemIndex}_question_${questionIndex}`]
          }))
        })),
        reportForm: reportForm,
        summary: calculateSummary()
      };

      // Prepare data for both storage systems
      const sheetData = prepareSheetData();
      
      // Send to both Google Sheets and Firestore simultaneously
      const [sheetsResult, firestoreResult] = await Promise.allSettled([
        sendToGoogleSheets(sheetData),
        sendToFirestore(sheetData)
      ]);
    
    // Determine overall success
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
    
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          {
            text: 'View Summary',
            onPress: () => setShowSummaryModal(true)
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred while sending the report. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => setShowSummaryModal(true)
          }
        ]
      );
    } finally {
      setIsSending(false);
    }
  };



  return (
    <SafeAreaView style={styles.container} edges={['left','right','bottom']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary || "#FF9500"}
        translucent={false}
        hidden={false}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'actions' && styles.activeTab]}
          onPress={() => setActiveTab('actions')}
        >
          <Text style={[styles.tabText, activeTab === 'actions' && styles.activeTabText]}>
            Actions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'conditions' && styles.activeTab]}
          onPress={() => setActiveTab('conditions')}
        >
          <Text style={[styles.tabText, activeTab === 'conditions' && styles.activeTabText]}>
            Conditions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'report' && styles.activeTab]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.activeTabText]}>
            Report
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        {activeTab === 'actions' && (
          <View style={styles.gridContainer}>
            {actions.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.gridItem}>
                <ItemCheck
                  item={item}
                  itemIndex={itemIndex}
                  type="action"
                  questionStatus={actionStatus}
                  updateQuestionStatus={updateActionStatus}
                  areAllQuestionsChecked={areAllActionsChecked}
                  toggleAllQuestions={toggleAllActions}
                />
              </View>
            ))}
          </View>
        )}

        {activeTab === 'conditions' && (
          <View style={styles.gridContainer}>
            {conditions.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.gridItem}>
                <ItemCheck
                  item={item}
                  itemIndex={itemIndex}
                  type="condition"
                  questionStatus={conditionStatus}
                  updateQuestionStatus={updateConditionStatus}
                  areAllQuestionsChecked={areAllConditionsChecked}
                  toggleAllQuestions={toggleAllConditions}
                />
              </View>
            ))}
          </View>
        )}

        {activeTab === 'report' && (
          <View style={styles.formContainer}>

            {/* Safe Acts Observed */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithButton}>
                <Text style={styles.inputLabel}>Safe acts observed</Text>
                <TouchableOpacity onPress={addSafeAct} style={styles.addButton}>
                  <Ionicons name="add" size={20} color={colors.primary || '#FF9500'} />
                </TouchableOpacity>
              </View>
              {reportForm.safeActsObserved.map((act, index) => (
                <View key={index} style={styles.inputWithRemove}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={act}
                    onChangeText={(text) => updateSafeAct(index, text)}
                    placeholder={`Safe act ${index + 1}`}
                  />
                  {reportForm.safeActsObserved.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeSafeAct(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="remove" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Unsafe Acts Observed */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithButton}>
                <Text style={styles.inputLabel}>Unsafe acts observed</Text>
                <TouchableOpacity onPress={addUnsafeAct} style={styles.addButton}>
                  <Ionicons name="add" size={20} color={colors.primary || '#FF9500'} />
                </TouchableOpacity>
              </View>
              {reportForm.unsafeActsObserved.map((act, index) => (
                <View key={index} style={styles.inputWithRemove}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={act}
                    onChangeText={(text) => updateUnsafeAct(index, text)}
                    placeholder={`Unsafe act ${index + 1}`}
                  />
                  {reportForm.unsafeActsObserved.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeUnsafeAct(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="remove" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {reportForm.date.toDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              </TouchableOpacity>

              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.doneButton}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerContent}>
                    <View style={styles.datePickerRow}>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                          const newDate = new Date(reportForm.date);
                          newDate.setDate(newDate.getDate() - 1);
                          updateReportForm('date', newDate);
                        }}
                      >
                        <Text style={styles.dateButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.currentDate}>
                        {reportForm.date.toLocaleDateString()}
                      </Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                          const newDate = new Date(reportForm.date);
                          newDate.setDate(newDate.getDate() + 1);
                          updateReportForm('date', newDate);
                        }}
                      >
                        <Text style={styles.dateButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.quickDateButtons}>
                      <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => updateReportForm('date', new Date())}
                      >
                        <Text style={styles.quickButtonText}>Today</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          updateReportForm('date', yesterday);
                        }}
                      >
                        <Text style={styles.quickButtonText}>Yesterday</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Site */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Site</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowSiteDropdown(true)}
              >
                <Text style={[styles.dropdownButtonText, !reportForm.site && styles.placeholderText]}>
                  {reportForm.site || "Select site"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary || '#8E8E93'} />
              </TouchableOpacity>
            </View>

            {/* Area */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Area</Text>
              <TextInput
                style={styles.textInput}
                value={reportForm.area}
                onChangeText={(text) => updateReportForm('area', text)}
                placeholder="Enter area"
              />
            </View>

            {/* Shift Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shift</Text>
              <View style={styles.dropdownContainer}>
                {['General', 'A', 'B', 'C'].map((shift) => (
                  <TouchableOpacity
                    key={shift}
                    style={[
                      styles.dropdownOption,
                      reportForm.shift === shift && styles.selectedOption
                    ]}
                    onPress={() => updateReportForm('shift', shift)}
                  >
                    <Text style={[
                      styles.dropdownText,
                      reportForm.shift === shift && styles.selectedText
                    ]}>
                      {shift}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.textInput}
                value={reportForm.duration}
                onChangeText={(text) => handleNumericInput('duration', text)}
                placeholder="Enter duration in minutes"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            {/* People Conducted */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of people conducted</Text>
              <TextInput
                style={styles.textInput}
                value={reportForm.peopleConducted}
                onChangeText={(text) => handleNumericInput('peopleConducted', text)}
                placeholder="Enter number"
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            {/* People Observed */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of people observed</Text>
              <TextInput
                style={styles.textInput}
                value={reportForm.peopleObserved}
                onChangeText={(text) => handleNumericInput('peopleObserved', text)}
                placeholder="Enter number"
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            {/* User Suggestions */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Suggestions for improvement</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={reportForm.suggestions}
                onChangeText={(text) => updateReportForm('suggestions', text)}
                placeholder="Enter your suggestions for safety improvements, recommendations, or observations..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.logButton, isSending && styles.logButtonDisabled]} 
              onPress={logStatus}
              disabled={isSending}
            >
              {isSending ? (
                <View style={styles.sendingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.sendingSpinner} />
                  <Text style={styles.logButtonText}>Sending...</Text>
                </View>
              ) : (
                <Text style={styles.logButtonText}>Send Report</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>STOP Card Summary</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSummaryModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {(() => {
              const summary = calculateSummary();
              return (
                <View>
                  {/* Completion Overview */}
                  <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Completion Overview</Text>
                    <View style={styles.pieChartContainer}>
                      <View style={styles.pieChartWrapper}>
                        <Text style={styles.chartTitle}>Actions</Text>
                        <View style={styles.pieChart}>
                          <View style={[
                            styles.pieSlice,
                            {
                              transform: [{ rotate: `${(summary.actions.percentage * 3.6)}deg` }],
                              backgroundColor: colors.success || '#30D158'
                            }
                          ]} />
                          <View style={styles.pieCenter}>
                            <Text style={styles.percentageText}>{summary.actions.percentage}%</Text>
                          </View>
                        </View>
                        <Text style={styles.chartSubtitle}>
                          {summary.actions.completed}/{summary.actions.total} Complete
                        </Text>
                      </View>

                      <View style={styles.pieChartWrapper}>
                        <Text style={styles.chartTitle}>Conditions</Text>
                        <View style={styles.pieChart}>
                          <View style={[
                            styles.pieSlice,
                            {
                              transform: [{ rotate: `${(summary.conditions.percentage * 3.6)}deg` }],
                              backgroundColor: colors.primary || '#FF9500'
                            }
                          ]} />
                          <View style={styles.pieCenter}>
                            <Text style={styles.percentageText}>{summary.conditions.percentage}%</Text>
                          </View>
                        </View>
                        <Text style={styles.chartSubtitle}>
                          {summary.conditions.completed}/{summary.conditions.total} Complete
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Safety Observations Bar Chart */}
                  <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Safety Observations</Text>
                    <View style={styles.barChartContainer}>
                      <View style={styles.barItem}>
                        <Text style={styles.barLabel}>Safe Acts</Text>
                        <View style={styles.barBackground}>
                          <View style={[
                            styles.barFill,
                            {
                              width: `${Math.min((summary.safeActs / Math.max(summary.safeActs, summary.unsafeActs, 1)) * 100, 100)}%`,
                              backgroundColor: colors.success || '#30D158'
                            }
                          ]} />
                        </View>
                        <Text style={styles.barValue}>{summary.safeActs}</Text>
                      </View>

                      <View style={styles.barItem}>
                        <Text style={styles.barLabel}>Unsafe Acts</Text>
                        <View style={styles.barBackground}>
                          <View style={[
                            styles.barFill,
                            {
                              width: `${Math.min((summary.unsafeActs / Math.max(summary.safeActs, summary.unsafeActs, 1)) * 100, 100)}%`,
                              backgroundColor: colors.error || '#FF3B30'
                            }
                          ]} />
                        </View>
                        <Text style={styles.barValue}>{summary.unsafeActs}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Statistics */}
                  <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Report Statistics</Text>
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{summary.duration}</Text>
                        <Text style={styles.statLabel}>Minutes</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{summary.peopleConducted}</Text>
                        <Text style={styles.statLabel}>Conducted</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{summary.peopleObserved}</Text>
                        <Text style={styles.statLabel}>Observed</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => {
                      // setShowSummaryModal(false);
                      navigation.navigate('Home')
                      // Here you could add share functionality
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Home</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Site Dropdown Modal */}
      <Modal
        visible={showSiteDropdown}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSiteDropdown(false)}
      >
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Site</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSiteDropdown(false)}
              >
                <Ionicons name="close" size={24} color={colors.text || '#1C1C1E'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {site_list.map((site, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    reportForm.site === site && styles.selectedDropdownItem
                  ]}
                  onPress={() => {
                    updateReportForm('site', site);
                    setShowSiteDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    reportForm.site === site && styles.selectedDropdownItemText
                  ]}>
                    {site}
                  </Text>
                  {reportForm.site === site && (
                    <Ionicons name="checkmark" size={20} color={colors.primary || '#FF9500'} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background || "#F8F9FA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 40,
    backgroundColor: colors.background || "#F8F9FA",
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerUserInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSeparator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 8,
  },
  headerCompanyId: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  homeButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logoutHeaderButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
  },
  logButton: {
    backgroundColor: colors.primary || "#34C759",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  logButtonDisabled: {
    backgroundColor: colors.textSecondary || '#8E8E93',
    opacity: 0.7,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendingSpinner: {
    marginRight: 10,
  },
  conditionsTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary || '#FF9500',
    textAlign: 'center',
    letterSpacing: 1.2,
    marginTop: 5,
    marginBottom: 20,
    textShadowColor: 'rgba(255, 149, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: 'uppercase',
  },
  gridContainer: {
    flexDirection: 'column',
    paddingHorizontal: 10,
  },
  gridItem: {
    width: '100%',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primary || '#FF9500',
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 5,
    marginTop: -1, // pull up to remove any hairline gap
  },
  tab: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeTab: {
    backgroundColor: colors.background || '#F8F9FA',
    borderBottomWidth: 0,
  },
  tabText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeTabText: {
    color: colors.primary || '#FF9500',
  },
  formContainer: {
    padding: 15,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary || '#FF9500',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text || '#1C1C1E',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border || '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 45,
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border || '#D1D1D6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    backgroundColor: colors.primary || '#FF9500',
    borderColor: colors.primary || '#FF9500',
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text || '#1C1C1E',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  multilineInput: {
    height: 80,
    paddingTop: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border || '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 45,
  },
  dateText: {
    fontSize: 16,
    color: colors.text || '#1C1C1E',
  },
  datePickerContainer: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border || '#D1D1D6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#D1D1D6',
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary || '#8E8E93',
  },
  doneButton: {
    fontSize: 16,
    color: colors.primary || '#FF9500',
    fontWeight: '600',
  },
  datePickerContent: {
    padding: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary || '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  dateButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  currentDate: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text || '#1C1C1E',
    minWidth: 120,
    textAlign: 'center',
  },
  quickDateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryLight || '#ea6d1aff',
    borderRadius: 6,
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background || '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#D1D1D6',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary || '#FF9500',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text || '#1C1C1E',
    marginBottom: 15,
    textAlign: 'center',
  },
  pieChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pieChartWrapper: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text || '#1C1C1E',
    marginBottom: 10,
  },
  pieChart: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5EA',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 8,
  },
  pieSlice: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    transformOrigin: '50% 50%',
  },
  pieCenter: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    top: 15,
    left: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text || '#1C1C1E',
  },
  chartSubtitle: {
    fontSize: 12,
    color: colors.textSecondary || '#8E8E93',
    textAlign: 'center',
  },
  barChartContainer: {
    gap: 15,
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text || '#1C1C1E',
    width: 80,
  },
  barBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
  },
  barValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text || '#1C1C1E',
    width: 30,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary || '#FF9500',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary || '#8E8E93',
    marginTop: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary || '#FF9500',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  labelWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWithRemove: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 15,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUserCompact: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  
  // Dropdown Styles
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: colors.text || '#1C1C1E',
  },
  placeholderText: {
    color: colors.textSecondary || '#8E8E93',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    maxHeight: '70%',
    width: '90%',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text || '#1C1C1E',
  },
  closeButton: {
    padding: 5,
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#F0F8FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text || '#1C1C1E',
    flex: 1,
  },
  selectedDropdownItemText: {
    color: colors.primary || '#FF9500',
    fontWeight: '600',
  },

});

export default StopCard;
