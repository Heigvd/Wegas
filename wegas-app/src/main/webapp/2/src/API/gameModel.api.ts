import { managedModeRequest } from './rest';

export const GameModelApi = {
  get(gameModelId: number | string) {
    return managedModeRequest('/GameModel/' + gameModelId).then(
      res => res.updatedEntities[0],
    );
  },
  liveEdition<T extends IMergeable>(channel: string, entity: T) {
    return managedModeRequest(
      '/GameModel/LiveEdition/' + channel,
      {
        method: 'POST',
        body: JSON.stringify(entity),
      },
      false,
    );
  },
};
