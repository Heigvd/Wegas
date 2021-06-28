import * as React from 'react';
import { DropDown } from '../../../Components/DropDown';
import {
  TrainerComponentKey,
  ReactTransformer,
  componentOrRawHTML,
} from './components';

interface TrainerDropMenuProps<K extends TrainerComponentKey> {
  label: string | ReactTransformer<K>;
  content: string | ReactTransformer<K>;
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
