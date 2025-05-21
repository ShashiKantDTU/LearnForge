import React, { useState, useEffect } from 'react';
import { useParams, Link, NavLink } from 'react-router-dom';
import Header from '../../components/header/Header';
import styles from './CourseDetails.module.css';
import { 
    FaArrowLeft, FaGraduationCap, FaUserGraduate, FaLaptopCode, 
    FaPalette, FaBriefcase, FaChartLine, FaClock, FaCheckCircle, 
    FaChevronDown, FaChevronUp, FaBookOpen, FaCode, FaLightbulb,
    FaRocket, FaMedal, FaArrowRight, FaChartBar, FaCertificate,
    FaRegCalendarAlt, FaUsers, FaShareAlt, FaRegBookmark, FaBookmark,
    FaTrophy, FaChalkboardTeacher, FaBrain, FaStar, FaTrash
} from 'react-icons/fa';
import CourseProgressManager from '../../utils/CourseProgressManager';

// Map icon names to their components
const iconComponents = {
    FaCode,
    FaLaptopCode,
    FaBrain,
    FaLightbulb,
    FaTrophy,
    FaGraduationCap,
    FaChartLine,
    FaCertificate,
    FaUsers,
    FaRocket,
    FaBookOpen,
    FaMedal,
    FaChartBar,
    FaStar,
    FaUserGraduate
};

