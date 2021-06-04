import * as React from 'react';
import { DropMenu } from '../../../Components/DropMenu';
import {
  TrainerComponentKey,
  ReactTransformer,
  componentOrRawHTML,
} from './components';

interface TrainerDropMenuProps<K extends TrainerComponentKey> {
  label: string | ReactTransformer<K>;
  content: (string | ReactTransformer<K>)[];
}

export function TrainerDropMenu<K extends TrainerComponentKey>({
  label,
  content,
}: TrainerDropMenuProps<K>) {
  return (
    <DropMenu
      label={componentOrRawHTML(label)}
      items={content.map(c => ({ label: componentOrRawHTML(c) }))}
      onSelect={() => {}}
    />
  );
}
