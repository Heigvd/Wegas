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
    'cursor': 'pointer',
    'verticalAlign': '1px',
    'padding': '4px',
    'borderRadius': '50%',
    ':hover': {
        background: 'lightgray',
    },
});

const viewSourceTooltip = 'View source code';
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
