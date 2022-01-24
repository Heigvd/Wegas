import { css } from '@emotion/css';
import * as React from 'react';
import NumberBoxTester from './NumberBoxTester';
import NumberSliderTester from './NumberSliderTester';

export const testerSectionStyle = css({
  borderStyle: 'solid',
  borderColor: 'black',
  margin: '2px',
  width: '100%',
});

export default function NumberInputTester() {
  const [value, setValue] = React.useState(5);

  return (
    <div>
      <div className={testerSectionStyle}>
        NumberBox Tester
        <NumberBoxTester value={value} onChange={setValue} />
      </div>
      <div className={testerSectionStyle}>
        NumberSlider Tester
        <NumberSliderTester value={value} onChange={setValue} />
      </div>
    </div>
  );
}
