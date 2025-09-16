import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { _noop } from '../helpers/common';


/**
 * Helps implementing the state reducer pattern. Accepts an ActionHandler object and invokes the handlers with state/redux hooks
 * @param {object} ACTION_HANDLERS - Object describing the actions and their corresponding handler functions
 */
const withActions = ACTION_HANDLERS => (ComposedComponent) => {
  class WithActions extends Component {
    getState = () => ({ ...this.props, ...this.state });

    handleAction = (action) => {
      const { dispatch } = this.props;
      const funcToExec = ACTION_HANDLERS[action.type] || _noop;
      funcToExec(action, { getState: this.getState, setState: this.setState.bind(this), dispatch });
    }

    render() {
      return <ComposedComponent {...this.getState()} onAction={this.handleAction} />;
    }
  }

  WithActions.propTypes = { dispatch: PropTypes.func.isRequired };

  return connect(undefined, (dispatch, ownProps) => ({ ...ownProps, dispatch }))(WithActions);
};

export default withActions;
