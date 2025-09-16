import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './navbar.module.css';
import { FileText, FilePlus } from 'lucide-react';
import ghcImage from '../../../assets/logo/hc_logo.png';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <img src={ghcImage} alt="Gauhati High Court Logo" className={styles.logo} />
        <span className={styles.siteName}>Gauhati High Court</span>
      </div>

      <div className={styles.navLinks}>
        <NavLink
          to="/view-report"
          className={styles.navLink}
          activeClassName={styles.activeNavLink}
        >
          <FileText className={styles.icon} />
          View Report
        </NavLink>
        <NavLink
          to="/form"
          className={styles.navLink}
          activeClassName={styles.activeNavLink}
        >
          <FilePlus className={styles.icon} />
          Form
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
