import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  autoScroll,
  defaultPadding,
  expandHeight,
  flex,
  flexColumn,
  flexRow,
  flexWrap,
  grow,
} from '../../../../css/classes';
import {
  EditorTabsTranslations,
  editorTabsTranslations,
} from '../../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../../i18n/internalTranslator';
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
  T extends keyof ThemeValues = keyof ThemeValues,
  K extends keyof ThemeValues[T] = keyof ThemeValues[T],
  V extends ThemeValues[T][K] = ThemeValues[T][K],
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
  autoColor?: {
    mainColor: string | number | undefined;
    shadeNumber: number;
  };
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
  autoColor,
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
          autoColor={autoColor}
        />
      ) : (
        <SimpleInput
          value={value}
          onChange={v => onChange(label as K, String(v) as V)}
          debouncingTime={1000}
        />
      )}
    </div>
  );
}

interface ThemeColorModifierProps
  extends Pick<ThemeValueProps<'colors'>, 'onChange'> {
  theme: Theme | undefined;
  themeValues: ThemeValues['colors'];
}

function ThemeColorModifier({
  theme,
  themeValues,
  onChange,
}: ThemeColorModifierProps) {
  const section = 'colors';
  const componentId = THEME_VALUE_MODIFIER_ID + section;
  const i18nValues = useInternalTranslate(editorTabsTranslations);

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
        <h3 className={colorSectionTitleStyle}>
          {i18nValues.themeEditor.primaryColors}
        </h3>
        <div className={paletteStyle}>
          {primaryColors.map(([k, v], i, colorArray) => (
            <ThemeValueEntry
              key={k}
              label={k}
              labelModifer={label =>
                i18nValues.themeEditor.themeColorShades[
                  primaryColorsSection[
                    label as keyof typeof primaryColorsSection
                  ] as keyof EditorTabsTranslations['themeEditor']['themeColorShades']
                ]
              }
              value={v}
              section={section}
              onChange={onChange}
              autoColor={
                i > 0
                  ? { mainColor: colorArray[0][1], shadeNumber: i }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
      <div className={cx(flex, flexColumn)}>
        <h3 className={colorSectionTitleStyle}>
          {i18nValues.themeEditor.secondaryColors}
        </h3>
        <div className={paletteStyle}>
          {secondaryColors.map(([k, v], i, colorArray) => (
            <ThemeValueEntry
              key={k}
              label={k}
              labelModifer={label =>
                i18nValues.themeEditor.themeColorShades[
                  secondaryColorsSection[
                    label as keyof typeof secondaryColorsSection
                  ] as keyof EditorTabsTranslations['themeEditor']['themeColorShades']
                ]
              }
              value={v}
              section={section}
              onChange={onChange}
              autoColor={
                i > 0
                  ? { mainColor: colorArray[0][1], shadeNumber: i }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
      <div className={cx(flex, flexColumn)}>
        <h3 className={colorSectionTitleStyle}>
          {i18nValues.themeEditor.backgroundColors}
        </h3>
        <div className={paletteStyle}>
          {backgroundColors.map(([k, v]) => (
            <ThemeValueEntry
              key={k}
              label={k}
              labelModifer={label =>
                i18nValues.themeEditor.themeColorShades[
                  backgroundColorsSection[
                    label as keyof typeof backgroundColorsSection
                  ] as keyof EditorTabsTranslations['themeEditor']['themeColorShades']
                ]
              }
              value={v}
              section={section}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
      <div className={cx(flex, flexColumn)}>
        <h3 className={colorSectionTitleStyle}>
          {i18nValues.themeEditor.textColors}
        </h3>
        <div className={paletteStyle}>
          {textColors.map(([k, v]) => (
            <ThemeValueEntry
              key={k}
              label={k}
              labelModifer={label =>
                i18nValues.themeEditor.themeColorShades[
                  textColorsSection[
                    label as keyof typeof textColorsSection
                  ] as keyof EditorTabsTranslations['themeEditor']['themeColorShades']
                ]
              }
              value={v}
              section={section}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
      <div className={cx(flex, flexColumn)}>
        <h3 className={colorSectionTitleStyle}>
          {i18nValues.themeEditor.otherColors}
        </h3>
        <div className={paletteStyle}>
          {otherColors.map(([k, v]) => (
            <ThemeValueEntry
              key={k}
              label={k}
              labelModifer={label => {
                if (
                  i18nValues.themeEditor.themeColorShades[
                    label as keyof EditorTabsTranslations['themeEditor']['themeColorShades']
                  ]
                )
                  return i18nValues.themeEditor.themeColorShades[
                    label as keyof EditorTabsTranslations['themeEditor']['themeColorShades']
                  ];
                else {
                  return String(label);
                }
              }}
              value={v}
              section={section}
              onChange={onChange}
            />
          ))}
          <ThemeValueInput
            onChange={(entry, value) => onChange(entry, value)}
            theme={theme}
            section={section}
            attachedToId={componentId}
          />
        </div>
      </div>
    </>
  );
}

interface ThemeStringValueModifierProps<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
> extends ThemeValueProps<T, K, V> {
  theme: Theme | undefined;
  themeValues: ThemeValues[T];
}

function ThemeStringValueModifier<
  T extends keyof ThemeValues,
  K extends keyof ThemeValues[T],
  V extends ThemeValues[T][K],
>({
  onChange,
  section,
  theme,
  themeValues,
}: ThemeStringValueModifierProps<T, K, V>) {
  const componentId = THEME_VALUE_MODIFIER_ID + section;
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

export interface ThemeValueModifierProps<
  T extends keyof ThemeValues = keyof ThemeValues,
  K extends keyof ThemeValues[T] = keyof ThemeValues[T],
  V extends ThemeValues[T][K] = ThemeValues[T][K],
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
  const themeValues = theme?.values[section];

  return (
    <div className={cx(flex, flexColumn, expandHeight)} id={componentId}>
      <div className={cx(flex, grow, flexColumn, defaultPadding, autoScroll)}>
        {themeValues == null ? (
          'No values in this section'
        ) : section === 'colors' ? (
          <ThemeColorModifier
            onChange={onChange as ThemeValueProps<'colors'>['onChange']}
            theme={theme}
            themeValues={themeValues as ThemeValues['colors']}
          />
        ) : (
          <ThemeStringValueModifier
            onChange={onChange}
            theme={theme}
            section={section}
            themeValues={themeValues}
          />
        )}
      </div>
    </div>
  );
}
