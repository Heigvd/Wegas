import { managedModeRequest } from './rest';

/*
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/AllPlayerInstances/{playerId:[1-9][0-9]*}
POST	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/ByIds
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/player/{playerId: [1-9][0-9]*}
POST	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/user/{userId : [1-9][0-9]*}
PUT	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/{entityId: [1-9][0-9]*}
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/{variableInstanceId: [1-9][0-9]*}
*/

const VI_BASE = (
  gameModelId: number,
  v?: IVariableDescriptor | IVariableInstance,
) => {
  let path = `/GameModel/${gameModelId}/VariableDescriptor`;
  if (v && v['@class'] === 'VariableDescriptor') {
    if (v.id) {
      path += `/${v.id}`;
    }
  }
  path += '/VariableInstance';
  if (v && v['@class'] === 'VariableInstance') {
    if (v.id) {
      path += `/${v.id}`;
    }
  }
  return path;
};
export const VariableInstanceAPI = {
  getAll(gameModelId: number) {
    return managedModeRequest(
      `${VI_BASE(gameModelId)}/AllPlayerInstances/${CurrentPlayerId}`,
      undefined,
      'Editor',
    );
  },
  update(gameModelId: number, variableInstance: IVariableInstance) {
    return managedModeRequest(
      `${VI_BASE(gameModelId, variableInstance)}`,
      { method: 'PUT', body: JSON.stringify(variableInstance) },
      'Editor',
    );
  },
};
