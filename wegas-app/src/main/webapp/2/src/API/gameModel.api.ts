import { managedModeRequest } from './rest';

export namespace GameModelApi {
  export function get(gameModelId: number | string) {
    return managedModeRequest(
      '/GameModel/' + gameModelId,
      undefined,
      'Editor',
    ).then(res => res.updatedEntities[0]);
  }
}
