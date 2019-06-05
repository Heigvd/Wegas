import * as React from 'react';
import { dropSpecsFactory } from './DnDTabLayout';
import { __EXPERIMENTAL_DND_HOOKS_THAT_MAY_CHANGE_AND_BREAK_MY_BUILD__ as dnd } from 'react-dnd';
import { DropTabProps } from './DnDTabs';
import { cx, css } from 'emotion';
import { themeVar } from '../../../Components/Theme';

const dropZoneFocus = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.successColor,
  zIndex: 1000,
});

const inactiveDropableTabStyle = css({
  width: '2px',
});

const activeDropableTabStyle = cx(
  css({
    width: '20px',
  }),
  dropZoneFocus,
);

/**
 * DropTabHook creates a drop target tab for the DnDTabLayout component
 * Hooks working good until redefinition of onDrop function (avoid using this until react-dnd makes it official)
 *
 */
function DropTabHook({ onDrop, className, children }: DropTabProps) {
  const [dropTabProps, dropTab] = dnd.useDrop(
    dropSpecsFactory(onDrop ? onDrop : () => {}),
  );

  return (
    <div
      ref={dropTab}
      className={cx(
        className,
        dropTabProps.isOver && dropTabProps.canDrop
          ? activeDropableTabStyle
          : inactiveDropableTabStyle,
      )}
    >
      {children}
    </div>
  );
}
