import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Courses.module.css';
import Header from '../../components/header/Header';
import { FaSearch, FaBook, FaChevronRight, FaClock, FaFilter, FaSpinner, 
         FaLaptopCode, FaBriefcase, FaPalette, FaChartLine, FaGraduationCap,
         FaUserGraduate, FaListAlt, FaCheckCircle, FaArrowRight, FaLayerGroup,
         FaRegLightbulb, FaLightbulb, FaThLarge, FaTimes } from 'react-icons/fa';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [search, setSearch] = useState('');
    const [field, setField] = useState('');
    const [level, setLevel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filtersVisible, setFiltersVisible] = useState(false);

    // Fetch courses based on filters
    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('http://localhost:3000/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Course_Field: field || undefined,
                    Course_Level: level || undefined,
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            
            const data = await response.json();
            setCourses(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch courses by name
    const fetchCoursesByName = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://localhost:3000/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: search || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }

            const data = await response.json();
            const coursedata = []
            coursedata.push(data)
            setCourses(coursedata);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    }

    // Fetch courses on initial load
    useEffect(() => {
        fetchCourses();
    }, []);

    // Handle search submission
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchCoursesByName();
    };

    // Handle filter application
    const handleApplyFilters = () => {
        fetchCourses();
        setFiltersVisible(false);
    };

    const toggleFilters = () => {
        setFiltersVisible(!filtersVisible);
    };

    return (
    <>
    <Header />
    <div className={styles.MainContainer}>
                <div className={styles.hero}>
                    <h1 className={styles.heroTitle}>Discover Your Next Learning Path</h1>
                    <p className={styles.heroSubtitle}>Explore our collection of AI-generated learning paths customized for every skill level</p>
                </div>
                
                <form onSubmit={handleSearchSubmit} className={styles.searchContainer}>
                    <div className={styles.searchWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input 
                            type="text" 
                            name="Course_Name" 
                            id="Course_Name" 
                            placeholder='Search for any skill you want to learn...'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className={styles.searchButton}>
                            Search
                        </button>
        </div>
                </form>
                
        <div className={styles.TrendingCourses}>
            <div className={styles.TrendingCoursesHeader}>
                        <h2>Available Learning Paths {!loading && !error && courses.length > 0 && (
                            <span className={styles.courseCount}>{courses.length}</span>
                        )}</h2>
                        <div className={styles.filtersContainer}>
                            <button 
                                onClick={toggleFilters} 
                                className={styles.filterButton}
                                aria-expanded={filtersVisible}
                                aria-label="Toggle filters"
                            >
                                {filtersVisible ? (
                                    <><FaTimes /> Hide Filters</>
                                ) : (
                                    <><FaFilter /> Show Filters</>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {filtersVisible && (
                <div className={styles.filters}>
                    <select 
                        value={field} 
                        onChange={(e) => setField(e.target.value)}
                        className={styles.select}
                                aria-label="Filter by field"
                    >
                                <option value="">All Fields</option>
                        <option value="Tech">Tech</option>
                        <option value="Non-Tech">Non-Tech</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                    </select>

                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className={styles.select}
                                aria-label="Filter by level"
                    >
                                <option value="">All Levels</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                    </select>
                            
                            <button 
                                onClick={handleApplyFilters} 
                                className={styles.filterButton}
                                disabled={loading}
                            >
                                {loading ? <FaSpinner className={styles.spinner} /> : <>Apply Filters</>}
                            </button>
                        </div>
                    )}
                    
                    {/* Loading state */}
                    {loading && (
                        <div className={styles.loadingContainer}>
                            <FaSpinner className={styles.spinnerLarge} />
                            <p>Loading your learning paths...</p>
                        </div>
                    )}
                    
                    {/* Error state */}
                    {error && (
                        <div className={styles.errorContainer}>
                            <p>Error: {error}</p>
                            <button onClick={fetchCourses} className={styles.retryButton}>
                                Try Again <FaChevronRight />
                            </button>
                        </div>
                    )}
                    
                    {/* No results state */}
                    {!loading && !error && courses.length === 0 && (
                        <div className={styles.noResultsContainer}>
                            <div className={styles.noResultsIcon}>🔍</div>
                            <h3>No courses found</h3>
                            <p>No problem! Search for any skill and we'll tailor a learning path for you in just minutes.</p>
                            <button onClick={() => document.getElementById('Course_Name').focus()} className={styles.retryButton}>
                                Search Now <FaSearch />
                            </button>
                        </div>
                    )}
                    
                    {/* Course Cards */}
                    {!loading && !error && courses.length > 0 && (
                        <div className={styles.courseGrid}>
                            {courses.map((course, idx) => (
                                <div 
                                    key={course._id || idx} 
                                    className={styles.courseCard}
                                    style={{"--card-index": idx}}
                                >
                                    <div className={styles.cardColorBadge}></div>
                                    <div className={styles.cardContent}>
                                        <div className={styles.courseCardHeader}>
                                            <span className={styles.courseField}>
                                                {course.Course_Field === 'Tech' && <FaLaptopCode />}
                                                {course.Course_Field === 'Business' && <FaBriefcase />}
                                                {course.Course_Field === 'Design' && <FaPalette />}
                                                {course.Course_Field === 'Non-Tech' && <FaChartLine />}
                                                {!course.Course_Field && <FaGraduationCap />}
                                                {course.Course_Field || 'General'}
                                            </span>
                                            <span className={styles.courseLevel}>
                                                <FaGraduationCap />
                                                {course.Course_Level && course.Course_Level.split(' ')[0] || 'All Levels'}
                                            </span>
                                        </div>
                                        
                                        <h3 className={styles.courseTitle}>{course.Course_Name}</h3>
                                        <p className={styles.courseDescription}>{course.Course_Description}</p>
                                        
                                        <div className={styles.cardFooter}>
                                            <div className={styles.courseStats}>
                                                <div className={styles.courseStat}>
                                                    <FaBook />
                                                    <span>{course.learning_path.length} Modules</span>
                                                </div>
                                                <div className={styles.courseStat}>
                                                    <FaClock />
                                                    <span>
                                                        {course.learning_path.reduce((total, section) => 
                                                            total + (section.estimated_time_hours || 0), 0)} Hours
                                                    </span>
                                                </div>
                                                {course.Target_Audience && (
                                                    <div className={styles.courseStat}>
                                                        <FaUserGraduate />
                                                        <span>For {course.Target_Audience.split(',')[0].split(' ').slice(0,2).join(' ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <NavLink 
                                                to={`/course/${course.Course_Name.replace(/\s+/g, '-')}`} 
                                                className={styles.viewCourseButton}
                                            >
                                                View Course <FaArrowRight />
                                            </NavLink>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
        </div>
    </div>
    </>
    );
};

export default Courses;