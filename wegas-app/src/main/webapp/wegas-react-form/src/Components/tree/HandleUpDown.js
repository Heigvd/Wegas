import React from 'react';

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
        const curr = document.activeElement;
        const heads = Array.prototype.filter.call(
            this.root.querySelectorAll(this.props.selector), n => n.offsetParent);
        const i = heads.indexOf(curr) + dir;
        if (heads[i]) {
            heads[i].focus();
        }
    }
    render() {
        return (
            <div
                tabIndex="-1"
                ref={(n) => {
                    this.root = n;
                }}
                onKeyDown={this.handleUpDown}
            >
                {this.props.children}
            </div>);
    }
}

export default HandleUpDown;
