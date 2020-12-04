import { css, cx } from 'emotion';
import * as React from 'react';
import {
  SDialogueDescriptor,
  SDialogueState,
  SDialogueTransition,
} from 'wegas-ts-api';
import {
  flex,
  flexColumn,
  flexDistribute,
  grow,
  itemCenter,
} from '../../../css/classes';
import { applyFSMTransition } from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { Player } from '../../../data/selectors';
import { store, useStore } from '../../../data/store';
import { themeVar } from '../../Style/ThemeVars';
import { DialogueChoice } from './DialogueChoice';
import { DialogueEntry } from './DialogueEntry';

const dialogEntryStyle = css({
  padding: '5px',
  '&>.player': {
    alignSelf: 'flex-end',
    backgroundColor: themeVar.Common.colors.HeaderColor,
  },
});

const choicePannelStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
  padding: '5px',
});

const dialogueDisplayStyle = css({
  border: 'solid',
});

interface DialogueDisplayProps {
  dialogue: SDialogueDescriptor;
}

export function DialogueDisplay({ dialogue }: DialogueDisplayProps) {
  const player = instantiate(useStore(Player.selectCurrent));
  const dialogueInstance = dialogue.getInstance(player);
  const history = dialogueInstance.getTransitionHistory();
  const dialogueStates = dialogue.getStates();

  function renderHistory(): JSX.Element[] {
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
    const dialogueComponents: JSX.Element[] = [
      <DialogueEntry key="STATE0" text={currentState.getText()} />,
    ];
    history.map(transitionId => {
      const transition = currentState
        .getTransitions()
        .find(transition => transition.getId() === transitionId) as
        | SDialogueTransition
        | undefined;

      if (transition != null) {
        dialogueComponents.push(
          <DialogueEntry
            key={`TRANSITION${transitionId}`}
            text={transition.getActionText()}
            player
          />,
        );
        currentState = dialogueStates[
          transition.getNextStateId()
        ] as SDialogueState;
        dialogueComponents.push(
          <DialogueEntry
            key={`STATE${transitionId}`}
            text={currentState.getText()}
          />,
        );
      }
    });
    return dialogueComponents;
  }

  return (
    <div
      className={
        cx(dialogueDisplayStyle, flex, flexColumn, grow) + ' wegas wegas-dialog'
      }
    >
      <div className={cx(dialogEntryStyle, flex, flexColumn, grow)}>
        {renderHistory()}
      </div>
      <div
        className={cx(
          flex,
          flexColumn,
          flexDistribute,
          itemCenter,
          choicePannelStyle,
        )}
      >
        {dialogueStates[dialogueInstance.getCurrentStateId()]
          .getTransitions()
          .map((transition: SDialogueTransition) => (
            <DialogueChoice
              key={`CHOICE${transition.getId()}`}
              label={transition.getActionText()}
              onClick={() => {
                store.dispatch(
                  applyFSMTransition(
                    dialogue.getEntity(),
                    transition.getEntity(),
                  ),
                );
              }}
            />
          ))}
      </div>
    </div>
  );
}
