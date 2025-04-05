import React, { useState } from 'react';
import { useNotifications } from '../ContextHooks/NotificationContext';
import { FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import styles from './Notifications.module.css';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, removeNotification, markAsRead, pendingContent } = useNotifications();
    
    // Calculate the number of unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Toggle the notification panel
    const togglePanel = () => {
        setIsOpen(!isOpen);
        
        // Mark all as read when opening the panel
        if (!isOpen && unreadCount > 0) {
            notifications.forEach(n => {
                if (!n.read) markAsRead(n.id);
            });
        }
    };
    
    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };
    
    // Remove a notification
    const handleRemove = (e, id) => {
        e.stopPropagation();
        removeNotification(id);
    };
    
    return (
        <div className={styles.notificationContainer}>
            <button 
                className={styles.bellButton} 
                onClick={togglePanel}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <FaBell />
                {(unreadCount > 0 || pendingContent.length > 0) && (
                    <span className={styles.badge}>
                        {unreadCount + pendingContent.length}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <div className={styles.notificationPanel}>
                    <div className={styles.notificationHeader}>
                        <h3>Notifications</h3>
                        <button 
                            className={styles.closeButton} 
                            onClick={togglePanel}
                            aria-label="Close notifications"
                        >
                            <FaTimes />
                        </button>
                    </div>
                    
                    {pendingContent.length > 0 && (
                        <div className={styles.pendingSection}>
                            <h4>Content Generation in Progress</h4>
                            <ul className={styles.pendingList}>
                                {pendingContent.map((item, index) => (
                                    <li key={`pending-${index}`} className={styles.pendingItem}>
                                        <div className={styles.pendingLoadingIndicator}></div>
                                        <div className={styles.pendingContent}>
                                            <p className={styles.pendingTitle}>
                                                {item.topicName || `Section ${item.sectionId}`}
                                            </p>
                                            <p className={styles.pendingCourse}>
                                                {item.courseName}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {notifications.length > 0 ? (
                        <ul className={styles.notificationList}>
                            {notifications.map(notification => (
                                <li 
                                    key={notification.id} 
                                    className={`${styles.notificationItem} ${notification.read ? styles.read : styles.unread}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    {notification.link ? (
                                        <NavLink to={notification.link} className={styles.notificationLink}>
                                            <div className={styles.notificationContent}>
                                                <h4 className={styles.notificationTitle}>
                                                    {notification.title}
                                                </h4>
                                                <p className={styles.notificationMessage}>
                                                    {notification.message}
                                                </p>
                                                <span className={styles.notificationTime}>
                                                    {new Date(notification.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </NavLink>
                                    ) : (
                                        <div className={styles.notificationContent}>
                                            <h4 className={styles.notificationTitle}>
                                                {notification.title}
                                            </h4>
                                            <p className={styles.notificationMessage}>
                                                {notification.message}
                                            </p>
                                            <span className={styles.notificationTime}>
                                                {new Date(notification.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                    <button 
                                        className={styles.removeButton}
                                        onClick={(e) => handleRemove(e, notification.id)}
                                        aria-label="Remove notification"
                                    >
                                        <FaTimes />
                                    </button>
                                    {notification.read && (
                                        <span className={styles.readIndicator}>
                                            <FaCheck />
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className={styles.emptyNotifications}>
                            {pendingContent.length === 0 ? 'No notifications' : 'No completed notifications yet'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell; 