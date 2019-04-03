import { managedModeRequest } from './rest';

const VI_BASE = (gameModelId: number) =>
  `/GameModel/${gameModelId}/VariableDescriptor/VariableInstance`;
export const VariableInstanceAPI = {
  getAll(gameModelId: number) {
    return managedModeRequest(
      `${VI_BASE(gameModelId)}/AllPlayerInstances/${CurrentPlayerId}`,
      undefined,
      'Editor',
    );
  },
};
