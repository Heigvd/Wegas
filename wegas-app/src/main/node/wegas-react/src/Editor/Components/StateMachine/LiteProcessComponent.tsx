import { css, cx } from '@emotion/css';
import produce, { Immutable } from 'immer';
import * as React from 'react';
import { IDialogueDescriptor, IFSMDescriptor } from 'wegas-ts-api';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import {
  CustomProcessComponent,
  ProcessComponentProps,
} from '../../../Components/FlowChart/ProcessComponent';
import {
  stateBoxActionStyle,
  stateBoxButtonStyle,
  stateBoxStyle,
  stateContainerStyle,
  stateMoreInfosStyle,
  StateProcessHandle,
} from '../../../Components/FlowChart/StateProcessComponent';
import HTMLEditor from '../../../Components/HTML/HTMLEditor';
import { Validate } from '../../../Components/Inputs/Validate';
import { HTMLText } from '../../../Components/Outputs/HTMLText';
import { isActionAllowed } from '../../../Components/PageComponents/tools/options';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import { deleteState } from '../../../data/Reducer/globalState';
import { store } from '../../../data/Stores/store';
import { classNameOrEmpty, classOrNothing } from '../../../Helper/className';
import { translate } from '../FormView/translatable';
import { IconComp } from '../Views/FontAwesome';
import { StateProcess, TransitionFlowLine } from './StateMachineEditor';

const editButtonStyle = css(stateBoxButtonStyle);

const customProcessComponentEditingStyle = css({
  zIndex: 1000,
});

const stateContainerEditingStyle = css({
  width: '500px',
});
const stateBoxContentEditingStyle = css({
  padding: '15px 15px 15px 15px',
  boxSizing: 'border-box',
  background: themeVar.colors.BackgroundColor,
  borderRadius: '8px',
  border: '2px solid ' + themeVar.colors.DisabledColor,
  boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.15)',
});

interface EditButtonProps {
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export function TrashButton({ onClick }: EditButtonProps) {
  return (
    <div className={editButtonStyle} onClick={onClick} data-nodrag={true}>
      <IconComp icon="trash" />
    </div>
  );
}

export function EditButton({ onClick }: EditButtonProps) {
  return (
    <div className={editButtonStyle} onClick={onClick} data-nodrag={true}>
      <IconComp icon="pen" />
    </div>
  );
}

export function LiteStateProcessComponentFactory<
  IFSM extends IFSMDescriptor | IDialogueDescriptor,
>(stateMachine: Immutable<IFSM>) {
  function LiteStateProcessComponent({
    isProcessSelected,
    onClick,
    ...processProps
  }: ProcessComponentProps<TransitionFlowLine, StateProcess>) {
    const { disabled, readOnly, process } = processProps;
    const { lang } = React.useContext(languagesCTX);
    const textValue = entityIs(process.state, 'State')
      ? process.state.label
      : translate(process.state.text, lang);

    const [isEditing, setEditing] = React.useState(false);
    const [isShown, setIsShown] = React.useState(false);

    const onEdit = React.useCallback(
      (e: ModifierKeysEvent) => {
        if (!entityIs(process.state, 'State')) {
          setEditing(true);
        } else {
          onClick && onClick(e, process);
        }
      },
      [onClick, process],
    );

    const onTrash = React.useCallback(() => {
      deleteState(stateMachine, Number(process.id));
      setEditing(false);
    }, [process.id]);

    const onValidate = React.useCallback(
      (value: string) => {
        const newStateMachine = produce((stateMachine: IFSM) => {
          const state = stateMachine.states[process.state.index!];
          if (entityIs(state, 'State')) {
            state.label = value;
          } else {
            state.text.translations[lang].translation = value;
          }
        })(stateMachine);

        store.dispatch(
          Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
        );
        setEditing(false);
      },
      [lang, process.state.index],
    );

    return (
      <CustomProcessComponent
        {...processProps}
        disabled={processProps.disabled || isEditing}
        className={classOrNothing(
          customProcessComponentEditingStyle,
          isEditing,
        )}
      >
        <div
          className={
            cx(stateContainerStyle, {
              [stateContainerEditingStyle]: isEditing,
            }) + classNameOrEmpty(process.className)
          }
          style={process.style}
          onDoubleClick={onEdit}
        >
          {isEditing ? (
            <div className={stateBoxContentEditingStyle}>
              <Validate
                value={textValue}
                onValidate={onValidate}
                onCancel={() => setEditing(false)}
                vertical
              >
                {(value, onChange) => (
                  <HTMLEditor value={value} onChange={onChange} />
                )}
              </Validate>
            </div>
          ) : (
            <div
              className={cx(stateBoxStyle, {
                [stateBoxActionStyle]: isActionAllowed({ disabled, readOnly }),
              })}
              onMouseEnter={() => !disabled && setIsShown(true)}
              onMouseLeave={() => !disabled && setIsShown(false)}
            >
              <div className="StateLabelTextStyle">
                <HTMLText text={textValue || 'Empty'} />
              </div>
              {isActionAllowed({ readOnly, disabled }) && (
                <>
                  <TrashButton onClick={onTrash} />
                  <EditButton onClick={onEdit} />
                  <StateProcessHandle sourceProcess={process} />
                </>
              )}
            </div>
          )}
          {isShown && process.state.onEnterEvent.content != '' && (
            <div className={stateMoreInfosStyle}>
              <strong>Impact</strong>
              <p>{process.state.onEnterEvent.content}</p>
            </div>
          )}
        </div>
      </CustomProcessComponent>
    );
  }

  return LiteStateProcessComponent;
}
