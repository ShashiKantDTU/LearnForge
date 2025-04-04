import React from 'react';
import styles from './Resources.module.css';
import Header from '../../components/header/Header';

const Resources = () => {
    return (
        <div className={styles.container}>
            <Header />
            <main className={styles.main}>
                <h1 className={styles.title}>Resources Page</h1>
                <p className={styles.description}>
                    This is the Resources page of LearnForge. Additional content will be added here.
                </p>
            </main>
        </div>
    );
};

export default Resources; 