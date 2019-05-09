import * as React from 'react';
import { css, cx } from 'emotion';
import { __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd } from 'react-dnd';
import { Toolbar } from '../../../Components/Toolbar';
import { primaryLight, primaryDark } from '../../../Components/Theme';

const compoContent = css({
  // backgroundColor: 'grey',
  position: 'relative',
  height: 'auto',
});

const highlighted = css({
  backgroundColor: 'lightgreen',
});

const dropLeftZone = css({
  // backgroundColor: 'green',
  position: 'absolute',
  width: '20%',
  height: '60%',
  left: 0,
  top: '20%',
});

const dropRightZone = css({
  // backgroundColor: 'red',
  position: 'absolute',
  width: '20%',
  height: '60%',
  right: 0,
  top: '20%',
});

const dropTopZone = css({
  // backgroundColor: 'blue',
  position: 'absolute',
  width: '60%',
  height: '20%',
  top: 0,
  left: '20%',
});

const dropBottomZone = css({
  // backgroundColor: 'yellow',
  position: 'absolute',
  width: '60%',
  height: '20%',
  bottom: 0,
  left: '20%',
});

export interface TabComponent {
  id: number;
  name: string;
  component: JSX.Element;
}

interface TabLayoutProps {
  active?: number;
  vertical?: boolean;
  tabs: TabComponent[];
  onDropTab: (item: { id: number; type: string }) => void;
  onDropLeft: (item: { id: number; type: string }) => void;
  onDropRight: (item: { id: number; type: string }) => void;
  onDropTop: (item: { id: number; type: string }) => void;
  onDropBottom: (item: { id: number; type: string }) => void;
}

const accept = 'DnDTab';

export function DnDTabLayout(props: React.PropsWithChildren<TabLayoutProps>) {
  const [active, setActive] = React.useState(props.active || 0);

  const [dropTabProps, dropTab] = dnd.useDrop({
    accept: accept,
    canDrop: () => true,
    drop: props.onDropTab,
    collect: mon => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
  });

  const [dropLeftProps, dropLeft] = dnd.useDrop({
    accept: accept,
    canDrop: () => true,
    drop: props.onDropLeft,
    collect: mon => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
  });

  const [dropRightProps, dropRight] = dnd.useDrop({
    accept: accept,
    canDrop: () => true,
    drop: props.onDropRight,
    collect: mon => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
  });

  const [dropTopProps, dropTop] = dnd.useDrop({
    accept: accept,
    canDrop: () => true,
    drop: props.onDropTop,
    collect: mon => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
  });

  const [dropBottomProps, dropBottom] = dnd.useDrop({
    accept: accept,
    canDrop: () => true,
    drop: props.onDropBottom,
    collect: mon => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
  });
  return (
    <Toolbar vertical={props.vertical}>
      <div
        ref={dropTab}
        className={
          dropTabProps.isOver && dropTabProps.canDrop ? highlighted : ''
        }
      >
        <Toolbar.Header>
          {props.tabs.map((t, i) => {
            return (
              <Tab
                key={t.id}
                id={t.id}
                active={i === active}
                onClick={() => setActive(i)}
              >
                {t.name}
              </Tab>
            );
          })}
        </Toolbar.Header>
      </div>
      <Toolbar.Content className={compoContent}>
        {props.tabs.map((t, i) => {
          return (
            <div
              key={t.id}
              style={{ visibility: i === active ? 'visible' : 'hidden' }}
            >
              {t.component}
            </div>
          );
        })}
        <div
          ref={dropLeft}
          className={cx(
            dropLeftZone,
            dropLeftProps.isOver && dropLeftProps.canDrop ? highlighted : '',
          )}
        />
        <div
          ref={dropRight}
          className={cx(
            dropRightZone,
            dropRightProps.isOver && dropRightProps.canDrop ? highlighted : '',
          )}
        />
        <div
          ref={dropTop}
          className={cx(
            dropTopZone,
            dropTopProps.isOver && dropTopProps.canDrop ? highlighted : '',
          )}
        />
        <div
          ref={dropBottom}
          className={cx(
            dropBottomZone,
            dropBottomProps.isOver && dropBottomProps.canDrop
              ? highlighted
              : '',
          )}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}

const tabStyle = css(primaryLight, {
  display: 'inline-block',
  cursor: 'pointer',

  margin: '0 0.2em',
  borderStyle: 'solid',
  borderWidth: '1px 1px 0 1px',
  padding: '5px',
  // '&:hover': primary,
});
const activeTabStyle = css(tabStyle, primaryDark);

interface TabProps {
  active: boolean;
  id: number;
  children: React.ReactChild | null;
  onClick: () => void;
}

function Tab(props: TabProps) {
  const [collectedProps, drag] = dnd.useDrag({
    item: { id: props.id, type: accept },
  });

  if (props.children === null) {
    return null;
  }
  return (
    <div
      ref={drag}
      className={`${props.active ? activeTabStyle : tabStyle}`}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
}
