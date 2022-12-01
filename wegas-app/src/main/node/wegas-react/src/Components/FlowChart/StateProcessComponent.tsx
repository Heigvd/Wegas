import { css, cx } from '@emotion/css';
import * as React from 'react';
import { useDrag } from 'react-dnd';
import { IAbstractState, IFSMDescriptor } from 'wegas-ts-api';
import { block, expandWidth, textCenter } from '../../css/classes';
import { entityIs } from '../../data/entities';
import { translate } from '../../data/i18n';
import { instantiate } from '../../data/scriptable';
import { Player, VariableDescriptor } from '../../data/selectors';
import {
  StateProcess,
  TransitionFlowLine,
} from '../../Editor/Components/StateMachine/StateMachineEditor';
import { IconComp } from '../../Editor/Components/Views/FontAwesome';
import { languagesCTX } from '../Contexts/LanguagesProvider';
import { EmptyMessage } from '../EmptyMessage';
import { HTMLText } from '../Outputs/HTMLText';
import { isActionAllowed } from '../PageComponents/tools/options';
import { themeVar } from '../Theme/ThemeVars';
import { FlowLine, Process } from './FlowChart';
import {
  DnDFlowchartHandle,
  ProcessHandleProps,
  PROCESS_HANDLE_DND_TYPE,
} from './Handles';
import {
  CustomProcessComponent,
  ProcessComponentProps,
} from './ProcessComponent';

export const stateContainerStyle = css({
  position: 'relative',
  display: 'inline-flex',
  flexDirection: 'column',
  width: '200px',
});

export const stateBoxStyle = css({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: '15px 15px 15px 15px',
  boxSizing: 'border-box',
  background: themeVar.colors.BackgroundColor,
  borderRadius: '8px',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: themeVar.colors.DisabledColor,
  boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.15)',
  color: themeVar.colors.ActiveColor,
  flexGrow: 0,
  maxHeight: '100px',
  '& *': {
    whiteSpace: 'nowrap',
    maxHeight: '40px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '.StateLabelTextStyle': {
    fontSize: '16px',
    textAlign: 'left',
    flex: '1 1 auto',
  },
});

export const stateBoxActionStyle = css({
  cursor: 'pointer',
  '&:hover': {
    background: themeVar.colors.BackgroundColor,
    borderColor: themeVar.colors.PrimaryColor,
  },
});

export const indexTagStyle = css({
  display: 'flex',
  borderRadius: '50%',
  border: '1px solid ' + themeVar.colors.ActiveColor,
  minWidth: '23px',
  height: '23px',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '12px',
  marginRight: '10px',
});

export const stateBoxButtonStyle = {
  color: themeVar.colors.PrimaryColor,
  display: 'flex',
  minWidth: '30px',
  height: '30px',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  '&:hover': {
    color: themeVar.colors.PrimaryColorShade,
  },
};

export const editHandle = css({
  position: 'absolute',
  top: '-38px',
  left: '50%',
  transform: 'translate(-50%, 0)',
  backgroundColor: themeVar.colors.HeaderColor,
  borderRadius: '5px 5px 0 0',
  padding: '3px',
  border: '2px solid ' + themeVar.colors.PrimaryColor,
  cursor: 'initial',
});

const handleForTransition = css({
  ...stateBoxButtonStyle,
  marginRight: '-15px',
  borderTop: '1px solid ' + themeVar.colors.PrimaryColor,
  borderBottom: '1px solid ' + themeVar.colors.PrimaryColor,
  borderLeft: '1px solid ' + themeVar.colors.PrimaryColor,
  borderRadius: '5px 0 0 5px',
  marginLeft: '5px',
  cursor: 'grab',
  '&:hover': {
    color: themeVar.colors.PrimaryColorShade,
    borderTop: '1px solid ' + themeVar.colors.PrimaryColorShade,
    borderBottom: '1px solid ' + themeVar.colors.PrimaryColorShade,
    borderLeft: '1px solid ' + themeVar.colors.PrimaryColorShade,
  },
});
export const stateMoreInfosStyle = css({
  position: 'absolute',
  backgroundColor: themeVar.colors.BackgroundColor,
  color: '#807F7F',
  fontSize: '0.8em',
  boxShadow: '0px 0px 6px rgba(0, 0, 0, 0.17)',
  borderRadius: '8px',
  marginTop: '10px',
  padding: '10px',
  wordWrap: 'break-word',
  top: '100%',
  width: '200px',
  ZIndex: 9999,
  '&::before': {
    content: "''",
    borderLeft: '15px solid transparent',
    borderRight: '15px solid transparent',
    borderBottom: '15px solid #fff',
    position: 'absolute',
    top: '-14px',
    left: 'calc(50% - 15px)',
  },
});

