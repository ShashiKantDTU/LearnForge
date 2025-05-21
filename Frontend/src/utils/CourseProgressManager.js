/**
 * CourseProgressManager - Utility for managing course progress across the application
 * Handles localStorage operations for tracking completion status, bookmarks, etc.
 */

const CourseProgressManager = {
    // Get progress for a specific course
    getCourseProgress: (courseName) => {
        try {
            // Input validation
            if (!courseName) {
                console.error('Error: No course name provided to getCourseProgress');
                return { 
                    completed: [], 
                    lastViewed: null,
                    startDate: null,
                    lastAccessDate: null
                };
            }
            
            // Normalize courseName to avoid case sensitivity issues
            const normalizedCourseName = courseName.toLowerCase();
            
            const progressData = localStorage.getItem(`course_progress_${normalizedCourseName}`);
            if (progressData) {
                const parsed = JSON.parse(progressData);
                
                // Ensure the data has the expected structure
                return {
                    completed: Array.isArray(parsed.completed) ? parsed.completed : [],
                    lastViewed: parsed.lastViewed || null,
                    startDate: parsed.startDate || new Date().toISOString(),
                    lastAccessDate: parsed.lastAccessDate || new Date().toISOString()
                };
            }
            
            // Initialize new progress data
            return { 
                completed: [], 
                lastViewed: null,
                startDate: new Date().toISOString(),
                lastAccessDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error retrieving course progress:', error);
            return { 
                completed: [], 
                lastViewed: null,
                startDate: new Date().toISOString(),
                lastAccessDate: new Date().toISOString()
            };
        }
    },
    
    // Save progress for a specific course
    saveCourseProgress: (courseName, progressData) => {
        try {
            // Input validation
            if (!courseName) {
                console.error('Error: No course name provided to saveCourseProgress');
                return progressData;
            }
            
            // Normalize courseName to avoid case sensitivity issues
            const normalizedCourseName = courseName.toLowerCase();
            
            // Ensure progressData has the correct structure
            const safeProgressData = {
                completed: Array.isArray(progressData.completed) ? progressData.completed : [],
                lastViewed: progressData.lastViewed || null,
                startDate: progressData.startDate || new Date().toISOString(),
                lastAccessDate: new Date().toISOString() // Always update this
            };
            
            localStorage.setItem(`course_progress_${normalizedCourseName}`, JSON.stringify(safeProgressData));
            return safeProgressData;
        } catch (error) {
            console.error('Error saving course progress:', error);
            return progressData;
        }
    },
    
    // Mark a section as completed
    markSectionCompleted: (courseName, sectionId) => {
        try {
            // Input validation
            if (!courseName || sectionId === undefined || sectionId === null) {
                console.error('Error: Invalid parameters provided to markSectionCompleted');
                return null;
            }
            
            // Ensure sectionId is a number
            const sectionIdNum = parseInt(sectionId, 10);
            if (isNaN(sectionIdNum)) {
                console.error('Error: Invalid section ID in markSectionCompleted');
                return null;
            }
            
            const progress = CourseProgressManager.getCourseProgress(courseName);
            
            // Check if section is already completed
            if (!progress.completed.includes(sectionIdNum)) {
                const updatedProgress = {
                    ...progress,
                    completed: [...progress.completed, sectionIdNum].sort((a, b) => a - b)
                };
                
                return CourseProgressManager.saveCourseProgress(courseName, updatedProgress);
            }
            
            return progress;
        } catch (error) {
            console.error('Error marking section as completed:', error);
            return null;
        }
    },
    
    // Update last viewed section
    updateLastViewed: (courseName, sectionId) => {
        try {
            // Input validation
            if (!courseName || sectionId === undefined || sectionId === null) {
                console.error('Error: Invalid parameters provided to updateLastViewed');
                return null;
            }
            
            // Ensure sectionId is a number
            const sectionIdNum = parseInt(sectionId, 10);
            if (isNaN(sectionIdNum)) {
                console.error('Error: Invalid section ID in updateLastViewed');
                return null;
            }
            
            const progress = CourseProgressManager.getCourseProgress(courseName);
            
            const updatedProgress = {
                ...progress,
                lastViewed: sectionIdNum
            };
            
            return CourseProgressManager.saveCourseProgress(courseName, updatedProgress);
        } catch (error) {
            console.error('Error updating last viewed section:', error);
            return null;
        }
    },
    
    // Calculate completion percentage
    calculateCompletion: (totalSections, completedSections) => {
        if (!completedSections || !Array.isArray(completedSections) || totalSections <= 0) return 0;
        return Math.round((completedSections.length / totalSections) * 100);
    },
    
    // Calculate estimated completion time in days
    calculateEstimatedCompletionDays: (totalSections, completedSections, averageTimePerSection = 3) => {
        if (!completedSections || !Array.isArray(completedSections)) return 0;
        
        const remainingSections = totalSections - completedSections.length;
        if (remainingSections <= 0) return 0;
        
        // Estimate based on average time to complete remaining sections
        // Assuming the user studies 1 hour per day on average
        return Math.ceil((remainingSections * averageTimePerSection) / 1);
    },
    
    // Get courseProgress status for UI display
    getProgressStatus: (courseName, learningPath) => {
        try {
            // Input validation
            if (!courseName) {
                console.error('Error: No course name provided to getProgressStatus');
                return {
                    percentage: 0,
                    completedModules: 0,
                    totalModules: 0,
                    estimatedCompletionDays: 0,
                    sectionsCompleted: []
                };
            }
            
            if (!learningPath || !Array.isArray(learningPath) || learningPath.length === 0) {
                return {
                    percentage: 0,
                    completedModules: 0,
                    totalModules: 0,
                    estimatedCompletionDays: 0,
                    sectionsCompleted: []
                };
            }
            
            const progress = CourseProgressManager.getCourseProgress(courseName);
            const completedSections = Array.isArray(progress.completed) ? progress.completed : [];
            const totalSections = learningPath.length;
            
            // Calculate average time per section, defaulting to 3 hours if no data
            const averageTimePerSection = learningPath.reduce(
                (sum, section) => sum + (section.estimated_time_hours || 3), 0
            ) / totalSections;
            
            return {
                percentage: CourseProgressManager.calculateCompletion(totalSections, completedSections),
                completedModules: completedSections.length,
                totalModules: totalSections,
                estimatedCompletionDays: CourseProgressManager.calculateEstimatedCompletionDays(
                    totalSections, 
                    completedSections, 
                    averageTimePerSection
                ),
                sectionsCompleted: completedSections,
                lastViewed: progress.lastViewed,
                startDate: progress.startDate,
                lastAccessDate: progress.lastAccessDate
            };
        } catch (error) {
            console.error('Error getting progress status:', error);
            return {
                percentage: 0,
                completedModules: 0,
                totalModules: 0,
                estimatedCompletionDays: 0,
                sectionsCompleted: []
            };
        }
    },
    
    // Check if section is completed
    isSectionCompleted: (courseName, sectionId) => {
        try {
            if (!courseName || sectionId === undefined || sectionId === null) {
                return false;
            }
            
            // Ensure sectionId is a number
            const sectionIdNum = parseInt(sectionId, 10);
            if (isNaN(sectionIdNum)) {
                return false;
            }
            
            const progress = CourseProgressManager.getCourseProgress(courseName);
            return Array.isArray(progress.completed) && progress.completed.includes(sectionIdNum);
        } catch (error) {
            console.error('Error checking if section is completed:', error);
            return false;
        }
    },
    
    // Calculate section progress (currently binary - either 0% or 100%)
    getSectionProgress: (courseName, sectionId) => {
        return CourseProgressManager.isSectionCompleted(courseName, sectionId) ? 100 : 0;
    },
    
    // Get all courses progress (for dashboard display)
    getAllCoursesProgress: () => {
        try {
            const allCourses = {};
            // Loop through localStorage to find all course progress items
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('course_progress_')) {
                    const courseName = key.replace('course_progress_', '');
                    const progressData = localStorage.getItem(key);
                    try {
                        const parsed = JSON.parse(progressData);
                        allCourses[courseName] = {
                            completed: Array.isArray(parsed.completed) ? parsed.completed : [],
                            lastViewed: parsed.lastViewed || null,
                            startDate: parsed.startDate || null,
                            lastAccessDate: parsed.lastAccessDate || null
                        };
                    } catch (parseError) {
                        console.error(`Error parsing progress data for course "${courseName}":`, parseError);
                    }
                }
            }
            return allCourses;
        } catch (error) {
            console.error('Error retrieving all courses progress:', error);
            return {};
        }
    },
    
    // Clear all progress for a specific course (for testing/debugging)
    clearCourseProgress: (courseName) => {
        try {
            if (!courseName) return false;
            
            const normalizedCourseName = courseName.toLowerCase();
            localStorage.removeItem(`course_progress_${normalizedCourseName}`);
            return true;
        } catch (error) {
            console.error('Error clearing course progress:', error);
            return false;
        }
    },
    
    // Bookmark functionality
    
    // Check if user has bookmarked a course
    isBookmarked: (courseName) => {
        try {
            if (!courseName) return false;
            
            const normalizedCourseName = courseName.toLowerCase();
            const bookmarks = JSON.parse(localStorage.getItem('course_bookmarks') || '{}');
            return !!bookmarks[normalizedCourseName];
        } catch (error) {
            console.error('Error loading bookmark state:', error);
            return false;
        }
    },
    
    // Toggle bookmark status
    toggleBookmark: (courseName) => {
        try {
            if (!courseName) return false;
            
            const normalizedCourseName = courseName.toLowerCase();
            const bookmarks = JSON.parse(localStorage.getItem('course_bookmarks') || '{}');
            const isCurrentlyBookmarked = !!bookmarks[normalizedCourseName];
            
            if (isCurrentlyBookmarked) {
                delete bookmarks[normalizedCourseName];
            } else {
                bookmarks[normalizedCourseName] = true;
            }
            
            localStorage.setItem('course_bookmarks', JSON.stringify(bookmarks));
            return !isCurrentlyBookmarked; // Return the new state
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            return false;
        }
    },
    
    // Get all bookmarked courses
    getAllBookmarks: () => {
        try {
            return JSON.parse(localStorage.getItem('course_bookmarks') || '{}');
        } catch (error) {
            console.error('Error retrieving bookmarks:', error);
            return {};
        }
    }
};

export default CourseProgressManager; 