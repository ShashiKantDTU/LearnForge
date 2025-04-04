import React from 'react';
import styles from './About.module.css';
import Header from '../../components/header/Header';

const About = () => {
    return (
        <div className={styles.container}>
            <Header />
            <main className={styles.main}>
                <h1 className={styles.title}>About LearnForge</h1>
                <p className={styles.description}>
                    This is the About page of LearnForge. Here you'll find information about our mission,
                    team, and the story behind our free and open-source learning platform.
                </p>
            </main>
        </div>
    );
};

export default About; 