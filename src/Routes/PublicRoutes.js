import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import LoginPage from '../pages/loginPage/LoginPage';
import FormPage from '../pages/formPage/FormPage';
import ViewReportPage from '../pages/viewReport.js/ViewReportPage';
import FlipBookOptimized from '../pages/flipViewPage/FlipBookOptimized';
import DocumentWorkspacePage from '../pages/documentWorkspace/DocumentWorkspacePage';
import { PrivateRoute } from '../utils/helpers/privateRoute';
import { PdfProvider } from '../utils/helpers/pdfContext';

const PublicRoutes = () => (
  <PdfProvider>
    <Switch>
      <Route exact path="/" component={LoginPage} />
      <PrivateRoute exact path="/form" component={FormPage} allowedRoles={[1]} />
      <PrivateRoute exact path="/view-report" component={ViewReportPage} allowedRoles={[1, 2]} />
      <PrivateRoute exact path="/report-edit" component={FlipBookOptimized} allowedRoles={[1, 2]} />
      <Route
        exact
        path="/document-workspace"
        component={DocumentWorkspacePage}
        allowedRoles={[1, 2]}
      />
      <Route render={() => <Redirect to="/" />} />
    </Switch>
  </PdfProvider>
);

export default PublicRoutes;
