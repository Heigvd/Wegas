import * as React from 'react';
import { Gauge } from '../Components/Outputs/Gauge';
import { expandBoth, flex, grow, flexRow } from '../css/classes';
import { cx, css } from 'emotion';
import { NumberSlider } from '../Components/Inputs/Number/NumberSlider';

export default function GaugeTester() {
  const [values, setValues] = React.useState({
    minAngle: 15,
    maxAngle: 165,
    holeSize: 30,
    value: 50,
  });

  return (
    <div className={cx(flex, flexRow, expandBoth)}>
      <div
        className={cx(
          grow,
          css({
            width: '400px',
            height: '400px',
            maxWidth: '400px',
            maxHeight: '400px',
          }),
        )}
      >
        <Gauge
          value={values.value}
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
        value
        <NumberSlider
          min={0}
          max={100}
          value={values.value}
          onChange={v => setValues(ov => ({ ...ov, value: v }))}
          displayValues="External"
        />
        min angle
        <NumberSlider
          min={-360}
          max={360}
          value={values.minAngle}
          onChange={v =>
            setValues(ov => ({
              ...ov,
              minAngle: v,
              maxAngle:
                ov.maxAngle > v + 360
                  ? v + 360
                  : ov.maxAngle < v
                  ? v
                  : ov.maxAngle,
            }))
          }
          displayValues="External"
        />
        max angle
        <NumberSlider
          min={values.minAngle}
          max={values.minAngle + 360}
          value={values.maxAngle}
          onChange={v => setValues(ov => ({ ...ov, maxAngle: v }))}
          displayValues="External"
        />
        hole size
        <NumberSlider
          min={0}
          max={100}
          value={values.holeSize}
          onChange={v => setValues(ov => ({ ...ov, holeSize: v }))}
          displayValues="External"
        />
      </div>
    </div>
  );
}
