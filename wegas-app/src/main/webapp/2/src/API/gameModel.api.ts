import { managedModeRequest } from './rest';

export const GameModelApi = {
  get(gameModelId: number | string) {
    return managedModeRequest('/GameModel/' + gameModelId).then(
      res => res.updatedEntities[0],
    );
  },
};
