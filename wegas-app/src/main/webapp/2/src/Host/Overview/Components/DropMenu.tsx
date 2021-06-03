import * as React from 'react';
import { DropMenu } from '../../../Components/DropMenu';

interface TrainerDropMenuProps {
  label: React.ReactNode;
  content: React.ReactNode[];
}

export function TrainerDropMenu({ label, content }: TrainerDropMenuProps) {
  return (
    <DropMenu
      label={label}
      items={content.map(c => ({ label: c }))}
      onSelect={() => {}}
    />
  );
}
