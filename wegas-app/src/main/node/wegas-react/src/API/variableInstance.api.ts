import { IVariableDescriptor, IVariableInstance } from 'wegas-ts-api';
import { managedModeRequest, rest } from './rest';

/*
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/AllPlayerInstances/{playerId:[1-9][0-9]*}
POST	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/ByIds
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/player/{playerId: [1-9][0-9]*}
POST	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/user/{userId : [1-9][0-9]*}
PUT	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/{entityId: [1-9][0-9]*}
GET	/Wegas/rest/GameModel/{gameModelId: ([1-9][0-9]*)?}{sep: /?}VariableDescriptor/{variableDescriptorId : ([1-9][0-9]*)?}{sep2: /?}VariableInstance/{variableInstanceId: [1-9][0-9]*}
*/

const VI_BASE = ({
  gameModelId,
  v,
}: {
  gameModelId?: number;
  v?: IVariableDescriptor | IVariableInstance;
}) => {
  let path = `/GameModel/`;
  if (gameModelId) {
    path += `${gameModelId}/`;
  }
  path += 'VariableDescriptor';
  if (v && v['@class'].includes('Descriptor')) {
    if (v.id !== undefined) {
      path += `/${v.id}`;
    }
  }
  path += '/VariableInstance';
  if (v && v['@class'].includes('Instance')) {
    if (v.id !== undefined) {
      path += `/${v.id}`;
    }
  }
  return path;
};
export const VariableInstanceAPI = {
  getByPlayer(gameModelId?: number, playerId?: number) {
    return managedModeRequest(
      `${VI_BASE({ gameModelId })}/AllPlayerInstances/${
        playerId !== undefined ? playerId : CurrentPlayerId
      }`,
    );
  },
  getByDescriptor(
    variableDescriptor: IVariableDescriptor,
    gameModelId?: number,
  ): Promise<IVariableInstance[]> {
    return rest(VI_BASE({ v: variableDescriptor, gameModelId })).then(
      (res: Response) => res.json(),
    );
  },
  // getByDescriptor(
  //   variableDescriptor: IVariableDescriptor,
  //   gameModelId?: number,
  // ) {
  //   return managedModeRequest(VI_BASE({ v: variableDescriptor, gameModelId }));
  // },
  update(variableInstance: IVariableInstance, gameModelId?: number) {
    return managedModeRequest(
      `${VI_BASE({ v: variableInstance, gameModelId })}`,
      { method: 'PUT', body: JSON.stringify(variableInstance) },
    );
  },
  getByIds(ids: number[], gameModelId?: number) {
    return managedModeRequest(`${VI_BASE({ gameModelId })}ByIds`, {
      method: 'POST',
      body: JSON.stringify(ids),
    });
  },
};
