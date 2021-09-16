import { css, cx } from '@emotion/css';
import * as React from 'react';
import { useOnClickOutside } from '../Components/Hooks/useOnClickOutside';
import { HTMLText } from '../Components/Outputs/HTMLText';
import { themeVar } from '../Components/Theme/ThemeVars';
import { Toolbar } from '../Components/Toolbar';
import { flex } from '../css/classes';
import { IconComp } from '../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../Helper/className';

////////////////////////////////////////////////////////////////////////////////////////////////////
// styles

const overlayStyle = css({
  position: 'absolute',
  top: 0,
  left: 0,
  maxWidth: '450px',
  maxHeight: '300px',
  padding: '2em',
  zIndex: 1000,
  backgroundColor: 'white',
  borderRadius: themeVar.dimensions.BorderRadius,
  boxShadow: '1px 2px 16px rgba(0, 0, 0, 0.2)',
  '&:before': {
    content: "''",
    width: 0,
    height: 0,
    borderRight: '15px solid ' + themeVar.colors.SecondaryBackgroundColor,
    borderTop: '15px solid transparent',
    borderBottom: '15px solid transparent',
    position: 'absolute',
    zIndex: 1001,
    left: '-13px',
    top: '43px',
  },
});
const overlayContentStyle = css({
  overflow: 'auto',
});
const modalCloseDivStyle = css({
  display: 'flex',
  position: 'absolute',
  top: 0,
  left: 'calc(100% - 2em)',
  width: '2em',
  height: '2em',
  cursor: 'pointer',
  color: themeVar.colors.DarkTextColor,
});

const modalCloseButtonStyle = css({
  margin: 'auto',
});

function placeOverlay(
  ref: HTMLDivElement,
  attachedToRef: React.RefObject<HTMLButtonElement>,
) {
  if (ref != null && attachedToRef.current != null) {
    const buttonBottom = attachedToRef.current.getBoundingClientRect().bottom;
    const parentTop = ref.parentElement?.getBoundingClientRect().top || 0;
    const buttonLeft = attachedToRef.current.getBoundingClientRect().right;
    const parentLeft = ref.parentElement?.getBoundingClientRect().left || 0;
    ref.style.setProperty('top', buttonBottom - parentTop - 60 + 'px');
    ref.style.setProperty('left', buttonLeft - parentLeft + 10 + 'px');
  }
}
// React element

interface InfoOverlayProps extends ClassStyleId {
  /**
   * content - the title of the pop up, recieved by the the server in html tag
   */
  title: string;
  /**
   * content - the content of the pop up, recieved by the the server in html tag
   */
  content: string;
  /**
   * onExit - called when <esc> key is pressed or when clicked outside of the content of the overlay
   */
  onExit: () => void;
  /**
   * innerStyle- the style to apply on the inner component
   */
  innerStyle?: React.CSSProperties;
  /**
   * attachedToRef
   */
  attachedToRef: React.RefObject<HTMLButtonElement>;
}

export function InfoOverlay({
  title,
  content,
  onExit,
  innerStyle,
  attachedToRef,
  className,
  style,
  id,
}: InfoOverlayProps) {
  const infoOverlayZone = React.useRef<HTMLDivElement | null>(null);
  useOnClickOutside(infoOverlayZone, onExit);

  return (
    //use here hook useClickOutside()
    <div
      ref={ref => {
        if (ref != null) {
          infoOverlayZone.current = ref;
          placeOverlay(ref, attachedToRef);
        }
      }}
      className={cx(overlayStyle, flex) + classNameOrEmpty(className)}
      style={style}
      id={id}
      //onClick={bgClick}
    >
      <div className={overlayContentStyle} style={innerStyle}>
        <div className={modalCloseDivStyle} onClick={onExit}>
          <IconComp icon="window-close" className={modalCloseButtonStyle} />
        </div>
        <Toolbar>
          <Toolbar.Header>
            <h2>{title}</h2>
          </Toolbar.Header>
          <Toolbar.Content>
            <HTMLText text={content} />
          </Toolbar.Content>
        </Toolbar>
      </div>
    </div>
  );
}
