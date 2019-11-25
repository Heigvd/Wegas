import * as React from 'react';
import { createPortal } from 'react-dom';
import { css } from 'emotion';
import { ThemeRoot, themeVar } from './Theme';

const modalStyle = css({
  position: 'fixed',
  top: 0,
  left: 0,
  overflow: 'auto',
  width: '100%',
  height: '100%',
  padding: '1em 0',
  backgroundColor: 'rgba(0,0,0,0.8)',
  zIndex: 1000,
  '&>div': {
    width: 'fit-content',
    backgroundColor: themeVar.backgroundColor,
    margin: '0 auto',
    padding: '10px',
    boxShadow: '0 0 1px 1px',
    maxWidth: '80%',
  },
});

export class Modal extends React.Component<{
  children: React.ReactNode;
  onExit?: () => void;
}> {
  modal = React.createRef<HTMLDivElement>();
  onEscape = (e: KeyboardEvent) => {
    const { onExit } = this.props;
    typeof onExit === 'function' && e.key === 'Escape' && onExit();
  };
  bgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { onExit } = this.props;
    typeof onExit === 'function' && e.target === e.currentTarget && onExit();
  };
  componentDidMount() {
    document.addEventListener('keydown', this.onEscape, { passive: true });
    if (this.modal.current !== null) {
      this.modal.current.focus();
    }
  }
  componentWillUnmount() {
    document.removeEventListener('keydown', this.onEscape);
  }
  render() {
    const { children } = this.props;
    return (
      <ThemeRoot>
        {values => {
          return values.themeRoot && values.themeRoot.current
            ? createPortal(
                <div className={modalStyle} onClick={this.bgClick}>
                  <div
                    ref={this.modal}
                    aria-modal="true"
                    role="dialog"
                    tabIndex={-1}
                  >
                    {children}
                  </div>
                </div>,
                values.themeRoot.current,
              )
            : null;
        }}
      </ThemeRoot>
    );
  }
}
