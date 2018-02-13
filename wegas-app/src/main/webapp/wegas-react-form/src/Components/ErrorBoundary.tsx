import * as React from 'react';

interface ErrorBoundaryProps {
    message?: string;
}
export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    { info?: React.ErrorInfo; error?: Error }
> {
    static defaultProps: ErrorBoundaryProps = {
        message: 'Something went wrong.',
    };
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { error: undefined, info: undefined };
    }
    componentWillReceiveProps() {
        this.setState(() => ({ error: undefined, info: undefined }));
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        this.setState(() => ({
            error,
            info,
        }));
    }
    render() {
        if (this.state.error && this.state.info) {
            return (
                <div>
                    <h3>{this.props.message}</h3>
                    <span />
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.info.componentStack}
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}
