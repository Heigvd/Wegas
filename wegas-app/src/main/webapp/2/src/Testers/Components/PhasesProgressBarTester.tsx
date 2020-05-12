import * as React from 'react';
import { expandBoth, flex, grow, flexRow, autoScroll } from '../../css/classes';
import { cx, css } from 'emotion';
import { NumberSlider } from '../../Components/Inputs/Number/NumberSlider';
import { PhasesProgressBar } from '../../Components/Outputs/PhasesProgressBar';

const testerStyle = css({
  borderStyle: 'solid',
  borderWidth: '5px',
  margin: '5px',
  padding: '5px',
});

export default function PhasesProgressBarTester() {
  const [values, setValues] = React.useState({
    value: 2,
    phaseMin: 1,
    phaseMax: 5,
  });

  return (
    <div className={cx(flex, flexRow, expandBoth)}>
      <div className={cx(grow, autoScroll)}>
        <PhasesProgressBar {...values} className={testerStyle} />
        <PhasesProgressBar
          {...values}
          label="Progress bar with label"
          className={testerStyle}
        />
        <PhasesProgressBar {...values} displayValue className={testerStyle} />
        <PhasesProgressBar
          {...values}
          label="Progress bar with label and value"
          displayValue
          className={testerStyle}
        />
      </div>
      <div className={cx(grow, autoScroll)}>
        <NumberSlider
          label="Value"
          min={0}
          max={11}
          steps={11}
          value={values.value}
          onChange={v => setValues(ov => ({ ...ov, value: v }))}
          displayValues="NumberInput"
        />
        <NumberSlider
          label="Phase Min"
          min={0}
          max={10}
          steps={10}
          value={values.phaseMin}
          onChange={v =>
            setValues(ov => ({
              ...ov,
              phaseMin: v,
            }))
          }
          displayValues="NumberInput"
        />
        <NumberSlider
          label="Phase Max"
          min={0}
          max={10}
          steps={10}
          value={values.phaseMax}
          onChange={v =>
            setValues(ov => ({
              ...ov,
              phaseMax: v,
            }))
          }
          displayValues="NumberInput"
        />
      </div>
    </div>
  );
}
