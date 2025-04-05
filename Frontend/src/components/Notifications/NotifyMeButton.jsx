import React, { useState } from 'react';
import { FaBell, FaCheck } from 'react-icons/fa';
import { useNotifications } from '../ContextHooks/NotificationContext';
import styles from './Notifications.module.css';

const NotifyMeButton = ({ courseName, sectionId, topicName }) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { trackContentGeneration, pendingContent } = useNotifications();
    
    // Check if this section is already being tracked
    const alreadyTracking = pendingContent.some(
        item => item.courseName === courseName && item.sectionId === sectionId
    );
    
    // Handle button click
    const handleClick = () => {
        if (isSubscribed || alreadyTracking) return;
        
        const result = trackContentGeneration(courseName, sectionId, topicName);
        if (result) {
            setIsSubscribed(true);
        }
    };
    
    // If already subscribed (either previously or just now), show confirmation
    if (isSubscribed || alreadyTracking) {
        return (
            <button 
                className={`${styles.notifyButton} ${styles.disabled}`}
                disabled={true}
            >
                <FaCheck className={styles.icon} />
                We'll notify you when ready
            </button>
        );
    }
    
    return (
        <button 
            className={styles.notifyButton}
            onClick={handleClick}
            aria-label="Notify me when content is ready"
        >
            <FaBell className={styles.icon} />
            Notify me when ready
        </button>
    );
};

export default NotifyMeButton; 