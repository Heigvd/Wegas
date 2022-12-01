import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  flex,
  flexColumn,
  insideInsetShadow,
  flexRow,
  justifyCenter,
  itemCenter,
  expandWidth,
} from '../css/classes';
import { classNameOrEmpty } from '../Helper/className';
import { ConfirmButton } from './Inputs/Buttons/ConfirmButton';
import { IconButton } from './Inputs/Buttons/IconButton';
import { themeVar } from './Theme/ThemeVars';

const listViewStyle = css({
  backgroundColor: themeVar.colors.BackgroundColor,
  paddingTop: '0.5em',
  paddingBottom: '0.5em',
  overflow: 'auto',
});

const listViewItemsStyle = css({
  paddingTop: '0.2em',
  paddingBottom: '0.2em',
  paddingLeft: '1em',
  paddingRight: '1em',
});

const listViewItemSelectedStyle = css({
  cursor: 'pointer',
  color: themeVar.colors.LightTextColor,
  backgroundColor: themeVar.colors.ActiveColor,
  ':hover': {
    backgroundColor: themeVar.colors.ActiveColor,
    color: themeVar.colors.LightTextColor,
  },
});

const listViewItemEnabledStyle = css({
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.colors.HoverColor,
    color: themeVar.colors.DarkTextColor,
  },
});

const listViewItemDisabledStyle = css({
  backgroundColor: themeVar.colors.DisabledColor,
});

interface ListViewSimpleItem {
  id: number;
  label: React.ReactNode;
  disabled?: boolean;
}

interface ListViewProps<T extends ListViewSimpleItem> extends ClassStyleId {
  selectedId?: number;
  items: T[];
  onSelect?: (id: number | undefined) => void;
  onMove?: (up: boolean) => void;
  onTrash?: () => void;
  onNew?: () => void;
}

export function ListView<T extends ListViewSimpleItem>({
  selectedId,
  items,
  onSelect,
  onMove,
  onTrash,
  onNew,
  className,
  style,
  id,
}: ListViewProps<T>) {
  return (
    <div className={cx(flex, flexColumn) + classNameOrEmpty(className)}>
      <div
        className={cx(flex, flexColumn, listViewStyle, insideInsetShadow)}
        style={style}
        id={id}
      >
        {items.map(item => (
          <div
            key={item.id}
            className={cx(listViewItemsStyle, {
              [listViewItemEnabledStyle]: !item.disabled,
              [listViewItemDisabledStyle]: item.disabled,
              [listViewItemSelectedStyle]: selectedId === item.id,
            })}
            onClick={() => {
              if (onSelect) {
                onSelect(selectedId === item.id ? undefined : item.id);
              }
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div
        className={cx(flex, flexRow, justifyCenter, itemCenter, expandWidth)}
      >
        <div className={cx(flex, flexRow)}>
          {onNew && <IconButton icon="plus" onClick={() => onNew()} />}
          {onMove && (
            <>
              <IconButton
                icon="arrow-down"
                onClick={() => selectedId != null && onMove(false)}
                disabled={
                  selectedId == null ||
                  items.findIndex(item => item.id === selectedId) ===
                    items.length - 1
                }
              />
              <IconButton
                icon="arrow-up"
                onClick={() => selectedId != null && onMove(true)}
                disabled={
                  selectedId == null ||
                  items.findIndex(item => item.id === selectedId) === 0
                }
              />
            </>
          )}
          {onTrash && (
            <ConfirmButton
              icon="trash"
              onAction={succes => succes && selectedId && onTrash()}
              disabled={!selectedId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
