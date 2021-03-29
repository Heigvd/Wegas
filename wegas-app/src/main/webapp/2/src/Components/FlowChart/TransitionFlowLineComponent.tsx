import * as React from 'react';
import { css, cx } from 'emotion';
import {
  StateProcess,
  TransitionFlowLine,
} from '../../Editor/Components/StateMachineEditor';
import { entityIs } from '../../data/entities';
import { translate } from '../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../Contexts/LanguagesProvider';
import { HTMLText } from '../Outputs/HTMLText';
import { isActionAllowed } from '../PageComponents/tools/options';
import {
  CustomFlowLineComponent,
  FlowLineComponentProps,
} from './FlowLineComponent';

const transitionContainerStyle = css({
  display: 'inline-flex',
  flexDirection: 'column',
  width: '200px',
});
export const transitionBoxStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: '20px 10px 20px 10px',
  boxSizing: 'border-box',
  background: '#E7F4FF',
  border: '1px solid #2097F7',
  borderRadius: '8px',
  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
  color: '#2097F7',
  flexGrow: 0,
  '&>*': {
    margin: '0 7px',
  },
  '.StateLabelTextStyle': {
    fontSize: '16px',
    textAlign: 'left',
    margin: 0,
  },
  '& *': {
    whiteSpace: 'nowrap',
    maxHeight: '30px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export const transitionBoxActionStyle = css({
  cursor: 'pointer',
  '&:hover': {
    background: '#FFF',
    color: '#0D71C1',
    borderColor: '#0D71C1',
  },
});

const selectedTransitionBoxStyle = css({
  background: '#FFFFFF',
  border: '4px solid #0D71C1',
});

const transitionMoreInfosStyle = css({
  position: 'relative',
  backgroundColor: '#fff',
  color: '#807F7F',
  padding: '10px',
  fontSize: '12px',
  boxShadow: '0px 0px 6px rgba(0, 0, 0, 0.17)',
  borderRadius: '8px',
  marginTop: '10px',
  wordWrap: 'break-word',
  zIndex: 9999,
  '&::before': {
    content: "''",
    borderLeft: '15px solid transparent',
    borderRight: '15px solid transparent',
    borderBottom: '15px solid #fff',
    position: 'absolute',
    top: '-15px',
    left: 'calc(50% - 15px)',
  },
});

interface TransitionBoxProps {
  transition: TransitionFlowLine;
  className?: string;
  onClick?: (e: ModifierKeysEvent) => void;
  selected?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export function TransitionBox({
  transition,
  className,
  selected,
  onClick,
  disabled,
  readOnly,
}: TransitionBoxProps) {
  const [isShown, setIsShown] = React.useState(false);
  const { lang } = React.useContext(languagesCTX);
  return (
    <div className={cx(transitionContainerStyle, className)} onClick={onClick}>
      <div
        className={cx(transitionBoxStyle, {
          [transitionBoxActionStyle]: isActionAllowed({ disabled, readOnly }),
          [selectedTransitionBoxStyle]: selected,
        })}
        onMouseEnter={() => !disabled && setIsShown(true)}
        onMouseLeave={() => !disabled && setIsShown(false)}
      >
        {/*  {/* {transition.isDialogBox && (
        <div className="speakerImg">
          <img src="" alt="" />
        </div>
        )} */}
        <div>
          <p className="StateLabelTextStyle">
            <HTMLText
              text={
                (entityIs(transition.transition, 'Transition')
                  ? transition.transition.label
                  : translate(transition.transition.actionText, lang)) ||
                'Empty'
              }
            />
          </p>
          <p></p>
        </div>
      </div>
      {isShown &&
        (transition.transition.preStateImpact.content ||
          transition.transition.triggerCondition.content) && (
          <div className={transitionMoreInfosStyle}>
            {transition.transition.preStateImpact.content != '' && (
              <div>
                <strong>Impact</strong>
                <p> {transition.transition.preStateImpact.content}</p>
              </div>
            )}
            {transition.transition.triggerCondition.content != '' && (
              <div>
                <strong>Conditions</strong>
                <p>{transition.transition.triggerCondition.content}</p>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export function TransitionFlowLineComponent({
  onClick,
  startProcess,
  flowline,
  disabled,
  readOnly,
  selected,
  position,
}: FlowLineComponentProps<TransitionFlowLine, StateProcess>) {
  return (
    <CustomFlowLineComponent selected={selected} position={position}>
      <TransitionBox
        transition={flowline}
        onClick={e => onClick && onClick(e, startProcess, flowline)}
        selected={selected}
        disabled={disabled}
        readOnly={readOnly}
      />
    </CustomFlowLineComponent>
  );
}
