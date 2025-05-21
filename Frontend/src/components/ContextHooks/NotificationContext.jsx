import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the notification context
const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [pendingContent, setPendingContent] = useState([]);
    const [pendingLearningPaths, setPendingLearningPaths] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isPolling, setIsPolling] = useState(false);
    const [isPollingLearningPaths, setIsPollingLearningPaths] = useState(false);
    
    // Add a section to be tracked for content generation
    const trackContentGeneration = (courseName, sectionId, topicName) => {
        // Check if we're already tracking this item
        const existingIndex = pendingContent.findIndex(
            item => item.courseName === courseName && item.sectionId === sectionId
        );
        
        // Check if it's a learning path generation (starts with gen_)
        if (sectionId.startsWith('gen_')) {
            // Track as a learning path generation
            const existingLPIndex = pendingLearningPaths.findIndex(
                item => item.prompt === courseName && item.id === sectionId
            );
            
            if (existingLPIndex === -1) {
                // Add to learning paths tracking list if not already there
                setPendingLearningPaths(prev => [
                    ...prev, 
                    { 
                        prompt: courseName,
                        id: sectionId,
                        topicName,
                        addedAt: new Date().toISOString() 
                    }
                ]);
                
                // Start polling if not already doing so
                if (!isPollingLearningPaths) {
                    startPollingLearningPaths();
                }
                
                return true;
            }
            
            return false; // Already tracking this learning path
        }
        
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
    
    // Remove a learning path from tracking
    const removeFromLearningPathTracking = (prompt, id) => {
        setPendingLearningPaths(prev => prev.filter(
            item => !(item.prompt === prompt && item.id === id)
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
    
    // Check for completed learning path generation
    const checkLearningPathStatus = async () => {
        if (pendingLearningPaths.length === 0) {
            setIsPollingLearningPaths(false);
            return;
        }
        
        try {
            // Make a copy to avoid mutating during iteration
            const currentPending = [...pendingLearningPaths];
            
            for (const item of currentPending) {
                // Check if a course with this prompt exists
                const response = await fetch('http://localhost:3000/check-learning-path', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: item.prompt
                    })
                });
                
                if (!response.ok) {
                    console.error(`Error checking learning path status for "${item.prompt}"`);
                    continue;
                }
                
                const data = await response.json();
                
                if (data.exists) {
                    // Learning path is generated, remove from tracking and show notification
                    removeFromLearningPathTracking(item.prompt, item.id);
                    
                    addNotification({
                        type: 'success',
                        title: 'Learning Path Ready!',
                        message: `Your learning path for "${item.prompt}" is now available.`,
                        link: `/course/${data.courseId || item.prompt.replace(/\s+/g, '-')}`,
                        read: false
                    });
                }
            }
        } catch (error) {
            console.error('Error during learning path status polling:', error);
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
    
    // Start polling for learning path generation status
    const startPollingLearningPaths = () => {
        if (isPollingLearningPaths) return;
        
        setIsPollingLearningPaths(true);
        checkLearningPathStatus(); // Check immediately once
        
        // Then setup interval for future checks
        const intervalId = setInterval(checkLearningPathStatus, 5000); // 5 seconds as requested
        
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
    
    // Start/stop polling for learning paths based on pendingLearningPaths
    useEffect(() => {
        let intervalId;
        
        if (pendingLearningPaths.length > 0 && !isPollingLearningPaths) {
            setIsPollingLearningPaths(true);
            checkLearningPathStatus(); // Check immediately
            intervalId = setInterval(checkLearningPathStatus, 5000); // 5 seconds
        } else if (pendingLearningPaths.length === 0 && isPollingLearningPaths) {
            setIsPollingLearningPaths(false);
            if (intervalId) clearInterval(intervalId);
        }
        
        // Clean up on unmount
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [pendingLearningPaths.length, isPollingLearningPaths]);
    
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
        
        // Load saved pending learning paths
        const savedPendingLearningPaths = localStorage.getItem('pendingLearningPaths');
        if (savedPendingLearningPaths) {
            try {
                const parsed = JSON.parse(savedPendingLearningPaths);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPendingLearningPaths(parsed);
                    // Start polling immediately if we have pending items
                    setIsPollingLearningPaths(true);
                }
            } catch (e) {
                console.error('Error parsing saved pending learning paths:', e);
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
    
    // Save to localStorage whenever pendingLearningPaths changes
    useEffect(() => {
        if (pendingLearningPaths.length > 0) {
            localStorage.setItem('pendingLearningPaths', JSON.stringify(pendingLearningPaths));
        } else {
            localStorage.removeItem('pendingLearningPaths');
        }
    }, [pendingLearningPaths]);
    
    const contextValue = {
        pendingContent,
        pendingLearningPaths,
        notifications,
        isPolling,
        isPollingLearningPaths,
        trackContentGeneration,
        removeFromTracking,
        removeFromLearningPathTracking,
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