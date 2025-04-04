import React from 'react';
import styles from './Home.module.css'
import Header from '../../components/header/Header';
import { FaArrowRight, FaRobot, FaLightbulb, FaRoute, FaChevronRight, FaPlay, 
         FaFacebookF, FaTwitter, FaLinkedinIn, FaCode, FaDownload, FaCodeBranch, FaSearch } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';

const Home = () => {
    return (
        <div className={styles.MainContainer}>
            <div className={styles.BackgroundPattern}></div>
            <Header/>
            
            {/* Hero Section - Simplified without image */}
            <section className={styles.HeroSection}>
                <div className={styles.HeroShape + ' ' + styles.ShapeTop}></div>
                <div className={styles.HeroShape + ' ' + styles.ShapeBottom}></div>
                
                <div className={styles.HeroSectionContent}>
                    <div className={styles.HeroTextFull}>
                        <div className={styles.OpenSourceBadge}>
                            <FaCode /> 100% Free & Open Source
                        </div>
                        <h1 className={styles.HeroTitle}>
                            Find Any Course or Skill on LearnForge
                        </h1>
                        <div className={styles.BrandingTag}>
                            <FaSearch /> Your Ultimate Knowledge Discovery Platform
                        </div>
                        <p className={styles.HeroSubtitle}>
                            Discover learning paths for any skill imaginable. LearnForge provides AI-generated, customized roadmaps for any subject or skill you want to master - from programming to poetry, data science to design, and everything in between.
                        </p>
                        <div className={styles.ButtonGroup}>
                            <NavLink to="/courses" className={styles.PrimaryButton}>
                                Find Your Course <FaArrowRight />
                            </NavLink>
                            <a href="#open-source" className={styles.SourceCodeButton}>
                                <FaCode /> View Source Code
                            </a>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Featured Section */}
            <section className={styles.FeaturedSection}>
                <div className={styles.FeaturedBackground}></div>
                <h2 className={styles.SectionTitle}>Why Choose LearnForge?</h2>
                <p className={styles.SectionSubtitle}>
                    A revolutionary learning experience powered by advanced AI to accelerate your mastery of any subject
                </p>
                
                <div className={styles.FeatureGrid}>
                    <div className={styles.FeatureCard}>
                        <div className={styles.FeatureIcon}>
                            <FaRobot />
                        </div>
                        <h3 className={styles.FeatureTitle}>AI-Generated Content</h3>
                        <p className={styles.FeatureDescription}>
                            Access learning materials created by cutting-edge artificial intelligence that adapts to your specific needs and learning style.
                        </p>
                    </div>
                    
                    <div className={styles.FeatureCard}>
                        <div className={styles.FeatureIcon}>
                            <FaRoute />
                        </div>
                        <h3 className={styles.FeatureTitle}>Custom Learning Paths</h3>
                        <p className={styles.FeatureDescription}>
                            Get personalized step-by-step roadmaps or quick overviews for any subject, designed specifically for your skill level and goals.
                        </p>
                    </div>
                    
                    <div className={styles.FeatureCard}>
                        <div className={styles.FeatureIcon}>
                            <FaCode />
                        </div>
                        <h3 className={styles.FeatureTitle}>Free & Open Source</h3>
                        <p className={styles.FeatureDescription}>
                            LearnForge is completely free and open source. Contribute to the codebase, add features, or fork it for your own educational projects.
                        </p>
                    </div>
                </div>
            </section>
            
            {/* Creative Visualization Section - Simplified replacement for courses */}
            <section className={styles.VisualizationSection}>
                <div className={styles.WaveBackground}></div>
                <div className={styles.VisualizationContent}>
                    <h2 className={styles.SectionTitle}>How It Works</h2>
                    <p className={styles.SectionSubtitle}>
                        A simple three-step process to unlock your learning potential
                    </p>
                    
                    <div className={styles.ProcessSteps}>
                        <div className={styles.ProcessStep}>
                            <div className={styles.StepNumber}>1</div>
                            <h3 className={styles.StepTitle}>Enter Your Topic</h3>
                            <p className={styles.StepDescription}>
                                Type in any subject you want to learn about, from programming to poetry
                            </p>
                        </div>
                        
                        <div className={styles.ProcessConnector}></div>
                        
                        <div className={styles.ProcessStep}>
                            <div className={styles.StepNumber}>2</div>
                            <h3 className={styles.StepTitle}>Choose Your Format</h3>
                            <p className={styles.StepDescription}>
                                Select between a detailed learning path or a quick overview
                            </p>
                        </div>
                        
                        <div className={styles.ProcessConnector}></div>
                        
                        <div className={styles.ProcessStep}>
                            <div className={styles.StepNumber}>3</div>
                            <h3 className={styles.StepTitle}>Receive Your Guide</h3>
                            <p className={styles.StepDescription}>
                                Get your personalized AI-generated learning materials instantly
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Open Source Section */}
            <section id="open-source" className={styles.OpenSourceSection}>
                <div className={styles.OpenSourceBackground}></div>
                <div className={styles.OpenSourceContent}>
                    <h2 className={styles.SectionTitle}>Open Source Community</h2>
                    <p className={styles.SectionSubtitle}>
                        LearnForge is proudly open source and free for everyone. Join our community of contributors!
                    </p>
                    
                    <div className={styles.OpenSourceFeatures}>
                        <div className={styles.OpenSourceFeature}>
                            <div className={styles.OpenSourceIcon}>
                                <FaCode />
                            </div>
                            <h3>MIT Licensed</h3>
                            <p>Free to use, modify, and distribute under the permissive MIT license</p>
                        </div>
                        
                        <div className={styles.OpenSourceFeature}>
                            <div className={styles.OpenSourceIcon}>
                                <FaCodeBranch />
                            </div>
                            <h3>Community Developed</h3>
                            <p>Open development process with transparent code and welcoming community</p>
                        </div>
                        
                        <div className={styles.OpenSourceFeature}>
                            <div className={styles.OpenSourceIcon}>
                                <FaLightbulb />
                            </div>
                            <h3>Community Driven</h3>
                            <p>Built by the community, for the community. Your contributions are welcome!</p>
                        </div>
                    </div>
                    
                    <div className={styles.GitHubCTA}>
                        <NavLink to="/download" className={styles.SourceCodeButton}>
                            <FaDownload /> Download Source Code
                        </NavLink>
                    </div>
                </div>
            </section>
            
            {/* CTA Section */}
            <section className={styles.CTASection}>
                <div className={styles.CTABackground}></div>
                <div className={styles.CTAContainer}>
                    <div className={styles.CTAShape + ' ' + styles.CTAShapeLeft}></div>
                    <div className={styles.CTAShape + ' ' + styles.CTAShapeRight}></div>
                    <h2 className={styles.CTATitle}>Ready to Unlock Knowledge?</h2>
                    <p className={styles.CTADescription}>
                        Join LearnForge today and discover how our free, open-source AI-generated learning resources can transform your educational journey - one click at a time.
                    </p>
                    <div className={styles.CTAButtonGroup}>
                        <NavLink to="/courses" className={styles.PrimaryButton}>
                            Get Started Now <FaArrowRight />
                        </NavLink>
                        <NavLink to="/open-source" className={styles.SecondaryButton}>
                            <FaCode /> Learn About Open Source
                        </NavLink>
                    </div>
                </div>
            </section>
            
            {/* Footer */}
            <footer className={styles.Footer}>
                <div className={styles.FooterBackground}></div>
                <div className={styles.FooterContainer}>
                    <div>
                        <div className={styles.FooterBrand}>
                            <div className={styles.FooterBrandName}>LearnForge</div>
                            <p className={styles.FooterDescription}>
                                A free and open source project that helps you find and learn any skill or course. Created with passion to make education accessible to everyone through AI-generated learning paths.
                            </p>
                            <div className={styles.OpenSourceTag}>
                                <FaCode /> 100% Free & Open Source
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.FooterColumn}>
                        <h3>Project</h3>
                        <div className={styles.FooterLinks}>
                            <a href="#open-source" className={styles.FooterLink}>View Source</a>
                            <NavLink to="/issues" className={styles.FooterLink}>Report Issues</NavLink>
                            <NavLink to="/docs" className={styles.FooterLink}>Documentation</NavLink>
                            <NavLink to="/requests" className={styles.FooterLink}>Feature Requests</NavLink>
                        </div>
                    </div>
                    
                    <div className={styles.FooterColumn}>
                        <h3>Sample Topics</h3>
                        <div className={styles.FooterLinks}>
                            <NavLink to="/topics/programming" className={styles.FooterLink}>Programming</NavLink>
                            <NavLink to="/topics/data-science" className={styles.FooterLink}>Data Science</NavLink>
                            <NavLink to="/topics/design" className={styles.FooterLink}>Design</NavLink>
                            <NavLink to="/topics/business" className={styles.FooterLink}>Business</NavLink>
                        </div>
                    </div>
                    
                    <div className={styles.FooterColumn}>
                        <h3>Developer</h3>
                        <div className={styles.FooterLinks}>
                            <a href="https://portfolio.example.com" target="_blank" rel="noopener noreferrer" className={styles.FooterLink}>Portfolio</a>
                            <a href="https://linkedin.com/in/username" target="_blank" rel="noopener noreferrer" className={styles.FooterLink}>LinkedIn</a>
                            <a href="https://github.com/username" target="_blank" rel="noopener noreferrer" className={styles.FooterLink}>GitHub</a>
                            <a href="mailto:contact@example.com" className={styles.FooterLink}>Email Me</a>
                        </div>
                        <div className={styles.FooterSocial}>
                            <a href="https://github.com/username" target="_blank" rel="noopener noreferrer" className={styles.FooterSocialIcon}><FaCode /></a>
                            <a href="https://twitter.com/username" target="_blank" rel="noopener noreferrer" className={styles.FooterSocialIcon}><FaTwitter /></a>
                            <a href="https://linkedin.com/in/username" target="_blank" rel="noopener noreferrer" className={styles.FooterSocialIcon}><FaLinkedinIn /></a>
                        </div>
                    </div>
                </div>
                
                <div className={styles.FooterCopyright}>
                    <p className={styles.CopyrightText}>
                        © {new Date().getFullYear()} Created with ❤️ by <span className={styles.DeveloperName}>Shashi Kant</span> / 23EN516 • Open source under the MIT License
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Home;