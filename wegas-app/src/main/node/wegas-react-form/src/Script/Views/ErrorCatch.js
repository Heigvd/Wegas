import * as React from 'react';
import { css } from '@emotion/css';
import JSEditor from './asyncJSEditor';

const errorStyle = css({
    color: '#999',
    fontSize: '12px',
    fontStyle: 'italic',
    paddingTop: '3px',
});
// eslint-disable-next-line
export class ErrorCatch extends React.Component {

    constructor(props) {
        super(props);
        this.state = { error: undefined };
        this.onErrorBlur = this.onErrorBlur.bind(this);
    }
    componentDidUpdate(prevProps) {
        if (prevProps.code !== this.props.code) {
            this.setState({
                error: undefined,
            });
        }
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    onErrorBlur(target, editor) {
        this.props.onChange(editor.getValue());
    }
    render() {
        if (this.state.error) {
            return (
                <>
                    <JSEditor
                        value={this.props.code}
                        width="100%"
                        height="200px"
                        onBlur={this.onErrorBlur}
                    />
                    <div className={errorStyle}>{this.state.error.message}</div>
                </>
            );
        }
        return this.props.children;
    }
}
