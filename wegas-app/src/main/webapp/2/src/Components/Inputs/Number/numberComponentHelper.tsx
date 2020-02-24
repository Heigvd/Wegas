import * as React from 'react';
import { MessageString } from '../../../Editor/Components/MessageString';

export function checkMinMax(
  min?: number,
  max?: number,
  value?: number,
): JSX.Element | void {
  if (min === undefined) {
    return <MessageString value={`Min value is undefined`} type={'error'} />;
  }
  if (max === undefined) {
    return <MessageString value={`Max value is undefined`} type={'error'} />;
  }
  if (value === undefined) {
    return <MessageString value={`Value value is undefined`} type={'error'} />;
  }
  if (max < min) {
    return (
      <MessageString
        value={`Max value [${max}] is smaller than min value [${min}]`}
        type={'error'}
      />
    );
  }
  if (value < min) {
    return (
      <MessageString
        value={`Current value [${value}] is smaller than min value [${min}]`}
        type={'error'}
      />
    );
  }
  if (value > max) {
    return (
      <MessageString
        value={`Current value [${value}] is greater than max value [${max}]`}
        type={'error'}
      />
    );
  }
}
