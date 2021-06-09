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
} from '../../../../css/classes';
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

function stringToRGBA(color?: string): RGBColor {
  const colorObject = Color(color);
  return {
    r: colorObject.red(),
    g: colorObject.green(),
    b: colorObject.blue(),
    a: colorObject.alpha(),
  };
}

export function rgbaToString(color?: RGBColor): string {
  return `rgba(${color?.r || 0},${color?.g || 0},${color?.b || 0}${
    color?.a ? `,${color.a}` : ''
  })`;
}

interface ColorPickerProps {
  initColor?: string;
  onChange?: (newColor: RGBColor) => void;
}

export function ColorPicker({
  initColor = 'black',
  onChange,
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
