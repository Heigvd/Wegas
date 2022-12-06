import { managedModeRequest, rest } from './rest';

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
  getAllQuests(gameModelId: number): Promise<string[]> {
    return rest('/GameModel/' + gameModelId + '/FindAllQuests').then(
      res => res.json() as Promise<string[]>,
    );
  },
  getAllFiredEvents(gameModelId: number): Promise<string[]> {
    return rest('/GameModel/' + gameModelId + '/FindAllFiredEvents').then(
      res => res.json() as Promise<string[]>,
    );
  },
  createExtraTestPlayer(gameModelId: number) {
    return managedModeRequest(
      `/GameModel/${ gameModelId}/ExtraTestPlayer`,
      {
        method: 'POST',
      });
  }
};
