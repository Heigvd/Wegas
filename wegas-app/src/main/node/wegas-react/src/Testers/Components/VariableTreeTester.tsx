import { cx /*,css*/ } from '@emotion/css';
import * as React from 'react';
import { useGameModel } from '../../Components/Hooks/useGameModel';
import { Toggler } from '../../Components/Inputs/Boolean/Toggler';
import { VariableTreeView } from '../../Components/Variable/VariableTreeView';
import {
  expandBoth,
  expandHeight,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
  grow,
} from '../../css/classes';

export default function MenuTester() {
  const [treeState, setTreeState] = React.useState({
    noHeader: false,
    noVisibleRoot: false,
    disabled: false,
    readOnly: false,
  });
  const root = useGameModel();
  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      <div className={cx(flex, flexRow, expandHeight, flexDistribute)}>
        {Object.entries(treeState).map(([k, v]) => (
          <Toggler
            key={k}
            label={k}
            value={v}
            onChange={newV => setTreeState(o => ({ ...o, [k]: newV }))}
          />
        ))}
      </div>
      <div className={grow}>
        <VariableTreeView root={root} {...treeState} />
      </div>
    </div>
  );
}
