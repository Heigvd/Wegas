/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { faSortAmountDownAlt, faSortAmountUp } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
//import useTranslations from '../../i18n/I18nContext';
import DropDownMenu, { itemStyle } from './DropDownMenu';
import Flex from './Flex';
import IconButton from './IconButton';

export interface SortByOption<T> {
  key: keyof T;
  label: string;
}

export interface SortByProps<T> {
  options: SortByOption<T>[];
  current: { key: keyof T; asc: boolean };
  onChange: (value: { key: keyof T; asc: boolean }) => void;
}

export default function SortBy<T>({ options, current, onChange }: SortByProps<T>): JSX.Element {
  //const i18n = useTranslations();

  const entries = options.map(opt => ({
    value: opt.key,
    label: <div className={itemStyle}>{opt.label}</div>,
  }));

  const [asc, setAsc] = React.useState(current.asc);
  const [key, setKey] = React.useState(current.key);

  return (
    <Flex align="center">
      <DropDownMenu
        menuIcon="CARET"
        entries={entries}
        value={current.key}
        onSelect={key => {
          setKey(key);
          onChange({
            key: key,
            asc: asc,
          });
        }}
      />

      <IconButton
        icon={current.asc ? faSortAmountDownAlt : faSortAmountUp}
        onClick={() => {
          setAsc(state => !state);
          onChange({
            key: key,
            asc: !asc,
          });
        }}
      />
    </Flex>
  );
}
