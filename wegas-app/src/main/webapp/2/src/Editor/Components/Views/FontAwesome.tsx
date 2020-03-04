import * as React from 'react';
import {
  library,
  IconPrefix,
  IconDefinition,
  IconName,
  IconLookup,
} from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, Props } from '@fortawesome/react-fontawesome';
import { far } from '@fortawesome/free-regular-svg-icons';
import { omit } from 'lodash-es';

// These icon definitions MUST be added to library in order for React-Fontawsome to work properly
library.add({
  ...fas,
  ...Object.keys(far).reduce((o, k) => ({ ...o, [k + 'r']: far[k] }), {}),
});

export interface IconString {
  value: string;
  color?: React.CSSProperties['color'];
  fontSize?: React.CSSProperties['fontSize'];
  fontWeight?: React.CSSProperties['fontWeight'];
}

export type Icon = IconName | IconLookup | Props | IconString;
export type Icons = Icon | Icon[];

export const prefixes = [
  'fas',
  /*'fab',*/ 'far' /*'fal', 'fad'*/,
] as IconPrefix[];

export const icons = Object.values(fas).reduce(
  (o: {}, v: IconDefinition) =>
    typeof v === 'object' && 'iconName' in v && v.iconName !== undefined
      ? { ...o, [v.iconName]: v }
      : o,
  {},
);

function isProps(icon: Icons): icon is Props {
  return !Array.isArray(icon) && typeof icon === 'object' && 'icon' in icon;
}

function isIconString(icon: Icons): icon is IconString {
  return !Array.isArray(icon) && typeof icon === 'object' && 'value' in icon;
}

function IconDisplay({ icon }: { icon: Icon }) {
  return isProps(icon) ? (
    <FontAwesome fixedWidth {...icon} />
  ) : isIconString(icon) ? (
    <div
      className="fa-layers svg-inline--fa fa-w-16 fa-fw"
      style={{
        display: 'table-cell',
        verticalAlign: 'middle',
      }}
    >
      <div style={omit(icon, 'value')}>{icon.value}</div>
    </div>
  ) : (
    <FontAwesome fixedWidth icon={icon} />
  );
}

export function IconComp({ icon }: { icon: Icons }) {
  return Array.isArray(icon) ? (
    <span className="fa-layers fa-fw">
      {icon.map((ic: Icon, i) => (
        <IconDisplay key={JSON.stringify(ic) + String(i)} icon={ic} />
      ))}
    </span>
  ) : (
    <IconDisplay icon={icon} />
  );
}

/**
 * see https://github.com/FortAwesome/Font-Awesome/issues/14774
 * @param icon icon to render
 * @param def icon to use if first icon is not defined
 */
export function withDefault(icon: Icons | undefined | null, def: Icons): Icons {
  if (icon != null) return icon;
  return def;
}
export const FontAwesome = FontAwesomeIcon;
