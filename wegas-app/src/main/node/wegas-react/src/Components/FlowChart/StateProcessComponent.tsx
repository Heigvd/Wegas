import { css, cx } from '@emotion/css';
import * as React from 'react';
import { entityIs } from '../../data/entities';
import { translate } from '../../Editor/Components/FormView/translatable';
import {
  StateProcess,
  TransitionFlowLine,
} from '../../Editor/Components/StateMachineEditor';
import { IconComp } from '../../Editor/Components/Views/FontAwesome';
import { classNameOrEmpty } from '../../Helper/className';
import { languagesCTX } from '../Contexts/LanguagesProvider';
import { HTMLText } from '../Outputs/HTMLText';
import { isActionAllowed } from '../PageComponents/tools/options';
import { themeVar } from '../Theme/ThemeVars';
import { FlowLine, Process } from './FlowChart';
import {
  ProcessHandleProps,
  PROCESS_HANDLE_DND_TYPE,
  useHandleManagement,
} from './Handles';
import {
  CustomProcessComponent,
  ProcessComponentProps,
} from './ProcessComponent';

const stateContainerStyle = css({
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
  border: '2px solid ' + themeVar.colors.DisabledColor,
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
  },
});

export const stateBoxActionStyle = css({
  cursor: 'pointer',
  '&:hover': {
    background: themeVar.colors.BackgroundColor,
    border: '2px solid ' + themeVar.colors.PrimaryColor,
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

const handleForTransition = css({
  display: 'flex',
  borderRadius: '50%',
  minWidth: '30px',
  height: '30px',
  border: '1px solid transparent',
  marginLeft: 'auto',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'grab',
  '&:hover': {
    border: '1px solid ' + themeVar.colors.PrimaryColor,
    color: themeVar.colors.PrimaryColor,
  },
  '&:active': {
    cursor: 'grabbing',
  },
});
const stateMoreInfosStyle = css({
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
  background: themeVar.colors.HeaderColor,
  color: themeVar.colors.ActiveColor,
  borderColor: 'transparent',
  boxShadow: 'none',
  '&:hover': {
    background: themeVar.colors.HeaderColor,
  },
  [`.${indexTagStyle}`]: {
    borderColor: themeVar.colors.ActiveColor,
  },
});

// Ignoring style while not in use
// @ts-ignore
const dragAndHoverStyle = css({
  background: themeVar.colors.HighlightColor, // add a third color? "evidence color shaded" editor theme var
});

interface StateBoxProps
  extends Pick<
    ProcessComponentProps<TransitionFlowLine, StateProcess>,
    'zoom' | 'onHandleMove' | 'onHandleMoveEnd'
  > {
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
  zoom,
  onHandleMove,
  onHandleMoveEnd,
}: StateBoxProps) {
  const [isShown, setIsShown] = React.useState(false);
  const { lang } = React.useContext(languagesCTX);
  return (
    <div
      className={stateContainerStyle + classNameOrEmpty(state.className)}
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
          <HTMLText
            text={
              (entityIs(state.state, 'State')
                ? state.state.label
                : translate(state.state.text, lang)) || 'Empty'
            }
          />
        </div>
        {isActionAllowed({ readOnly, disabled }) && (
          <StateProcessHandle
            sourceProcess={state}
            zoom={zoom}
            onHandleMove={onHandleMove}
            onHandleMoveEnd={onHandleMoveEnd}
          />
        )}
      </div>
      {isShown && state.state.onEnterEvent.content != '' && (
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
  const { disabled, readOnly, process, zoom, onHandleMove, onHandleMoveEnd } =
    processProps;
  return (
    <CustomProcessComponent {...processProps}>
      <StateBox
        state={process}
        onClick={onClick}
        selected={isProcessSelected && isProcessSelected(process)}
        disabled={disabled}
        readOnly={readOnly}
        zoom={zoom}
        onHandleMove={onHandleMove}
        onHandleMoveEnd={onHandleMoveEnd}
      />
    </CustomProcessComponent>
  );
}

export function StateProcessHandle<F extends FlowLine, P extends Process<F>>({
  sourceProcess,
  zoom,
  onHandleMove,
  onHandleMoveEnd,
}: ProcessHandleProps<F, P>) {
  // const [, drag] = useDrag<DnDFlowchartHandle<F, P>, unknown, unknown>({
  //   item: {
  //     type: PROCESS_HANDLE_DND_TYPE,
  //     processes: { sourceProcess },
  //   },
  // });

  const handleElement = useHandleManagement(
    onHandleMove,
    onHandleMoveEnd,
    sourceProcess,
    zoom,
  );

  return (
    <div
      // ref={drag}
      ref={handleElement}
      className={handleForTransition + ' ' + PROCESS_HANDLE_DND_TYPE}
      data-nodrag={true}
    >
      <IconComp icon="project-diagram" />
    </div>
  );
}
