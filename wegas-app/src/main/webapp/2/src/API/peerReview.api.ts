// "/PeerReviewController/" + prd.get("id") + "/" + action + "/" + Y.Wegas.Facade.Game.cache.getCurrentGame()

import { managedModeRequest } from './rest';
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
    return managedModeRequest(
      `${PR_BASE(gameModelId)}${peerReviewId}/${state}/${gameId}`,
      {
        method: 'POST',
      },
    );
  },
};
