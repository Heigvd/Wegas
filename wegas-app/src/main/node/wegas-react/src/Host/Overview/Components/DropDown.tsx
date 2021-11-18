import { css, cx } from '@emotion/css';
import * as React from 'react';
import { DropDown } from '../../../Components/DropDown';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { MediumPadding } from '../../../css/classes';
import {
  TrainerComponentKey,
  ReactFormatter,
  componentOrRawHTML,
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
      listClassName={cx(MediumPadding, css({borderRadius: themeVar.dimensions.BorderRadius, marginTop: '5px'}))}
    />
  );
}
