import React, { useEffect, useState } from 'react';
import { useNotifications } from '../ContextHooks/NotificationContext';
import { FaCheckCircle, FaTimes, FaExclamationCircle, FaBell } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import styles from './Notifications.module.css';

const Toast = () => {
    const { notifications, removeNotification } = useNotifications();
    const [visibleToasts, setVisibleToasts] = useState([]);
    
    // Update visible toasts when notifications change
    useEffect(() => {
        // Get only the newest unread notifications to show as toasts
        const newToasts = notifications
            .filter(n => !n.read)
            .slice(0, 3); // Show maximum 3 toasts at once
        
        setVisibleToasts(newToasts);
        
        // Auto-dismiss toasts after delay
        const timeouts = newToasts.map(toast => {
            return setTimeout(() => {
                setVisibleToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 7000); // 7 seconds
        });
        
        // Clean up timeouts
        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [notifications]);
    
    // Get icon based on notification type
    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <FaCheckCircle className={styles.toastIcon} />;
            case 'error':
                return <FaExclamationCircle className={styles.toastIcon} />;
            case 'info':
            default:
                return <FaBell className={styles.toastIcon} />;
        }
    };
    
    // Close a toast and remove the notification
    const closeToast = (id) => {
        setVisibleToasts(prev => prev.filter(t => t.id !== id));
        removeNotification(id);
    };
    
    if (visibleToasts.length === 0) {
        return null;
    }
    
    return (
        <div className={styles.toastContainer}>
            {visibleToasts.map(toast => (
                <div 
                    key={toast.id} 
                    className={`${styles.toast} ${styles[toast.type || 'info']}`}
                >
                    {getIcon(toast.type)}
                    
                    <div className={styles.toastContent}>
                        <h4 className={styles.toastTitle}>{toast.title}</h4>
                        <p className={styles.toastMessage}>{toast.message}</p>
                    </div>
                    
                    {toast.link && (
                        <NavLink 
                            to={toast.link} 
                            className={styles.toastLink}
                            onClick={() => closeToast(toast.id)}
                        >
                            View
                        </NavLink>
                    )}
                    
                    <button 
                        className={styles.toastCloseButton}
                        onClick={() => closeToast(toast.id)}
                        aria-label="Close notification"
                    >
                        <FaTimes />
                    </button>
                    
                    {/* Auto-dismiss progress bar */}
                    <div className={styles.toastProgressBar}></div>
                </div>
            ))}
        </div>
    );
};

export default Toast; 