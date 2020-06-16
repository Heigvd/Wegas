import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../../Style/ThemeVars';
import { classNameOrEmpty } from '../../../Helper/className';

type TitleLevels = '1' | '2' | '3' | '4' | '5';

const levelStyle = (level: TitleLevels) =>
  css({
    color:
      themeVar.Title.colors[
        `TextColor${level}` as keyof typeof themeVar.Title.colors
      ],
    background:
      themeVar.Title.colors[
        `TextBackground${level}` as keyof typeof themeVar.Title.colors
      ],
    fontSize:
      themeVar.Title.dimensions[
        `FontSize${level}` as keyof typeof themeVar.Title.dimensions
      ],
    fontFamily:
      themeVar.Title.others[
        `FontFamily${level}` as keyof typeof themeVar.Title.others
      ],
  });

interface TitleProps extends React.PropsWithChildren<ClassAndStyle> {
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
