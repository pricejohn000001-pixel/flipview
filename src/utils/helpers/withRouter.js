import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export const withRouter = (Component) => {
  const Wrapper = (props) => {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    
    return (
      <Component
        router={{navigate, params, location}}
        {...props}
        />
    );
  };
  
  return Wrapper;
};
