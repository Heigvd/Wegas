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

// These icon definitions MUST be added to library in order for React-Fontawsome to work properly
library.add({
  ...fas,
  ...Object.keys(far).reduce((o, k) => ({ ...o, [k + 'r']: far[k] }), {}),
});

export type Icon = IconName | IconLookup | Props;
export type Icons = Icon | Icon[];

export const prefixes = [
  'fas',
  /*'fab',*/ 'far' /*'fal', 'fad'*/,
] as IconPrefix[];

const defaultProps: Props = {
  icon: 'unicorn',
  mask: 'unicorn',
  className: '',
  color: '',
  spin: false,
  pulse: false,
  border: false,
  fixedWidth: false,
  inverse: false,
  listItem: false,
  flip: 'both',
  size: 'xs',
  pull: 'left',
  rotation: 90,
  transform: '',
  symbol: '',
  style: {},
  tabIndex: 0,
  title: 'string',
};

export const icons = Object.values(fas).reduce(
  (o: {}, v: IconDefinition) =>
    typeof v === 'object' && 'iconName' in v && v.iconName !== undefined
      ? { ...o, [v.iconName]: v }
      : o,
  {},
);

function isProps(icon: Icons): icon is Props {
  return (
    !Array.isArray(icon) &&
    Object.keys(icon).filter(icon => Object.keys(defaultProps).includes(icon))
      .length > 0
  );
}

function IconDisplay({ icon }: { icon: Icon }) {
  return isProps(icon) ? (
    <FontAwesome fixedWidth {...icon} />
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
