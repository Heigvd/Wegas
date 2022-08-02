import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  editHandle,
  stateBoxButtonStyle,
} from '../../../Components/FlowChart/StateProcessComponent';
import { IconComp } from '../../../Components/Views/FontAwesome';
import { flex, flexRow } from '../../../css/classes';

const editButtonStyle = css(stateBoxButtonStyle);

interface ButtonProps {
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export function TrashButton({ onClick }: ButtonProps) {
  return (
    <div className={editButtonStyle} onClick={onClick} data-nodrag={true}>
      <IconComp icon="trash" />
    </div>
  );
}

export function EditButton({ onClick }: ButtonProps) {
  return (
    <div className={editButtonStyle} onClick={onClick} data-nodrag={true}>
      <IconComp icon="pen" />
    </div>
  );
}

interface EditHandleProps {
  onTrash: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onEdit: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export function EditHandle({ onEdit, onTrash }: EditHandleProps) {
  return (
    <div className={cx(flex, flexRow, editHandle)}>
      <TrashButton onClick={onTrash} />
      <EditButton onClick={onEdit} />
    </div>
  );
}
