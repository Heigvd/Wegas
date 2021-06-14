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
import { ThemeValues, themeVar } from '../../ThemeVars';
import { ColorPicker, rgbaToString, valueStyle } from './ColorPicker';
import { colorLabelStyle, ThemeValueModifierProps, valueEntryStyle } from './ThemeValueModifier';

const newInputStyle = css({
  cursor: 'pointer',
  overflow: 'hidden',
  border: '3px dashed ' + themeVar.colors.DisabledColor,
  boxSizing: 'border-box',
  boxShadow: 'none',
  borderRadius: '8px',
});

const newColorStyle = css({
  height: '4em',
});

const newValueStyle = css({
  ...inputStyleCSS,
  resize: 'none',
  borderColor:themeVar.colors.DisabledColor,
});



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
            className={cx(flex, colorLabelStyle)}
            htmlFor={label}
            title={label}
          >
            {label}
          </label>
        </div>
        <div
          className={cx(
            isColorInput ? newColorStyle : newValueStyle,
            flex,
            newInputStyle,
            justifyCenter,
            itemCenter,
          )}
          onClick={showModal}
        >
          <IconComp icon="plus" className={css({ color: themeVar.colors.DisabledColor })} />
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
