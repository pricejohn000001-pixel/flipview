import React from 'react';
import ReactDOM from 'react-dom';

import AppContainer from 'base/App.container';

import './index.css';

window.onload = () => {
  ReactDOM.render(<AppContainer />, document.getElementById('root'));
};
