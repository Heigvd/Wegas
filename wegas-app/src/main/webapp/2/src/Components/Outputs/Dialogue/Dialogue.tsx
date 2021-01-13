import { css, cx } from 'emotion';
import * as React from 'react';
import {
  SDialogueDescriptor,
  SDialogueState,
  SDialogueTransition,
} from 'wegas-ts-api';
import {
  autoScroll,
  flex,
  flexColumn,
  flexDistribute,
  grow,
  itemCenter,
} from '../../../css/classes';
import { applyFSMTransition } from '../../../data/Reducer/VariableInstanceReducer';
import { useCurrentPlayer } from '../../../data/selectors/Player';
import { store } from '../../../data/store';
import { themeVar } from '../../Style/ThemeVars';
import { DialogueChoice } from './DialogueChoice';
import { DialogueEntry } from './DialogueEntry';
import { WaitingLoader } from './WaitingLoader';

////////////////////////////////////////////////////////////////////////////////////////////////////
// styles

const dialogEntryStyle = css({
  padding: '5px',
  marginBottom: '3px',
  '&>.player': {
    alignSelf: 'flex-end',
    backgroundColor: themeVar.Common.colors.HeaderColor,
  },
});

const choicePannelStyle = css({
  position: 'relative',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  padding: '5px',
  minHeight: '4em',
  flexShrink: 0,
});

const dialogueDisplayStyle = css({
  border: 'solid',
});

////////////////////////////////////////////////////////////////////////////////////////////////////
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
// React element

interface DialogueDisplayProps {
  dialogue: SDialogueDescriptor;
}

export function DialogueDisplay({ dialogue }: DialogueDisplayProps) {
  const historyDiv = React.useRef<HTMLDivElement>(null);

  const [waiting, setWaiting] = React.useState(false);

  const player = useCurrentPlayer();
  const dialogueInstance = dialogue.getInstance(player);
  const history = dialogueInstance.getTransitionHistory();
  const dialogueStates = dialogue.getStates();

  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // dialogue state

  const wait = React.useCallback(() => {
    setWaiting(true);
    const timer = setTimeout(() => {
      setWaiting(false);
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  let currentState = Object.values(dialogueStates)
    .sort((stateA, stateB) => {
      const A = stateA.getIndex();
      const B = stateB.getIndex();
      return (
        (B == null ? Number.MAX_SAFE_INTEGER : B) -
        (A == null ? Number.MAX_SAFE_INTEGER : A)
      );
    })
    .pop() as SDialogueState;

  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // dialogue history

  // when a dialogue entry is added, scroll to it at the bottom of the history
  // TODO There is still a problem when the last choice is made
  React.useEffect(() => {
    if (historyDiv != null) {
      historyDiv.current!.scrollTop = historyDiv.current!.scrollHeight;
    }
  }, [currentState]);

  function renderHistory(): JSX.Element[] {
    const dialogueComponents: JSX.Element[] = [
      <DialogueEntry key="STATE0" text={currentState.getText()} />,
    ];
    history.map((transitionId, i, arr) => {
      const transition = currentState
        .getTransitions()
        .find(transition => transition.getId() === transitionId) as
        | SDialogueTransition
        | undefined;

      if (transition != null) {
        // <><><><><><><><><><><><><><><><><>
        // player input
        dialogueComponents.push(
          <DialogueEntry
            key={`TRANSITION${transitionId}`}
            text={transition.getActionText()}
            player
          />,
        );

        // <><><><><><><><><><><><><><><><><>
        // update current state
        currentState = dialogueStates[
          transition.getNextStateId()
        ] as SDialogueState;

        // <><><><><><><><><><><><><><><><><>
        // game answer
        dialogueComponents.push(
          <DialogueEntry
            key={`STATE${transitionId}`}
            text={currentState.getText()}
            waiting={i === arr.length - 1 && waiting}
          />,
        );
      }
    });
    return dialogueComponents;
  }

  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // next input choices

  const choices = dialogueStates[
    dialogueInstance.getCurrentStateId()
  ].getTransitions();

  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // render

  return (
    <div
      className={
        cx(dialogueDisplayStyle, flex, flexColumn, grow) + ' wegas wegas-dialog'
      }
    >
      {/* ----- dialogue history  ---------------------------------------------------------- */}
      <div
        ref={historyDiv}
        className={cx(dialogEntryStyle, flex, flexColumn, autoScroll, grow)}
      >
        {renderHistory()}
      </div>

      {/* ----- show next input choices  --------------------------------------------------- */}
      {choices.length > 0 && (
        <div
          className={cx(
            flex,
            flexColumn,
            flexDistribute,
            itemCenter,
            choicePannelStyle,
          )}
        >
          {/* ---------- each input choice  ------------------------------------------------ */}
          {choices.map((transition: SDialogueTransition) => (
            <DialogueChoice
              key={`CHOICE${transition.getId()}`}
              label={transition.getActionText()}
              onClick={() => {
                wait();
                store.dispatch(
                  applyFSMTransition(
                    dialogue.getEntity(),
                    transition.getEntity(),
                  ),
                );
              }}
            />
          ))}

          {/* ---------- waiting for the next answer to be revealed ------------------------ */}
          {waiting && choices.length > 0 && (
            <WaitingLoader
              color={themeVar.Common.colors.HeaderColor}
              background={themeVar.Common.colors.HeaderColor}
            />
          )}
        </div>
      )}
    </div>
  );
}
