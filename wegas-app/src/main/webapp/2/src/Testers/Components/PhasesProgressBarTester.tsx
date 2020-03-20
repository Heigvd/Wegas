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
    phases: 5,
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
          label="Phases"
          min={0}
          max={10}
          steps={10}
          value={values.phases}
          onChange={v =>
            setValues(ov => ({
              ...ov,
              phases: v,
            }))
          }
          displayValues="NumberInput"
        />
      </div>
    </div>
  );
}
