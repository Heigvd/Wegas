import { managedModeRequest } from './rest';

const VD_BASE = (gameModelId: number) =>
  `/GameModel/${gameModelId}/VariableDescriptor/`;
export namespace VariableDescriptorAPI {
  export function getAll(gameModelId: number) {
    return managedModeRequest(VD_BASE(gameModelId), undefined, 'Editor');
  }
  export function update(
    gameModelId: number,
    variableDescriptor: IVariableDescriptor,
  ) {
    return managedModeRequest(
      `${VD_BASE(gameModelId)}${variableDescriptor.id}`,
      { method: 'PUT', body: JSON.stringify(variableDescriptor) },
      'Editor',
    );
  }
  export function post(
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
  }
  export function del(
    gameModelId: number,
    variableDescriptor: IVariableDescriptor,
  ) {
    return managedModeRequest(
      `${VD_BASE(gameModelId)}${variableDescriptor.id}`,
      {
        method: 'DELETE',
      },
      'Editor',
    );
  }
}
