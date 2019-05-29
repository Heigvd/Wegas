import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import { VariableConnect } from '../../VariableConnect';
import { css } from 'emotion';
import { primary } from '../../Theme';

const boxStyle = css(
  {
    display: 'inline-block',
    width: '1ex',
    height: '1ex',
    margin: '0 1px',
  },
  primary,
);
function box(count: number) {
  const ret = [];
  for (let i = 0; i < count; i += 1) {
    ret.push(<div key={i} className={boxStyle} />);
  }
  return ret;
}
export default function NumberValue(props: { variable: string }) {
  return (
    <VariableConnect<INumberDescriptor> name={props.variable}>
      {({ state }) => {
        if (state === undefined) {
          return <span>Not found: {props.variable}</span>;
        }
        return (
          <div>
            {TranslatableContent.toString(state.descriptor.label)}
            <div>{box(state.instance.value)}</div>
          </div>
        );
      }}
    </VariableConnect>
  );
}
