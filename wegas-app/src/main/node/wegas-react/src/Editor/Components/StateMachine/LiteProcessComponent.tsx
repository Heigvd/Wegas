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
  selectedStateBoxStyle,
  stateBoxActionStyle,
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
import { createTranslatableContent, translate } from '../FormView/translatable';
import { EditHandle } from './EditHandle';
import { StateProcess, TransitionFlowLine } from './StateMachineEditor';

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
            state.text = createTranslatableContent(lang, value, state.text);
          }
        })(stateMachine);

        store.dispatch(
          Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
        );
        setEditing(false);
      },
      [lang, process.state.index],
    );

    const isSelected = isProcessSelected && isProcessSelected(process);

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
          onClick={e => onClick && onClick(e, process)}
        >
          {isSelected && !isEditing && (
            <EditHandle onEdit={onEdit} onTrash={onTrash} />
          )}
          {isEditing ? (
            <div
              className={cx(stateBoxContentEditingStyle, css({ padding: 0 }))}
            >
              <Validate
                value={textValue}
                onValidate={onValidate}
                onCancel={() => setEditing(false)}
                vertical
                validatorClassName={css({
                  padding: '15px',
                  backgroundColor: themeVar.colors.HeaderColor,
                })}
              >
                {(value, onChange) => (
                  <HTMLEditor
                    value={value}
                    onChange={onChange}
                    customToolbar="bold italic underline bullist fontsizeselect"
                  />
                )}
              </Validate>
            </div>
          ) : (
            <div
              className={cx(stateBoxStyle, {
                [stateBoxActionStyle]: isActionAllowed({ disabled, readOnly }),
                [selectedStateBoxStyle]: isSelected,
              })}
              onMouseEnter={() => !disabled && setIsShown(true)}
              onMouseLeave={() => !disabled && setIsShown(false)}
            >
              <div className="StateLabelTextStyle">
                <HTMLText text={textValue || 'Empty'} />
              </div>
              {isActionAllowed({ readOnly, disabled }) && (
                <StateProcessHandle sourceProcess={process} />
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
