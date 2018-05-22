import { managedModeRequest } from './rest';

export const GameModelApi = {
  get(gameModelId: number | string) {
    return managedModeRequest(
      '/GameModel/' + gameModelId,
      undefined,
      'Editor',
    ).then(res => res.updatedEntities[0]);
  },
};
