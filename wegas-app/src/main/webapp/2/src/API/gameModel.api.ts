import { managedModeRequest } from './rest';

export const GameModelApi = {
  get(gameModelId: number | string) {
    return managedModeRequest('/GameModel/' + gameModelId);
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
