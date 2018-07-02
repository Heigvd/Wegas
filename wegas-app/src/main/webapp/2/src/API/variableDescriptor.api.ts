import { managedModeRequest } from './rest';

const VD_BASE = (gameModelId: number) =>
  `/GameModel/${gameModelId}/VariableDescriptor/`;
export const VariableDescriptorAPI = {
  getAll(gameModelId: number) {
    return managedModeRequest(VD_BASE(gameModelId), undefined, 'Editor');
  },
  update(gameModelId: number, variableDescriptor: IVariableDescriptor) {
    return managedModeRequest(
      `${VD_BASE(gameModelId)}${variableDescriptor.id}`,
      { method: 'PUT', body: JSON.stringify(variableDescriptor) },
      'Editor',
    );
  },
  post(
    gameModelId: number,
    variableDescriptor: IVariableDescriptor,
    parent?: IParentDescriptor,
  ) {
    return managedModeRequest(
      `${VD_BASE(gameModelId)}${parent ? `/${parent.id}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify(variableDescriptor),
      },
      'Editor',
    );
  },
  del(gameModelId: number, variableDescriptor: IVariableDescriptor) {
    return managedModeRequest(
      `${VD_BASE(gameModelId)}${variableDescriptor.id}`,
      {
        method: 'DELETE',
      },
      'Editor',
    );
  },
  move(
    gameModelId: number,
    variableDescriptor: IVariableDescriptor,
    index: number,
    parent?: IParentDescriptor,
  ) {
    let position = String(index);
    if (parent != null) {
      position = `${parent.id}/${index}`;
    }
    return managedModeRequest(
      `${VD_BASE(gameModelId)}${variableDescriptor.id}/Move/${position}`,
      { method: 'PUT' },
    );
  },

  runScript(
    gameModelId: number,
    playerId: number,
    script: IScript,
    context?: IVariableDescriptor,
  ) {
    return managedModeRequest(
      `${VD_BASE(gameModelId)}/Script/Run/${playerId}/${
        context ? context.id : ''
      }`,
      {
        method: 'POST',
        body: JSON.stringify(script),
      },
    );
  },
};
