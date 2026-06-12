import * as React from 'react';
import { Button } from './Inputs/Buttons/Button';
import { wwarn } from '../Helper/wegaslog';

/**
 * 12.06.2026
 * React still has no hooks or function-component error boundary.
 * getDerivedStateFromError and componentDidCatch are class-only lifecycle methods,
 * and that hasn't changed through React 18/19
 *
 * https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
export class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    wwarn(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div /*className={cx(expandBoth, flexColumn, itemCenter, flexDistribute)}*/
        >
          <h1>Something went wrong.</h1>
          <Button
            label={'Retry'}
            onClick={() => this.setState({ hasError: false })}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
