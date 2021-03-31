import { css, cx } from 'emotion';
import * as React from 'react';
import { useOnClickOutside } from '../Components/Hooks/useOnClickOutside';
import { Toolbar } from '../Components/Toolbar';
import { flex } from '../css/classes';
import { IconComp } from '../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../Helper/className';
import { wlog } from '../Helper/wegaslog';

////////////////////////////////////////////////////////////////////////////////////////////////////
// styles

const overlayStyle = css({
  position: 'absolute',
  top: 0,
  left: 0,
  overflow: 'auto',
  maxWidth: '400px',
  height: '200px',
  padding: '1.5em',
  zIndex: 1000,
  cursor: 'pointer',
  backgroundColor: 'white',
  border: '3px',
});

const modalCloseDivStyle = css({
  display: 'flex',
  position: 'absolute',
  top: 0,
  left: 'calc(100% - 1.5em)',
  width: '1.5em',
  height: '1.5em',
  cursor: 'pointer',
  color: 'black',
});

const modalCloseButtonStyle = css({
  margin: 'auto',
});

// React element

interface InfoOverlayProps extends ClassStyleId {
  /**
   * onExit - called when <esc> key is pressed or when clicked outside of the content of the overlay
   */
  onExit: () => void;
  /**
   * content - the content of the pop up, recieved by the the server in html tag
   */
  content: string;
  /**
   * innerStyle- the style to apply on the inner component
   */
  innerStyle?: React.CSSProperties;
}

export function InfoOverlay({
  onExit,
  content,
  innerStyle,
  className,
  style,
  id,
}: InfoOverlayProps) {
  const infoOverlayZone = React.useRef<HTMLDivElement | null>(null);
  useOnClickOutside(infoOverlayZone, onExit);

  return (
    //use here hook useClickOutside()
    <div
      ref= {ref => {
          if (ref != null) {
            infoOverlayZone.current = ref;
            ref.focus();
             const refBoundaries = ref.getBoundingClientRect();
             wlog("HOLAAAAAA" + refBoundaries.width);
           }
         }}
      className={cx(overlayStyle, flex) + classNameOrEmpty(className)}
      style={style}
      id={id}
      //onClick={bgClick}
    >
      <div style={innerStyle}>
        <div className={modalCloseDivStyle} onClick={onExit}>
          <IconComp icon="window-close" className={modalCloseButtonStyle} />
        </div>
        <Toolbar>
          <Toolbar.Header>
            <h2>Title of Overlay</h2>
          </Toolbar.Header>
          <Toolbar.Content>
            <div
              dangerouslySetInnerHTML={{
                __html: content ? content : '',
              }}
            />
          </Toolbar.Content>
        </Toolbar>
      </div>
    </div>
  );
}
