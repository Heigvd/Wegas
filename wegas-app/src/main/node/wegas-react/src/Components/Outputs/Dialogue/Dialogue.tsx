import { css, cx } from '@emotion/css';
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
  halfOpacity,
  itemCenter,
} from '../../../css/classes';
import { applyFSMTransition } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { store } from '../../../data/Stores/store';
import { isActionAllowed } from '../../PageComponents/tools/options';
import { themeVar } from '../../Theme/ThemeVars';
import { DialogueChoice } from './DialogueChoice';
import { DialogueEntry } from './DialogueEntry';
import { WaitingLoader } from './WaitingLoader';

////////////////////////////////////////////////////////////////////////////////////////////////////
// styles

const dialogEntryStyle = css({
  padding: '5px',
  marginBottom: '3px',
  maxHeight: '40vh',
  overflow: 'auto',
  '&>.player': {
    alignSelf: 'flex-end',
    backgroundColor: themeVar.colors.PrimaryColor,
  },
});

const choicePannelStyle = css({
  position: 'relative',
  backgroundColor: themeVar.colors.DisabledColor,
  padding: '5px',
  minHeight: '4em',
  flexShrink: 0,
});

const dialogueDisplayStyle = css({
  border: 'none',
  boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.1)',
  borderRadius: themeVar.dimensions.BorderRadius,
});

////////////////////////////////////////////////////////////////////////////////////////////////////
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
// React element

interface DialogueDisplayProps extends DisabledReadonly {
  dialogue: SDialogueDescriptor;
}

export function DialogueDisplay({
  dialogue,
  disabled,
  readOnly,
}: DialogueDisplayProps) {
  const historyDiv = React.useRef<HTMLDivElement>(null);

  const [waitingUser, setWaitingUser] = React.useState(false);
  const [waitingSystem, setWaitingSystem] = React.useState(false);

  const dialogueInstance = dialogue.getInstance(Player.self());
  const history = dialogueInstance.getTransitionHistory();
  const dialogueStates = dialogue.getStates();

  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // dialogue state

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
  React.useEffect(() => {
    if (historyDiv != null && historyDiv.current != null) {
      historyDiv.current.scrollTop = historyDiv.current.scrollHeight;
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
            waiting={i === arr.length - 1 && waitingSystem}
          />,
        );
      }
    });
    return dialogueComponents;
  }

  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // next input choices

  const choices =
    dialogueStates[dialogueInstance.getCurrentStateId()].getTransitions();

  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // render

  return (
    <div
      className={
        cx(dialogueDisplayStyle, flex, flexColumn, grow, {
          [halfOpacity]: disabled,
        }) + ' wegas wegas-dialog'
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
      {isActionAllowed({ disabled, readOnly }) && choices.length > 0 && (
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
                setWaitingUser(true);
                store.dispatch(
                  applyFSMTransition(
                    dialogue.getEntity(),
                    transition.getEntity(),
                    () => {
                      setWaitingUser(false);
                      setWaitingSystem(true);
                      setTimeout(() => {
                        setWaitingSystem(false);
                        setWaitingUser(false);
                      }, 1000);
                    },
                  ),
                );
              }}
              disabled={disabled}
              readOnly={readOnly}
            />
          ))}
          {/* ---------- waiting for the next answer to be revealed ------------------------ */}
          {(waitingUser || waitingSystem) && choices.length > 0 && (
            <WaitingLoader
              color={
                waitingSystem
                  ? themeVar.colors.DisabledColor
                  : themeVar.colors.LightTextColor
              }
              background={themeVar.colors.DisabledColor}
            />
          )}
        </div>
      )}
    </div>
  );
}
