import * as React from 'react';
import { css } from 'emotion';
import { themeVar } from '../../Style/ThemeVars';
import { classNameOrEmpty } from '../../../Helper/className';

type TitleLevels = '1' | '2' | '3' | '4' | '5';

const levelStyle = (level: TitleLevels) =>
  css({
    color:
      themeVar.ComponentTitle.colors[
        `TextColor${level}` as keyof typeof themeVar.ComponentTitle.colors
      ],
    background:
      themeVar.ComponentTitle.colors[
        `TextBackground${level}` as keyof typeof themeVar.ComponentTitle.colors
      ],
    fontSize:
      themeVar.ComponentTitle.dimensions[
        `FontSize${level}` as keyof typeof themeVar.ComponentTitle.dimensions
      ],
    fontFamily:
      themeVar.ComponentTitle.others[
        `FontFamily${level}` as keyof typeof themeVar.ComponentTitle.others
      ],
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
