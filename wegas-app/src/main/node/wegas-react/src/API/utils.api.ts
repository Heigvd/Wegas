import { selectCurrentGameModel } from '../store/slices/gameModel';
import { FindAndReplacePayload } from '../Editor/Components/FindAndReplace';
import { IManagedResponse, managedModeRequest, rest } from './rest';

const UTILS_BASE = 'Utils/';
const FIND_AND_REPLACE_BASE = 'FindAndReplace';

const GAME_MODEL_URL = (gameModelId?: number) =>
  `GameModel/${
    gameModelId === undefined
      ? selectCurrentGameModel()?.id ?? CurrentGM.id!
      : gameModelId
  }/`;

export const UtilsAPI = {
  async getServerTime(): Promise<number> {
    const res = await rest(UTILS_BASE + 'ServerTime');
    const textResponse = await res.text();
    return Number.parseInt(textResponse);
  },
};

export function FindAndReplaceAPI(gameModelId?: number) {
  return {
    async findAndReplace(
      payload: FindAndReplacePayload,
    ): Promise<IManagedResponse> {
      return managedModeRequest(
        GAME_MODEL_URL(gameModelId) + FIND_AND_REPLACE_BASE,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );
    },
  };
}
