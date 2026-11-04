import { managedModeRequest } from './rest';
import { selectCurrentGameModel } from '../store/slices/gameModel';
import { selectCurrentPlayer } from '../store/slices/players';

export const FSM_BASE = (
  stateMachineId: number,
  gameModelId?: number,
  playerId?: number,
) =>
  `GameModel/${
    gameModelId === undefined ? selectCurrentGameModel().id! : gameModelId
  }/VariableDescriptor/StateMachine/${stateMachineId}/Player/${
    playerId === undefined ? selectCurrentPlayer().id! : playerId
  }/`;

/**StateMachine
 * FileAPIFactory - generates en object containing methods to manage files
 * @param gameModelId
 */
export const FSM_APIFactory = (gameModelId?: number, playerId?: number) => {
  return {
    applyTransition(stateMachineId: number, transitionId?: number) {
      return managedModeRequest(
        `${FSM_BASE(stateMachineId, gameModelId, playerId)}Do/${transitionId}`,
        {
          method: 'GET',
        },
      );
    },
  };
};

export const FSM_API = FSM_APIFactory();
