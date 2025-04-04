import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './BookmarksPage.module.css';
import Header from '../../components/header/Header';
import CourseProgressManager from '../../utils/CourseProgressManager';
import { FaBookmark, FaGraduationCap, FaClock, FaArrowRight, FaSearch, FaSadTear } from 'react-icons/fa';

const BookmarksPage = () => {
    const [bookmarkedCourses, setBookmarkedCourses] = useState([]);
    const [coursesData, setCoursesData] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBookmarkedCourses = async () => {
            try {
                // Get all bookmarked courses
                const bookmarks = CourseProgressManager.getAllBookmarks();
                const bookmarkedCourseNames = Object.keys(bookmarks).filter(name => bookmarks[name]);
                setBookmarkedCourses(bookmarkedCourseNames);

                // Fetch data for each bookmarked course
                const coursesInfo = {};
                
                for (const courseName of bookmarkedCourseNames) {
                    try {
                        // Try to fetch course data from the API
                        const response = await fetch(`http://localhost:3000/generate`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                Course_Name: courseName
                            })
                        });
                        
                        if (response.ok) {
                            const courseData = await response.json();
                            coursesInfo[courseName] = courseData;
                        }
                    } catch (error) {
                        console.error(`Error fetching data for ${courseName}:`, error);
                        // Create minimal course data for display
                        coursesInfo[courseName] = {
                            Course_Name: courseName,
                            Course_Description: "Course details unavailable",
                            Course_Field: "Unknown",
                            Course_Level: "Unknown"
                        };
                    }
                }
                
                setCoursesData(coursesInfo);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching bookmarked courses:', error);
                setLoading(false);
            }
        };

        fetchBookmarkedCourses();
    }, []);

    // Get course progress information
    const getCourseProgress = (courseName) => {
        if (!courseName) return { percentage: 0 };
        
        const progress = CourseProgressManager.getCourseProgress(courseName);
        const courseData = coursesData[courseName];
        
        if (!courseData || !courseData.learning_path) {
            return { percentage: 0 };
        }
        
        return CourseProgressManager.getProgressStatus(
            courseName, 
            courseData.learning_path
        );
    };

    // Remove bookmark
    const removeBookmark = (courseName, e) => {
        e.preventDefault(); // Prevent navigation to course
        e.stopPropagation(); // Prevent event bubbling
        
        CourseProgressManager.toggleBookmark(courseName);
        
        // Update state to remove the course
        setBookmarkedCourses(prev => prev.filter(name => name !== courseName));
    };

    // Filter courses based on search term
    const filteredCourses = bookmarkedCourses.filter(courseName => 
        courseName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Header />
            <div className={styles.bookmarksContainer}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <FaBookmark className={styles.titleIcon} />
                        My Bookmarked Courses
                    </h1>
                    <p className={styles.pageDescription}>
                        Access your saved courses for quick reference and continued learning.
                    </p>
                    
                    <div className={styles.searchContainer}>
                        <div className={styles.searchInputWrapper}>
                            <FaSearch className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search your bookmarks..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading your bookmarked courses...</p>
                    </div>
                ) : bookmarkedCourses.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaSadTear className={styles.emptyIcon} />
                        <h2>No Bookmarked Courses</h2>
                        <p>You haven't bookmarked any courses yet. Explore our courses and bookmark your favorites!</p>
                        <Link to="/courses" className={styles.exploreCourses}>
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className={styles.bookmarkCount}>
                            {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} bookmarked
                        </div>
                        
                        <div className={styles.courseGrid}>
                            {filteredCourses.map(courseName => {
                                const courseData = coursesData[courseName] || {};
                                const progress = getCourseProgress(courseName);
                                
                                return (
                                    <Link 
                                        to={`/course/${courseName}`} 
                                        className={styles.courseCard} 
                                        key={courseName}
                                    >
                                        <div className={styles.courseHeader}>
                                            <div className={styles.courseField}>
                                                <FaGraduationCap />
                                                <span>{courseData.Course_Field || 'Category'}</span>
                                            </div>
                                            <button 
                                                className={styles.removeBookmark}
                                                onClick={(e) => removeBookmark(courseName, e)}
                                                aria-label="Remove bookmark"
                                                title="Remove bookmark"
                                            >
                                                <FaBookmark />
                                            </button>
                                        </div>
                                        
                                        <h3 className={styles.courseTitle}>{courseName}</h3>
                                        
                                        <p className={styles.courseDescription}>
                                            {courseData.Course_Description?.substring(0, 120)}
                                            {courseData.Course_Description?.length > 120 ? '...' : ''}
                                        </p>
                                        
                                        {progress.percentage > 0 && (
                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressBarOuter}>
                                                    <div 
                                                        className={styles.progressBarInner} 
                                                        style={{ width: `${progress.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className={styles.progressText}>
                                                    {progress.percentage}% Complete
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className={styles.courseFooter}>
                                            <span className={styles.courseLevel}>
                                                {courseData.Course_Level || 'All Levels'}
                                            </span>
                                            
                                            <div className={styles.continueButtonWrapper}>
                                                <span className={styles.continueButton}>
                                                    {progress.lastViewed ? 'Continue Learning' : 'Start Course'}
                                                    <FaArrowRight className={styles.arrowIcon} />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default BookmarksPage; 