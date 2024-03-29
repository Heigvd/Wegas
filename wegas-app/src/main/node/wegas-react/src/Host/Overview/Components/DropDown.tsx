import { css, cx } from '@emotion/css';
import * as React from 'react';
import { DropDown } from '../../../Components/DropDown';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { mediumPadding } from '../../../css/classes';
import {
  componentOrRawHTML,
  ReactFormatter,
  TrainerComponentKey,
} from './components';

interface TrainerDropMenuProps<K extends TrainerComponentKey> {
  label: string | ReactFormatter<K>;
  content: string | ReactFormatter<K>;
}

export function TrainerDropDown<K extends TrainerComponentKey>({
  label,
  content,
}: TrainerDropMenuProps<K>) {
  return (
    <DropDown
      label={componentOrRawHTML(label)}
      content={componentOrRawHTML(content)}
      listClassName={cx(
        mediumPadding,
        css({
          borderRadius: themeVar.dimensions.BorderRadius,
          marginTop: '5px',
        }),
      )}
      containerClassName={css({
        '.open': {
          fontWeight: 700,
          boxShadow: 'inset 0 0 8px 1px rgba(0, 0, 0, 0.2)',
        },
      })}
    />
  );
}
