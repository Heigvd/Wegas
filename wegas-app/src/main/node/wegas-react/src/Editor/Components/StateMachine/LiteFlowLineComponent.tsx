import { css, cx } from '@emotion/css';
import produce, { Immutable } from 'immer';
import * as React from 'react';
import {
  IAbstractTransition,
  IDialogueDescriptor,
  IFSMDescriptor,
} from 'wegas-ts-api';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
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
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import { store } from '../../../data/Stores/store';
import { classOrNothing } from '../../../Helper/className';
import { createTranslatableContent, translate } from '../FormView/translatable';
import { EditButton, TrashButton } from './LiteProcessComponent';
import {
  deleteTransition,
  StateProcess,
  TransitionFlowLine,
} from './StateMachineEditor';

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
>(stateMachine: Immutable<IFSM>) {
  function LiteFlowLineComponent({
    startProcess,
    onClick,
    flowline,
    disabled,
    readOnly,
    position,
    zoom,
  }: Omit<
    FlowLineComponentProps<TransitionFlowLine, StateProcess>,
    'selected'
  >) {
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

        store.dispatch(
          Actions.VariableDescriptorActions.updateDescriptor(newStateMachine),
        );
        setEditing(false);
      },
      [flowline.transition.id, lang, startProcess.state.index],
    );

    const onEdit = React.useCallback(
      (e: ModifierKeysEvent) => {
        if (!entityIs(startProcess.state, 'State')) {
          setEditing(true);
        } else {
          onClick && onClick(e, startProcess, flowline);
        }
      },
      [flowline, onClick, startProcess],
    );

    const onTrash = React.useCallback(() => {
      deleteTransition(
        stateMachine,
        Number(startProcess.id),
        Number(flowline.id),
        store.dispatch,
      );
      setEditing(false);
    }, [flowline.id, startProcess.id]);

    return (
      <CustomFlowLineComponent
        selected={false}
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
              className={cx(transitionBoxStyle, {
                [transitionBoxActionStyle]: isActionAllowed({
                  disabled,
                  readOnly,
                }),
              })}
              onMouseEnter={() => !disabled && setIsShown(true)}
              onMouseLeave={() => !disabled && setIsShown(false)}
              onDoubleClick={onEdit}
            >
              <div className="StateLabelTextStyle">
                <HTMLText text={textValue || 'Empty'} />
              </div>
              <TrashButton onClick={onTrash} />
              <EditButton onClick={onEdit} />
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
