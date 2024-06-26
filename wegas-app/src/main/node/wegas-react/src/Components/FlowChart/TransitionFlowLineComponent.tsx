import { css, cx } from '@emotion/css';
import * as React from 'react';
import { block, expandWidth, textCenter } from '../../css/classes';
import { entityIs } from '../../data/entities';
import { translate } from '../../data/i18n';
import {
  StateProcess,
  TransitionFlowLine,
} from '../../Editor/Components/StateMachine/StateMachineEditor';
import { languagesCTX } from '../Contexts/LanguagesProvider';
import { EmptyMessage } from '../EmptyMessage';
import { HTMLText } from '../Outputs/HTMLText';
import { isActionAllowed } from '../PageComponents/tools/options';
import { themeVar } from '../Theme/ThemeVars';
import {
  CustomFlowLineComponent,
  FlowLineComponentProps,
} from './FlowLineComponent';

export const transitionContainerStyle = css({
  display: 'inline-flex',
  flexDirection: 'column',
  width: '200px',
  userSelect: 'none',
});
export const transitionBoxStyle = css({
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
  '&>*': {
    margin: '0 7px',
  },
  '.StateLabelTextStyle': {
    fontSize: '16px',
    textAlign: 'left',
    margin: 0,
    flex: '1 1 auto',
  },
  '& *': {
    whiteSpace: 'nowrap',
    maxHeight: '30px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    alignItems: 'center',
  },
  // does not work because of transform rules in parent elements
  // see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
  // '&:hover': {
  //   zIndex: 9999,
  //   color: '#FF0000'
  // }
});

export const transitionBoxActionStyle = css({
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0px 0px 6px rgba(0, 0, 0, 0.2)',
    borderColor: 'transparent',
  },
});

const selectedTransitionBoxStyle = css({
  background: themeVar.colors.ActiveColor,
  border: '4px solid ' + themeVar.colors.ActiveColor,
  '&:hover': {
    backgroundColor: themeVar.colors.ActiveColor,
    border: '4px solid ' + themeVar.colors.ActiveColor,
  },
});

export const transitionMoreInfosStyle = css({
  position: 'absolute',
  top: '110%',
  backgroundColor: themeVar.colors.BackgroundColor,
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
  labelComponent?: React.LegacyRef<HTMLDivElement>;
}

export function TransitionBox({
  transition,
  className,
  selected,
  onClick,
  disabled,
  readOnly,
  labelComponent,
}: TransitionBoxProps) {
  const [isShown, setIsShown] = React.useState(false);
  const { lang } = React.useContext(languagesCTX);
  const textValue = entityIs(transition.transition, 'Transition')
    ? transition.transition.label
    : translate(transition.transition.actionText, lang);
  return (
    <div
      className={cx(transitionContainerStyle, className)}
      onClick={e =>
        isActionAllowed({ disabled, readOnly }) && onClick && onClick(e)
      }
    >
      <div
        ref={labelComponent}
        className={cx(transitionBoxStyle, {
          [transitionBoxActionStyle]: isActionAllowed({ disabled, readOnly }),
          [selectedTransitionBoxStyle]: selected,
        })}
        onMouseEnter={() => !disabled && setIsShown(true)}
        onMouseLeave={() => !disabled && setIsShown(false)}
      >
        <div className="StateLabelTextStyle">
          {textValue ? (
            <HTMLText text={textValue} />
          ) : (
            <EmptyMessage className={cx(expandWidth, textCenter, block)} />
          )}
        </div>
      </div>
      {isShown &&
        (transition.transition.preStateImpact?.content ||
          transition.transition.triggerCondition?.content) && (
          <div className={transitionMoreInfosStyle}>
            {transition.transition.preStateImpact?.content && (
              <div>
                <strong>Impact</strong>
                <p> {transition.transition.preStateImpact.content}</p>
              </div>
            )}
            {transition.transition.triggerCondition?.content && (
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
  zoom,
}: FlowLineComponentProps<TransitionFlowLine, StateProcess>) {
  const labelRef = React.useRef<HTMLDivElement>(null);
  return (
    <CustomFlowLineComponent
      selected={selected}
      position={position}
      zoom={zoom}
      mainElement={labelRef}
    >
      <TransitionBox
        labelComponent={labelRef}
        transition={flowline}
        onClick={e => onClick && onClick(e, startProcess, flowline)}
        selected={selected}
        disabled={disabled}
        readOnly={readOnly}
      />
    </CustomFlowLineComponent>
  );
}
