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
  justifyEnd,
  pointer,
} from '../css/classes';
import { IconComp } from '../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../Helper/className';
import { useInternalTranslate } from '../i18n/internalTranslator';
import { modalTranslations } from '../i18n/modal/peerReview';
import { Button } from './Inputs/Buttons/Button';
import { themeCTX } from './Style/Theme';
import { themeVar } from './Style/ThemeVars';

////////////////////////////////////////////////////////////////////////////////////////////////////
// styles

const modalStyle = css({
  position: 'absolute',
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
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  padding: '30px',
  cursor: 'initial',
  boxShadow: '4px 4px 8px rgba(0,0,0,0.2)',
  borderRadius: themeVar.Common.dimensions.BorderRadius,
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

const secondaryButtonStyle = css({
  backgroundColor: 'transparent',
  color: themeVar.Common.colors.PrimaryColor,
  border: '1px solid ' + themeVar.Common.colors.PrimaryColor,
});
////////////////////////////////////////////////////////////////////////////////////////////////////
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
// React element

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
    /**
     * innerClassName - the class to apply on the inner component
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
        className={
          cx(modalStyle, flex, flexColumn, justifyCenter, contentCenter, {
            [pointer]: onExit != null,
          }) + classNameOrEmpty(className)
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
      </div>,
      container.current,
    )
  );
}

interface OkCancelModalProps {
  onOk?: () => void;
  onCancel?: () => void;
}

export function OkCancelModal({
  onOk,
  onCancel,
  children,
}: React.PropsWithChildren<OkCancelModalProps>) {
  const i18nValues = useInternalTranslate(modalTranslations);

  return (
    <Modal>
      <div className={cx(flex, flexColumn)}>
        {children}
        <div className={cx(flex, flexRow, justifyEnd, defaultMarginTop)}>
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

export function useOkCancelModal() {
  const [show, setShow] = React.useState(false);
  const oldHtmlOverflowProperty = React.useRef<string | null>(null);

  const setHTMLScroll = React.useCallback((scroll: boolean) => {
    const htmlTag = document.getElementsByTagName('html')[0];
    if (scroll) {
      htmlTag.style.setProperty('overflow', oldHtmlOverflowProperty.current);
    } else {
      oldHtmlOverflowProperty.current =
        htmlTag.style.overflow === '' ? null : htmlTag.style.overflow;
      htmlTag.style.setProperty('overflow', 'hidden');
    }
    return () => {
      htmlTag.style.setProperty('overflow', oldHtmlOverflowProperty.current);
    };
  }, []);

  const showModal = function () {
    setShow(true);
    setHTMLScroll(false);
  };

  function Modal({
    onCancel,
    onOk,
    children,
  }: React.PropsWithChildren<OkCancelModalProps>) {
    return show ? (
      <OkCancelModal
        onCancel={() => {
          setShow(false);
          onCancel && onCancel();
        }}
        onOk={() => {
          setHTMLScroll(true);
          setShow(false);
          onOk && onOk();
        }}
      >
        {children}
      </OkCancelModal>
    ) : null;
  }
  return { showModal, OkCancelModal: Modal };
}
