import { css } from '@emotion/css';
import * as React from 'react';
import { stateBoxButtonStyle } from '../../../Components/FlowChart/StateProcessComponent';
import { IconComp } from '../Views/FontAwesome';

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
