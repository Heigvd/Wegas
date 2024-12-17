import { managedModeRequest, rest } from './rest';

/** PatchDiff and changes */
interface LineChange {
  lineNumber: number;
  tag: string;
  content: string;
}

interface SideBySideChange {
  oldValue: string;
  newValue: string;
}

type Change = LineChange | SideBySideChange;

interface DiffCollection {
  title: string;
  diffs: PatchDiff[];
}

interface PrimitiveDiff {
  title: string;
  changes: Change[];
}

export type PatchDiff = DiffCollection | PrimitiveDiff;

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
    return managedModeRequest(`/GameModel/${gameModelId}/ExtraTestPlayer`, {
      method: 'POST',
    });
  },
  getModelDiff(gameModelId: number | string): Promise<PatchDiff> {
    return managedModeRequest(`/GameModel/${gameModelId}/Diff`).then(
      res => res.updatedEntities[0] as Promise<PatchDiff>,
    );
  },
  propagateModel(gameModelId: number) {
    return managedModeRequest(
      `/GameModel/${gameModelId}/Propagate`,
      {
        method: 'PUT',
      },
      false,
    );
  },
};
