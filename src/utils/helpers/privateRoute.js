// src/routes/PrivateRoute.js
import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { AuthContext } from '../connectors/authContext';

export const PrivateRoute = ({ component: Component, allowedRoles, ...rest }) => {
  const { token, role, isTokenValid } = useContext(AuthContext);

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isTokenValid()) {
          return <Redirect to="/" />;
        }
        if (allowedRoles && !allowedRoles.includes(Number(role))) {
          return <Redirect to="/" />;
        }
        return <Component {...props} />;
      }}
    />
  );
};
