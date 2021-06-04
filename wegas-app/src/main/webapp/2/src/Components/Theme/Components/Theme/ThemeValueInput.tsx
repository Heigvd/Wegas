import { cx, css } from 'emotion';
import * as React from 'react';
import {
  flex,
  flexColumn,
  flexRow,
  itemCenter,
  justifyCenter,
} from '../../../../css/classes';
import { MessageString } from '../../../../Editor/Components/MessageString';
import { IconComp } from '../../../../Editor/Components/Views/FontAwesome';
import { inputStyleCSS } from '../../../Inputs/inputStyles';
import { SimpleInput } from '../../../Inputs/SimpleInput';
import { useOkCancelModal } from '../../../Modal';
import { ThemeValues } from '../../ThemeVars';
import { ColorPicker, rgbaToString, valueStyle } from './ColorPicker';
import { ThemeValueModifierProps, valueEntryStyle } from './ThemeValueModifier';

const newInputStyle = css({
  cursor: 'pointer',
  overflow: 'hidden',
  border: '1px dashed #C5C5C5',
  boxSizing: 'border-box',
  boxShadow: 'inset 0px 0px 3px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
});

const newColorStyle = css({
  height: '4em',
});

const newValueStyle = css({ ...inputStyleCSS, resize: 'none' });

interface ThemeInputValue {
  name?: string;
  value?: string;
}

export function ThemeValueInput<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
>({
  theme,
  section,
  attachedToId,
  onChange,
}: ThemeValueModifierProps<T, K, V>) {
  const { showModal, OkCancelModal } = useOkCancelModal(attachedToId);

  const [value, setValue] =
    React.useState<ThemeInputValue | undefined>(undefined);

  const accept: (value?: ThemeInputValue) => string | undefined =
    React.useCallback(
      value =>
        value?.name == null || value.name === ''
          ? 'You have to enter a name'
          : Object.keys(theme?.values[section] || {}).includes(
              value?.name || '',
            )
          ? `The ${section} value already exists`
          : undefined,
      [section, theme],
    );

  const validator: (value?: ThemeInputValue | undefined) => string | undefined =
    React.useCallback(
      value => {
        if (
          Object.keys(theme?.values[section] || {}).includes(value?.name || '')
        ) {
          return `The ${section} value already exists`;
        }
      },
      [section, theme],
    );

  const error = React.useMemo(() => {
    let error = undefined;
    if (validator) {
      error = validator(value);
    }
    return error || accept(value);
  }, [accept, validator, value]);

  function onCancel() {
    setValue({});
  }

  const isColorInput = section === 'colors';
  const label = isColorInput ? 'Add new color' : 'Add new value';

  return (
    <>
      {/* {section === 'colors' ? ( */}
      <div className={cx(flex, flexColumn, valueEntryStyle)}>
        <div className={cx(flex, flexRow)}>
          <label
            className={cx(css({ display: 'flex', alignItems: 'center' }))}
            htmlFor={label}
            title={label}
          >
            {label}
          </label>
        </div>
        <div
          className={cx(
            flex,
            newInputStyle,
            justifyCenter,
            itemCenter,
            valueStyle,
            isColorInput ? newColorStyle : newValueStyle,
          )}
          onClick={showModal}
        >
          <IconComp icon="plus" />
        </div>
      </div>
      <OkCancelModal
        onOk={() => onChange(value!.name! as K, value!.value as V)}
        onCancel={onCancel}
      >
        {error && <MessageString type="warning" value={error} />}
        <SimpleInput
          placeholder="value name"
          onChange={v =>
            setValue(ov => ({
              ...(ov || { value: 'black' }),
              name: String(v),
            }))
          }
        />
        {section === 'colors' ? (
          <ColorPicker
            onChange={color => {
              setValue(ov => ({
                ...ov,
                value: rgbaToString(color),
              }));
            }}
          />
        ) : (
          <SimpleInput
            placeholder="Theme value"
            className={valueStyle}
            onChange={v => setValue(ov => ({ ...ov, value: String(v) }))}
          />
        )}
      </OkCancelModal>
    </>
  );
}
