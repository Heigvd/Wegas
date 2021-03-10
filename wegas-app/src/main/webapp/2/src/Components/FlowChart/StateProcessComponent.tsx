import * as React from 'react';
import { css, cx } from 'emotion';
import { FlowLine, Process } from './FlowChart';
import {
  CustomProcessComponent,
  ProcessComponentProps,
} from './ProcessComponent';
import {
  StateProcess,
  TransitionFlowLine,
} from '../../Editor/Components/StateMachineEditor';
import { entityIs } from '../../data/entities';
import { translate } from '../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../Contexts/LanguagesProvider';
import {
  DnDFlowchartHandle,
  ProcessHandleProps,
  PROCESS_HANDLE_DND_TYPE,
} from './Handles';
import { useDrag } from 'react-dnd';
import { HTMLText } from '../Outputs/HTMLText';
import { isActionAllowed } from '../PageComponents/tools/options';
import { classNameOrEmpty } from '../../Helper/className';

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
  background: '#2097F6', // primaryColor theme var?
  borderRadius: '8px',
  border: '4px solid transparent',
  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', //shadow theme var?
  color: '#fff', //LightText theme var?
  flexGrow: 0,
  '&>*': {
    marginRight: '15px',
  },
  '.StateLabelTextStyle': {
    fontSize: '16px',
    textAlign: 'left',
  },
});

export const stateBoxActionStyle = css({
  cursor: 'pointer',
  '&:hover': {
    background: '#0D71C1', // primaryColor theme var?
  },
});

export const indexTagStyle = css({
  display: 'flex',
  borderRadius: '50%',
  border: '1px solid #fff', //LightText theme var?
  minWidth: '23px',
  height: '23px',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '12px',
});

const handleForTransition = css({
  position: 'absolute',
  backgroundColor: '#FFA462', //evidence color editor theme var?
  borderRadius: '50%',
  minWidth: '20px',
  height: '20px',
  border: '1px solid #fff',
  right: '-25px',
  '&:hover': {
    minWidth: '30px',
    height: '30px',
    right: '-30px',
  },
});
const stateMoreInfosStyle = css({
  position: 'absolute',
  backgroundColor: '#fff',
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
  background: '#FFFFFF',
  border: '4px solid #0D71C1',
  color: '#0D71C1',
  '&:hover': {
    background: '#FFFFFF',
  },
  [`.${indexTagStyle}`]: {
    borderColor: '#0D71C1',
  },
});

// Ignoring style while not in use
// @ts-ignore
const dragAndHoverStyle = css({
  background: '#F97617', // add a third color? "evidence color shaded" editor theme var
});

interface StateBoxProps {
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
        {/*  {/* {state.isDialogBox && (
        <div className="speakerImg">
          <img src="" alt="" />
        </div>
        )} */}
        <div>
          <p className="StateLabelTextStyle">
            <HTMLText
              text={
                (entityIs(state.state, 'State')
                  ? state.state.label
                  : translate(state.state.text, lang)) || 'Empty'
              }
            />
          </p>
        </div>
        {isActionAllowed({ readOnly, disabled }) && (
          <StateProcessHandle sourceProcess={state} />
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
    item: {
      type: PROCESS_HANDLE_DND_TYPE,
      processes: { sourceProcess },
    },
  });
  return <div ref={drag} className={handleForTransition} data-nodrag={true} />;
}
