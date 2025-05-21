import { useParams, NavLink, useNavigate } from 'react-router-dom';
import styles from './LearningPage.module.css';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Header from '../../components/header/Header';
import { 
    FaArrowLeft, FaArrowRight, FaBookmark, FaRegBookmark, 
    FaShareAlt, FaClock, FaCheckCircle, FaLaptopCode, 
    FaLightbulb, FaCode, FaBrain, FaGraduationCap, FaBookOpen
} from 'react-icons/fa';
import React from 'react';
import CourseProgressManager from '../../utils/CourseProgressManager';
import AIChatAssistant from '../../components/AIChatAssistant/AIChatAssistant';
import MarkdownRenderer from '../../components/MarkdownRender/MarkdownRenderer';
import NotifyMeButton from '../../components/Notifications/NotifyMeButton';

// Utility function for fetching with retry
const fetchWithRetry = async (url, options, maxRetries = 3, retryDelay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            console.warn(`Attempt ${attempt} failed for ${url}:`, error.message);
            lastError = error;
            
            if (attempt < maxRetries) {
                const delay = retryDelay * attempt; // Progressive delay
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError; // If all retries fail, throw the last error
};

// This commented mock data is kept for reference but not used in production
/*
const mockCourseData = {
    Course_Name: "Python for Data Science",
    Course_Description: "A comprehensive course on using Python for data science, including data manipulation, analysis, and visualization.",
    Course_Field: "Tech",
    Course_Level: "Intermediate",
    learning_path: [
        {
            section: 1,
            topic_name: "Data Manipulation with Python",
            estimated_time_hours: 4,
            key_concepts: [
                "Setting up the Data Science Environment",
                "Python Review for Data Science",
                "NumPy Fundamentals",
                "Pandas for Data Analysis"
            ],
            practice: "Create a data analysis pipeline for cleaning and processing a dataset using NumPy and Pandas.",
            content: "Content removed" // Simplify mock content
        },
        {
            section: 2,
            topic_name: "Data Visualization with Python",
            estimated_time_hours: 3,
            key_concepts: [
                "Matplotlib Basics",
                "Seaborn for Statistical Visualization",
                "Interactive Visualizations with Plotly",
                "Dashboard Creation with Dash"
            ],
            practice: "Create an interactive dashboard visualizing a dataset with multiple chart types.",
            content: "Content removed" // Simplify mock content
        },
        {
            section: 3,
            topic_name: "Machine Learning Fundamentals",
            estimated_time_hours: 5,
            key_concepts: [
                "Supervised vs. Unsupervised Learning",
                "Classification and Regression",
                "Model Evaluation and Validation",
                "Introduction to Scikit-learn"
            ],
            practice: "Build and evaluate a simple classification model using Scikit-learn.",
            content: "Content removed" // Simplify mock content
        }
    ]
};
*/

const LearningPage = () => {
    const { courseName, sectionId = 1 } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSection, setCurrentSection] = useState(null);
    const [bookmarked, setBookmarked] = useState(false);
    const [progressData, setProgressData] = useState({
        completed: [],
        lastViewed: null
    });
    const [activeHeadings, setActiveHeadings] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [initialLoadProgress, setInitialLoadProgress] = useState(0);
    const progressIntervalRef = useRef(null);
    
    const contentRef = useRef(null);
    const navigate = useNavigate();
    
    // Auto-complete tracking
    const [timeSpentOnPage, setTimeSpentOnPage] = useState(0);
    const autoCompleteIntervalRef = useRef(null);
    
    // Define a constant for auto-complete threshold (in seconds)
    const AUTO_COMPLETE_THRESHOLD = 120; // 2 minutes
    
    // Determine if the current section is the first or last
    const isFirstSection = parseInt(sectionId) === 1;
    const isLastSection = course?.learning_path ? 
        parseInt(sectionId) === course.learning_path.length : 
        false;
    
    // Check if the current section is already marked as completed
    const isSectionCompleted = progressData.completed.includes(parseInt(sectionId));
    
    // Cleanup any intervals on unmount
    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            
            if (autoCompleteIntervalRef.current) {
                clearInterval(autoCompleteIntervalRef.current);
                autoCompleteIntervalRef.current = null;
            }
        };
    }, []);
    
    // Fetch the course data on component mount or when parameters change
    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch course progress from CourseProgressManager
                const progress = CourseProgressManager.getCourseProgress(courseName);
                if (progress) {
                    setProgressData(progress);
                    
                    // Check if the current section is bookmarked
                    const isBookmarked = CourseProgressManager.isBookmarked(courseName);
                    setBookmarked(isBookmarked);
                    
                    // Update last viewed section - store the result to ensure it worked
                    const updatedViewProgress = CourseProgressManager.updateLastViewed(courseName, parseInt(sectionId));
                    
                    // If the update failed, log an error but continue loading the course
                    if (!updatedViewProgress) {
                        console.error(`Failed to update last viewed section to ${sectionId}`);
                    }
                }
                
                // Reset active headings
                setActiveHeadings([]);
                
                console.log(`Fetching course data for ${courseName}`);
                
                try {
                    const response = await fetchWithRetry(
                        `http://localhost:3000/courses`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({})
                        }
                    );
                    
                    if (!response.ok) {
                        throw new Error(`Failed to fetch course data. Status: ${response.status}`);
                    }
                    
                    const allCourses = await response.json();
                    
                    // Add debugging to help diagnose course name matching issues
                    console.log(`Searching for course with URL parameter: "${courseName}"`);
                    console.log(`Available courses:`, allCourses.map(c => ({
                        name: c.Course_Name,
                        slug: c.Course_Name.toLowerCase().replace(/\s+/g, '-')
                    })));
                    
                    // Find our course by name with enhanced logging
                    const courseData = allCourses.find(c => {
                        const transformedName = c.Course_Name.toLowerCase().replace(/\s+/g, '-');
                        const isMatch = transformedName === courseName.toLowerCase();
                        console.log(`Comparing: "${transformedName}" with "${courseName.toLowerCase()}" - Match: ${isMatch}`);
                        return isMatch;
                    });
                    
                    if (!courseData) {
                        throw new Error(`Course "${courseName}" not found.`);
                    }
                    
                    console.log(`Found course: "${courseData.Course_Name}"`);
                    setCourse(courseData);
                    
                    // Find the current section
                    const section = courseData.learning_path.find(
                        s => s.section === parseInt(sectionId)
                    );
                    
                    if (!section) {
                        throw new Error(`Section ${sectionId} not found in course "${courseName}".`);
                    }
                    
                    setCurrentSection(section);
                    
                    // Fetch the content for this section
                    fetchSectionContent(section, courseData);
                } catch (fetchError) {
                    console.error("API fetch error:", fetchError);
                    
                    // Provide a proper error message instead of falling back to mock data
                    const errorMessage = `Unable to load the course "${courseName}". Please check your connection and try again.`;
                    console.warn(errorMessage);
                    setError(errorMessage);
                    
                    // Clear any loading states
                    setCurrentSection(null);
                    setCourse(null);
                } finally {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error:', err);
                setError(err.message);
                setLoading(false);
            }
        };
        
        fetchCourseData();
    }, [courseName, sectionId]);
    
    // Fetch section content with useCallback to prevent unnecessary recreations
    const fetchSectionContent = useCallback(async (section, courseData) => {
        try {
            // Set a section-specific loading state
            setCurrentSection(prev => {
                console.log("Setting section loading state:", { 
                    loading: true, 
                    isGeneratingNew: false,
                    section: section.section
                });
                return {
                    ...prev,
                    loading: true,
                    isGeneratingNew: false
                };
            });
            
            // First check if we already have this section content in the course data
            if (courseData && courseData.generated_content && courseData.generated_content.length > 0) {
                const existingContent = courseData.generated_content.find(
                    item => item.section === parseInt(section.section)
                );
                
                if (existingContent && existingContent.content) {
                    console.log(`Using existing content for section ${section.section}`);
                    
                    setCurrentSection({
                        ...section,
                        content: existingContent.content,
                        loading: false,
                        isGeneratingNew: false
                    });
                    
                    return;
                }
            }
            
            // If content not found in course data, fetch it from the API with retry
            console.log(`Fetching content for section ${section.section} from API - will show enhanced loading UI`);
            
            // Update state to indicate we're generating new content
            setCurrentSection(prev => {
                console.log("Setting isGeneratingNew to true");
                return {
                    ...prev,
                    loading: true,
                    isGeneratingNew: true,
                    topic_name: section.topic_name
                };
            });
            
            // Clear any existing interval
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            
            // Start simulated progress for visual feedback
            setInitialLoadProgress(0);
            progressIntervalRef.current = setInterval(() => {
                setInitialLoadProgress(prev => {
                    // Simulate progress up to 95% (real completion will hit 100%)
                    const newProgress = prev + (Math.random() * 1.5);
                    return newProgress > 95 ? 95 : newProgress;
                });
            }, 3000); // Update every 3 seconds
            
            // Prepare topic data by combining course and section information
            const topicData = {
                ...section,
                Course_Name: courseData.Course_Name,
                Course_Field: courseData.Course_Field,
                Course_Description: courseData.Course_Description,
                Target_Audience: courseData.Target_Audience,
                Course_Level: courseData.Course_Level,
                Prerequisites: courseData.Prerequisites
            };
            
            // Simulate a delay to ensure loading state is visible (TEMPORARY - REMOVE IN PRODUCTION)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const response = await fetchWithRetry(
                'http://localhost:3000/topic',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        topicdata: topicData
                    })
                }
            );
            
            if (response.status === 404) {
                throw new Error(`Content for section ${section.section} not found`);
            }
            
            if (!response.ok) {
                throw new Error(`Failed to fetch content for section ${section.section} (Status: ${response.status})`);
            }
            
            // Check content type to decide how to parse the response
            const contentType = response.headers.get('Content-Type');
            let contentText;
            
            if (contentType && contentType.includes('application/json')) {
                const jsonData = await response.json();
                contentText = jsonData.content || '';
                
                // Log for debugging if needed
                console.log(`Received JSON content from API. Content starts with: ${contentText.substring(0, 30)}...`);
            } else {
                contentText = await response.text();
                console.log(`Received text content from API. Content type: ${contentType}`);
            }
            
            // Final update when complete
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            setInitialLoadProgress(100);
            console.log("Setting final section state with content loaded");
            
            setCurrentSection({
                ...section,
                content: contentText,
                loading: false,
                isGeneratingNew: false
            });
            
        } catch (err) {
            // Clear interval on error
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            console.error('Error fetching section content:', err);
            setError(`Failed to load content for "${section.topic_name}": ${err.message}`);
            setCurrentSection({
                ...section,
                error: err.message,
                loading: false,
                isGeneratingNew: false
            });
        }
    }, []);
    
    // Reset active headings (formerly extracted from markdown)
    const resetHeadings = useCallback(() => {
        // Clear all active headings
        setActiveHeadings([]);
    }, []);
    
    // Mark section as completed - updated to use our manager
    const markSectionCompleted = () => {
        const currentSectionId = parseInt(sectionId);
        
        // Use our progress manager to mark section as completed
        if (!progressData.completed.includes(currentSectionId)) {
            const updatedProgress = CourseProgressManager.markSectionCompleted(courseName, currentSectionId);
            
            // If the update was successful (not null)
            if (updatedProgress) {
                setProgressData(updatedProgress);
                // Optional: show a success notification to the user
                console.log(`Section ${currentSectionId} marked as completed!`);
            } else {
                console.error(`Failed to mark section ${currentSectionId} as completed`);
            }
        } else {
            console.log(`Section ${currentSectionId} already marked as completed`);
        }
    };
    
    // Toggle bookmark
    const toggleBookmark = () => {
        const newBookmarked = !bookmarked;
        setBookmarked(newBookmarked);
        
        // Use our progress manager to toggle bookmark
        CourseProgressManager.toggleBookmark(courseName);
    };
    
    // Share course section
    const shareCourse = () => {
        // Create shareable URL
        const shareUrl = window.location.href;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Link copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy link:', err);
            alert('Error copying link to clipboard. Please copy the URL manually.');
        });
    };
    
    // Navigation handlers
    const goToPreviousSection = () => {
        if (isFirstSection) {
            // If we're on the first section, go back to the course details
            navigate(`/course/${courseName}`);
        } else {
            // Otherwise go to the previous section
            navigate(`/course/${courseName}/section/${parseInt(sectionId) - 1}`);
        }
    };
    
    const goToNextSection = () => {
        if (!isLastSection) {
            navigate(`/course/${courseName}/section/${parseInt(sectionId) + 1}`);
        }
    };
    
    // Scroll to heading
    const scrollToHeading = (headingId) => {
        if (!headingId) return;
        
        const element = document.getElementById(headingId);
        if (element) {
            // Use scrollIntoView with smooth behavior
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Add a small delay before focusing to ensure scroll completes
            setTimeout(() => {
                element.focus();
                // Add a temporary highlight class
                element.classList.add(styles.highlightedHeading);
                // Remove the highlight after a delay
                setTimeout(() => {
                    element.classList.remove(styles.highlightedHeading);
                }, 2000);
            }, 500);
        }
    };
    
    // Handle AI chat message sent
    const handleChatMessage = useCallback((message, contextTopic, conversationHistory = []) => {
        console.log(`Sending message to AI about "${contextTopic}":`, message);
        if (conversationHistory.length > 0) {
            console.log(`Including ${conversationHistory.length} previous messages for context`);
        }
        
        // Return a promise for proper async handling
        return new Promise(async (resolve, reject) => {
            try {
                // Show more detailed logging
                console.log(`Chat request for course: ${courseName}, section: ${sectionId}`);
                
                // Make API call to backend chat endpoint
                const response = await fetchWithRetry(
                    'http://localhost:3000/chat',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: message,
                            context: contextTopic,
                            course: courseName,
                            section: sectionId,
                            conversationHistory: conversationHistory
                        })
                    },
                    3,  // max retries
                    1000 // retry delay
                );
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Check if response field exists in data
                if (data && data.response) {
                    resolve(data.response);
                } else {
                    console.warn('Response from chat API did not contain expected data format:', data);
                    resolve("I'm having trouble processing your request right now. Please try again later.");
                }
            } catch (error) {
                console.error('Chat API error:', error);
                // Return a user-friendly error message
                resolve("I'm sorry, I encountered an error while processing your question. Please try again or refresh the page if the problem persists.");
                // Also reject so the component can handle error state if needed
                reject(error);
            }
        });
    }, [courseName, sectionId]);

    // Setup auto-complete tracking on component mount
    useEffect(() => {
        // Only start tracking if the section isn't already completed
        if (!isSectionCompleted && currentSection && !currentSection.loading) {
            console.log(`Starting auto-complete tracking for section ${sectionId}`);
            
            // Clear any existing interval
            if (autoCompleteIntervalRef.current) {
                clearInterval(autoCompleteIntervalRef.current);
                autoCompleteIntervalRef.current = null;
            }
            
            // Start a new interval to track time spent on page
            setTimeSpentOnPage(0);
            autoCompleteIntervalRef.current = setInterval(() => {
                setTimeSpentOnPage(prev => {
                    const newTime = prev + 1;
                    
                    // If threshold reached, mark as completed and clear interval
                    if (newTime >= AUTO_COMPLETE_THRESHOLD) {
                        console.log(`Auto-complete threshold reached (${AUTO_COMPLETE_THRESHOLD}s) for section ${sectionId}`);
                        markSectionCompleted();
                        clearInterval(autoCompleteIntervalRef.current);
                        autoCompleteIntervalRef.current = null;
                    }
                    
                    return newTime;
                });
            }, 1000); // Check every second
        }
        
        // Cleanup interval on unmount
        return () => {
            if (autoCompleteIntervalRef.current) {
                clearInterval(autoCompleteIntervalRef.current);
                autoCompleteIntervalRef.current = null;
            }
        };
    }, [sectionId, isSectionCompleted, currentSection]);

    if (loading) {
        return (
            <>
                <Header />
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading course structure...</p>
                    <small className={styles.loadingNote}>Preparing your learning path</small>
                </div>
            </>
        );
    }
    
    if (error) {
        return (
            <>
                <Header />
                <div className={styles.errorContainer}>
                    <h2>Error</h2>
                    <p>{error}</p>
                    <NavLink to={`/course/${courseName}`} className={styles.backButton}>
                        <FaArrowLeft /> Back to Course Details
                    </NavLink>
                </div>
            </>
        );
    }
    
    return (
        <>
            <div className={styles.MainContainer}>
                <Header />
                
                <div className={styles.courseHeader}>
                    <NavLink to={`/course/${courseName}`} className={styles.backLink}>
                        <FaArrowLeft /> Back to Course
                    </NavLink>
                    <h1 className={styles.courseName}>{course?.Course_Name}</h1>
                    <div className={styles.courseActions}>
                        <button 
                            className={`${styles.actionButton} ${bookmarked ? styles.bookmarked : ''}`} 
                            onClick={toggleBookmark}
                            title={bookmarked ? "Remove bookmark" : "Bookmark this section"}
                            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this section"}
                        >
                            {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
                        </button>
                        <button 
                            className={styles.actionButton}
                            onClick={shareCourse}
                            title="Share this section"
                            aria-label="Share this section"
                        >
                            <FaShareAlt />
                        </button>
                    </div>
                </div>
                
                {course && (
                    <div className={styles.courseProgress}>
                        <div className={styles.progressBarContainer}>
                            <div 
                                className={styles.progressBarFill} 
                                style={{ 
                                    width: `${Math.round((progressData.completed.length / course.learning_path.length) * 100)}%` 
                                }}
                            ></div>
                        </div>
                        <span className={styles.progressText}>
                            {progressData.completed.length} of {course.learning_path.length} sections completed
                        </span>
                    </div>
                )}
                
                <div className={styles.ContentContainer}>
                    <div className={styles.Sidebar}>
                        <div className={styles.SidebarHeader}>
                            <h3>Course Outline</h3>
                        </div>
                        <div className={styles.SidebarContent}>
                            <ul>
                                {course?.learning_path?.map((section, index) => {
                                    const isActive = parseInt(sectionId) === section.section;
                                    const isCompleted = progressData.completed.includes(section.section);
                                    
                                    return (
                                        <li key={section.section} className={isActive ? styles.activeSectionLink : ''}>
                                            <NavLink 
                                                to={`/course/${courseName}/section/${section.section}`}
                                                className={isCompleted ? styles.completedSection : ''}
                                            >
                                                <span className={styles.sectionNumber}>
                                                    {isCompleted ? <FaCheckCircle className={styles.completedIcon} /> : section.section}
                                                </span>
                                                <div className={styles.sectionLinkContent}>
                                                    <span className={styles.sectionTitle}>{section.topic_name}</span>
                                                    <span className={styles.sectionDuration}>
                                                        <FaClock className={styles.durationIcon} /> {section.estimated_time_hours} hours
                                                    </span>
                                                </div>
                                    </NavLink>
                                </li>
                                    );
                                })}
                            </ul>
                            {!course?.learning_path?.length && (
                                <div className={styles.noContent}>
                                    <p>No sections found for this course</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className={styles.Content} ref={contentRef}>
                        <div className={styles.sectionHeader}>
                            <h1>{currentSection?.topic_name}</h1>
                            <div className={styles.sectionMeta}>
                                <span className={styles.sectionDuration}>
                                    <FaClock /> Estimated time: {currentSection?.estimated_time_hours} hours
                                </span>
                                {isSectionCompleted && (
                                    <span className={styles.completedBadge}>
                                        <FaCheckCircle /> Completed
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className={styles.sectionContent}>
                            {currentSection?.loading ? (
                                <div className={`${styles.sectionLoading} ${currentSection?.isGeneratingNew ? styles.generationInProgress : ''}`}>
                                    {currentSection?.isGeneratingNew ? (
                                        <>
                                            <div className={styles.loadingAnimation}>
                                                <div className={styles.spinnerLarge}></div>
                                                <div className={styles.pulsingDot}></div>
                                            </div>
                                            <h3 className={styles.generatingTitle}>Creating Your Learning Experience</h3>
                                            <p className={styles.generatingDescription}>
                                                Our AI is crafting personalized content for <strong>{currentSection?.topic_name}</strong>
                                            </p>
                                            <div className={styles.generationSteps}>
                                                <div className={styles.step}>
                                                    <span className={styles.stepIcon}><FaLightbulb /></span>
                                                    <span>Analyzing topic requirements</span>
                                                </div>
                                                <div className={styles.step}>
                                                    <span className={styles.stepIcon}><FaCode /></span>
                                                    <span>Creating examples and diagrams</span>
                                                </div>
                                                <div className={styles.step}>
                                                    <span className={styles.stepIcon}><FaBrain /></span>
                                                    <span>Tailoring content to your skill level</span>
                                                </div>
                                            </div>
                                            
                                            {/* Add progress bar */}
                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressBar}>
                                                    <div 
                                                        className={styles.progressFill}
                                                        style={{ width: `${initialLoadProgress}%` }}
                                                    />
                                                </div>
                                                <div className={styles.progressText}>
                                                    {Math.round(initialLoadProgress)}% - Generating content...
                                                </div>
                                            </div>
                                            
                                            <div className={styles.generationTimeWrapper}>
                                                <p className={styles.generationTime}>
                                                    <FaClock className={styles.clockIcon} /> 
                                                    First-time content generation may take up to 5 minutes
                                                </p>
                                                <p className={styles.generationNote}>
                                                    Once created, sections load instantly on future visits
                                                </p>
                                                
                                                {/* Add Notify Me button */}
                                                <NotifyMeButton 
                                                    courseName={courseName}
                                                    sectionId={sectionId}
                                                    topicName={currentSection?.topic_name}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.spinner}></div>
                                            <p>Loading section content...</p>
                                        </>
                                    )}
                                </div>
                            ) : currentSection?.error ? (
                                <div className={styles.sectionError}>
                                    <p>Error loading content: {currentSection.error}</p>
                                    <button 
                                        className={styles.retryButton}
                                        onClick={() => fetchSectionContent(currentSection, course)}
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : currentSection?.content ? (
                                <div className={styles.contentWrapper}>
                                    <div className={styles.contentPlaceholder}>
                                        {/* Enhanced markdown renderer with improved options */}
                                        <div style={{ 
                                            paddingRight: '25px', 
                                            boxSizing: 'border-box',
                                            overflow: 'hidden',
                                            width: '100%',
                                            backgroundColor: 'transparent' /* Ensure parent container is transparent */
                                        }}>
                                            {/* MarkdownRenderer with transparent background that inherits theming from parent */}
                                            <MarkdownRenderer 
                                                markdown={currentSection.content} 
                                                className={styles.contentMarkdown}
                                                tocHeading="Contents"
                                                allowHtml={false}
                                                optimizeForPrint={true}
                                                skipFirstHeading={true}
                                                // Syntax highlighter theme will be automatically selected based on system preference
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.noContent}>
                                    <p>No content available for this section.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.sectionNavigation}>
                            <button 
                                className={`${styles.navButton} ${isFirstSection ? styles.disabledButton : ''}`}
                                onClick={goToPreviousSection}
                                disabled={false} // Never fully disable to allow going back to course details
                            >
                                <FaArrowLeft className={styles.navIcon} /> 
                                {isFirstSection ? 'Back to Course' : 'Previous Section'}
                            </button>
                            
                            {!isLastSection ? (
                                <button 
                                    className={`${styles.navButton} ${styles.nextButton}`}
                                    onClick={() => {
                                        // Mark current section as completed when moving to the next one
                                        if (!isSectionCompleted) {
                                            markSectionCompleted();
                                        }
                                        goToNextSection();
                                    }}
                                >
                                    Next Section <FaArrowRight className={styles.navIcon} />
                                </button>
                            ) : (
                                <button 
                                    className={`${styles.navButton} ${styles.completeButton} ${isSectionCompleted ? styles.disabledButton : ''}`}
                                    onClick={markSectionCompleted}
                                    disabled={isSectionCompleted}
                                >
                                    {isSectionCompleted ? 'Course Completed' : 'Complete Course'} 
                                    <FaCheckCircle className={styles.navIcon} />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className={styles.JumpToTopic}>
                        <h3>Key Concepts</h3>
                        <div className={styles.keyConceptsBox}>
                            <h3 className={styles.keyConceptsTitle}>
                                <FaLightbulb className={styles.conceptIcon} /> Key Concepts
                            </h3>
                            <ul className={styles.keyConceptsList}>
                                {currentSection?.key_concepts && currentSection.key_concepts.length > 0 ? (
                                    currentSection.key_concepts.map((concept, idx) => (
                                        <li key={idx}>
                                            <FaGraduationCap className={styles.listIcon} />
                                            {concept}
                            </li>
                                    ))
                                ) : (
                                    <li className={styles.noContent}>
                                        <FaBookOpen className={styles.listIcon} />
                                        No key concepts listed for this section
                            </li>
                                )}
                        </ul>
                        </div>
                    </div>
                </div>

                {/* AI Chat Assistant */}
                <AIChatAssistant 
                    contextTopic={currentSection?.topic_name}
                    isOpen={isChatOpen}
                    onToggleChat={setIsChatOpen}
                    onSendMessage={handleChatMessage}
                    suggestedQuestions={[
                        `Explain the key concepts in ${currentSection?.topic_name || 'this section'}`,
                        `What are practical applications of ${currentSection?.topic_name || 'this topic'}?`,
                        `Help me understand ${currentSection?.key_concepts?.[0] || 'the first concept'} better`,
                        "How can I practice what I've learned?",
                        "What should I focus on most in this section?"
                    ]}
                    welcomeMessage={`Hi there! I'm your AI learning assistant for "${currentSection?.topic_name || courseName}". How can I help you understand this topic better?`}
                    chatId={`course-${courseName}-section-${sectionId}`}
                    historyLength={6}
                />
            </div>
        </>
    );
};

export default LearningPage;