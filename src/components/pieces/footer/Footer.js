import React from 'react';
import styles from './footer.module.css';
import ghcImage from '../../../assets/images/GHC.jpg'; // Adjust the path

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <h3 className={styles.heading}>Contact Information</h3>
            <img src={ghcImage} alt="Gauhati High Court" className={styles.image} />
            <p>
              The Gauhati High Court<br />
              MG Road, Latasil, Uzan Bazar<br />
              Guwahati - 781001, Assam
            </p>
          </div>

          <div>
            <h3 className={styles.heading}>Permanent Benches</h3>
            <ul className={styles.links}>
              <li><a href="https://kohimahighcourt.gov.in/" target="_blank" rel="noreferrer">Kohima Bench</a></li>
              <li><a href="https://ghcazlbench.nic.in/" target="_blank" rel="noreferrer">Aizawl Bench</a></li>
              <li><a href="https://ghcitanagar.gov.in/" target="_blank" rel="noreferrer">Itanagar Bench</a></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.heading}>Download Apps</h3>
            <div className={styles.apps}>
              <div>
                <p className={styles.appTitle}>e-Courts Services App</p>
                <a href="https://play.google.com/store/apps/details?id=in.gov.ecourts.eCourtsServices" target="_blank" rel="noreferrer">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" />
                </a>
                <a href="https://apps.apple.com/in/app/ecourts-services/id1260905816" target="_blank" rel="noreferrer">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" />
                </a>
              </div>

              <div>
                <p className={styles.appTitle}>Bhoroxa App</p>
                <a href="https://play.google.com/store/apps/details?id=com.web.bhoroxaa" target="_blank" rel="noreferrer">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.copy}>
          © 2025 Gauhati High Court. All rights reserved. | Last updated: August 2025
        </div>
      </div>
    </footer>
  );
};

export default Footer;
