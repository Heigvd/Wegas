import * as React from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';

const floatingLayerContainer = css({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  pointerEvents: 'none',
  zIndex: 11111,
});

/**
 * Allows children to appear in front of everything, centered at the top.
 */
export function FloatingLayer({ children }: { children: React.ReactNode }): JSX.Element {
  return createPortal(
    <div className={floatingLayerContainer} role="region" aria-label="Announcements" aria-live="polite">
      {children}
    </div>,
    document.body,
  );
}