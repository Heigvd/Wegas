import { css, cx } from 'emotion';
import * as React from 'react';
import { defaultPadding, flex, flexColumn } from '../../../../css/classes';
import { DropMenu } from '../../../DropMenu';
import { Title } from '../../../Inputs/String/Title';
import {
  ThemeValues,
  ModeColor,
  ModeDimension,
  ModeOther,
  Theme,
  ModeValues,
} from '../../ThemeVars';
import { ModeColorValue } from './ModeColorValue';

export interface ModeValueModifierProps {
  theme: Theme | undefined;
  values: ModeValues;
  section: keyof ThemeValues;
  onChange: (entry: string, value: string) => void;
}

export function ModeValueModifier({
  theme,
  values,
  section,
  onChange,
}: ModeValueModifierProps) {
  if (theme == null) {
    return null;
  }

  const themeValuesWithUndefined = [
    'undefined',
    ...Object.keys(theme.values[section]),
  ];

  return (
    <div
      className={cx(flex, flexColumn, defaultPadding)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content auto',
        alignItems: 'center',
      }}
    >
      <Title
        level="3"
        style={{ gridColumnStart: 1, gridColumnEnd: 3, marginTop: 0 }}
      >
        {section}
      </Title>
      {Object.entries(values[section as keyof typeof values] || []).map(
        ([k, v]: [string, ModeColor | ModeDimension | ModeOther]) => {
          const sectionValue = v == null ? 'undefined' : v;
          return (
            <React.Fragment key={k}>
              <div title={k} className={css({ margin: '3px' })}>
                {k} :
              </div>
              <DropMenu
                label={
                  section === 'colors' && v != null ? (
                    <ModeColorValue label={sectionValue} theme={theme} />
                  ) : (
                    sectionValue
                  )
                }
                items={themeValuesWithUndefined.map(k => ({
                  value: k,
                  label:
                    section === 'colors' && k !== 'undefined' ? (
                      <ModeColorValue label={k} theme={theme} />
                    ) : (
                      k
                    ),
                }))}
                onSelect={({ value: themeValue }) => onChange(k, themeValue)}
                containerClassName={css({ margin: '3px' })}
              />
            </React.Fragment>
          );
        },
      )}
    </div>
  );
}
