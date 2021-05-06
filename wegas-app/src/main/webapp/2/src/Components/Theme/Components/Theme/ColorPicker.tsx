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
} from '../../../../css/classes';
import { useOnClickOutside } from '../../../Hooks/useOnClickOutside';
import { Button } from '../../../Inputs/Buttons/Button';
import { themeVar } from '../../ThemeVars';
import { borderStyle } from '../ThemeEditor';

export const valueStyle = css({
  marginTop: '1px',
});

const colorButton = css({
  width: '100%',
  ...borderStyle,
  cursor: 'pointer',
  padding: '2px',
});

const colorInnerButton = (color: string) =>
  css({
    height: '1.6em',
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
  });

  return (
    <div className={cx(flex, colorButton, justifyCenter)} ref={pickerZone}>
      {!displayed ? (
        <div
          className={cx(
            colorInnerButton(rgbaToString(color)),
            valueStyle,
            grow,
          )}
          onClick={() => setDisplayed(old => !old)}
        />
      ) : (
        <div className={cx(flex, flexColumn, itemCenter)}>
          <ChromePicker
            color={color}
            onChangeComplete={newColor => {
              setColor(newColor.rgb);
            }}
          />
          <div style={{ margin: themeVar.Common.dimensions.BorderWidth }}>
            <Button
              label="Accept"
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
