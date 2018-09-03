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
  backgroundColor:"rgba(0,0,0,0.8)",
  zIndex: 1,
  '&>div': {
    backgroundColor: themeVar.backgroundColor,
    margin: '0 auto',
    padding: '10px',
    boxShadow: '0 0 1px 1px',
    maxWidth: '80%',
  },
});

export function Modal({
  show = false,
  children,
  onBgClick,
}: {
  show?: boolean;
  children: React.ReactNode;
  onBgClick?: () => void;
}) {
  return (
    <ThemeRoot>
      {root => {
        return show && root !== null
          ? createPortal(
              <div
                className={modalStyle}
                onClick={e =>
                  typeof onBgClick === 'function' &&
                  e.target === e.currentTarget &&
                  onBgClick()
                }
              >
                {children}
              </div>,
              root,
            )
          : null;
      }}
    </ThemeRoot>
  );
}
