import PropTypes from 'prop-types';
import React from 'react';

class Popover extends React.Component {
    constructor(props) {
        super(props);
        this.checkClickOutside = this.checkClickOutside.bind(this);
    }
    componentDidMount() {
        document.addEventListener('mousedown', this.checkClickOutside);
        document.addEventListener('touchstart', this.checkClickOutside);
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.checkClickOutside);
        document.removeEventListener('touchstart', this.checkClickOutside);
    }
    checkClickOutside(event) {
        if (this.container && !this.container.contains(event.target)) {
            this.props.onClickOutside();
        }
    }
    render() {
        if (this.props.show) {
            return (
                <div
                    ref={node => { this.container = node; }}
                    style={{ position: 'relative' }}
                >
                    <div style={{ position: 'absolute', zIndex: 1000 }} >
                        {this.props.children}
                    </div>
                </div>
            );
        }
        return null;
    }
}
Popover.defaultProps = {
    onClickOutside: function noop() { },
    show: false
};
Popover.propTypes = {
    onClickOutside: PropTypes.func,
    show: PropTypes.bool,
    children: PropTypes.node.isRequired
};
export default Popover;
