/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {css, cx} from '@emotion/css';
import {library} from '@fortawesome/fontawesome-svg-core';
import {far} from '@fortawesome/free-regular-svg-icons';
import {fas} from '@fortawesome/free-solid-svg-icons/';
import * as React from 'react';
import useTranslations from '../../../i18n/I18nContext';
import {illustrationColors, resolveColor} from '../../styling/color';
import DebouncedInput from '../DebouncedInput';
import FitSpace from '../FitSpace';
import Flex from '../Flex';
import './fontello.css';
import {IconDisplay} from './Illustration';
import {getIconDef, IconDef, icons} from './illustrationHelper';

library.add(fas, far);

export interface Props {
  value: string;
  onChange: (value: string) => void;
}

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const colorStyle = css({
  width: '4%',
  height: '32px',
  boxSizing: 'border-box',
  cursor: 'pointer',
  ":hover": {
    border: '2px solid white',
  }
});

const selectedColor = cx(colorStyle, css({
  border: '5px solid white',
  ":hover": {
    border: '5px solid white',
  }
}));

export function ColorPicker({color, onChange}: ColorPickerProps): JSX.Element {
  return (
    <Flex wrap="wrap">
      {Object.entries(illustrationColors).map(entry => {
        return (
          <span
            key={entry[0]}
            onClick={() => {
              onChange(entry[0]);
            }}
            className={cx(
              color === entry[0] ? selectedColor : colorStyle,
              css({backgroundColor: entry[1].toString()}),
            )}
          ></span>
        );
      })}
    </Flex>
  );
}

interface IconPickerProps {
  icon: IconDef;
  color: string;
  onChange: (icon: IconDef) => void;
}

const roundIcon = (color: string) => css({
  borderRadius: '100%',
  overflow: 'hidden',
  margin: "1px",
  ":hover": {
    boxShadow: `0 0 1px 2px ${color}`
  }
});

const matchSearch = (search: string) => (data: IconDef) => {
  const regex = new RegExp(search, 'i');
  if (search) {
    return data.name.match(regex) != null;
  } else {
    return true;
  }
};

export function IconPicker({icon, color, onChange}: IconPickerProps): JSX.Element {
  const i18n = useTranslations();

  const [filter, setFilter] = React.useState('');

  const filteredIconds = filter.length > 0 ? icons.filter(matchSearch(filter)) : icons;

  return (
    <FitSpace direction="column" overflow="auto">
      <div className={css({padding: '10px'})}>
        <DebouncedInput size="SMALL" value={filter} placeholder={i18n.search} onChange={setFilter} />
      </div>
      <Flex wrap="wrap" overflow="auto">
        {filteredIconds.map(iconDef => {
          const selected = iconDef === icon;

          return (
            <span
              key={`${iconDef.library}-${iconDef.key}`}
              onClick={() => {
                onChange(iconDef);
              }}
              className={roundIcon(color)}
            >
              <IconDisplay
                icon={iconDef}
                size="MEDIUM"
                fgColor={selected ? 'white' : 'black'}
                bgColor={selected ? color : 'white'}
              />
            </span>
          );
        })}
      </Flex>
    </FitSpace>
  );
}

export default function IllustrationPicker({value, onChange}: Props): JSX.Element {
  const [, color = 'orange', key = 'gamepad', library = 'fa'] = value.split('_');

  //const state = React.useState<>({color, key, library});

  const changeColorCb = React.useCallback(
    (color: string) => {
      onChange(`ICON_${color}_${key}_${library}`);
    },
    [key, library, onChange],
  );

  const changeIconCb = React.useCallback(
    (icon: IconDef) => {
      onChange(`ICON_${color}_${icon.key}_${icon.library}`);
    },
    [color, onChange],
  );

  const iconDef = getIconDef(library, key) || icons[0];

  const theColor = resolveColor(color);

  return (
    <FitSpace direction="column" overflow="auto">
      <ColorPicker color={color} onChange={changeColorCb} />
      <IconPicker icon={iconDef} onChange={changeIconCb} color={theColor} />
    </FitSpace>
  );
}
