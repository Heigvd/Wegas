import { managedModeRequest, rest } from './rest';

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
  getAllQuests(gameModelId: number): Promise<string[]> {
    return rest('/GameModel/' + gameModelId + '/FindAllQuests').then(
      res => res.json() as Promise<string[]>,
    );
  },
};
