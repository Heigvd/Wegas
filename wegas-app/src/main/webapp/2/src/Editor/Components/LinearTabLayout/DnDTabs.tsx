import * as React from 'react';
import { css, cx } from 'emotion';
import {
  __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd,
  DropTargetMonitor,
} from 'react-dnd';
import { Toolbar } from '../../../Components/Toolbar';
import { primaryLight, primaryDark } from '../../../Components/Theme';
import { IconButton } from '../../../Components/Button/IconButton';
import { Menu } from '../../../Components/Menu';
import { DropType } from './LinearLayout';

const compoContent = css({
  position: 'relative',
  height: 'auto',
  display: 'flex',
});

const dropZoneStyle = {
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: 'red',
};

const dropZone = css({
  ...dropZoneStyle,
});

const dropVerticalZone = css({
  ...dropZoneStyle,
  top: 0,
  height: '100%',
});

const dropHorizontalZone = css({
  ...dropZoneStyle,
  left: 0,
  width: '100%',
});

const dropLeftZone = css({
  position: 'absolute',
  width: '20%',
  height: '60%',
  left: 0,
  top: '20%',
});

const dropRightZone = css({
  position: 'absolute',
  width: '20%',
  height: '60%',
  right: 0,
  top: '20%',
});

const dropTopZone = css({
  position: 'absolute',
  width: '60%',
  height: '20%',
  top: 0,
  left: '20%',
});

const dropBottomZone = css({
  position: 'absolute',
  width: '60%',
  height: '20%',
  bottom: 0,
  left: '20%',
});

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
  alignItems: 'center',
});

export interface TabComponent {
  id: number;
  name: string;
  component: JSX.Element;
}

type DropAction = (item: { id: number; type: string }) => void;

interface TabLayoutProps {
  active?: number;
  vertical?: boolean;
  tabs: TabComponent[];
  unusedTabs?: { label: string; value: number }[];
  allowDrop: boolean;
  onDrop: (type: DropType) => DropAction;
  onDeleteTab: (tabKey: number) => void;
  onDrag: (isDragging: boolean, tabKey: string) => void;
  onNewTab: (tabKey: number) => void;
}

const accept = 'DnDTab';

const dropSpecs = (action: DropAction) => {
  return {
    accept: accept,
    canDrop: () => true,
    drop: action,
    collect: (mon: DropTargetMonitor) => ({
      isOver: !!mon.isOver(),
      canDrop: !!mon.canDrop(),
    }),
  };
};

export function DnDTabLayout(props: React.PropsWithChildren<TabLayoutProps>) {
  const [active, setActive] = React.useState(
    props.active ? props.active % props.tabs.length : 0,
  );
  const [currentTabs, setCurrentTabs] = React.useState(props.tabs);

  const [dropTabProps, dropTab] = dnd.useDrop(dropSpecs(props.onDrop('TAB')));
  const [dropLeftProps, dropLeft] = dnd.useDrop(
    dropSpecs(props.onDrop('LEFT')),
  );
  const [dropRightProps, dropRight] = dnd.useDrop(
    dropSpecs(props.onDrop('RIGHT')),
  );
  const [dropTopProps, dropTop] = dnd.useDrop(dropSpecs(props.onDrop('TOP')));
  const [dropBottomProps, dropBottom] = dnd.useDrop(
    dropSpecs(props.onDrop('BOTTOM')),
  );

  React.useEffect(() => {
    setCurrentTabs(oldTabs => {
      const newTabs = props.tabs.filter(el => oldTabs.indexOf(el) < 0);
      if (newTabs.length > 0) {
        setActive(props.tabs.indexOf(newTabs[0]));
        return props.tabs;
      }
      return oldTabs;
    });
  }, [props.tabs]);

  return (
    <Toolbar vertical={props.vertical}>
      <div
        ref={dropTab}
        className={cx(
          props.allowDrop &&
            dropTabProps.isOver &&
            dropTabProps.canDrop &&
            dropZone,
        )}
      >
        <Toolbar.Header>
          {currentTabs.map((t, i) => {
            return (
              <Tab
                key={t.id}
                id={t.id}
                active={i === active}
                onClick={() => setActive(i)}
                onDrag={props.onDrag}
              >
                <div className={flex}>
                  <span className={grow}> {t.name}</span>
                  <IconButton
                    icon="times"
                    tooltip="Remove tab"
                    onClick={() => props.onDeleteTab(t.id)}
                  />
                </div>
              </Tab>
            );
          })}
          {props.unusedTabs && props.unusedTabs.length > 0 && (
            <Tab key={'-1'} id={-1} active={false}>
              <Menu
                items={props.unusedTabs}
                icon="plus"
                onSelect={i => props.onNewTab(i.value)}
              />
            </Tab>
          )}
        </Toolbar.Header>
      </div>
      <Toolbar.Content className={compoContent}>
        {currentTabs.map((t, i) => {
          return (
            <div
              key={t.id}
              style={i !== active ? { display: 'none' } : undefined}
              className={grow}
            >
              {t.component}
            </div>
          );
        })}
        {props.allowDrop && (
          <>
            <div
              ref={dropLeft}
              className={cx(
                dropLeftZone,
                dropLeftProps.isOver &&
                  dropLeftProps.canDrop &&
                  dropVerticalZone,
              )}
            />
            <div
              ref={dropRight}
              className={cx(
                dropRightZone,
                dropRightProps.isOver &&
                  dropRightProps.canDrop &&
                  dropVerticalZone,
              )}
            />
            <div
              ref={dropTop}
              className={cx(
                dropTopZone,
                dropTopProps.isOver &&
                  dropTopProps.canDrop &&
                  dropHorizontalZone,
              )}
            />
            <div
              ref={dropBottom}
              className={cx(
                dropBottomZone,
                dropBottomProps.isOver &&
                  dropBottomProps.canDrop &&
                  dropHorizontalZone,
              )}
            />
          </>
        )}
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
});
const activeTabStyle = css(tabStyle, primaryDark);

interface TabProps {
  active: boolean;
  id: number;
  children: React.ReactChild | null;
  onClick?: () => void;
  onDrag?: (isDragging: boolean, tabKey: string) => void;
}

function Tab(props: TabProps) {
  const [, drag] = dnd.useDrag({
    item: { id: props.id, type: accept },
    canDrag: props.onDrag !== undefined,
    begin: () => props.onDrag && props.onDrag(true, String(props.id)),
    end: () => props.onDrag && props.onDrag(false, String(props.id)),
  });

  if (props.children === null) {
    return null;
  }
  return (
    <div
      ref={drag}
      className={`${props.active ? activeTabStyle : tabStyle}`}
      onClick={() => {
        if (props.onClick) {
          props.onClick();
        }
      }}
    >
      {props.children}
    </div>
  );
}
