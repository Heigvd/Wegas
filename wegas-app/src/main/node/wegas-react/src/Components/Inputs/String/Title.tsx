import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../../Theme/ThemeVars';
import { classNameOrEmpty } from '../../../Helper/className';

type TitleLevels = '1' | '2' | '3' | '4' | '5';

const levelStyle = (level: TitleLevels) =>
  css({
    color: themeVar.colors.DarkTextColor,
    // background: themeVar.colors.BackgroundColor,
    fontSize: `${3 - Number(level) / 2}em`,
  });

interface TitleProps extends React.PropsWithChildren<ClassStyleId> {
  level?: TitleLevels;
}

export function Title({ level = '1', children, className, style }: TitleProps) {
  return React.createElement(
    `h${level}`,
    {
      className: levelStyle(level) + classNameOrEmpty(className),
      style: style,
    },
    children,
  );
}
