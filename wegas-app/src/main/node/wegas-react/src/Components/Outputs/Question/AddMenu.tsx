import { cx } from '@emotion/css';
import * as React from 'react';
import { flex, itemCenter, justifyCenter } from '../../../css/classes';
import { DropMenu, DropMenuProps } from '../../DropMenu';
import { singleEditButtonStyle } from './QuestionList';

type AddMenuProps<T, MItem extends DropMenuItem<T>> = Pick<
  DropMenuProps<T, MItem>,
  'items' | 'onSelect'
>;

export function AddMenu<T, MItem extends DropMenuItem<T>>({
  items,
  onSelect,
}: AddMenuProps<T, MItem>) {
  return (
    <div className={cx(flex, itemCenter, justifyCenter)}>
      <DropMenu
        containerClassName={singleEditButtonStyle}
        items={items}
        icon="plus"
        onSelect={onSelect}
      />
    </div>
  );
}
