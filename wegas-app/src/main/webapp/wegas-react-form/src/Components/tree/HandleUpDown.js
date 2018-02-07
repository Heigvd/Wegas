import PropTypes from 'prop-types';
import React from 'react';

function visibleSelector(from = document, selector) {
    // get visible elements
    return Array.prototype.filter.call(
        from.querySelectorAll(selector),
        n => n.offsetParent
    );
}
/**
 * @class HandleUpDown
 * @extends React.Component<{selector:string}>
 */
class HandleUpDown extends React.Component {
    constructor(props) {
        super(props);
        this.handleUpDown = this.handleUpDown.bind(this);
    }
    handleUpDown(ev) {
        let dir = 0;
        switch (ev.key) {
            case 'ArrowUp':
                dir = -1;
                ev.stopPropagation();
                ev.preventDefault();
                break;
            case 'ArrowDown':
                dir = +1;
                ev.stopPropagation();
                ev.preventDefault();
                break;
            default:
                return;
        }
        this.focus(dir);
    }
    focus(inc) {
        const curr = document.activeElement;
        const heads = visibleSelector(this.root, this.props.selector);
        const i = heads.indexOf(curr) + inc;
        if (heads[i]) {
            heads[i].focus();
        }
    }
    render() {
        return (
            <div
                tabIndex="-1"
                ref={n => {
                    this.root = n;
                }}
                onKeyDown={this.handleUpDown}
            >
                {this.props.children}
            </div>
        );
    }
}
HandleUpDown.propTypes = {
    children: PropTypes.node.isRequired,
    selector: PropTypes.string.isRequired,
};

export default HandleUpDown;
