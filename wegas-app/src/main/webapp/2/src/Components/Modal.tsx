import { css, cx } from 'emotion';
import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  contentCenter,
  defaultMarginLeft,
  defaultMarginTop,
  flex,
  flexColumn,
  flexRow,
  justifyCenter,
  layoutStyle,
  pointer,
} from '../css/classes';
import { IconComp } from '../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../Helper/className';
import { useInternalTranslate } from '../i18n/internalTranslator';
import { modalTranslations } from '../i18n/modal/modal';
import { Button } from './Inputs/Buttons/Button';
import { themeCTX } from './Theme/Theme';
import { themeVar } from './Theme/ThemeVars';

////////////////////////////////////////////////////////////////////////////////////////////////////
// styles

const modalStyle = (fixed: boolean) =>
  css({
    position: fixed ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    overflow: 'auto',
    minWidth: '100%',
    height: '100%',
    padding: '1.5em',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1000,
  });

const modalContentStyle = css({
  margin: '0 auto',
  maxWidth: '100%',
  backgroundColor: themeVar.colors.BackgroundColor,
  padding: '30px',
  cursor: 'initial',
  boxShadow: '4px 4px 8px rgba(0,0,0,0.2)',
  borderRadius: themeVar.dimensions.BorderRadius,
  '&:focus': {
    outline: 'none',
  },
});

const modalCloseDivStyle = css({
  display: 'flex',
  position: 'absolute',
  top: 0,
  left: 'calc(100% - 1.5em)',
  width: '1.5em',
  height: '1.5em',
  cursor: 'pointer',
  color: 'white',
});

const modalCloseButtonStyle = css({
  margin: 'auto',
});

export const secondaryButtonCSS = {
  backgroundColor: 'transparent',
  color: themeVar.colors.PrimaryColor,
  border: '1px solid ' + themeVar.colors.PrimaryColor,
  ['&:hover']: {
    color: themeVar.colors.ActiveColor,
    backgroundColor: themeVar.colors.HoverColor,
    borderColor: 'transparent',
  },
};

export const secondaryButtonStyle = css(
  secondaryButtonCSS
);
////////////////////////////////////////////////////////////////////////////////////////////////////
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
// React element

export type ModalProps = React.PropsWithChildren<
  {
    /**
     * onExit - called when <esc> key is pressed or when clicked outside of the content of the modal
     */
    onExit?: (event?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    /**
     * unattached - The modal component will be rendered as a child of the calling component.
     * attachedToId won't be used
     */
    unattached?: boolean;
    /**
     * attachedTo - the ID of the element to insert the modal (will cover the whole element). By default, gets the last themeCTX provider
     * if unattached is set to true, this prop won't be used.
     */
    attachedToId?: string;
    /**
     * innerClassName - the class to apply on the inner component
     * if false, will simply render in the parent element.
     */
    innerClassName?: string;
    /**
     * innerStyle- the style to apply on the inner component
     */
    innerStyle?: React.CSSProperties;
  } & ClassStyleId
>;

export function Modal({
  children,
  onExit,
  unattached,
  attachedToId,
  className,
  style,
  innerStyle,
  innerClassName,
  id,
}: ModalProps) {
  const { themeRoot } = React.useContext(themeCTX);
  const container = React.useRef<HTMLElement | null>(null);
  const modal = React.useRef<HTMLDivElement | null>(null);

  if (attachedToId) {
    container.current = document.getElementById(attachedToId);
  } else if (!unattached && themeRoot?.current) {
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
        e.stopPropagation();
        onExit(e);
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

  const modalComponent = React.useMemo(() => {
    return (
      <div
        className={
          cx(
            layoutStyle,
            modalStyle(!attachedToId),
            flex,
            flexColumn,
            justifyCenter,
            contentCenter,
            {
              [pointer]: onExit != null,
            },
          ) + classNameOrEmpty(className)
        }
        style={style}
        id={id}
        onClick={bgClick}
      >
        <div
          ref={modal}
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
          style={innerStyle}
          className={modalContentStyle + classNameOrEmpty(innerClassName)}
        >
          {onExit && (
            <div className={modalCloseDivStyle} onClick={onExit}>
              <IconComp icon="window-close" className={modalCloseButtonStyle} />
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }, [
    attachedToId,
    bgClick,
    children,
    className,
    id,
    innerClassName,
    innerStyle,
    onExit,
    style,
  ]);

  if (container.current) {
    return container.current && createPortal(modalComponent, container.current);
  } else {
    return modalComponent;
  }
}

interface OkCancelModalProps {
  onOk?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onCancel?: (event?: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  unattached?: boolean;
  attachedToId?: string;
}

export function OkCancelModal({
  onOk,
  onCancel,
  unattached,
  attachedToId,
  children,
}: React.PropsWithChildren<OkCancelModalProps>) {
  const i18nValues = useInternalTranslate(modalTranslations);

  return (
    <Modal
      attachedToId={attachedToId}
      unattached={unattached}
      onExit={onCancel}
    >
      <div className={cx(flex, flexColumn)}>
        {children}
        <div className={cx(flex, flexRow, justifyCenter, defaultMarginTop)}>
          <Button
            label={i18nValues.cancel}
            onClick={onCancel}
            className={secondaryButtonStyle}
          />
          <Button
            label={i18nValues.ok}
            onClick={onOk}
            className={defaultMarginLeft}
          />
        </div>
      </div>
    </Modal>
  );
}

export function useOkCancelModal(attachedToId?: string) {
  const [show, setShow] = React.useState(false);
  const showModal = function () {
    setShow(true);
  };
  const Modal = React.useCallback(
    ({
      onCancel,
      onOk,
      children,
    }: React.PropsWithChildren<OkCancelModalProps>) => {
      return show ? (
        <OkCancelModal
          attachedToId={attachedToId}
          onCancel={e => {
            setShow(false);
            onCancel && onCancel(e);
          }}
          onOk={e => {
            setShow(false);
            onOk && onOk(e);
          }}
        >
          {children}
        </OkCancelModal>
      ) : null;
    },
    [attachedToId, show],
  );
  return { showModal, OkCancelModal: Modal };
}