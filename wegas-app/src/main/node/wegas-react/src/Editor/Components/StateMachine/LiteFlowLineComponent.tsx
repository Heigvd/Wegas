import { css, cx } from '@emotion/css';
import produce, { Immutable } from 'immer';
import * as React from 'react';
import {
  IAbstractTransition,
  IDialogueDescriptor,
  IFSMDescriptor,
} from 'wegas-ts-api';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import { EmptyMessage } from '../../../Components/EmptyMessage';
import {
  CustomFlowLineComponent,
  FlowLineComponentProps,
} from '../../../Components/FlowChart/FlowLineComponent';
import {
  transitionBoxActionStyle,
  transitionBoxStyle,
  transitionContainerStyle,
  transitionMoreInfosStyle,
} from '../../../Components/FlowChart/TransitionFlowLineComponent';
import HTMLEditor from '../../../Components/HTML/HTMLEditor';
import { Validate } from '../../../Components/Inputs/Validate';
import { HTMLText } from '../../../Components/Outputs/HTMLText';
import { isActionAllowed } from '../../../Components/PageComponents/tools/options';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { block, expandWidth, textCenter } from '../../../css/classes';
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import { createTranslatableContent, translate } from '../../../data/i18n';
import { deleteTransition } from '../../../data/Reducer/editingState';
import {
  editingStore,
  EditingStoreDispatch,
} from '../../../data/Stores/editingStore';
import { classOrNothing } from '../../../Helper/className';
import { EditHandle } from './EditHandle';
import { StateProcess, TransitionFlowLine } from './StateMachineEditor';

const customFlowLineComponentEditingStyle = css({
  zIndex: 1000,
});

const transitionContainerEditingStyle = css({
  width: '500px',
});
const stateBoxContentEditingStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  boxSizing: 'border-box',
  padding: '4px',
  background: themeVar.colors.PrimaryColor,
  border: '1px solid ' + themeVar.colors.BackgroundColor,
  borderRadius: '8px',
  color: themeVar.colors.LightTextColor,
  flexGrow: 0,
});

export function LiteFlowLineComponentFactory<
  IFSM extends IFSMDescriptor | IDialogueDescriptor,
>(stateMachine: Immutable<IFSM>, dispatch: EditingStoreDispatch) {
  function LiteFlowLineComponent({
    startProcess,
    onClick,
    flowline,
    disabled,
    readOnly,
    position,
    zoom,
    selected,
  }: FlowLineComponentProps<TransitionFlowLine, StateProcess>) {
    const [isEditing, setEditing] = React.useState(false);
    const [isShown, setIsShown] = React.useState(false);
    const { lang } = React.useContext(languagesCTX);

    const textValue = entityIs(flowline.transition, 'Transition')
      ? flowline.transition.label
      : translate(flowline.transition.actionText, lang);

    const onValidate = React.useCallback(
      (value: string) => {
        const newStateMachine = produce((stateMachine: IFSM) => {
          const transitionI = (
            stateMachine.states[startProcess.state.index!]
              .transitions as IAbstractTransition[]
          ).findIndex(trans => trans.id === flowline.transition.id);
          const transition =
            stateMachine.states[startProcess.state.index!].transitions[
              transitionI
            ];
          if (entityIs(transition, 'Transition')) {
            transition.label = value;
          } else {
            transition.actionText = createTranslatableContent(
              lang,
              value,
              transition.actionText,
            );
          }
        })(stateMachine);

        dispatch(
          Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
        );
        setEditing(false);
      },
      [flowline.transition.id, lang, startProcess.state.index],
    );

    const onEdit = React.useCallback(
      (e: ModifierKeysEvent) => {
        if (
          isActionAllowed({
            disabled: disabled,
            readOnly: readOnly,
          })
        ) {
          if (!entityIs(startProcess.state, 'State')) {
            setEditing(true);
          } else {
            onClick && onClick(e, startProcess, flowline);
          }
        }
      },
      [disabled, flowline, onClick, readOnly, startProcess],
    );

    const onTrash = React.useCallback(() => {
      if (
        isActionAllowed({
          disabled: disabled,
          readOnly: readOnly,
        })
      ) {
        editingStore.dispatch(
          deleteTransition(
            stateMachine,
            Number(startProcess.id),
            Number(flowline.id),
          ),
        );
        setEditing(false);
      }
    }, [disabled, flowline.id, readOnly, startProcess.id]);

    return (
      <CustomFlowLineComponent
        selected={selected}
        position={position}
        zoom={zoom}
        className={classOrNothing(
          customFlowLineComponentEditingStyle,
          isEditing,
        )}
      >
        <div
          className={cx(transitionContainerStyle, {
            [transitionContainerEditingStyle]: isEditing,
          })}
        >
          {!isEditing && selected && (
            <EditHandle onEdit={onEdit} onTrash={onTrash} />
          )}
          {isEditing ? (
            <div className={stateBoxContentEditingStyle}>
              <Validate
                value={textValue}
                onValidate={onValidate}
                onCancel={() => setEditing(false)}
                vertical
              >
                {(value, onChange) => (
                  <HTMLEditor
                    value={value}
                    onChange={onChange}
                    toolbarLayout="player"
                    // customToolbar="bold italic underline bullist fontsizeselect"
                  />
                )}
              </Validate>
            </div>
          ) : (
            <div
              className={cx(transitionBoxStyle, {
                [transitionBoxActionStyle]: isActionAllowed({
                  disabled,
                  readOnly,
                }),
              })}
              onMouseEnter={() => !disabled && setIsShown(true)}
              onMouseLeave={() => !disabled && setIsShown(false)}
              onDoubleClick={onEdit}
              onClick={e => onClick && onClick(e, startProcess, flowline)}
            >
              <div className="StateLabelTextStyle">
                {textValue ? (
                  <HTMLText text={textValue} />
                ) : (
                  <EmptyMessage
                    className={cx(expandWidth, textCenter, block)}
                  />
                )}
              </div>
            </div>
          )}
          {isShown &&
            (flowline.transition.preStateImpact.content ||
              flowline.transition.triggerCondition.content) && (
              <div className={transitionMoreInfosStyle}>
                {flowline.transition.preStateImpact.content != '' && (
                  <div>
                    <strong>Impact</strong>
                    <p> {flowline.transition.preStateImpact.content}</p>
                  </div>
                )}
                {flowline.transition.triggerCondition.content != '' && (
                  <div>
                    <strong>Conditions</strong>
                    <p>{flowline.transition.triggerCondition.content}</p>
                  </div>
                )}
              </div>
            )}
        </div>
      </CustomFlowLineComponent>
    );
  }

  return LiteFlowLineComponent;
}
