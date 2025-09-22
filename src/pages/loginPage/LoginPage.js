import React, { useState } from 'react';
import styles from './LoginPage.module.css';
import courtImage from '../../assets/images/court.jpg';
import Header from '../../components/pieces/header/Header';
import Footer from '../../components/pieces/footer/Footer';
import page1 from '../../assets/page1.jpg'
import page2 from '../../assets/page2.jpg'
import page3 from '../../assets/page3.jpg'

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const pages = [page1, page2, page3, page1, page2, page3];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }
    setError('');
    // Backend login logic here
    alert(`Logged in as: ${username}`);
  };

  return (
    <div style={{width: '100vw'}}>
      <Header />  
      <div className={styles['login-container']}>
          <div className={styles['background-blur']} style={{ backgroundImage: `url(${courtImage})` }}></div>
          <div className={styles['login-card']}>
            <div className={styles['logo-section']}>
              <h2 className={styles['court-name']}>Enter your credentials to continue</h2>
            </div>
            <form className={styles['login-form']} onSubmit={handleSubmit} autoComplete="on">
              <div className={styles['form-group']}>
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <div style={{ color: '#ef4444', textAlign: 'center', marginBottom: 8 }}>{error}</div>}
              <button type="submit" className={styles['login-btn']}>
                Login
              </button>
            </form>
          </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
