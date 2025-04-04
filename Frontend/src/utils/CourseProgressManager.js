/**
 * CourseProgressManager - Utility for managing course progress across the application
 * Handles localStorage operations for tracking completion status, bookmarks, etc.
 */

const CourseProgressManager = {
    // Get progress for a specific course
    getCourseProgress: (courseName) => {
        try {
            const progressData = localStorage.getItem(`course_progress_${courseName}`);
            if (progressData) {
                return JSON.parse(progressData);
            }
            return { 
                completed: [], 
                lastViewed: null,
                startDate: null,
                lastAccessDate: null
            };
        } catch (error) {
            console.error('Error retrieving course progress:', error);
            return { 
                completed: [], 
                lastViewed: null,
                startDate: null,
                lastAccessDate: null
            };
        }
    },
    
    // Save progress for a specific course
    saveCourseProgress: (courseName, progressData) => {
        try {
            // Make sure to update the last access date
            const updatedProgress = {
                ...progressData,
                lastAccessDate: new Date().toISOString()
            };
            
            // Set start date if it doesn't exist
            if (!updatedProgress.startDate) {
                updatedProgress.startDate = new Date().toISOString();
            }
            
            localStorage.setItem(`course_progress_${courseName}`, JSON.stringify(updatedProgress));
            return updatedProgress;
        } catch (error) {
            console.error('Error saving course progress:', error);
            return progressData;
        }
    },
    
    // Mark a section as completed
    markSectionCompleted: (courseName, sectionId) => {
        const progress = CourseProgressManager.getCourseProgress(courseName);
        
        // Check if section is already completed
        if (!progress.completed.includes(sectionId)) {
            const updatedProgress = {
                ...progress,
                completed: [...progress.completed, sectionId].sort((a, b) => a - b)
            };
            
            return CourseProgressManager.saveCourseProgress(courseName, updatedProgress);
        }
        
        return progress;
    },
    
    // Update last viewed section
    updateLastViewed: (courseName, sectionId) => {
        const progress = CourseProgressManager.getCourseProgress(courseName);
        
        const updatedProgress = {
            ...progress,
            lastViewed: sectionId
        };
        
        return CourseProgressManager.saveCourseProgress(courseName, updatedProgress);
    },
    
    // Calculate completion percentage
    calculateCompletion: (totalSections, completedSections) => {
        if (!completedSections || totalSections === 0) return 0;
        return Math.round((completedSections.length / totalSections) * 100);
    },
    
    // Calculate estimated completion time in days
    calculateEstimatedCompletionDays: (totalSections, completedSections, averageTimePerSection = 3) => {
        if (!completedSections) return 0;
        
        const remainingSections = totalSections - completedSections.length;
        if (remainingSections <= 0) return 0;
        
        // Estimate based on average time to complete remaining sections
        // Assuming the user studies 1 hour per day on average
        return Math.ceil((remainingSections * averageTimePerSection) / 1);
    },
    
    // Get courseProgress status for UI display
    getProgressStatus: (courseName, learningPath) => {
        if (!learningPath || !learningPath.length) {
            return {
                percentage: 0,
                completedModules: 0,
                totalModules: 0,
                estimatedCompletionDays: 0,
                sectionsCompleted: []
            };
        }
        
        const progress = CourseProgressManager.getCourseProgress(courseName);
        const completedSections = progress.completed || [];
        const totalSections = learningPath.length;
        
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
    },
    
    // Check if section is completed
    isSectionCompleted: (courseName, sectionId) => {
        const progress = CourseProgressManager.getCourseProgress(courseName);
        return progress.completed.includes(sectionId);
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
                    allCourses[courseName] = JSON.parse(localStorage.getItem(key));
                }
            }
            return allCourses;
        } catch (error) {
            console.error('Error retrieving all courses progress:', error);
            return {};
        }
    },
    
    // Bookmark functionality
    
    // Check if user has bookmarked a course
    isBookmarked: (courseName) => {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('course_bookmarks') || '{}');
            return !!bookmarks[courseName];
        } catch (error) {
            console.error('Error loading bookmark state:', error);
            return false;
        }
    },
    
    // Toggle bookmark status
    toggleBookmark: (courseName) => {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('course_bookmarks') || '{}');
            const isCurrentlyBookmarked = !!bookmarks[courseName];
            
            if (isCurrentlyBookmarked) {
                delete bookmarks[courseName];
            } else {
                bookmarks[courseName] = true;
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