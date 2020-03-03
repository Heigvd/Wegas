import * as React from 'react';
import { CustomGauge } from '../Components/Outputs/CustomGauge';
import {
  expandBoth,
  flex,
  grow,
  flexRow,
  showOverflow,
  autoScroll,
} from '../css/classes';
import { cx, css } from 'emotion';
import { NumberSlider } from '../Components/Inputs/Number/NumberSlider';
import { degreeToRadian } from '../Components/Outputs/PieChart';
import { Toggler } from '../Components/Inputs/Boolean/Toggler';

export default function CustomGaugeTester() {
  const [values, setValues] = React.useState({
    minAngle: 15,
    maxAngle: 165,
    holeSize: 30,
    explodeSize: 0,
    value: 50,
    useGradient: true,
  });

  return (
    <div className={cx(flex, flexRow, expandBoth)}>
      <div className={cx(grow, autoScroll)}>
        <CustomGauge
          value={values.value}
          min={0}
          sections={[
            { backgroundColor: 'red', stopValue: 25 },
            { backgroundColor: 'yellow', stopValue: 50 },
            { backgroundColor: 'green', stopValue: 75 },
            { backgroundColor: 'blue', stopValue: 100 },
          ]}
          minAngle={values.minAngle}
          maxAngle={values.maxAngle}
          displayValue
          holeRatio={values.holeSize}
          explodeRatio={values.explodeSize}
          label={'Simple Custom Gauge'}
          useGradient={values.useGradient}
        />
        <CustomGauge
          value={values.value}
          followNeedle
          min={0}
          sections={[
            { backgroundColor: 'red', stopValue: 25 },
            { backgroundColor: 'yellow', stopValue: 50 },
            { backgroundColor: 'green', stopValue: 75 },
            { backgroundColor: 'blue', stopValue: 100 },
          ]}
          minAngle={values.minAngle}
          maxAngle={values.maxAngle}
          displayValue
          holeRatio={values.holeSize}
          explodeRatio={values.explodeSize}
          label={'Follow needle gauge'}
          useGradient={values.useGradient}
        />
        <CustomGauge
          value={values.value}
          min={0}
          sections={[
            { backgroundColor: '#ff0000', stopValue: 20 },
            { backgroundColor: '#ff0040', stopValue: 40 },
            { backgroundColor: '#ff0080', stopValue: 60 },
            { backgroundColor: '#ff00C0', stopValue: 80 },
            { backgroundColor: '#ff00E0', stopValue: 100 },
          ]}
          minAngle={values.minAngle}
          maxAngle={values.maxAngle}
          displayValue
          holeRatio={values.holeSize}
          explodeRatio={values.explodeSize}
          label={'Styled needle custom Gauge'}
          needleStyle={{
            '@class': 'SimpleNeedle',
            color: 'blue',
            strokeWidth: 10,
          }}
          useGradient={values.useGradient}
        />
        <CustomGauge
          value={values.value}
          min={0}
          sections={[
            { backgroundColor: 'red', stopValue: 25 },
            { backgroundColor: 'yellow', stopValue: 50 },
            { backgroundColor: 'green', stopValue: 75 },
            { backgroundColor: 'blue', stopValue: 100 },
          ]}
          minAngle={values.minAngle}
          maxAngle={values.maxAngle}
          displayValue
          holeRatio={values.holeSize}
          explodeRatio={values.explodeSize}
          label={'Image needle custom Gauge'}
          needleStyle={{
            '@class': 'ImageNeedle',
            src: require('../pictures/needle.png').default,
            width: 239,
            height: 242,
            initAngle: 46,
            sizeRatio: 1.4,
          }}
          useGradient={values.useGradient}
        />
        <CustomGauge
          value={values.value}
          min={0}
          sections={[
            { backgroundColor: 'red', stopValue: 25 },
            { backgroundColor: 'yellow', stopValue: 50 },
            { backgroundColor: 'green', stopValue: 75 },
            { backgroundColor: 'blue', stopValue: 100 },
          ]}
          minAngle={values.minAngle}
          maxAngle={values.maxAngle}
          displayValue
          holeRatio={values.holeSize}
          explodeRatio={values.explodeSize}
          label={'SVG needle custom Gauge'}
          needleStyle={{
            '@class': 'SVGNeedle',
            svg: (cX, cY, angle, radius, holeRadius) => {
              const radAngle = degreeToRadian(angle);
              const x = Math.cos(radAngle) * ((radius + holeRadius) / 2) + cX;
              const y = Math.sin(radAngle) * ((radius + holeRadius) / 2) + cY;
              return (
                <circle
                  cx={x}
                  cy={y}
                  r={(radius - holeRadius) / 2}
                  fill="black"
                />
              );
            },
          }}
          useGradient={values.useGradient}
        />
      </div>
      <div className={grow}>
        <NumberSlider
          label="Value"
          min={0}
          max={100}
          value={values.value}
          onChange={v => setValues(ov => ({ ...ov, value: v }))}
          displayValues="Internal"
          numberInput
        />
        <NumberSlider
          label="Min angle"
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
          displayValues="Internal"
          numberInput
        />
        <NumberSlider
          label="Max angle"
          min={values.minAngle}
          max={values.minAngle + 360}
          value={values.maxAngle}
          onChange={v => setValues(ov => ({ ...ov, maxAngle: v }))}
          displayValues="Internal"
          numberInput
        />
        <NumberSlider
          label="Hole ratio"
          min={0}
          max={100}
          value={values.holeSize}
          onChange={v => setValues(ov => ({ ...ov, holeSize: v }))}
          displayValues="Internal"
          numberInput
        />
        <NumberSlider
          label="Explode ratio"
          min={0}
          max={200}
          value={values.explodeSize}
          onChange={v => setValues(ov => ({ ...ov, explodeSize: v }))}
          displayValues="Internal"
          numberInput
        />
        Use gradient
        <Toggler
          value={values.useGradient}
          onChange={v => setValues(ov => ({ ...ov, useGradient: v }))}
        />
      </div>
    </div>
  );
}
