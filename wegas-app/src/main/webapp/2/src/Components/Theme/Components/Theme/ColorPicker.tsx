import * as Color from 'color';
import { css, cx } from 'emotion';
import * as React from 'react';
import { RGBColor, ChromePicker } from 'react-color';
import {
  flex,
  justifyCenter,
  grow,
  flexColumn,
  itemCenter,
  defaultMargin,
  MediumPadding,
  expandWidth,
  defaultMarginTop,
} from '../../../../css/classes';
import { borderBottom } from '../../../../Editor/Components/FormView/commonView';
import { useOnClickOutside } from '../../../Hooks/useOnClickOutside';
import { Button, outlinePrimaryButtonStyle } from '../../../Inputs/Buttons/Button';
import { themeVar } from '../../ThemeVars';

export const borderStyle = {
  boxShadow: 'inset 0px 0px 3px rgba(0, 0, 0, 0.1)',
  borderRadius: themeVar.dimensions.BorderRadius,
};

export const valueStyle = css({
  marginTop: '1px',
  boxShadow: 'inset 0px 0px 4px rgba(0, 0, 0, 0.15)',
});

const colorPickerContainerStyle = css({
backgroundColor: themeVar.colors.BackgroundColor,
boxShadow: '0 0 6px rgba(0, 0, 0, 0.2)',
zIndex: 1,
});

const colorButton = css({
  // width: '100%',
  // width: '120px',
  ...borderStyle,
  cursor: 'pointer',
  // padding: '2px',
  overflow: 'hidden',
});

const colorInnerButton = (color: string) =>
  css({
    height: '4em',
    backgroundColor: color,
  });

function colorToRGBA(color: Color): RGBColor {
  return {
    r: Number(color.red().toFixed(0)),
    g: Number(color.green().toFixed(0)),
    b: Number(color.blue().toFixed(0)),
    a: Number(color.alpha().toFixed(0)),
  };
}

function stringToRGBA(color?: string): RGBColor {
  let colorObject;
  try {colorObject = Color(color);}
  catch (e) {colorObject = Color();}
  return colorToRGBA(colorObject);
}

function autoShader(mainColor: string | number | undefined, shadeNumber: number): RGBColor {
  let newColor = Color(mainColor);
  switch (shadeNumber) {
    case 1: {
      //return shaded color (darken)
      newColor = newColor.lightness(25);
      return colorToRGBA(newColor);
    }
    case 2: {
      //return tint color (lighten + staturated)
      newColor = newColor.saturate(0.4);
      return colorToRGBA(newColor);
    }
    case 3: {
      //return pastel color (very light)
      newColor = newColor.desaturate(0.3).lightness(90);
      return colorToRGBA(newColor);
    }
    default: {
      return colorToRGBA(newColor);
    }
  }
}

export function rgbaToString(color?: RGBColor): string {
  return `rgba(${color?.r || 0},${color?.g || 0},${color?.b || 0}${
    color?.a ? `,${color.a}` : ''
  })`;
}

interface ColorPickerProps {
  initColor?: string;
  onChange?: (newColor: RGBColor) => void;
  autoColor?: {
    mainColor: string | number | undefined;
    shadeNumber: number;
  }
}

export function ColorPicker({
  initColor = 'black',
  onChange,
  autoColor
}: ColorPickerProps) {
  const [displayed, setDisplayed] = React.useState(false);
  const [color, setColor] = React.useState<RGBColor>(stringToRGBA(initColor));
  const pickerZone = React.useRef(null);

  React.useEffect(() => {
    setColor(stringToRGBA(initColor));
  }, [initColor]);

  useOnClickOutside(pickerZone, () => {
    setDisplayed(false);
    setColor(stringToRGBA(initColor));
  });

  return (
    <div className={cx(flex, justifyCenter)} ref={pickerZone}>
      {!displayed ? (
        <div
          className={cx(
            colorInnerButton(rgbaToString(color)),
            valueStyle,
            grow,
            colorButton,
          )}
          onClick={() => setDisplayed(old => !old)}
        />
      ) : (
        <div className={cx(flex, flexColumn, itemCenter, MediumPadding, colorPickerContainerStyle)}>
          <ChromePicker
            color={color}
            onChangeComplete={newColor => {
              setColor(newColor.rgb);
            }}
          />
          {autoColor &&
            <div className={cx(flex, expandWidth, justifyCenter, defaultMargin, borderBottom)}>
              <Button
                icon="magic"
                tooltip="Create a suitable shade from main color"
                label="Auto color"
                onClick={() => {
                  setColor(autoShader(autoColor.mainColor, autoColor.shadeNumber));
                }}
              />
            </div>
          }
          <div className={flex} style={{ margin: themeVar.dimensions.BorderWidth }}>
            <Button
              label="Cancel"
              className={cx(outlinePrimaryButtonStyle, defaultMargin)}
              onClick={() => {
                setDisplayed(false);
                setColor(stringToRGBA(initColor));
              }}
            />
            <Button
              label="Accept"
              className={defaultMargin}
              onClick={() => {
                setDisplayed(false);
                onChange && onChange(color);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
