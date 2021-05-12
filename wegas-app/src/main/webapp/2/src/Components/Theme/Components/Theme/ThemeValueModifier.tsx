import { cx, css } from 'emotion';
import * as React from 'react';
import {
  flex,
  flexColumn,
  expandHeight,
  itemCenter,
  flexDistribute,
  grow,
  defaultPadding,
  autoScroll,
  flexRow,
} from '../../../../css/classes';
import { ConfirmButton } from '../../../Inputs/Buttons/ConfirmButton';
import { SimpleInput } from '../../../Inputs/SimpleInput';
import { defaultThemeValues, Theme, ThemeValues } from '../../ThemeVars';
import { ColorPicker, rgbaToString, valueStyle } from './ColorPicker';
import { ThemeValueInput } from './ThemeValueInput';

const valueEntryStyle = css({
  marginBottom: '7px',
});

const THEME_VALUE_MODIFIER_ID = 'THEME_VALUE_MODIFIER_ID';

export interface ThemeValueModifierProps<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
> {
  theme: Theme | undefined;
  section: T;
  onChange: (entry: K, value: V | null) => void;
  attachedToId?: string;
}

export function ThemeValueModifier<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
>({ theme, section, onChange }: ThemeValueModifierProps<T, K, V>) {
  const componentId = THEME_VALUE_MODIFIER_ID + section;

  return (
    <div className={cx(flex, flexColumn, expandHeight)} id={componentId}>
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
        <div className={cx(flex, itemCenter, flexDistribute)}>
          <ThemeValueInput
            onChange={(entry, value) => onChange(entry as K, value as V)}
            theme={theme}
            section={section}
            attachedToId={componentId}
          />
        </div>
      </div>
    </div>
  );
}
