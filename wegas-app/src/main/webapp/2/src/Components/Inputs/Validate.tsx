import { css, cx } from 'emotion';
import * as React from 'react';
import { flex, flexColumn, flexRow, grow, itemCenter } from '../../css/classes';
import { schemaProps } from '../PageComponents/tools/schemaProps';
import { themeVar } from '../Style/ThemeVars';
import { Button } from './Buttons/Button';

const validatorStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  padding: '5px',
});

const inputStyle = css({
  padding: '5px',
});

interface ValidateProps<T> {
  value: T;
  onValidate: (value: T) => void;
  onCancel: (value: T) => void;
  children: (value: T, onChange: (value: T) => void) => JSX.Element;
}

export function Validate<T>({
  value,
  onValidate,
  onCancel,
  children,
}: ValidateProps<T>) {
  const [savedValue, setSavedValue] = React.useState<T>(value);

  React.useEffect(() => {
    setSavedValue(value);
  }, [value]);

  return (
    <div className={cx(flex, flexRow, itemCenter, validatorStyle)}>
      <div className={cx(grow, inputStyle)}>
        {children(savedValue, setSavedValue)}
      </div>
      <div className={cx(flex, flexColumn, inputStyle)}>
        <Button icon="times" onClick={() => onCancel(savedValue)} />
        <Button icon="check" onClick={() => onValidate(savedValue)} />
      </div>
    </div>
  );
}

export interface ValidatorComponentProps {
  /**
   * validator - if true, will put a handle that will fire the change event
   */
  validator?: boolean;
  /**
   * onCancel - will be called if the modiofication is cancelled
   */
  onCancel?: IScript;
}

export const validatorSchema = {
  validator: schemaProps.boolean({ label: 'Validator' }),
  onCancel: schemaProps.code({ label: 'On cancel action' }),
};
