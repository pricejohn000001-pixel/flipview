// src/utils/connectors/authContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const history = useHistory();

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [expiry, setExpiry] = useState(localStorage.getItem('tokenExpiry'));

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setExpiry(null);
    history.push('/');
  };

  const login = (token, role, expiresAt) => {
    const expiryTime = new Date(expiresAt).getTime(); // convert to ms timestamp
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('tokenExpiry', expiryTime);

    setToken(token);
    setRole(role);
    setExpiry(expiryTime);
  };

  const isTokenValid = () => {
    return token && expiry && Date.now() < Number(expiry);
  };

  // Auto logout when token expires
  useEffect(() => {
    if (expiry) {
      const timeout = Number(expiry) - Date.now();
      if (timeout <= 0) {
        logout();
      } else {
        const timer = setTimeout(logout, timeout);
        return () => clearTimeout(timer);
      }
    }
  }, [expiry]);

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  );
};
