import * as React from 'react';
import { Link } from 'react-router-dom';
import Login from './LoginForm';
import Overlay from './Overlay';
import RequestIndicator from './RequestIndicator';

class App extends React.Component {
    render() {
        const style = {
            textAlign: 'center',
        };
        return (
            <div>
                <Overlay />
                <h2 className="header" style={style}>
                    Wegas Stats
                </h2>
                <button>
                    <Link to="/"> Restart</Link>
                </button>
                <RequestIndicator />
                <div className="body">
                    <Login>{this.props.children}</Login>
                </div>
            </div>
        );
    }
}
export default App;
