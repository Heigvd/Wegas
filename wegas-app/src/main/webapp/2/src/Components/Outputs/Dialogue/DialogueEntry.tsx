import { css, cx } from 'emotion';
import * as React from 'react';
import {
  flex,
  flexRowReverse,
  flexRow,
  expandWidth,
  itemCenter,
  expandHeight,
  grow,
} from '../../../css/classes';
import { useTranslate } from '../../../Editor/Components/FormView/translatable';
import { themeVar } from '../../Style/ThemeVars';
import { WaitingLoader } from './WaitingLoader';

const dialogueEntryStyle = (player?: boolean) =>
  css({
    width: '80%',
    margin: '5px',
    ...(player ? { marginLeft: '20%' } : { marginRight: '20%' }),
  });

const textContainerStyle = (player?: boolean) =>
  css({
    position: 'relative',
    backgroundColor: player
      ? themeVar.Common.colors.HeaderColor
      : themeVar.Common.colors.DisabledColor,
    borderRadius: themeVar.Common.dimensions.BorderRadius,
    padding: '5px',
    overflow: 'hidden',
  });

const portraitStyle = css({
  width: '50px',
  height: '50px',
  margin: '5px',
});

interface UserPortraitProps extends ClassStyleId {
  color?: string;
}

function UserPortrait({
  color = '#00BFCE',
  className,
  style,
  id,
}: UserPortraitProps) {
  return (
    <div className={className} style={style} id={id}>
      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="25" cy="25" r="25" fill={color} />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8.33331 43.6373C8.49419 36.4296 14.2332 30.6369 21.2928 30.6287H28.7002C35.7599 30.6369 41.4989 36.4296 41.6597 43.6373C37.2372 47.5941 31.3978 50 24.9965 50C18.5952 50 12.7559 47.5941 8.33331 43.6373ZM24.9965 28.7281C19.8828 28.7281 15.7373 24.4735 15.7373 19.2251C15.7373 13.9768 19.8828 9.72222 24.9965 9.72222C30.1103 9.72222 34.2558 13.9768 34.2558 19.2251C34.2497 24.4709 30.1077 28.7218 24.9965 28.7281Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

interface DialogueEntryProps {
  text: STranslatableContent;
  player?: boolean;
  waiting?: boolean;
}

export function DialogueEntry({ text, player, waiting }: DialogueEntryProps) {
  const translation = useTranslate(text);
  return (
    <div
      className={cx(
        flex,
        player ? flexRowReverse : flexRow,
        itemCenter,
        expandWidth,
        dialogueEntryStyle(player),
      )}
    >
      <UserPortrait
        className={portraitStyle}
        color={
          player
            ? themeVar.Common.colors.ActiveColor
            : themeVar.Common.colors.HeaderColor
        }
      />
      <div className={cx(expandHeight, grow, textContainerStyle(player))}>
        <div dangerouslySetInnerHTML={{ __html: translation }} />
        {waiting && (
          <WaitingLoader
            color={themeVar.Common.colors.HeaderColor}
            background={themeVar.Common.colors.DisabledColor}
          />
        )}
      </div>
    </div>
  );
}
