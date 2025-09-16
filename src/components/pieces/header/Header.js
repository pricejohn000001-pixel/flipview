import React, { useEffect, useState } from 'react';
import styles from './header.module.css';
import logo from '../../../assets/logo/hc_logo.png'; // Adjust the path as needed

const Header = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
      setDate(
            now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <img src={logo} alt="Gauhati High Court Logo" className={styles.logo} />
        </div>
        <div className={styles.center}>
          <h4 className={styles.title}>The Gauhati High Court</h4>
          <small className={styles.subtitle}>
            High Court of Assam, Nagaland, Mizoram and Arunachal Pradesh
          </small>
        </div>
        <div className={styles.right}>
          <div className={styles.time}>{time}</div>
          <div className={styles.date}>{date}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
