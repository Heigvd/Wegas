import { css, cx } from 'emotion';
import * as React from 'react';
import {
  flex,
  flexRowReverse,
  flexRow,
  expandWidth,
  itemCenter,
  expandBoth,
  expandHeight,
  grow,
} from '../../../css/classes';
import { useTranslate } from '../../../Editor/Components/FormView/translatable';
import { themeVar } from '../../Style/ThemeVars';

const dialogueEntryStyle = (player?: boolean) =>
  css({
    width: '80%',
    margin: '5px',
    ...(player ? { marginLeft: '20%' } : { marginRight: '20%' }),
  });

const textContainerStyle = (player?: boolean) =>
  css({
    backgroundColor: player
      ? themeVar.Common.colors.HeaderColor
      : themeVar.Common.colors.DisabledColor,
    borderRadius: themeVar.Common.dimensions.BorderRadius,
    // width: '80%',
  });

interface DialogueEntryProps {
  text: STranslatableContent;
  player?: boolean;
}

export function DialogueEntry({ text, player }: DialogueEntryProps) {
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
      {/* <div className={cx(dialogueEntryStyle, expandHeight)}> */}
      <img src={require('../../../pictures/chat_anonymous.svg').default} />
      <div className={cx(expandHeight, grow, textContainerStyle(player))}>
        <div
          // className={classOrNothing('player', player)}
          dangerouslySetInnerHTML={{ __html: translation }}
        />
        {/* </div> */}
      </div>
    </div>
  );
}