const CourseDetails = () => {
    const { courseName } = useParams();
    const [course, setCourse] = useState(null);
    const [benefits, setBenefits] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [bookmarked, setBookmarked] = useState(false);
    const [courseProgress, setCourseProgress] = useState({
        percentage: 0,
        completedModules: 0,
        totalModules: 0,
        estimatedCompletionDays: 0,
        sectionsCompleted: []
    });

    useEffect(() => {
        // This is where the user will implement their API fetching logic
        // Sample implementation:
        const fetchCourseData = async () => {
            try {
                setLoading(true);
                
                const CourseDataResponse = await fetch(`http://localhost:3000/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        Course_Name: courseName
                    })
                });

                const courseData = await CourseDataResponse.json();
                setCourse(courseData);
                console.log(courseData);
                
                // Load course progress using our manager
                const progressStatus = CourseProgressManager.getProgressStatus(
                    courseName, 
                    courseData.learning_path
                );
                
                // Check if progress status is valid before setting
                if (progressStatus) {
                    setCourseProgress(progressStatus);
                } else {
                    console.error('Failed to get course progress status');
                    // Set default progress to avoid UI errors
                    setCourseProgress({
                        percentage: 0,
                        completedModules: 0,
                        totalModules: courseData.learning_path ? courseData.learning_path.length : 0,
                        estimatedCompletionDays: 0,
                        sectionsCompleted: []
                    });
                }
                
                // Load bookmark state
                setBookmarked(CourseProgressManager.isBookmarked(courseName));
                
                if(courseData.benefits && courseData.benefits.length > 0){
                    setBenefits(courseData.benefits);
                }else{
                    const benefitsResponse = await fetch(`http://localhost:3000/benefits`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            Course_Name: courseName
                        })
                    });
                    const benefitsData = await benefitsResponse.json();
                    setBenefits(benefitsData);
                }

                setLoading(false);
            } catch (err) {
                setError('Failed to load course details. Please try again later.');
                setLoading(false);
            }
        };

        fetchCourseData();
        
        // Initialize first section as expanded
        setExpandedSections({ 1: true });
    }, [courseName]);

    // Toggle section expansion
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Get appropriate icon based on course field
    const getFieldIcon = (field) => {
        switch(field) {
            case 'Tech':
                return <FaLaptopCode />;
            case 'Business':
                return <FaBriefcase />;
            case 'Design':
                return <FaPalette />;
            case 'Non-Tech':
                return <FaChartLine />;
            default:
                return <FaGraduationCap />;
        }
    };

    // Calculate total course hours
    const getTotalHours = (learningPath) => {
        if (!learningPath) return 0;
        return learningPath.reduce((total, section) => 
            total + (section.estimated_time_hours || 0), 0);
    };

    // Check if a section is expanded
    const isTopicExpanded = (sectionId) => {
        return expandedSections[sectionId] || false;
    };

    // Toggle bookmark state with our manager
    const toggleBookmark = () => {
        const newBookmarkedState = CourseProgressManager.toggleBookmark(courseName);
        setBookmarked(newBookmarkedState);
    };

    // Share functionality
    const shareCourse = () => {
        // In a real implementation, this would open a share dialog
        navigator.clipboard.writeText(window.location.href);
        alert('Course link copied to clipboard!');
    };

    // Get section progress
    const getSectionProgress = (sectionId) => {
        // Call getSectionProgress with both courseName and sectionId
        return CourseProgressManager.getSectionProgress(courseName, sectionId);
    };

    // Check if section is completed
    const isSectionCompleted = (sectionId) => {
        // Call isSectionCompleted with both courseName and sectionId
        return CourseProgressManager.isSectionCompleted(courseName, sectionId);
    };

    // Reset course progress (for testing/debugging)
    const resetCourseProgress = () => {
        const confirmReset = window.confirm(
            'Are you sure you want to reset your progress for this course? This action cannot be undone.'
        );
        
        if (confirmReset) {
            const success = CourseProgressManager.clearCourseProgress(courseName);
            if (success) {
                // Reset local state to reflect changes
                setCourseProgress({
                    percentage: 0,
                    completedModules: 0,
                    totalModules: course?.learning_path?.length || 0,
                    estimatedCompletionDays: 0,
                    sectionsCompleted: []
                });
                alert('Course progress has been reset successfully!');
            } else {
                alert('Failed to reset course progress. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className={styles.courseDetailsContainer}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading course details...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className={styles.courseDetailsContainer}>
                    <div className={styles.errorContainer}>
                        <h2>Error Loading Course</h2>
                        <p>{error}</p>
                        <Link to="/courses" className={styles.backButton}>
                            <FaArrowLeft /> Back to Courses
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className={styles.courseDetailsContainer}>
                <div className={styles.courseNavigation}>
                    <Link to="/courses" className={styles.backLink}>
                        <FaArrowLeft /> Back to Courses
                    </Link>
                    <div className={styles.courseActions}>
                        <button 
                            className={`${styles.actionButton} ${bookmarked ? styles.bookmarked : ''}`} 
                            onClick={toggleBookmark}
                            title={bookmarked ? "Remove bookmark" : "Bookmark this course"}
                        >
                            {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
                        </button>
                        <button 
                            className={styles.actionButton}
                            onClick={shareCourse}
                            title="Share course"
                            aria-label="Share course"
                        >
                            <FaShareAlt />
                        </button>
                    </div>
                    
                    {/* Only show the reset button in development mode */}
                    {process.env.NODE_ENV === 'development' && (
                        <button 
                            className={`${styles.resetProgressButton}`} 
                            onClick={resetCourseProgress}
                            title="Reset course progress (Development only)"
                        >
                            <FaTrash /> Reset Progress
                        </button>
                    )}
                </div>

                {course && (
                    <>
                        {courseProgress.percentage > 0 && (
                            <div className={styles.progressContainer}>
                                <div className={styles.progressInfo}>
                                    <h3>Your Progress</h3>
                                    <span>{courseProgress.percentage}% Complete</span>
                                </div>
                                <div className={styles.progressBarOuter}>
                                    <div 
                                        className={styles.progressBarInner} 
                                        style={{ width: `${courseProgress.percentage}%` }}
                                    ></div>
                                </div>
                                <div className={styles.progressStat}>
                                    <span className={styles.completedModules}>
                                        <FaCheckCircle /> {courseProgress.completedModules} of {courseProgress.totalModules} modules completed
                                    </span>
                                    <span className={styles.estimatedCompletion}>
                                        <FaClock /> {courseProgress.estimatedCompletionDays > 0 
                                            ? `Estimated completion: ${courseProgress.estimatedCompletionDays} days` 
                                            : 'Course completed!'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className={styles.courseHero}>
                            <div className={styles.courseHeader}>
                                <div className={styles.courseField}>
                                    {getFieldIcon(course.Course_Field)}
                                    <span>{course.Course_Field}</span>
                                </div>
                                <div className={styles.courseLevel}>
                                    <FaGraduationCap />
                                    <span>{course.Course_Level}</span>
                                </div>
                            </div>
                            <h1 className={styles.courseTitle}>{course.Course_Name}</h1>
                            <p className={styles.courseDescription}>{course.Course_Description}</p>
                            
                            <div className={styles.courseStats}>
                                <div className={styles.statItem}>
                                    <FaUserGraduate className={styles.statIcon} />
                                    <div className={styles.statContent}>
                                        <span className={styles.statLabel}>Target Audience</span>
                                        <span className={styles.statValue}>{course.Target_Audience}</span>
                                    </div>
                                </div>
                                <div className={styles.statItem}>
                                    <FaClock className={styles.statIcon} />
                                    <div className={styles.statContent}>
                                        <span className={styles.statLabel}>Estimated Duration</span>
                                        <span className={styles.statValue}>{getTotalHours(course.learning_path)} hours</span>
                                    </div>
                                </div>
                                <div className={styles.statItem}>
                                    <FaBookOpen className={styles.statIcon} />
                                    <div className={styles.statContent}>
                                        <span className={styles.statLabel}>Modules</span>
                                        <span className={styles.statValue}>{course.learning_path?.length || 0} sections</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.courseBenefits}>
                                <h3 className={styles.benefitsTitle}>
                                    <FaCertificate className={styles.benefitIcon} />
                                    What You'll Gain
                                </h3>
                                <div className={styles.benefitsList}>
                                    {benefits && benefits.map((benefit, index) => {
                                        // Get the icon component by name
                                        const IconComponent = iconComponents[benefit.icon] || FaCertificate;
                                        return (
                                            <div key={index} className={styles.benefitItem}>
                                                <span className={styles.benefitItemIcon}><IconComponent /></span>
                                                <span>{benefit.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {course.Prerequisites && course.Prerequisites.length > 0 && (
                            <div className={styles.prerequisites}>
                                <h2 className={styles.sectionTitle}>
                                    <FaMedal style={{ marginRight: '8px', fontSize: '1.2rem' }} />
                                    Prerequisites
                                </h2>
                                <ul className={styles.prerequisitesList}>
                                    {course.Prerequisites.map((prerequisite, idx) => (
                                        <li key={idx} className={styles.prerequisiteItem}>
                                            <FaCheckCircle className={styles.checkIcon} />
                                            <span>{prerequisite}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className={styles.learningPath}>
                            <h2 className={styles.sectionTitle}>
                                <FaRocket style={{ marginRight: '8px', fontSize: '1.2rem' }} />
                                Learning Path
                            </h2>
                            
                            <div className={styles.timeline}>
                                {course.learning_path && course.learning_path.map((section, idx) => {
                                    // Get section progress from our tracking system
                                    const sectionProgress = getSectionProgress(section.section);
                                    const isCompleted = isSectionCompleted(section.section);
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`${styles.timelineItem} ${isTopicExpanded(section.section) ? styles.expanded : ''} ${isCompleted ? styles.completed : ''}`}
                                        >
                                            <div className={styles.timelineHeader} onClick={() => toggleSection(section.section)}>
                                                <div className={styles.sectionNumber}>
                                                    {isCompleted ? 
                                                        <FaCheckCircle className={styles.completedIcon} /> : 
                                                        section.section
                                                    }
                                                </div>
                                                <div className={styles.sectionContent}>
                                                    <h3 className={styles.sectionTitle}>
                                                        {section.topic_name}
                                                    </h3>
                                                    <div className={styles.sectionMeta}>
                                                        <span className={styles.timeEstimate}>
                                                            <FaClock /> {section.estimated_time_hours} hours
                                                        </span>
                                                        {sectionProgress > 0 && sectionProgress < 100 && (
                                                            <div className={styles.moduleProgress}>
                                                                <div className={styles.moduleProgressBar}>
                                                                    <div 
                                                                        className={styles.moduleProgressFill}
                                                                        style={{width: `${sectionProgress}%`}}
                                                                    ></div>
                                                                </div>
                                                                <span>{sectionProgress}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button className={styles.expandButton} aria-label={isTopicExpanded(section.section) ? "Collapse section" : "Expand section"}>
                                                    {isTopicExpanded(section.section) ? <FaChevronUp /> : <FaChevronDown />}
                                                </button>
                                            </div>
                                            
                                            {isTopicExpanded(section.section) && (
                                                <div className={styles.timelineDetails}>
                                                    <div className={styles.keyConcepts}>
                                                        <h4 className={styles.detailTitle}>
                                                            <FaLightbulb className={styles.detailIcon} /> 
                                                            Key Concepts
                                                        </h4>
                                                        <ul className={styles.conceptsList}>
                                                            {section.key_concepts.map((concept, conceptIdx) => (
                                                                <li key={conceptIdx}>{concept}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    
                                                    {section.practice && (
                                                        <div className={styles.practiceSection}>
                                                            <h4 className={styles.detailTitle}>
                                                                <FaCode className={styles.detailIcon} /> 
                                                                Hands-on Practice
                                                            </h4>
                                                            <p>{section.practice}</p>
                                                        </div>
                                                    )}

                                                    {isCompleted ? (
                                                        <div className={styles.sectionCompleted}>
                                                            <FaCheckCircle /> You've completed this section!
                                                        </div>
                                                    ) : (
                                                        <NavLink to={`/course/${courseName}/section/${section.section}`} className={styles.continueButton}>
                                                            {courseProgress.lastViewed === section.section ? 'Continue Learning' : 'Start Learning'}
                                                            <FaArrowRight className={styles.continueIcon} />
                                                        </NavLink>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.callToAction}>
                            <div className={styles.ctaBadge}>Free Course</div>
                            <h3>Ready to Expand Your Skills?</h3>
                            <p>Begin your learning journey with this comprehensive course today - completely free! Join thousands of learners who are transforming their careers.</p>
                            {courseProgress.lastViewed ? (
                                <NavLink to={`/course/${courseName}/section/${courseProgress.lastViewed}`} className={styles.enrollButton}>
                                    <span>Continue Your Learning Journey</span>
                                    <FaArrowRight className={styles.buttonIcon} />
                                    <span className={styles.buttonAccent}>✨</span>
                                </NavLink>
                            ) : (
                                <NavLink to={`/course/${courseName}/section/1`} className={styles.enrollButton}>
                                    <span>Begin Your Learning Journey</span>
                                    <FaArrowRight className={styles.buttonIcon} />
                                    <span className={styles.buttonAccent}>✨</span>
                                </NavLink>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default CourseDetails;