import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Courses.module.css';
import Header from '../../components/header/Header';
import { 
  FaSearch, FaBook, FaClock, FaFilter, FaTimes, FaChevronDown,
  FaLaptopCode, FaBriefcase, FaPalette, FaChartLine, FaGraduationCap,
  FaUserGraduate, FaArrowRight
} from 'react-icons/fa';

const Courses = () => {
  // State for courses and filters
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [field, setField] = useState('');
  const [level, setLevel] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Function to fetch filtered courses
  const fetchFilteredCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSearching(false);
      
      const response = await fetch('http://localhost:3000/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Course_Field: field || undefined,
          Course_Level: level || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses (Status: ${response.status})`);
      }
      
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [field, level]);

  // Function to search courses by name/keyword
  const searchCourses = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setIsSearching(true);
      
      const response = await fetch('http://localhost:3000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: searchQuery }),
      });

      if (!response.ok) {
        throw new Error(`Search failed (Status: ${response.status})`);
      }

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.message);
      console.error('Error searching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Load courses on initial render
  useEffect(() => {
    fetchFilteredCourses();
  }, []);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchCourses();
  };

  // Apply filters and fetch courses
  const handleApplyFilters = () => {
    fetchFilteredCourses();
    setFiltersVisible(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setField('');
    setLevel('');
    setFiltersVisible(false);
    fetchFilteredCourses();
  };

  // Reset search and show all courses
  const handleResetSearch = () => {
    setSearchQuery('');
    fetchFilteredCourses();
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Memoized field icon selector
  const getFieldIcon = useCallback((fieldType) => {
    switch(fieldType) {
      case 'Tech': return <FaLaptopCode />;
      case 'Business': return <FaBriefcase />;
      case 'Design': return <FaPalette />;
      case 'Non-Tech': return <FaChartLine />;
      default: return <FaGraduationCap />;
    }
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* Hero Section */}
        <motion.div 
          className={styles.hero}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Discover Your Perfect Learning Path
          </motion.h1>
          <motion.p 
            className={styles.heroSubtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Explore AI-generated learning paths tailored to your goals and skill level
          </motion.p>
        </motion.div>
        
        {/* Search Section */}
        <motion.form 
          onSubmit={handleSearchSubmit} 
          className={styles.searchContainer}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className={styles.searchWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="What skill do you want to master?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <motion.button 
              type="submit" 
              className={styles.searchButton}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? 'Searching...' : 'Generate Path'}
            </motion.button>
          </div>
          {isSearching && searchQuery && (
            <motion.p 
              className={styles.searchNotice}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Showing results for "{searchQuery}" 
              <button 
                onClick={handleResetSearch} 
                className={styles.resetButton}
              >
                View all courses
              </button>
            </motion.p>
          )}
        </motion.form>
        
        {/* Courses Section */}
        <section className={styles.coursesSection}>
          <div className={styles.sectionHeader}>
            <motion.div 
              className={styles.titleWrapper}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <h2>Learning Paths</h2>
              {!loading && !error && courses.length > 0 && (
                <span className={styles.courseCount}>{courses.length}</span>
              )}
            </motion.div>
            
            <motion.div 
              className={styles.filterControls}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.button 
                onClick={toggleFilters} 
                className={styles.filterToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-expanded={filtersVisible}
              >
                {filtersVisible ? (
                  <>
                    <FaTimes />
                    <span>Hide Filters</span>
                  </>
                ) : (
                  <>
                    <FaFilter />
                    <span>Filter Paths</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
          
          {/* Filters Panel */}
          <AnimatePresence>
            {filtersVisible && (
              <motion.div 
                className={styles.filtersPanel}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.filterOptions}>
                  <div className={styles.filterGroup}>
                    <label>Field</label>
                    <div className={styles.selectWrapper}>
                      <select 
                        value={field} 
                        onChange={(e) => setField(e.target.value)}
                        className={styles.select}
                      >
                        <option value="">All Fields</option>
                        <option value="Tech">Technology</option>
                        <option value="Non-Tech">General Skills</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                      </select>
                      <FaChevronDown className={styles.selectIcon} />
                    </div>
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label>Level</label>
                    <div className={styles.selectWrapper}>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className={styles.select}
                      >
                        <option value="">All Levels</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                      <FaChevronDown className={styles.selectIcon} />
                    </div>
                  </div>
                  
                  <div className={styles.filterActions}>
                    <motion.button 
                      onClick={handleApplyFilters} 
                      className={styles.applyButton}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={loading}
                    >
                      Apply Filters
                    </motion.button>
                    
                    <motion.button 
                      onClick={handleClearFilters} 
                      className={styles.clearButton}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={loading}
                    >
                      Clear All
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Loading State */}
          {loading && (
            <motion.div 
              className={styles.loadingState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.loadingPulse}></div>
              <p>Building your learning journey...</p>
            </motion.div>
          )}
          
          {/* Error State */}
          {error && !loading && (
            <motion.div 
              className={styles.errorState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={styles.errorIcon}>❌</div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <motion.button 
                onClick={fetchFilteredCourses} 
                className={styles.retryButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </motion.div>
          )}
          
          {/* Empty State */}
          {!loading && !error && courses.length === 0 && (
            <motion.div 
              className={styles.emptyState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No learning paths found</h3>
              <p>
                Try searching for any skill you want to learn, and we'll create a 
                personalized learning path just for you!
              </p>
              <motion.button 
                onClick={() => document.querySelector('input').focus()} 
                className={styles.searchNowButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Search Now <FaSearch />
              </motion.button>
            </motion.div>
          )}
          
          {/* Course Cards */}
          {!loading && !error && courses.length > 0 && (
            <motion.div 
              className={styles.courseGrid}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {courses.map((course, idx) => (
                <motion.div 
                  key={course._id || `course-${idx}`} 
                  className={styles.courseCard}
                  variants={itemVariants}
                  whileHover={{ 
                    y: -8,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.fieldBadge}>
                      {getFieldIcon(course.Course_Field)}
                      <span>{course.Course_Field || 'General'}</span>
                    </div>
                    <div className={styles.levelBadge}>
                      <FaGraduationCap />
                      <span>{course.Course_Level || 'All Levels'}</span>
                    </div>
                  </div>
                  
                  <div className={styles.cardBody}>
                    <h3 className={styles.courseTitle}>{course.Course_Name}</h3>
                    <p className={styles.courseDescription}>
                      {course.Course_Description?.length > 120 
                        ? `${course.Course_Description.substring(0, 120)}...` 
                        : course.Course_Description}
                    </p>
                  </div>
                  
                  <div className={styles.cardFooter}>
                    <div className={styles.courseStats}>
                      <div className={styles.statItem}>
                        <FaBook />
                        <span>{course.learning_path?.length || 0} Modules</span>
                      </div>
                      <div className={styles.statItem}>
                        <FaClock />
                        <span>
                          {course.learning_path?.reduce((total, section) => 
                            total + (section.estimated_time_hours || 0), 0) || 0} Hours
                        </span>
                      </div>
                      {course.Target_Audience && (
                        <div className={styles.statItem}>
                          <FaUserGraduate />
                          <span>
                            For {course.Target_Audience.split(',')[0].split(' ').slice(0,2).join(' ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <NavLink 
                      to={`/course/${course.Course_Name.replace(/\s+/g, '-')}`}
                      className={styles.viewButton}
                    >
                      View Path <FaArrowRight />
                    </NavLink>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </>
  );
};

export default Courses;