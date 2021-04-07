// "/PeerReviewController/" + prd.get("id") + "/" + action + "/" + Y.Wegas.Facade.Game.cache.getCurrentGame()

import { managedModeRequest, rest } from './rest';
const PR_BASE = (gameModelId: number) =>
  `/GameModel/${gameModelId}/VariableDescriptor/PeerReviewController/`;

export type PeerReviewStateSelector = 'Dispatch' | 'Notify' | 'Close';

export const PeerReviewDescriptorAPI = {
  setState(
    gameModelId: number,
    peerReviewId: number,
    gameId: number,
    state: PeerReviewStateSelector,
  ) {
    const path = `${PR_BASE(gameModelId)}${peerReviewId}/${state}/${gameId}`;
    return managedModeRequest(path, {
      method: 'POST',
    });
  },
  setStateUnmanaged(
    gameModelId: number,
    peerReviewId: number,
    gameId: number,
    state: PeerReviewStateSelector,
  ) {
    const path = `${PR_BASE(gameModelId)}${peerReviewId}/${state}/${gameId}`;
    return rest(path, {
      method: 'POST',
    });
  },
};
