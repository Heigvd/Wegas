import * as React from 'react';

interface Props {
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    message?: string;
}

class ErrorBoundary extends React.Component<Props, State> {
    
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, message: `[${error.name}]: ${error.message}` };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {}

    public render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            } else {
                return <h1>Sorry.. there was an error</h1>;
            }
        } else {
            return this.props.children;
        }
    }
}

export default ErrorBoundary;
