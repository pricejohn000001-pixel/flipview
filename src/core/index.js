import React from 'react';
import ReactDOM from 'react-dom';
import AppContainer from 'base/App.container';
import './index.css';
import { AuthProvider } from '../utils/connectors/authContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <AppContainer />
  </AuthProvider>
);
