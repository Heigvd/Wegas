import * as React from 'react';
import { css, cx } from 'emotion';
import {
  FontAwesome,
  Icon,
} from '../../../Editor/Components/Views/FontAwesome';
import { themeVar } from '../../Theme';
import * as iconModules from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { IconPrefix, IconName } from '@fortawesome/fontawesome-svg-core';

export const prefixes = ['fas', 'fab', 'far', 'fal', 'fad'] as IconPrefix[];

export const icons = Object.values(iconModules).reduce(
  (o: {}, v: IconDefinition) =>
    typeof v === 'object' && 'iconName' in v && v.iconName !== undefined
      ? { ...o, [v.iconName]: v }
      : o,
  {},
);

export interface IconButtonProps /*extends Props*/ {
  icon: Icon | Icon[];
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  id?: string;
  tooltip?: string;
  tabIndex?: number;
  prefixedLabel?: boolean;
  type?: 'submit' | 'reset';
  className?: string;
  ref?: React.ClassAttributes<HTMLButtonElement>['ref'];
}
const defaultActiveStyle = css({ color: themeVar.primaryDarkerColor });

export const shapeStyle = css({
  width: 'auto',
  margin: '3px',
  background: 'none',
  border: 'none',
  fontFamily: 'initial',
  fontSize: 'initial',
  cursor: 'pointer',
  textAlign: 'center',
  display: 'inline-block',
  color: themeVar.primaryColor,
  ':hover,:focus': {
    color: themeVar.primaryLighterColor,
    outline: 'none',
  },
});

const disabledStyle = css({
  color: themeVar.disabledColor,
  cursor: 'not-allowed',
  ':hover,:focus': {
    color: themeVar.disabledColor,
  },
});

function isIconName(icon: Icon): icon is IconName {
  return typeof icon === 'string';
}

export function IconComp({ icon }: { icon: Icon }) {
  return isIconName(icon) ? (
    <FontAwesome fixedWidth icon={icon} />
  ) : (
    <FontAwesome fixedWidth {...icon} />
  );
}

export const IconButton: React.FunctionComponent<IconButtonProps> = (
  props: IconButtonProps,
) => {
  const {
    onClick,
    onMouseDown,
    disabled,
    tooltip,
    tabIndex,
    pressed,
    label,
    prefixedLabel,
    id,
    type,
    className,
    icon,
    ref,
  } = props;

  return (
    <button
      ref={ref}
      id={id}
      type={type}
      title={tooltip}
      tabIndex={tabIndex}
      aria-label={tooltip}
      aria-pressed={pressed}
      onClick={onClick != null ? event => !disabled && onClick(event) : onClick}
      onMouseDown={
        onMouseDown != null
          ? event => !disabled && onMouseDown(event)
          : onMouseDown
      }
      className={cx(shapeStyle, className, {
        [disabledStyle]: Boolean(disabled),
        [defaultActiveStyle]: Boolean(pressed),
      })}
    >
      {prefixedLabel && label}
      {Array.isArray(icon) ? (
        <span className="fa-layers fa-fw">
          {icon.map((ic, i) => (
            <IconComp key={JSON.stringify(ic) + String(i)} icon={ic} />
          ))}
        </span>
      ) : (
        <IconComp icon={icon} />
      )}
      {!prefixedLabel && label}
    </button>
  );
};
