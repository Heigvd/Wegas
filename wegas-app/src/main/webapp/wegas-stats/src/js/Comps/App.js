import React from 'react';
import { Link } from 'react-router';
import Login from './LoginForm';
import Overlay from './Overlay';

class App extends React.Component {
    render() {
        const style = {
            textAlign: 'center',
        };
        return (
            <div>
              <Overlay/>
              <h2 className="header"
                  style={ style }>Wegas Stats</h2>
              <div>
                <button>
                  <Link to="/"> Restart
                  </Link>
                </button>
              </div>
              <div className="body">
                <Login>
                  { this.props.children }
                </Login>
              </div>
            </div>
            );
    }
}
export default App;
