import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

type DOMRectReadOnly = ResizeObserverEntry['contentRect'];
interface Child {
  /**
   * @param size DOMReact undefined on first mount.
   */
  (size?: DOMRectReadOnly): React.ReactNode;
}
/**
 * A div element. Render child with it's size (DOMRect) as first parameter
 */
export class SizedDiv extends React.Component<
  React.HTMLAttributes<HTMLDivElement> & {
    children: Child;
  },
  { readonly size?: DOMRectReadOnly }
> {
  readonly state: Readonly<{ size?: DOMRectReadOnly }> = { size: undefined };
  // as of ts 4.2, ResizeObserver callback is typed mistyped as any...
  private readonly obs = new ResizeObserver((entries : ResizeObserverEntry[]) => {
    if (entries.length === 1) {
      this.setState({ size: entries[0].contentRect });
    }
  });
  div: HTMLDivElement | null = null;
  componentDidMount() {
    this.obs.observe(this.div!);
  }
  componentWillUnmount() {
    this.obs.disconnect();
    this.div = null;
  }
  render() {
    const { children, ...restProps } = this.props;
    return (
      <div
        ref={n => {
          this.div = n;
        }}
        {...restProps}
      >
        {children(this.state.size)}
      </div>
    );
  }
}
