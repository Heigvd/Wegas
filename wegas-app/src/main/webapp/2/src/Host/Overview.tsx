import * as React from 'react';
import { VariableDescriptorAPI } from '../API/variableDescriptor.api';
import { Button } from '../Components/Inputs/Buttons/Button';
import { runScript } from '../data/Reducer/VariableInstanceReducer';
import { GameModel, Player } from '../data/selectors';
import { createScript } from '../Helper/wegasEntites';
import { wlog } from '../Helper/wegaslog';

export default function Overview() {
  const overview = runScript('WegasDashboard.getOverview();');

  return (
    <div>
      <Button
        icon="undo"
        onClick={() =>
          VariableDescriptorAPI.runScript(
            GameModel.selectCurrent().id!,
            Player.selectCurrent().id!,
            createScript('WegasDashboard.getOverview();'),
            undefined,
            true,
          )?.then(res => wlog(res))
        }
      />
      {JSON.stringify(overview)}
    </div>
  );
}
