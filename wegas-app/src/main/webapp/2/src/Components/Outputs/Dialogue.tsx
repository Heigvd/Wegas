import { css, cx } from 'emotion';
import * as React from 'react';
import {
  SDialogueDescriptor,
  SDialogueState,
  SDialogueTransition,
  STranslatableContent,
} from 'wegas-ts-api';
import {
  flex,
  flexColumn,
  flexDistribute,
  flexRowReverse,
  grow,
} from '../../css/classes';
import { applyFSMTransition } from '../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../data/scriptable';
import { Player } from '../../data/selectors';
import { store, useStore } from '../../data/store';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { classOrNothing } from '../../Helper/className';
import { Button } from '../Inputs/Buttons/Button';

const dialogEntryStyle = css({
  '&>.player': {
    alignSelf: 'flex-end',
  },
});

function TranslatedButton({
  label,
  onClick,
}: {
  label: STranslatableContent;
  onClick: () => void;
}) {
  const translation = useTranslate(label);
  return (
    <Button onClick={onClick} className={flexRowReverse}>
      <div
        dangerouslySetInnerHTML={{
          __html: translation,
        }}
      ></div>
    </Button>
  );
}

interface DialogueEntryProps {
  text: STranslatableContent;
  player?: boolean;
}

function DialogueEntry({ text, player }: DialogueEntryProps) {
  const translation = useTranslate(text);
  return (
    <div
      className={classOrNothing('player', player)}
      dangerouslySetInnerHTML={{ __html: translation }}
    />
  );
}

const dialogueDisplayStyle = css({});

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
      <div className={cx(dialogEntryStyle, flex, flexColumn)}>
        {renderHistory()}
      </div>
      <div className={cx(flex, flexColumn, flexDistribute)}>
        {dialogueStates[dialogueInstance.getCurrentStateId()]
          .getTransitions()
          .map((transition: SDialogueTransition) => (
            <TranslatedButton
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
