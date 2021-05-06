import { cx, css } from 'emotion';
import * as React from 'react';
import {
  flex,
  flexColumn,
  expandHeight,
  itemCenter,
  flexDistribute,
  headerStyle,
  grow,
  defaultPadding,
  autoScroll,
  flexRow,
} from '../../../../css/classes';
import { ConfirmButton } from '../../../Inputs/Buttons/ConfirmButton';
import { SimpleInput } from '../../../Inputs/SimpleInput';
import { ConfirmAdder } from '../../../Inputs/String/ConfirmAdder';
import { defaultThemeValues, Theme, ThemeValues } from '../../ThemeVars';
import { ColorPicker, rgbaToString, valueStyle } from './ColorPicker';

const valueEntryStyle = css({
  marginBottom: '7px',
});

interface ThemeValueModifierProps<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K]
> {
  theme: Theme | undefined;
  section: T;
  onChange: (entry: K, value: V | null) => void;
}

export function ThemeValueModifier<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K]
>({ theme, section, onChange }: ThemeValueModifierProps<T, K, V>) {
  const accept: (value?: {
    name?: string;
    value: string;
  }) => string | undefined = value =>
    value?.name == null || value.name === ''
      ? 'You have to enter a name'
      : Object.keys(theme?.values[section] || {}).includes(value?.name || '')
      ? `The ${section} value already exists`
      : undefined;

  const validator: (
    value?:
      | {
          name?: string;
          value: string;
        }
      | undefined,
  ) => string | undefined = value => {
    if (Object.keys(theme?.values[section] || {}).includes(value?.name || '')) {
      return `The ${section} value already exists`;
    }
  };

  return (
    <div className={cx(flex, flexColumn, expandHeight)}>
      <div className={cx(flex, itemCenter, flexDistribute, headerStyle)}>
        <ConfirmAdder
          label={`Add new ${section} value`}
          accept={accept}
          validator={validator}
          onAccept={value => onChange(value!.name! as K, value!.value as V)}
        >
          {onNewValue => (
            <>
              <SimpleInput
                placeholder="value name"
                onChange={v =>
                  onNewValue(ov => ({
                    ...(ov || { value: 'black' }),
                    name: String(v),
                  }))
                }
              />
              {section === 'colors' ? (
                <ColorPicker
                  onChange={color => {
                    onNewValue(ov => ({ ...ov, value: rgbaToString(color) }));
                  }}
                />
              ) : (
                <SimpleInput
                  placeholder="Theme value"
                  className={valueStyle}
                  onChange={v =>
                    onNewValue(ov => ({ ...ov, value: String(v) }))
                  }
                />
              )}
            </>
          )}
        </ConfirmAdder>
      </div>
      <div className={cx(flex, grow, flexColumn, defaultPadding, autoScroll)}>
        {Object.entries(theme?.values[section] || {}).map(([k, v]) => (
          <div key={k} className={cx(flex, flexColumn, valueEntryStyle)}>
            <div className={cx(flex, flexRow)}>
              <label
                className={cx(css({ display: 'flex', alignItems: 'center' }))}
                htmlFor={k}
                title={k}
              >
                {k} :
              </label>
              {!Object.keys(defaultThemeValues[section]).includes(k) && (
                <ConfirmButton
                  icon="trash"
                  onAction={success => success && onChange(k as K, null)}
                />
              )}
            </div>
            {section === 'colors' ? (
              <ColorPicker
                initColor={(v as string) || 'black'}
                onChange={color => {
                  onChange(k as K, rgbaToString(color) as V);
                }}
              />
            ) : (
              <SimpleInput
                className={valueStyle}
                value={v}
                onChange={v => onChange(k as K, String(v) as V)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
