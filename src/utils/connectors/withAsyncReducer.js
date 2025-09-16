import React from 'react';

import { EMPTY_OBJECT } from 'constants/app.constants';

import withStore from './withStore';
import { injectReducer } from '../helpers/redux';

/**
 * Helps injecting an asynchronous reducer into the store.
 * @param {string} key - Key to inject the reducer into.
 * @param {Function} reducer - Reducer to inject
 */
function withAsyncReducer({ key, reducer } = EMPTY_OBJECT) {
  return ComposedComponent => withStore(({ store, ...restProps }) => {
    injectReducer(key, reducer, store);
    return <ComposedComponent {...restProps} />;
  });
}

export default withAsyncReducer;
