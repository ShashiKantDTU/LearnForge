import styles from './Header.module.css'
import { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../ContextHooks/ThemeContext';
import { FaMoon, FaSun, FaBook, FaGraduationCap, FaInfoCircle, FaSearch, FaUser, FaBars, FaTimes, FaChevronDown, FaBookmark } from 'react-icons/fa';
import { NavLink, Link } from 'react-router-dom';
import CourseProgressSummary from '../CourseProgressSummary/CourseProgressSummary';
import CourseProgressManager from '../../utils/CourseProgressManager';

const Header = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);   
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [progressSummaryOpen, setProgressSummaryOpen] = useState(false);
    const [hasCourseProgress, setHasCourseProgress] = useState(false);
    
    // Listen for scroll events to add shadow effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    // Check if user has any courses in progress
    useEffect(() => {
        const allProgress = CourseProgressManager.getAllCoursesProgress();
        setHasCourseProgress(Object.keys(allProgress).length > 0);
    }, []);
    
    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };
    
    // Toggle user menu
    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
        // Close progress summary when user menu is toggled
        if (!userMenuOpen) {
            setProgressSummaryOpen(false);
        }
    };
    
    // Toggle progress summary
    const toggleProgressSummary = () => {
        setProgressSummaryOpen(!progressSummaryOpen);
        // Close user menu when progress summary is toggled
        if (!progressSummaryOpen) {
            setUserMenuOpen(false);
        }
    };
    
    // Handle search form submission
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // For now just log the search query - this would be connected to search functionality
        console.log('Search query:', searchQuery);

        // Clear search field after submission
        setSearchQuery('');
    };
    
    return (
        <>
            <header className={isScrolled ? styles.scrolled : ''}>
                {/* Brand name at start */}
                <NavLink to="/" className={`${styles.NavLink} ${styles.BrandName}`}>
                    <span className={styles.BrandNameText}>LearnForge</span>
                </NavLink>
                
                {/* Mobile menu button */}
                <button 
                    className={styles.mobileMenuBtn}
                    onClick={toggleMobileMenu}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                    {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
                
                {/* Navigation links in center */}
                <div className={styles.navCenter}>
                    <NavLink 
                        to="/" 
                        className={({isActive}) => `${styles.NavLink} ${isActive ? styles.activeLink : ''}`}
                    >
                        Home
                    </NavLink>
                    <NavLink 
                        to="/courses" 
                        className={({isActive}) => `${styles.NavLink} ${isActive ? styles.activeLink : ''}`}
                    >
                        Courses
                    </NavLink>
                    <NavLink 
                        to="/resources" 
                        className={({isActive}) => `${styles.NavLink} ${isActive ? styles.activeLink : ''}`}
                    >
                        Resources
                    </NavLink>
                    <NavLink 
                        to="/about" 
                        className={({isActive}) => `${styles.NavLink} ${isActive ? styles.activeLink : ''}`}
                    >
                        About
                    </NavLink>
                </div>
                
                {/* Theme switch and login at end */}
                <div className={styles.navEnd}>
                    
                    
                    {/* My Courses & Progress Button - Only show if user has course progress */}
                    {hasCourseProgress && (
                        <div className={styles.userProgressContainer}>
                            <button
                                className={styles.progressButton}
                                onClick={toggleProgressSummary}
                                aria-expanded={progressSummaryOpen}
                            >
                                My Progress <FaChevronDown className={`${styles.dropdownIcon} ${progressSummaryOpen ? styles.dropdownIconOpen : ''}`} />
                            </button>
                            
                            {progressSummaryOpen && (
                                <div className={styles.progressDropdown}>
                                    <CourseProgressSummary />
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* User menu */}
                    <div className={styles.userMenuContainer}>
                        <button 
                            className={styles.userButton} 
                            onClick={toggleUserMenu}
                            aria-expanded={userMenuOpen}
                        >
                            <FaUser />
                        </button>
                        
                        {userMenuOpen && (
                            <div className={styles.userDropdown}>
                                <ul className={styles.userMenu}>
                                    <li>
                                        <Link to="/profile/bookmarks">My Bookmarks</Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={toggleTheme} 
                        className={`${styles.themeSwitch} ${theme === 'dark' ? styles.dark : ''}`}
                        aria-label="Toggle dark mode"
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <div className={`${styles.toggleCircle} ${theme === 'dark' ? styles.dark : styles.light}`}>
                            <span className={styles.toggleIcon}>
                                {theme === 'dark' ? 
                                  <FaSun className={styles.sunIcon} /> : 
                                  <FaMoon className={styles.moonIcon} />
                                }
                            </span>
                        </div>
                    </button>
                    {/* <NavLink to="" className={`${styles.NavLink} ${styles.Login}`}>
                        Sign In
                    </NavLink> */}
                </div>
            </header>
            
            {/* Mobile menu */}
            {mobileMenuOpen && (
                <nav className={`${styles.mobileNav} ${styles.mobileMenuOpen}`}>
                    <ul className={styles.mobileNavList}>
                        <li className={styles.mobileNavItem}>
                            <NavLink 
                                to="/" 
                                end 
                                className={({isActive}) => `${styles.mobileNavLink} ${isActive ? styles.mobileActiveLink : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Home
                            </NavLink>
                        </li>
                        <li className={styles.mobileNavItem}>
                            <NavLink 
                                to="/courses" 
                                className={({isActive}) => `${styles.mobileNavLink} ${isActive ? styles.mobileActiveLink : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FaBook className={styles.navIcon} /> Courses
                            </NavLink>
                        </li>
                        <li className={styles.mobileNavItem}>
                            <NavLink 
                                to="/resources" 
                                className={({isActive}) => `${styles.mobileNavLink} ${isActive ? styles.mobileActiveLink : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FaGraduationCap className={styles.navIcon} /> Resources
                            </NavLink>
                        </li>
                        <li className={styles.mobileNavItem}>
                            <NavLink 
                                to="/about" 
                                className={({isActive}) => `${styles.mobileNavLink} ${isActive ? styles.mobileActiveLink : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FaInfoCircle className={styles.navIcon} /> About
                            </NavLink>
                        </li>
                        {hasCourseProgress && (
                            <li className={styles.mobileNavItem}>
                                <NavLink 
                                    to="/profile/bookmarks" 
                                    className={({isActive}) => `${styles.mobileNavLink} ${isActive ? styles.mobileActiveLink : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <FaBookmark className={styles.navIcon} /> My Bookmarks
                                </NavLink>
                            </li>
                        )}
                    </ul>
                </nav>
            )}
        </>
    )
}

export default Header