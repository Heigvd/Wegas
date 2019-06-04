import * as React from 'react';
import { dropSpecs } from './DnDTabLayout';
import { __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd } from 'react-dnd';
import {
  DropTabProps,
  defaultDroppableTabStyle,
  activeDropableTabStyle,
  inactiveDropableTabStyle,
} from './DnDTabs';
import { cx } from 'emotion';

/* Hooks working good until redefinition of onDrop function */
function DropTabHook(props: DropTabProps) {
  const [dropTabProps, dropTab] = dnd.useDrop(
    dropSpecs(props.onDrop ? props.onDrop : () => {}),
  );

  return (
    <div
      ref={dropTab}
      className={cx(
        defaultDroppableTabStyle,
        props.className,
        dropTabProps.isOver && dropTabProps.canDrop
          ? activeDropableTabStyle
          : inactiveDropableTabStyle,
      )}
    >
      {props.children}
    </div>
  );
}
/* Hooks dnd target */
