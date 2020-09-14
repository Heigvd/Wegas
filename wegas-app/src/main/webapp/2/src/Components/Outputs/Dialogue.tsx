import { css, cx } from 'emotion';
import * as React from 'react';
import {
  SDialogueDescriptor,
  SDialogueState,
  SDialogueTransition,
  STranslatableContent,
} from 'wegas-ts-api';
import { flex, flexColumn, flexDistribute, flexRow } from '../../css/classes';
import { instantiate } from '../../data/scriptable';
import { Player } from '../../data/selectors';
import { useStore } from '../../data/store';
import { useTranslate } from '../../Editor/Components/FormView/translatable';
import { Button } from '../Inputs/Buttons/Button';

function TranslatedButton({
  label,
  onClick,
}: {
  label: STranslatableContent;
  onClick: () => void;
}) {
  const translation = useTranslate(label);
  return <Button label={translation} onClick={onClick} />;
}

interface DialogueEntryProps {
  text: STranslatableContent;
}

function DialogueEntry({ text }: DialogueEntryProps) {
  const translation = useTranslate(text);
  return <div>{translation}</div>;
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
      .sort(
        (stateA, stateB) =>
          (stateA.getIndex() || Number.MAX_SAFE_INTEGER) -
          (stateB.getIndex() || Number.MAX_SAFE_INTEGER),
      )
      .pop() as SDialogueState;
    const dialogueComponents: JSX.Element[] = [
      <DialogueEntry key="STATE0" text={currentState.getText()} />,
    ];
    history.map(transitionIndex => {
      const transition = currentState.getTransitions()[
        transitionIndex
      ] as SDialogueTransition;
      dialogueComponents.push(
        <DialogueEntry
          key={`TRANSITION${transitionIndex}`}
          text={transition.getActionText()}
        />,
      );
      currentState = dialogueStates[
        transition.getNextStateId()
      ] as SDialogueState;
      dialogueComponents.push(
        <DialogueEntry
          key={`STATE${transitionIndex}`}
          text={currentState.getText()}
        />,
      );
    });
    return dialogueComponents;
  }

  return (
    <div className={cx(dialogueDisplayStyle, flex, flexColumn)}>
      {renderHistory()}
      <div className={cx(flex, flexRow, flexDistribute)}>
        {dialogueStates[dialogueInstance.getCurrentStateId()]
          .getTransitions()
          .map((transition: SDialogueTransition) => (
            <TranslatedButton
              key={`CHOICE${transition.getId()}`}
              label={transition.getActionText()}
              onClick={() => {
                // Implement dialogue API
                debugger;
              }}
            />
          ))}
      </div>
    </div>
  );
}
