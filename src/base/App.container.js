import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AuthControl from './AuthControl/AuthControl';

function AppContainer() {
  return (
    <BrowserRouter>
      <AuthControl />
    </BrowserRouter>
  );
}

export default AppContainer;
