// src/pages/loginPage/LoginPage.js
import React, { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import styles from './LoginPage.module.css';
import courtImage from '../../assets/images/court.jpg';
import Header from '../../components/pieces/header/Header';
import Footer from '../../components/pieces/footer/Footer';
import { apiPost } from '../../utils/connectors/api';
import { AuthContext } from '../../utils/connectors/authContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const history = useHistory();
  const { login } = useContext(AuthContext);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      if (role === '1') history.push('/form');
      else if (role === '2') history.push('/view-report');
    }
  }, [history]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }

    try {
      const res = await apiPost('/login', { username, password });

      if (res?.success && res?.data?.token) {
        const { token, expires_at, users } = res.data;

        // Save via AuthContext
        login(token, users.role_id, expires_at);

        // Redirect based on role
        if (users.role_id === 1) history.push('/dashboard1');
        else if (users.role_id === 2) history.push('/dashboard2');
      } else {
        alert(res?.message || 'Invalid username or password.');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div>
      <Header />
      <div className={styles['login-container']}>
        <div
          className={styles['background-blur']}
          style={{ backgroundImage: `url(${courtImage})` }}
        ></div>
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
                onChange={(e) => setUsername(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
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
