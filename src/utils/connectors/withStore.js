import React from 'react';
import { ReactReduxContext } from 'react-redux';

function withStore(ComposedComponent) {
  return props => (
    <ReactReduxContext.Consumer>
      {({ store }) => <ComposedComponent {...props} store={store} />}
    </ReactReduxContext.Consumer>
  );
}
export default withStore;
