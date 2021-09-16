import * as React from 'react';
import { NumberBox } from '../../Components/Inputs/Number/NumberBox';
import { css } from '@emotion/css';

export default function NumberBoxTester({
  value = 5,
  onChange,
}: {
  value?: number;
  onChange?: (value: number) => void;
}) {
  const [currentValue, setValue] = React.useState(value);

  React.useEffect(() => {
    setValue(value);
  }, [value]);

  return (
    <div>
      <NumberBox
        value={currentValue}
        minValue={0}
        maxValue={10}
        onChange={v => {
          setValue(v);
          onChange && onChange(v);
        }}
      />
      <NumberBox
        value={currentValue}
        minValue={0}
        maxValue={10}
        onChange={v => {
          setValue(v);
          onChange && onChange(v);
        }}
        boxClassName={css`
          background-color: darkgreen;
          color: white;
          &.active {
            background-color: lime;
            color: darkgreen;
          }
        `}
      />
      <NumberBox
        value={currentValue}
        onChange={v => {
          setValue(v);
          onChange && onChange(v);
        }}
      />
      <NumberBox
        value={currentValue}
        minValue={-5}
        onChange={v => {
          setValue(v);
          onChange && onChange(v);
        }}
      />
      <NumberBox
        value={currentValue}
        minValue={0}
        maxValue={10}
        onChange={v => {
          setValue(v);
          onChange && onChange(v);
        }}
        readOnly
      />
      <NumberBox
        value={currentValue}
        minValue={0}
        maxValue={10}
        onChange={v => {
          setValue(v);
          onChange && onChange(v);
        }}
        disabled
      />
    </div>
  );
}
