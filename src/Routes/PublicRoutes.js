import React from 'react';
import { Switch, Route } from 'react-router-dom';
import LoginPage from '../pages/loginPage/LoginPage';
import FormPage from '../pages/formPage/FormPage';
import ViewReportPage from '../pages/viewReport.js/ViewReportPage';
import FlipBook from '../pages/flipViewPage/FlipBook';

const PublicRoutes = () => (
  <Switch>
    <Route exact path="/" component={LoginPage} />
    <Route exact path="/form" component={FormPage} />
    <Route exact path="/view-report" component={ViewReportPage} />
    <Route exact path="/report-edit" component={FlipBook} />
    <Route component={LoginPage} />
  </Switch>
);

export default PublicRoutes;