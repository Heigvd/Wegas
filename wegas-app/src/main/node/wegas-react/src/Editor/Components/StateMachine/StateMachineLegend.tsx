import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  currentStateBoxStyle,
  defaultStateBoxStyle,
  selectedStateBoxStyle,
  stateBoxStyle,
} from '../../../Components/FlowChart/StateProcessComponent';
import { flex, flexColumn, insideInsetShadow } from '../../../css/classes';

const legendStyle = css({
  padding: '5px',
  fontSize: '10px',
  borderRadius: '2px',
});

const legendTitleStyle = css({
  textDecorationLine: 'underline',
});

const smallStateBoxStyle = css({
  display: 'block',
  padding: 0,
  textAlign: 'center',
  marginTop: '2px',
});

export function StateMachineLegend() {
  return (
    <div className={cx(legendStyle, insideInsetShadow, flex, flexColumn)}>
      <em className={legendTitleStyle}>Legend : </em>
      <div
        className={cx(stateBoxStyle, selectedStateBoxStyle, smallStateBoxStyle)}
      >
        Selected
      </div>
      <div
        className={cx(stateBoxStyle, defaultStateBoxStyle, smallStateBoxStyle)}
      >
        Initial sate
      </div>
      <div
        className={cx(stateBoxStyle, currentStateBoxStyle, smallStateBoxStyle)}
      >
        Current state
      </div>
    </div>
  );
}
