import React from 'react';

interface IPopoverProps {
    onClickOutside?: (event: { target: EventTarget }) => void;
    show: boolean;
}
class Popover extends React.Component<IPopoverProps> {
    static defaultProps: Partial<IPopoverProps> = {
        onClickOutside: function noop() {
            /* Do nothing */
        },
        show: false,
    };

    container: HTMLSpanElement | null;
    constructor(props: IPopoverProps) {
        super(props);
        this.checkClickOutside = this.checkClickOutside.bind(this);
    }
    track() {
        document.addEventListener('mousedown', this.checkClickOutside);
        document.addEventListener('touchstart', this.checkClickOutside);
    }
    unTrack() {
        document.removeEventListener('mousedown', this.checkClickOutside);
        document.removeEventListener('touchstart', this.checkClickOutside);
    }
    componentDidMount() {
        if (this.props.show) {
            this.track();
        }
    }
    componentDidUpdate(prevProps: IPopoverProps) {
        if (!prevProps.show && this.props.show) {
            this.track();
        } else if (prevProps.show && !this.props.show) {
            this.unTrack();
        }
    }
    componentWillUnmount() {
        this.unTrack();
    }
    checkClickOutside(event: { target: EventTarget }) {
        if (
            this.props.onClickOutside &&
            this.container &&
            !this.container.contains(event.target as Node)
        ) {
            this.props.onClickOutside(event); // default props not handled.
        }
    }
    render() {
        if (this.props.show) {
            return (
                <div
                    ref={node => {
                        this.container = node;
                    }}
                    style={{ position: 'relative', display: 'inline-block' }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            zIndex: 1000,
                            top: '4px',
                        }}
                    >
                        {this.props.children}
                    </div>
                </div>
            );
        }
        return null;
    }
}
export default Popover;
