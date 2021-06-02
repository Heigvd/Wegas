import { cx, css } from 'emotion';
import * as React from 'react';
import {
  flex,
  flexColumn,
  expandHeight,
  grow,
  defaultPadding,
  autoScroll,
  flexRow,
  flexWrap,
} from '../../../../css/classes';
import { ConfirmButton } from '../../../Inputs/Buttons/ConfirmButton';
import { SimpleInput } from '../../../Inputs/SimpleInput';
import {
  backgroundColorsSection,
  defaultThemeValues,
  primaryColorsSection,
  secondaryColorsSection,
  textColorsSection,
  Theme,
  ThemeValues,
} from '../../ThemeVars';
import { ColorPicker, rgbaToString } from './ColorPicker';
import { ThemeValueInput } from './ThemeValueInput';

export const valueEntryStyle = css({
  margin: '3px',
  minWidth: '120px',
  flex: '0 1 24%',
});
const colorSectionTitleStyle = css({
  marginBottom: '5px',
});

const paletteStyle = cx(flex, flexRow, flexWrap);

export const colorLabelStyle = css({
  fontSize: '14px',
  opacity: 0.5,
});

const THEME_VALUE_MODIFIER_ID = 'THEME_VALUE_MODIFIER_ID';

interface ThemeValueProps<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
> {
  section: T;
  onChange: (entry: K, value: V | null) => void;
}

interface ThemeValueEntryProps<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
> extends ThemeValueProps<T, K, V> {
  label: K;
  labelModifer?: (label: K) => string;
  value: V;
}

function ThemeValueEntry<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
>({
  label,
  labelModifer,
  value,
  section,
  onChange,
}: ThemeValueEntryProps<T, K, V>) {
  const computedLabel = labelModifer ? labelModifer(label) : String(label);

  return (
    <div className={cx(flex, flexColumn, valueEntryStyle)}>
      <div className={cx(flex, flexRow)}>
        <label
          className={cx(flex, colorLabelStyle)}
          htmlFor={String(computedLabel)}
          title={String(computedLabel)}
        >
          {computedLabel}
        </label>
        {!Object.keys(defaultThemeValues[section]).includes(String(label)) && (
          <ConfirmButton
            icon="trash"
            onAction={success => success && onChange(label as K, null)}
          />
        )}
      </div>
      {section === 'colors' ? (
        <ColorPicker
          initColor={String(value) || 'black'}
          onChange={color => {
            onChange(label as K, rgbaToString(color) as V);
          }}
        />
      ) : (
        <SimpleInput
          //className={valueStyle}
          value={value}
          onChange={v => onChange(label as K, String(v) as V)}
        />
      )}
    </div>
  );
}

export interface ThemeValueModifierProps<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
> extends ThemeValueProps<T, K, V> {
  theme: Theme | undefined;
  attachedToId?: string;
}

export function ThemeValueModifier<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
>({ theme, section, onChange }: ThemeValueModifierProps<T, K, V>) {
  const componentId = THEME_VALUE_MODIFIER_ID + section;

  const values = React.useMemo(() => {
    const themeValues = theme?.values[section];

    if (themeValues == null) {
      return null;
    }
    if (section === 'colors') {
      const primaryColors = Object.entries(themeValues).filter(([k]) =>
        Object.keys(primaryColorsSection).includes(k),
      );
      const secondaryColors = Object.entries(themeValues).filter(([k]) =>
        Object.keys(secondaryColorsSection).includes(k),
      );
      const backgroundColors = Object.entries(themeValues).filter(([k]) =>
        Object.keys(backgroundColorsSection).includes(k),
      );
      const textColors = Object.entries(themeValues).filter(([k]) =>
        Object.keys(textColorsSection).includes(k),
      );
      const otherColors = Object.entries(themeValues).filter(
        ([k]) =>
          !Object.keys({
            ...primaryColorsSection,
            ...secondaryColorsSection,
            ...backgroundColorsSection,
            ...textColorsSection,
          }).includes(k),
      );

      return (
        <>
          <div className={cx(flex, flexColumn)}>
            <h3 className={colorSectionTitleStyle}>Primary colors</h3>
            <div className={paletteStyle}>
              {primaryColors.map(([k, v]) => (
                <ThemeValueEntry
                  key={k}
                  label={k as K}
                  labelModifer={label =>
                    primaryColorsSection[
                      label as keyof typeof primaryColorsSection
                    ]
                  }
                  value={v as V}
                  section={section}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
          <div className={cx(flex, flexColumn)}>
            <h3 className={colorSectionTitleStyle}>Secondary colors</h3>
            <div className={paletteStyle}>
              {secondaryColors.map(([k, v]) => (
                <ThemeValueEntry
                  key={k}
                  label={k as K}
                  labelModifer={label =>
                    secondaryColorsSection[
                      label as keyof typeof secondaryColorsSection
                    ]
                  }
                  value={v as V}
                  section={section}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
          <div className={cx(flex, flexColumn)}>
            <h3 className={colorSectionTitleStyle}>Background colors</h3>
            <div className={paletteStyle}>
              {backgroundColors.map(([k, v]) => (
                <ThemeValueEntry
                  key={k}
                  label={k as K}
                  labelModifer={label =>
                    backgroundColorsSection[
                      label as keyof typeof backgroundColorsSection
                    ]
                  }
                  value={v as V}
                  section={section}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
          <div className={cx(flex, flexColumn)}>
            <h3 className={colorSectionTitleStyle}>Text colors</h3>
            <div className={paletteStyle}>
              {textColors.map(([k, v]) => (
                <ThemeValueEntry
                  key={k}
                  label={k as K}
                  labelModifer={label =>
                    textColorsSection[label as keyof typeof textColorsSection]
                  }
                  value={v as V}
                  section={section}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
          <div className={cx(flex, flexColumn)}>
            <h3 className={colorSectionTitleStyle}>Other colors</h3>
            <div className={paletteStyle}>
              {otherColors.map(([k, v]) => (
                <ThemeValueEntry
                  key={k}
                  label={k as K}
                  value={v as V}
                  section={section}
                  onChange={onChange}
                />
              ))}
              <ThemeValueInput
                onChange={(entry, value) => onChange(entry as K, value as V)}
                theme={theme}
                section={section}
                attachedToId={componentId}
              />
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          {Object.entries(themeValues).map(([k, v]) => (
            <ThemeValueEntry
              key={k}
              label={k as K}
              value={v as V}
              section={section}
              onChange={onChange}
            />
          ))}
          <ThemeValueInput
            onChange={(entry, value) => onChange(entry as K, value as V)}
            theme={theme}
            section={section}
            attachedToId={componentId}
          />
        </>
      );
    }
  }, [componentId, onChange, section, theme]);

  return (
    <div className={cx(flex, flexColumn, expandHeight)} id={componentId}>
      <div className={cx(flex, grow, flexColumn, defaultPadding, autoScroll)}>
        {values}
      </div>
    </div>
  );
}
