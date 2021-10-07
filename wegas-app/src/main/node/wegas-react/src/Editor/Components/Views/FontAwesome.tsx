import * as React from 'react';
import {
  library,
  IconPrefix,
  IconDefinition,
  IconName,
  IconProp,
  Transform,
} from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, Props } from '@fortawesome/react-fontawesome';
import { far } from '@fortawesome/free-regular-svg-icons';
import { omit } from 'lodash-es';
import { halfOpacity } from '../../../css/classes';
import { classNameOrEmpty } from '../../../Helper/className';
import { cx } from '@emotion/css';

// These icon definitions MUST be added to library in order for React-Fontawsome to work properly
library.add(fas, far);

export interface IconString {
  value: string;
  color?: React.CSSProperties['color'];
  fontSize?: React.CSSProperties['fontSize'];
  fontWeight?: React.CSSProperties['fontWeight'];
}

export type Icon = IconName | Props | IconString;
export type Icons = Icon | Icon[];

export const prefixes = [
  'fas',
  /*'fab',*/ 'far' /*'fal', 'fad'*/,
] as IconPrefix[];

export const icons = {
  // undefined: undefined,
  ...Object.values(fas).reduce(
    (o: {}, v: IconDefinition) =>
      typeof v === 'object' && 'iconName' in v && v.iconName !== undefined
        ? { ...o, [v.iconName]: v }
        : o,
    {},
  ),
};

export function isProps(icon: Icons): icon is Props {
  return !Array.isArray(icon) && typeof icon === 'object' && 'icon' in icon;
}

export function isIconString(icon: Icons): icon is IconString {
  return !Array.isArray(icon) && typeof icon === 'object' && 'value' in icon;
}

interface IconDisplayProps extends Omit<ClassStyleId, 'id'> {
  icon: Icon;
  /**
   * disabled - if true, displayed as disabled
   */
  disabled?: boolean;
  mask?: IconProp;
  transform?: string | Transform;
}

function IconDisplay({ icon, mask, transform, style, className, disabled }: IconDisplayProps) {
  return isProps(icon) ? (
    <FontAwesome
      fixedWidth
      {...icon}
      style={style}
      className={cx({ [halfOpacity]: disabled }) + classNameOrEmpty(className)}
      mask={mask}
      transform={transform}
    />
  ) : isIconString(icon) ? (
    <div
      className={
        cx({ [halfOpacity]: disabled }) +
        classNameOrEmpty(className) +
        ' fa-layers svg-inline--fa fa-w-16 fa-fw'
      }
      style={{
        ...style,
        display: 'table-cell',
        verticalAlign: 'middle',
      }}
    >
      <div style={{ ...omit(icon, 'value'), ...style }}>{icon.value}</div>
    </div>
  ) : (
    <FontAwesome
      fixedWidth
      icon={icon}
      mask={mask}
      transform={transform}
      style={style}
      className={cx({ [halfOpacity]: disabled }) + classNameOrEmpty(className)}
    />
  );
}

interface IconCompProps extends Omit<ClassStyleId, 'id'> {
  icon?: Icons;
  /**
   * disabled - if true, displayed as disabled
   */
  disabled?: boolean;
  /**
   * mask - icon name or [prefix, icon name] given to mask the icon prop
   */
  mask?: IconProp;
/**
   * transform - transform the icon given for icon prop.
   * Easiest is to use "shrink-n down-n left-n" for example: "shrink-9 down-1.5"
   */
  transform?: string | Transform;
}

export function IconComp({ icon, mask, transform, style, className, disabled }: IconCompProps) {
  return icon == null ? (
    <pre style={style} className={className}>
      No icon
    </pre>
  ) : Array.isArray(icon) ? (
    <span style={style} className={className + ' fa-layers fa-fw'}>
      {icon.map((ic: Icon, i) => (
        <IconDisplay
          key={JSON.stringify(ic) + String(i)}
          icon={ic}
          style={style}
          disabled={disabled}
        />
      ))}
    </span>
  ) : (
    <IconDisplay
      icon={icon}
      mask={mask}
      transform={transform}
      style={style}
      className={className}
      disabled={disabled}
    />
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
