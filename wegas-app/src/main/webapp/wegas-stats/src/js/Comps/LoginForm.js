import React from 'react';
import { connect } from 'react-redux';
import t from 'tcomb-form';
import { userLogin, userLogout } from '../Actions/userActions';

const User = t.struct({
    username: t.Str,
    password: t.Str
});

// @connect(state => ({
//         user: state.user
// }))
class LoginForm extends React.Component {

    onLoginClick(e) {
        e.preventDefault();
        const val = this.refs.form.getValue();
        if (val) {
            this.props.dispatch(userLogin(val.username, val.password));
        }
    }

    onLogoutClick() {
        this.props.dispatch(userLogout());
    }

    render() {
        let panel;
        if (this.props.user.isLoggedIn) {
            panel = (
                <div>
                  { this.props.user.user.name }
                  <button onClick={ this.onLogoutClick.bind(this) }>
                    Logout
                  </button>
                  { this.props.children }
                </div>
            );
        } else {
            let options = {
                fields: {
                    password: {
                        type: 'password'
                    }
                }
            };
            panel = (
                <div>
                  <form onSubmit={ this.onLoginClick.bind(this) }>
                    <t.form.Form options={ options }
                                 ref='form'
                                 type={ User } />
                    <button>
                      Login
                    </button>
                  </form>
                </div>
            );
        }

        return panel;
    }
}
export default connect(state => ({
        user: state.user
}))(LoginForm);
