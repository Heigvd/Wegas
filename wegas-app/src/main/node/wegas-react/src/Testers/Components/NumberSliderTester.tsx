import * as React from 'react';
import {
  NumberSlider,
  NumberSliderProps,
} from '../../Components/Inputs/Number/NumberSlider';
import { testerSectionStyle } from './NumberInputTester';

export default function NumberSliderTester({
  value,
  onChange,
}: {
  value: number;
  onChange?: (value: number) => void;
}) {
  const [currentValue, setValue] = React.useState(value);

  React.useEffect(() => {
    setValue(value);
  }, [value]);

  function NumberSliderPack(
    props: Omit<NumberSliderProps, 'value' | 'onChange' | 'displayValues'> & {
      label: string;
    },
  ) {
    const { label, ...restProps } = props;
    return (
      <div className={testerSectionStyle}>
        {props.label}
        <NumberSlider
          label="simple"
          value={currentValue}
          onChange={v => {
            setValue(v);
            onChange && onChange(v);
          }}
          {...restProps}
        />
        <NumberSlider
          label="number input"
          value={currentValue}
          onChange={v => {
            setValue(v);
            onChange && onChange(v);
          }}
          {...restProps}
          displayValues="NumberInput"
        />
        <NumberSlider
          label="display none"
          value={currentValue}
          onChange={v => {
            setValue(v);
            onChange && onChange(v);
          }}
          displayValues="None"
          {...restProps}
        />
        <NumberSlider
          label="display external"
          value={currentValue}
          onChange={v => {
            setValue(v);
            onChange && onChange(v);
          }}
          displayValues="External"
          {...restProps}
        />
        <NumberSlider
          label="display internal"
          value={currentValue}
          onChange={v => {
            setValue(v);
            onChange && onChange(v);
          }}
          displayValues="Internal"
          {...restProps}
        />
        <NumberSlider
          label="display both"
          value={currentValue}
          onChange={v => {
            setValue(v);
            onChange && onChange(v);
          }}
          displayValues="Both"
          {...restProps}
        />
        <NumberSlider
          label="display function"
          value={currentValue}
          onChange={v => {
            setValue(v);
            onChange && onChange(v);
          }}
          displayValues={(iv, v) => (
            <div>{`Testing displayer\n - value:${v}\n - internal:${iv}`}</div>
          )}
          {...restProps}
        />
      </div>
    );
  }

  return (
    <div>
      <NumberSliderPack label="Simple" min={0} max={10} />
      <NumberSliderPack label="Steps 10" min={0} max={10} steps={10} />
      <NumberSliderPack label="Steps 1000" min={0} max={10} steps={1000} />
      <NumberSliderPack label="Disabled" min={0} max={10} disabled />
      <NumberSliderPack
        label="Disabled + disabledStyle"
        min={0}
        max={10}
        disabled
        // disabledStyle={{ backgroundColor: 'red' }}
      />
      <NumberSliderPack
        label="Handlestyle"
        min={0}
        max={10}
        handleStyle={{ backgroundColor: 'red' }}
      />
      <NumberSliderPack
        label="LeftPartStyle"
        min={0}
        max={10}
        leftPartStyle={{ backgroundColor: 'red' }}
      />
      <NumberSliderPack
        label="RightPartStyle"
        min={0}
        max={10}
        rightPartStyle={{ backgroundColor: 'red' }}
      />
    </div>
  );
}
