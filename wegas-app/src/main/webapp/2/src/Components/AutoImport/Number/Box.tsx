import { css } from 'emotion';
import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import {
  useVariableDescriptor,
  useVariableInstance,
} from '../../Hooks/useVariable';
import { themeVar } from '../../Style/ThemeVars';
import { INumberDescriptor } from 'wegas-ts-api/typings/WegasEntities';

const boxStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
  color: themeVar.Common.colors.TextColor,
  display: 'inline-block',
  width: '1ex',
  height: '1ex',
  margin: '0 1px',
});
function box(count: number) {
  const ret = [];
  for (let i = 0; i < count; i += 1) {
    ret.push(<div key={i} className={boxStyle} />);
  }
  return ret;
}
export default function NumberValue(props: { variable: string }) {
  const descriptor = useVariableDescriptor<INumberDescriptor>(props.variable);
  const instance = useVariableInstance(descriptor);
  if (descriptor === undefined || instance === undefined) {
    return <span>Not found: {props.variable}</span>;
  }

  return (
    <div>
      {TranslatableContent.toString(descriptor.label)}
      <div>{box(instance.value)}</div>
    </div>
  );
}
