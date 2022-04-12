import { omit, pick } from 'lodash-es';
import { manageResponseHandler } from '../data/actions';
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

function getNewVariable(
  variable: IVariableDescriptor,
  res: IManagedResponse,
): SVariableDescriptor {
  const trimmedVD = omit(variable, ['id', 'defaultInstance', 'version']);
  return instantiate(
    res.updatedEntities.find(e => {
      const pickedDescriptor = pick(e, Object.keys(trimmedVD));
      return compareVariables(trimmedVD, pickedDescriptor);
    }),
  ) as SVariableDescriptor;
}

const dispatch = editingStore.dispatch;

function compareVariables(
  var1: { [attr: string]: unknown },
  var2: { [attr: string]: unknown },
): boolean {
  let same = true;
  for (const attr in var1) {
    const attr1 = var1[attr];
    const attr2 = var2[attr];
    if (
      typeof attr1 === 'object' &&
      attr1 !== null &&
      typeof attr2 === 'object' &&
      attr2 !== null
    ) {
      same =
        same &&
        compareVariables(
          attr1 as { [attr: string]: unknown },
          attr2 as { [attr: string]: unknown },
        );
    } else if (attr1 !== attr2) {
      return false;
    }
  }
  return true;
}

export const APIScriptMethods: APIMethodsClass = {
  createVariable: (gameModelId, variable, parent, callback) => {
    VariableDescriptorAPI.post(gameModelId, variable, parent).then(res => {
      dispatch(manageResponseHandler(res));
      if (callback) {
        callback(getNewVariable(variable, res));
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
              entity => entity.id === variable.id,
            ) as IVariableDescriptor,
          ),
        );
      }
    });
  },
  updateVariable: variable => dispatch(updateDescriptor(variable)),
  deleteVariable: variable => dispatch(deleteDescriptor(variable)),
  updateInstance: instance => dispatch(updateInstance(instance)),
  runScript: async (script, context) => {
    const gameModelId = store.getState().global.currentGameModelId;

    const result = await asyncRunLoadedScript(
      gameModelId,
      script,
      undefined,
      undefined,
      { Context: context },
    );

    return dispatch(manageResponseHandler(result));
  },

  getServerTime: () => UtilsAPI.getServerTime(),
};
