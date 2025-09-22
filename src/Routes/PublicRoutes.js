import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import LoginPage from '../pages/loginPage/LoginPage';
import FormPage from '../pages/formPage/FormPage';
import ViewReportPage from '../pages/viewReport.js/ViewReportPage';
import FlipBook from '../pages/flipViewPage/FlipBook';
import { PrivateRoute } from '../utils/helpers/privateRoute';

const PublicRoutes = () => (
  <Switch>
    <Route exact path="/" component={LoginPage} />
    <PrivateRoute exact path="/form" component={FormPage} allowedRoles={[1]} />
    <PrivateRoute exact path="/view-report" component={ViewReportPage} allowedRoles={[1]} />
    <PrivateRoute exact path="/report-edit" component={FlipBook} allowedRoles={[2]} />
    <Route render={() => <Redirect to="/" />} />
  </Switch>
);

export default PublicRoutes;
