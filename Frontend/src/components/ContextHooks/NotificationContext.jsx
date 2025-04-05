import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the notification context
const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [pendingContent, setPendingContent] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isPolling, setIsPolling] = useState(false);
    
    // Add a section to be tracked for content generation
    const trackContentGeneration = (courseName, sectionId, topicName) => {
        // Check if we're already tracking this item
        const existingIndex = pendingContent.findIndex(
            item => item.courseName === courseName && item.sectionId === sectionId
        );
        
        if (existingIndex === -1) {
            // Add to tracking list if not already there
            setPendingContent(prev => [
                ...prev, 
                { 
                    courseName, 
                    sectionId, 
                    topicName,
                    addedAt: new Date().toISOString() 
                }
            ]);
            
            // Start polling if not already doing so
            if (!isPolling) {
                startPolling();
            }
            
            return true;
        }
        
        return false; // Already tracking this content
    };
    
    // Remove a section from tracking
    const removeFromTracking = (courseName, sectionId) => {
        setPendingContent(prev => prev.filter(
            item => !(item.courseName === courseName && item.sectionId === sectionId)
        ));
    };
    
    // Add a notification
    const addNotification = (notification) => {
        const id = Date.now();
        setNotifications(prev => [
            { id, ...notification, createdAt: new Date().toISOString() },
            ...prev
        ]);
        
        // Auto-remove notification after a delay (optional)
        setTimeout(() => {
            removeNotification(id);
        }, 15000); // 15 seconds
        
        return id;
    };
    
    // Remove a notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };
    
    // Mark a notification as read
    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
    };
    
    // Check for completed content generation
    const checkGenerationStatus = async () => {
        if (pendingContent.length === 0) {
            setIsPolling(false);
            return;
        }
        
        try {
            // Make a copy to avoid mutating during iteration
            const currentPending = [...pendingContent];
            
            for (const item of currentPending) {
                const response = await fetch('http://localhost:3000/check-generation-status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        courseName: item.courseName,
                        sectionId: item.sectionId
                    })
                });
                
                if (!response.ok) {
                    console.error(`Error checking status for ${item.courseName} section ${item.sectionId}`);
                    continue;
                }
                
                const data = await response.json();
                
                if (data.isGenerated) {
                    // Content is generated, remove from tracking and show notification
                    removeFromTracking(item.courseName, item.sectionId);
                    
                    const sectionName = data.section?.name || item.topicName || `Section ${item.sectionId}`;
                    const courseName = data.course?.name || item.courseName;
                    
                    addNotification({
                        type: 'success',
                        title: 'Content Ready!',
                        message: `${sectionName} in ${courseName} is now available.`,
                        link: `/course/${item.courseName.replace(/\s+/g, '-')}/section/${item.sectionId}`,
                        read: false
                    });
                }
            }
        } catch (error) {
            console.error('Error during content status polling:', error);
        }
    };
    
    // Start polling for content generation status
    const startPolling = () => {
        if (isPolling) return;
        
        setIsPolling(true);
        checkGenerationStatus(); // Check immediately once
        
        // Then setup interval for future checks
        const intervalId = setInterval(checkGenerationStatus, 10000); // 10 seconds
        
        // Clean up the interval when component unmounts
        return () => clearInterval(intervalId);
    };
    
    // Start/stop polling based on pendingContent
    useEffect(() => {
        let intervalId;
        
        if (pendingContent.length > 0 && !isPolling) {
            setIsPolling(true);
            checkGenerationStatus(); // Check immediately
            intervalId = setInterval(checkGenerationStatus, 10000); // 10 seconds
        } else if (pendingContent.length === 0 && isPolling) {
            setIsPolling(false);
            if (intervalId) clearInterval(intervalId);
        }
        
        // Clean up on unmount
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [pendingContent.length, isPolling]);
    
    // Persist pending content between page refreshes
    useEffect(() => {
        // Load saved pending content on initial render
        const savedPending = localStorage.getItem('pendingContent');
        if (savedPending) {
            try {
                const parsed = JSON.parse(savedPending);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPendingContent(parsed);
                    // Start polling immediately if we have pending items
                    setIsPolling(true);
                }
            } catch (e) {
                console.error('Error parsing saved pending content:', e);
            }
        }
    }, []);
    
    // Save to localStorage whenever pendingContent changes
    useEffect(() => {
        if (pendingContent.length > 0) {
            localStorage.setItem('pendingContent', JSON.stringify(pendingContent));
        } else {
            localStorage.removeItem('pendingContent');
        }
    }, [pendingContent]);
    
    const contextValue = {
        pendingContent,
        notifications,
        isPolling,
        trackContentGeneration,
        removeFromTracking,
        addNotification,
        removeNotification,
        markAsRead
    };
    
    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext; 