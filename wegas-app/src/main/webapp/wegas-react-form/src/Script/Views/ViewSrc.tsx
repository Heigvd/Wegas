import classNames from 'classnames';
import { css } from 'glamor';
import React from 'react';
import debounced from '../../HOC/callbackDebounce';
import JSEditor from './asyncJSEditor';

interface IViewSrcProps {
    value: string;
    error: string;
    onChange: (value: string) => void;
}

const iconStyle = css({
    label: 'ViewSrc-iconStyle',
    cursor: 'pointer',
    verticalAlign: '4px',
    padding: '2px',
    border: '1px solid lightgray',
    borderRadius: '50%',
    position: 'relative',
    marginLeft: '5px',
    fontSize: '10px',
    ':hover': {
        background: 'lightgray',
    },
});

const viewSourceTooltip = 'Open source code';
const hideSourceTooltip = 'Hide source code';

/**
 * Toggle view between parsed and code
 */
class ViewSrc extends React.Component<IViewSrcProps, { src: boolean }> {
    constructor(props: IViewSrcProps) {
        super(props);
        this.state = { src: false };
        this.toggleState = this.toggleState.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }
    toggleState() {
        this.setState({
            src: !this.state.src,
        });
    }
    handleChange(value: string) {
        this.props.onChange(value);
    }
    render() {
        let child;
        if (this.state.src || this.props.error) {
            child = [
                <JSEditor
                    key="editor"
                    value={this.props.value}
                    width="100%"
                    height="200px"
                    focus
                    onChange={this.handleChange}
                />,
                <div key="error">{this.props.error || <br />}</div>,
            ];
        } else {
            child = this.props.children;
        }
        return (
            <span>
                <i
                    className={classNames('fa fa-code', `${iconStyle}`)}
                    title={this.state.src ? hideSourceTooltip : viewSourceTooltip}
                    onClick={this.toggleState}
                />
                <div>
                    {child}
                </div>
            </span>
        );
    }
}

export default debounced('onChange')(ViewSrc);
