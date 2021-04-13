import { css, cx } from 'emotion';
import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  contentCenter,
  flex,
  flexColumn,
  flexRow,
  justifyCenter,
  pointer,
} from '../css/classes';
import { IconComp } from '../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../Helper/className';
import { internalTranslate } from '../i18n/internalTranslator';
import { modalTranslations } from '../i18n/modal/peerReview';
import { languagesCTX } from './Contexts/LanguagesProvider';
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
  padding: '10px',
  cursor: 'initial',
  boxShadow: '0 0 1px 1px',
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
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(modalTranslations, lang);

  return (
    <Modal>
      <div className={cx(flex, flexColumn)}>
        {children}
        <div className={cx(flex, flexRow)}>
          <Button label={i18nValues.ok} onClick={onOk} />
          <Button label={i18nValues.cancel} onClick={onCancel} />
        </div>
      </div>
    </Modal>
  );
}

export function useOkCancelModal() {
  const [show, setShow] = React.useState(false);
  const showModal = function () {
    setShow(true);
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
