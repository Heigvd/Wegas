import * as React from 'react';
import { DropDown } from '../../../Components/DropDown';
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
    />
  );
}
