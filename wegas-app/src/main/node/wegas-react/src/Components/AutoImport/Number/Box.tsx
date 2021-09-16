import { css } from '@emotion/css';
import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import {
  useVariableDescriptor,
  useVariableInstance,
} from '../../Hooks/useVariable';
import { themeVar } from '../../Theme/ThemeVars';
import { INumberDescriptor } from 'wegas-ts-api';
import { wwarn } from '../../../Helper/wegaslog';
import { TumbleLoader } from '../../Loader';

const boxStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
  color: themeVar.colors.DarkTextColor,
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
    wwarn(`Not found: ${props.variable}`);
    return <TumbleLoader />;
  }

  return (
    <div>
      {TranslatableContent.toString(descriptor.label)}
      <div>{box(instance.getValue())}</div>
    </div>
  );
}
