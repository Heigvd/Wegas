import classNames from 'classnames';
import { css } from 'glamor';
import React from 'react';
import debounced from '../../HOC/callbackDebounce';
import JSEditor from './asyncJSEditor';

interface IProps {
    value: string;
    error: string;
    onChange: (value: string) => void;
}
/**
 * Toggle view between parsed and code
 */
class ViewSrc extends React.Component<IProps, { src: boolean }> {
    constructor(props: IProps) {
        super(props);
        this.state = { src: false };
        this.toggleState = this.toggleState.bind(this);
        this.handleChange.bind(this);
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
                    className={classNames('fa fa-code', css({ icon: 'pointer' }).toString())}
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
