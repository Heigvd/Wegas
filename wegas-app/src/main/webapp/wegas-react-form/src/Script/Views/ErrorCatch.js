import * as React from 'react';
import { print, parse } from 'recast';
import JSEditor from './asyncJSEditor';

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
                    <div>{this.state.error.message}</div>
                </>
            );
        }
        return this.props.children;
    }
}
