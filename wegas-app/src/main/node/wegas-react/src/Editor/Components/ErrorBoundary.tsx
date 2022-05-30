import * as React from 'react';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { wwarn } from '../../Helper/wegaslog';
// https://reactjs.org/docs/error-boundaries.html

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
