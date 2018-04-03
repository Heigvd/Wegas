import * as React from 'react';
import { connect } from 'react-redux';
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 10000,
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: '100%',
    height: '100%',
};
class Overlay extends React.Component {
    render() {
        const style = Object.assign({}, overlayStyle, {
            display: this.props.overlay ? 'block' : 'none',
        });
        return (
            <div style={ style } />
            );
    }
}

export default connect(state => {
    return {
        overlay: state.globalState.overlay,
    };
})(Overlay);
