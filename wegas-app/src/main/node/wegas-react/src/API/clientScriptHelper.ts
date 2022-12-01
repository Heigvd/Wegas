//import { omit, pick } from 'lodash-es';
import { manageResponseHandler } from '../data/actions';
import { entityIs } from '../data/entities';
import {
  deleteDescriptor,
  updateDescriptor,
} from '../data/Reducer/VariableDescriptorReducer';
import {
  asyncRunLoadedScript,
  updateInstance,
} from '../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../data/scriptable';
import { editingStore } from '../data/Stores/editingStore';
import { store } from '../data/Stores/store';
import { IManagedResponse } from './rest';
import { UtilsAPI } from './utils.api';
import { VariableDescriptorAPI } from './variableDescriptor.api';

const dispatch = editingStore.dispatch;

export const APIScriptMethods: APIMethodsClass = {
  createVariable: (gameModelId, variable, parent, callback) => {
    VariableDescriptorAPI.post(gameModelId, variable, parent).then(res => {
      dispatch(manageResponseHandler(res));
      if (callback) {
        //callback(getNewVariable(variable, res));
        callback(
          instantiate<IVariableDescriptor>(
            res.updatedEntities[0] as IVariableDescriptor,
          ),
        );
      }
    });
  },
  duplicateVariable: (variable, callback) => {
    const gameModelId = store.getState().global.currentGameModelId;
    VariableDescriptorAPI.duplicate(gameModelId, variable).then(res => {
      dispatch(manageResponseHandler(res));
      if (callback) {
        callback(
          instantiate<IVariableDescriptor>(
            res.updatedEntities[0] as IVariableDescriptor,
          ),
        );
      }
    });
  },
  moveVariable: (variable, parent, index, callback) => {
    // dispatch(moveDescriptor(variable, index, parent))
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableDescriptorAPI.move(
      gameModelId,
      variable,
      index,
      parent,
    ).then(res => {
      dispatch(manageResponseHandler(res));
      if (callback) {
        callback(
          instantiate<IVariableDescriptor>(
            res.updatedEntities.find(
              // entity => entityIs(entity, 'AbstractEntity', true) && entity.id === variable.id,
              entity =>
                entityIs(entity, variable['@class']) &&
                entity.id === variable.id,
            ) as IVariableDescriptor,
          ),
        );
      }
    });
  },
  updateVariable: variable => dispatch(updateDescriptor(variable)),
  deleteVariable: variable => dispatch(deleteDescriptor(variable)),
  updateInstance: instance => dispatch(updateInstance(instance)),
  runScript: async (script, context): Promise<IManagedResponse> => {
    const gameModelId = store.getState().global.currentGameModelId;

    const result = await asyncRunLoadedScript(
      gameModelId,
      script,
      undefined,
      undefined,
      { Context: context },
    );

    dispatch(manageResponseHandler(result));

    return result;
  },

  getServerTime: () => UtilsAPI.getServerTime(),
};
