import * as React from 'react';
import { entityIs } from '../../../data/entities';
import { getIcon } from '../../editionConfig';
import { css } from '@emotion/css';
import { withDefault, IconComp } from '../Views/FontAwesome';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import {
  IVariableDescriptor,
  IEvaluationDescriptorContainer,
  IResult,
} from 'wegas-ts-api';

interface VariableTreeTitleProps extends ClassStyleId {
  variable?: IVariableDescriptor | IResult | IEvaluationDescriptorContainer;
  subPath?: (string | number)[];
}

export function VariableTreeTitle({
  variable,
  subPath,
  className,
  style,
}: VariableTreeTitleProps) {
  return (
    <div className={className} style={style}>
      <IconComp
        icon={withDefault(getIcon(variable!), 'question')}
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
