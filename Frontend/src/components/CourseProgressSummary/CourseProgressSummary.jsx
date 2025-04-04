import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaBookOpen, FaClock, FaCheckCircle, FaChartLine } from 'react-icons/fa';
import CourseProgressManager from '../../utils/CourseProgressManager';
import styles from './CourseProgressSummary.module.css';

/**
 * CourseProgressSummary Component
 * Displays a summary of progress across all courses the user is enrolled in
 */
const CourseProgressSummary = () => {
    const [courseProgress, setCourseProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCompletionPercentage, setTotalCompletionPercentage] = useState(0);
    const [totalCourses, setTotalCourses] = useState(0);
    const [completedCourses, setCompletedCourses] = useState(0);
    const [bookmarkedCourses, setBookmarkedCourses] = useState([]);

    // Load progress data
    useEffect(() => {
        const loadProgressData = () => {
            try {
                // Get all course progress data
                const allProgress = CourseProgressManager.getAllCoursesProgress();
                
                // Transform the object into an array with course names
                const progressArray = Object.entries(allProgress).map(([courseName, progress]) => ({
                    courseName,
                    ...progress,
                    // Calculate course completion percentage based on the data we have
                    completionPercentage: progress.completed ? 
                        CourseProgressManager.calculateCompletion(progress.completed.length * 2, progress.completed) : 0
                }));
                
                setCourseProgress(progressArray);
                
                // Calculate overall stats
                if (progressArray.length > 0) {
                    const totalPercentage = progressArray.reduce((sum, course) => 
                        sum + (course.completionPercentage || 0), 0) / progressArray.length;
                    
                    setTotalCompletionPercentage(Math.round(totalPercentage));
                    setTotalCourses(progressArray.length);
                    
                    // Count courses with 100% completion
                    const completed = progressArray.filter(course => 
                        course.completionPercentage === 100).length;
                    setCompletedCourses(completed);
                }
                
                // Get bookmarked courses
                const bookmarks = CourseProgressManager.getAllBookmarks();
                setBookmarkedCourses(Object.keys(bookmarks));
                
                setLoading(false);
            } catch (error) {
                console.error('Error loading course progress summary:', error);
                setLoading(false);
            }
        };
        
        loadProgressData();
        
        // Set up an event listener for storage changes
        const handleStorageChange = () => {
            loadProgressData();
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);
    
    if (loading) {
        return <div className={styles.loading}>Loading progress data...</div>;
    }
    
    // If no courses found
    if (courseProgress.length === 0) {
        return (
            <div className={styles.noCourses}>
                <FaGraduationCap className={styles.icon} />
                <p>You haven't started any courses yet.</p>
                <Link to="/courses" className={styles.exploreCourses}>Explore Courses</Link>
            </div>
        );
    }
    
    return (
        <div className={styles.progressSummary}>
            <div className={styles.overallProgress}>
                <h3>Your Learning Progress</h3>
                <div className={styles.stat}>
                    <FaChartLine className={styles.statIcon} />
                    <span className={styles.statLabel}>Overall Completion:</span>
                    <span className={styles.statValue}>{totalCompletionPercentage}%</span>
                </div>
                <div className={styles.stat}>
                    <FaBookOpen className={styles.statIcon} />
                    <span className={styles.statLabel}>Courses In Progress:</span>
                    <span className={styles.statValue}>{totalCourses - completedCourses}</span>
                </div>
                <div className={styles.stat}>
                    <FaCheckCircle className={styles.statIcon} />
                    <span className={styles.statLabel}>Completed Courses:</span>
                    <span className={styles.statValue}>{completedCourses}</span>
                </div>
            </div>
            
            <div className={styles.recentCourses}>
                <h3>Recent Courses</h3>
                <ul className={styles.courseList}>
                    {courseProgress
                        .sort((a, b) => new Date(b.lastAccessDate || 0) - new Date(a.lastAccessDate || 0))
                        .slice(0, 3)
                        .map((course, index) => (
                            <li key={index} className={styles.courseItem}>
                                <Link to={`/course/${course.courseName}/section/${course.lastViewed || 1}`}>
                                    <div className={styles.courseTitle}>{course.courseName}</div>
                                    <div className={styles.courseDetails}>
                                        <span className={styles.lastAccessed}>
                                            <FaClock /> {course.lastAccessDate ? 
                                                formatLastAccessed(course.lastAccessDate) : 'Not started'}
                                        </span>
                                        <div className={styles.courseProgressBar}>
                                            <div 
                                                className={styles.courseProgressFill}
                                                style={{ width: `${course.completionPercentage || 0}%` }}
                                            ></div>
                                        </div>
                                        <span className={styles.progressPercentage}>
                                            {course.completionPercentage || 0}%
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                </ul>
                <Link to="/courses" className={styles.viewAllCourses}>View All Courses</Link>
            </div>
            
            {bookmarkedCourses.length > 0 && (
                <div className={styles.bookmarkedCourses}>
                    <h3>Bookmarked Courses</h3>
                    <ul className={styles.bookmarkList}>
                        {bookmarkedCourses.map((courseName, index) => (
                            <li key={index} className={styles.bookmarkItem}>
                                <Link to={`/course/${courseName}`}>{courseName}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Helper function to format the last accessed date
const formatLastAccessed = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
};

export default CourseProgressSummary; 