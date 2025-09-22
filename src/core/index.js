import React from 'react';
import ReactDOM from 'react-dom';
import AppContainer from 'base/App.container';
import './index.css';
import { AuthProvider } from '../utils/connectors/authContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <AppContainer />
  </AuthProvider>
);
