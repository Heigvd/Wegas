import React from 'react';
import { HashRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './js/init';
import App from './js/Comps/App';
import LogIdSelector from './js/Comps/LogIdSelector';
import Stats from './js/Comps/Stats';


class AppRoute extends React.Component {
    renderRoute() {
        return (
            <HashRouter>
                <div>
                    <App />
                    <Route exact path="/" component={LogIdSelector} />
                    <Route component={Stats} path="/:LogId" />
                </div>
            </HashRouter>
        );
    }

    render() {
        return (
            <Provider store={store}>
                {this.renderRoute()}
            </Provider>
        );
    }
}
export default React.createElement(AppRoute);
