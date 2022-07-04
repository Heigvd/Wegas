import { css } from '@emotion/css';
import * as React from 'react';
import {
  IEvaluationDescriptorContainer,
  IResult,
  IVariableDescriptor,
} from 'wegas-ts-api';
import { entityIs } from '../../../data/entities';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { getIcon } from '../../editionConfig';
import { IconComp, withDefault } from '../Views/FontAwesome';

interface VariableTreeTitleProps extends ClassStyleId {
  variable?: IVariableDescriptor | IResult | IEvaluationDescriptorContainer;
  subPath?: (string | number)[];
  open: boolean;
}

export function VariableTreeTitle({
  variable,
  open,
  subPath,
  className,
  style,
}: VariableTreeTitleProps) {
  return (
    <div className={className} style={style}>
      <IconComp
        icon={withDefault(getIcon(variable!, open), 'question')}
        className={css({ marginRight: '2px' })}
      />
      {entityIs(variable, 'EvaluationDescriptorContainer')
        ? subPath && subPath.length === 1
          ? String(subPath[0]) === 'feedback'
            ? 'Feedback'
            : 'Feedback comment'
          : 'Unreachable code'
        : editorLabel(variable)}
    </div>
  );
}
