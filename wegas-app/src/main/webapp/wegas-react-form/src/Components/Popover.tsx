import React from 'react';

interface IPopoverprops {
    onClickOutside: () => void;
    show: boolean;
}
class Popover extends React.Component<IPopoverprops> {
    static defaultProps: IPopoverprops = {
        onClickOutside: function noop() {},
        show: false
    };

    container: HTMLDivElement | null;
    constructor(props: IPopoverprops) {
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
    checkClickOutside(event: MouseEvent) {
        if (this.container && !this.container.contains(event.target as Node)) {
            this.props.onClickOutside();
        }
    }
    render() {
        if (this.props.show) {
            return (
                <div
                    ref={node => {
                        this.container = node;
                    }}
                    style={{ position: 'relative' }}
                >
                    <div style={{ position: 'absolute', zIndex: 1000 }}>
                        {this.props.children}
                    </div>
                </div>
            );
        }
        return null;
    }
}
Popover.defaultProps = {
    onClickOutside: function noop() {},
    show: false
};
export default Popover;
