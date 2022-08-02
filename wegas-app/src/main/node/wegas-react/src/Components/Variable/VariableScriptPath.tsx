import { css } from '@emotion/css';
import * as React from 'react';
import { editorLabel } from '../../data/methods/VariableDescriptorMethods';
import { VariableDescriptor } from '../../data/selectors';
import { safeClientScriptEval } from '../Hooks/useScript';

function getVariablePath(variable: IVariableDescriptor): string {
  let path = '';
  const parentVariable = VariableDescriptor.select(variable.parentId);
  if (parentVariable != null) {
    path += getVariablePath(parentVariable);
  }
  return `${path}\\${editorLabel(variable)}`;
}

const variableScriptPathStyle = css({
  fontSize: '0.8em',
  lineHeight: '0.8em',
  padding: '5px',
});

interface VariableScriptPathProps {
  script: string;
}

export function VariableScriptPath({ script }: VariableScriptPathProps) {
  return (
    <div className={variableScriptPathStyle}>
      {getVariablePath(
        safeClientScriptEval<SVariableDescriptor>(
          script,
          undefined,
          undefined,
          undefined,
          undefined,
        ).getEntity(),
      )}
    </div>
  );
}
