// components/ItemCheck.js
import React from 'react';
import { colors } from '../constants/color';
import './ItemCheck.css';

const ItemCheck = ({ item, itemIndex, type, questionStatus, updateQuestionStatus, areAllQuestionsChecked, toggleAllQuestions }) => {
    const allChecked = areAllQuestionsChecked(itemIndex);

    return (
        <div className="item-check-container">
            <div className="item-check-header">
                <div className="header-title-row">
                    {item.icon && (
                        <svg className="header-icon" viewBox="0 0 24 24" fill={colors.headerTitle || '#fff'}>
                            {getIconPath(item.icon)}
                        </svg>
                    )}
                    <h3 className="header-text">
                        {item.label}
                    </h3>
                </div>
                <div className="all-safe-row">
                    <input
                        type="checkbox"
                        className="header-checkbox"
                        checked={allChecked}
                        onChange={(e) => toggleAllQuestions(itemIndex, e.target.checked)}
                        style={{ accentColor: allChecked ? colors.success : '#FFFFFF' }}
                    />
                    <span className="all-safe-text">
                        All Safe
                    </span>
                </div>
            </div>
            {item.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={questionStatus[`${type}_${itemIndex}_question_${questionIndex}`] || false}
                        onChange={(e) => updateQuestionStatus(itemIndex, questionIndex, e.target.checked)}
                        style={{ accentColor: questionStatus[`${type}_${itemIndex}_question_${questionIndex}`] ? colors.primary : undefined }}
                    />
                    <label className="checkbox-label">{question.q}</label>
                </div>
            ))}
        </div>
    );
};

// Helper function to get SVG paths for icons
const getIconPath = (iconName) => {
    const icons = {
        'people-outline': <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
        'warning-outline': <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>,
        'shield-outline': <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>,
        'construct-outline': <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>,
        'document-text-outline': <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>,
        'library-outline': <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>,
        'build-outline': <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>,
        'business-outline': <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>,
        'earth-outline': <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>,
        'checkmark-done-outline': <path d="M17.3 6.3l-5.8 5.8-2.8-2.8-1.4 1.4 4.2 4.2 7.2-7.2zM8.5 12l-1.4-1.4L3 14.7l1.4 1.4zm9.2-7.8L12 9.9 10.6 8.5l-1.4 1.4 3.5 3.5z"/>
    };
    return icons[iconName] || <circle cx="12" cy="12" r="10"/>;
};

export default ItemCheck;
