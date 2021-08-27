import * as React from 'react';

function visibleSelector(
  from: ParentNode = document,
  selector: string,
): HTMLElement[] {
  // get visible elements
  return Array.prototype.filter.call(
    from.querySelectorAll(selector),
    (n: HTMLElement) => n.offsetParent,
  );
}
interface HandleUpDownProps {
  selector: string;
}
/**
 * @class HandleUpDown
 * @extends React.Component<{selector:string}>
 */
class HandleUpDown extends React.Component<HandleUpDownProps> {
  private root: HTMLDivElement | null = null;
  private handleUpDown = (ev: React.KeyboardEvent) => {
    let dir = 0;
    switch (ev.key) {
      case 'ArrowUp':
        dir = -1;
        ev.stopPropagation();
        ev.preventDefault();
        break;
      case 'ArrowDown':
        dir = +1;
        ev.stopPropagation();
        ev.preventDefault();
        break;
      default:
        return;
    }
    this.focus(dir);
  };
  focus(inc: number) {
    const curr = document.activeElement;
    if (curr != null && this.root != null) {
      const heads = visibleSelector(this.root, this.props.selector);
      const currPos = heads.indexOf(curr as HTMLElement);
      const i = currPos + inc;
      if (heads[i]) {
        heads[i].focus();
      }
    }
  }
  render() {
    return (
      <div
        tabIndex={-1}
        ref={n => {
          this.root = n;
        }}
        onKeyDown={this.handleUpDown}
      >
        {this.props.children}
      </div>
    );
  }
}

export default HandleUpDown;
