import * as React from 'react';
import { MessageString } from '../../../Editor/Components/MessageString';

interface CheckMinMaxProps {
  min?: number;
  max?: number;
  value?: number | string;
}

export function CheckMinMax({
  min,
  max,
  value,
}: CheckMinMaxProps): JSX.Element | null {
  const numberValue = Number(value);

  if (isNaN(numberValue)) {
    return <MessageString value={`Value is not a number`} type={'error'} />;
  }
  if (min === undefined && max === undefined) {
    return (
      <MessageString value={`Min and max value are undefined`} type={'error'} />
    );
  }
  if (min === undefined) {
    return <MessageString value={`Min value is undefined`} type={'error'} />;
  }
  if (max === undefined) {
    return <MessageString value={`Max value is undefined`} type={'error'} />;
  }
  if (numberValue === undefined) {
    return <MessageString value={`Value is undefined`} type={'error'} />;
  }
  if (max < min) {
    return (
      <MessageString
        value={`Max value [${max}] is smaller than min value [${min}]`}
        type={'error'}
      />
    );
  }
  if (numberValue < min) {
    return (
      <MessageString
        value={`Current value [${value}] is smaller than min value [${min}]`}
        type={'error'}
      />
    );
  }
  if (numberValue > max) {
    return (
      <MessageString
        value={`Current value [${value}] is greater than max value [${max}]`}
        type={'error'}
      />
    );
  }
  return null;
}
