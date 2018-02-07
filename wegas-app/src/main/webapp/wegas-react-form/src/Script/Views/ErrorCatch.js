import * as React from 'react';
import { css } from 'glamor';
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
        this.state = { error: undefined, info: undefined };
        this.onErrorBlur = this.onErrorBlur.bind(this);
    }
    componentWillReceiveProps() {
        this.setState(() => ({ error: undefined, info: undefined }));
    }
    onErrorBlur(target, editor) {
        this.props.onChange(editor.getValue());
    }
    componentDidCatch(error, info) {
        this.setState(() => ({
            error,
            info,
        }));
    }
    render() {
        if (this.state.error && this.state.info) {
            return (
                <>
                    <JSEditor
                        value={this.props.code}
                        width="100%"
                        height="200px"
                        onBlur={this.onErrorBlur}
                    />
                    <div {...errorStyle}>{this.state.error.message}</div>
                </>
            );
        }
        return this.props.children;
    }
}