export const selectedStateBoxStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
  color: themeVar.colors.ActiveColor,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: themeVar.colors.HeaderColor,
  },
  [`.${indexTagStyle}`]: {
    borderColor: themeVar.colors.ActiveColor,
  },
});

export const currentStateBoxStyle = css({
  borderColor: themeVar.colors.SuccessColor,
});

export const defaultStateBoxStyle = css({
  borderWidth: '3px',
  borderStyle: 'double',
});

// Ignoring style while not in use
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const dragAndHoverStyle = css({
  background: themeVar.colors.HighlightColor, // add a third color? "evidence color shaded" editor theme var
});

export function isStateCurrentDefault(state: IAbstractState) {
  const currentStateId = VariableDescriptor.select<IFSMDescriptor>(
    state.parentId,
  )?.defaultInstance.currentStateId;
  return currentStateId === state.index;
}

export function isStateCurrent(state: IAbstractState) {
  const currentStateId = instantiate(
    VariableDescriptor.select<IFSMDescriptor>(state.parentId),
  )
    ?.getInstance(Player.self())
    .getCurrentStateId();
  return currentStateId === state.index;
}

export interface StateBoxProps {
  state: StateProcess;
  className?: string;
  onClick?: (e: ModifierKeysEvent, process: StateProcess) => void;
  selected?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export function StateBox({
  state,
  className,
  onClick,
  selected,
  disabled,
  readOnly,
}: StateBoxProps) {
  const [isShown, setIsShown] = React.useState(false);
  const { lang } = React.useContext(languagesCTX);
  const textValue = entityIs(state.state, 'State')
    ? state.state.label
    : translate(state.state.text, lang);
  return (
    <div
      style={state.style}
      onClick={e =>
        isActionAllowed({ disabled, readOnly }) && onClick && onClick(e, state)
      }
    >
      <div
        className={cx(
          stateBoxStyle,
          {
            [stateBoxActionStyle]: isActionAllowed({ disabled, readOnly }),
            [selectedStateBoxStyle]: selected,
            [currentStateBoxStyle]: isStateCurrent(state.state),
            [defaultStateBoxStyle]: isStateCurrentDefault(state.state),
          },
          className,
        )}
        onMouseEnter={() => !disabled && setIsShown(true)}
        onMouseLeave={() => !disabled && setIsShown(false)}
      >
        <div className={indexTagStyle}>
          <p>{state.id}</p>
        </div>
        <div className="StateLabelTextStyle">
          {textValue ? (
            <HTMLText text={textValue} />
          ) : (
            <EmptyMessage className={cx(expandWidth, textCenter, block)} />
          )}
        </div>
        {isActionAllowed({ readOnly, disabled }) && (
          <StateProcessHandle sourceProcess={state} />
        )}
      </div>
      {isShown && state.state.onEnterEvent?.content && (
        <div className={stateMoreInfosStyle}>
          <strong>Impact</strong>
          <p>{state.state.onEnterEvent.content}</p>
        </div>
      )}
    </div>
  );
}

export function StateProcessComponent({
  isProcessSelected,
  onClick,
  ...processProps
}: ProcessComponentProps<TransitionFlowLine, StateProcess>) {
  const { disabled, readOnly, process } = processProps;
  return (
    <CustomProcessComponent {...processProps}>
      <StateBox
        state={process}
        onClick={onClick}
        selected={isProcessSelected && isProcessSelected(process)}
        disabled={disabled}
        readOnly={readOnly}
      />
    </CustomProcessComponent>
  );
}

export function StateProcessHandle<F extends FlowLine, P extends Process<F>>({
  sourceProcess,
}: ProcessHandleProps<F, P>) {
  const [, drag] = useDrag<DnDFlowchartHandle<F, P>, unknown, unknown>({
    type: PROCESS_HANDLE_DND_TYPE,
    item: {
      type: PROCESS_HANDLE_DND_TYPE,
      processes: { sourceProcess },
    },
  });
  return (
    <div ref={drag} className={handleForTransition} data-nodrag={true}>
      <IconComp icon="project-diagram" />
    </div>
  );
}
