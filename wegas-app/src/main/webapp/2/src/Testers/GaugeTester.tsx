import * as React from 'react';
import { Gauge } from '../Components/Outputs/Gauge';
import { expandBoth, flex, grow, flexRow } from '../css/classes';
import { cx } from 'emotion';
import { NumberSlider } from '../Components/Inputs/Number/NumberSlider';

export default function GaugeTester() {
  const [values, setValues] = React.useState({
    minAngle: 15,
    maxAngle: 165,
    holeSize: 30,
  });
  return (
    <div className={cx(flex, flexRow, expandBoth)}>
      <div className={cx(grow, expandBoth)}>
        <Gauge
          value={50}
          min={0}
          sections={[
            { backgroundColor: 'red', stopValue: 33 },
            { backgroundColor: 'yellow', stopValue: 66 },
            { backgroundColor: 'green', stopValue: 100 },
          ]}
          minAngle={values.minAngle}
          maxAngle={values.maxAngle}
          displayValue
          holeSize={values.holeSize}
          label={'Gauge tester'}
        />
      </div>
      <div className={grow}>
        min angle
        <NumberSlider
          min={0}
          max={360}
          value={values.minAngle}
          onChange={v =>
            setValues(ov => ({
              ...ov,
              minAngle: v,
              maxAngle: ov.maxAngle > v + 360 ? v + 360 : ov.maxAngle,
            }))
          }
        />
        max angle
        <NumberSlider
          min={0}
          max={values.minAngle + 360}
          value={values.maxAngle}
          onChange={v => setValues(ov => ({ ...ov, maxAngle: v }))}
        />
        hole size
        <NumberSlider
          min={0}
          max={100}
          value={values.holeSize}
          onChange={v => setValues(ov => ({ ...ov, holeSize: v }))}
        />
      </div>
    </div>
  );
}
