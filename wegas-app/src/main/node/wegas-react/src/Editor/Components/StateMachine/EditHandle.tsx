import { css, cx } from '@emotion/css';
import * as React from 'react';
import { stateBoxButtonStyle } from '../../../Components/FlowChart/StateProcessComponent';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { flex, flexRow } from '../../../css/classes';
import { IconComp } from '../Views/FontAwesome';

const editButtonStyle = css(stateBoxButtonStyle);

const editHandle = css({
  position: 'absolute',
  top: '-35px',
  backgroundColor: themeVar.colors.HeaderColor,
});

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
