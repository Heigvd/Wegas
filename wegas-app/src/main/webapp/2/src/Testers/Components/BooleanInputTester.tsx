import * as React from 'react';
import {
  expandBoth,
  flex,
  grow,
  autoScroll,
  flexDistribute,
  flexColumn,
} from '../../css/classes';
import { cx, css } from 'emotion';
import { Toggler } from '../../Components/Inputs/Boolean/Toggler';
import {
  CheckBox,
  CheckBoxProps,
} from '../../Components/Inputs/Boolean/CheckBox';
import { Button } from '../../Components/Inputs/Buttons/Button';

function BoleanPack({
  label,
  value,
  defaultChecked,
  onChange,
  className,
  disabled,
  readOnly,
}: CheckBoxProps) {
  return (
    <div className={cx(flex, flexDistribute)}>
      <Toggler
        label={label}
        value={value}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className={className}
        disabled={disabled}
        readOnly={readOnly}
      />
      <CheckBox
        label={label}
        value={value}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className={className}
        disabled={disabled}
        readOnly={readOnly}
      />
    </div>
  );
}

export default function CustomGaugeTester() {
  const [checked, setChecked] = React.useState();
  const [key, setKey] = React.useState(0);

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <Button
        label="Reset tester"
        onClick={() => {
          setChecked(undefined);
          setKey(k => k + 1);
        }}
      />
      <div key={key} className={cx(grow, autoScroll)}>
        <BoleanPack label="simple" value={checked} onChange={setChecked} />
        <BoleanPack
          label="defaultChecked"
          defaultChecked
          value={checked}
          onChange={setChecked}
        />
        <BoleanPack
          label="funny classname"
          value={checked}
          onChange={setChecked}
          className={css({ backgroundColor: 'pink' })}
        />
        <BoleanPack
          label="disabled"
          value={checked}
          onChange={setChecked}
          disabled
        />
        <BoleanPack
          label="readonly"
          value={checked}
          onChange={setChecked}
          readOnly
        />
      </div>
    </div>
  );
}
