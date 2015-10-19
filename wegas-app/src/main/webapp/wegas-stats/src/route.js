import React from 'react';
import { Router, Route } from 'react-router';
import createHistory from 'history/lib/createHashHistory';
import { Provider } from 'react-redux';
import { store } from './js/init';
import App from './js/Comps/App';
import LogIdSelector from './js/Comps/LogIdSelector';
import Stats from './js/Comps/Stats';

const history = createHistory();

class AppRoute extends React.Component {

    constructor(props, context) {
        super(props, context);
    }

    renderRoute() {
        return (
            <Router history={ history }>
              <Route components={ App }>
                <Route components={ LogIdSelector }
                       history={ this.history }
                       path="/" />
                <Route components={ Stats }
                       path="/:LogId" />
              </Route>
            </Router>
            );
    }

    render() {
        return ( <Provider store={ store }>
                   { this.renderRoute() }
                 </Provider> );
    }
}
export default React.createElement(AppRoute);
