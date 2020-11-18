import * as React from 'react';
import { createPortal } from 'react-dom';
import { css } from 'emotion';
import { themeCTX } from './Style/Theme';
import { themeVar } from './Style/ThemeVars';
import { classNameOrEmpty } from '../Helper/className';

const modalStyle = css({
  position: 'absolute',
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
    backgroundColor: themeVar.Common.colors.BackgroundColor,
    borderWidth: themeVar.Common.dimensions.BorderWidth,
    margin: '0 auto',
    padding: '10px',
    boxShadow: '0 0 1px 1px',
    maxWidth: '80%',
  },
});

export type ModalProps = React.PropsWithChildren<
  {
    /**
     * onExit - called when <esc> key is pressed or when clicked outside of the content of the modal
     */
    onExit?: () => void;
    /**
     * attachedTo - the ID of the element to insert the modal (will cover the whole element). By default, gets the last themeCTX provider
     */
    attachedToId?: string;
  } & ClassStyleId
>;

export function Modal({
  children,
  onExit,
  attachedToId,
  className,
  style,
  id,
}: ModalProps) {
  const { themeRoot } = React.useContext(themeCTX);
  const container = React.useRef<HTMLElement | null>(null);
  const modal = React.useRef<HTMLDivElement | null>(null);

  if (attachedToId) {
    container.current = document.getElementById(attachedToId);
  } else if (themeRoot?.current) {
    container.current = themeRoot?.current;
  }

  const onEscape = React.useCallback(
    (e: KeyboardEvent) => {
      if (onExit && e.key === 'Escape') {
        onExit();
      }
    },
    [onExit],
  );

  const bgClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (onExit && e.target === e.currentTarget) {
        onExit();
      }
    },
    [onExit],
  );

  React.useEffect(() => {
    document.addEventListener('keydown', onEscape, { passive: true });
    if (modal.current !== null) {
      modal.current.focus();
    }
    return () => {
      document.removeEventListener('keydown', onEscape);
    };
  }, [onEscape]);

  return (
    container.current &&
    createPortal(
      <div
        className={modalStyle + classNameOrEmpty(className)}
        style={style}
        id={id}
        onClick={bgClick}
      >
        <div ref={modal} aria-modal="true" role="dialog" tabIndex={-1}>
          {children}
        </div>
      </div>,
      container.current,
    )
  );
}
