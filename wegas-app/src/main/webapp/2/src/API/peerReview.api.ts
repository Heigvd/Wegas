// "/PeerReviewController/" + prd.get("id") + "/" + action + "/" + Y.Wegas.Facade.Game.cache.getCurrentGame()

import { IReview } from 'wegas-ts-api';
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
  submitToReview(gameModelId: number, peerReviewId: number, playerId: number) {
    const path = `${PR_BASE(gameModelId)}${peerReviewId}/Submit/${playerId}`;
    return managedModeRequest(path, {
      method: 'POST',
    });
  },
  saveReview(gameModelId: number, playerId: number, review: IReview) {
    const path = `${PR_BASE(gameModelId)}SaveReview/${playerId}`;
    return managedModeRequest(
      path,
      {
        method: 'POST',
        body: JSON.stringify(review),
      },
      false,
    );
  },
  submitReview(gameModelId: number, playerId: number, review: IReview) {
    const path = `${PR_BASE(gameModelId)}SubmitReview/${playerId}`;
    return managedModeRequest(
      path,
      {
        method: 'POST',
        body: JSON.stringify(review),
      },
      false,
    );
  },
  submitReviewUnmanaged(
    gameModelId: number,
    playerId: number,
    review: IReview,
  ) {
    const path = `${PR_BASE(gameModelId)}SubmitReview/${playerId}`;
    return rest(
      path,
      {
        method: 'POST',
        body: JSON.stringify(review),
      },
      false,
    );
  },
};
