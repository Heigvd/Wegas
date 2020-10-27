import { omit, pick } from 'lodash-es';
import { manageResponseHandler } from '../data/actions';
import { deleteDescriptor } from '../data/Reducer/VariableDescriptorReducer';
import { updateInstance } from '../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../data/scriptable';
import { store } from '../data/store';
import { VariableDescriptorAPI } from './variableDescriptor.api';

const dispatch = store.dispatch;

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
  createVariable: (gameModelId, variableDescriptor, parent, callback) => {
    return VariableDescriptorAPI.post(
      gameModelId,
      variableDescriptor,
      parent,
    ).then(res => {
      dispatch(manageResponseHandler(res));
      const trimmedVD = omit(variableDescriptor, [
        'id',
        'defaultInstance',
        'version',
      ]);
      const newVariable = res.updatedEntities.find(e => {
        const pickedDescriptor = pick(e, Object.keys(trimmedVD));
        const test = compareVariables(trimmedVD, pickedDescriptor);
        return test;
      });
      callback && callback(instantiate(newVariable));
    });
  },
  updateInstance: instance => dispatch(updateInstance(instance)),
  deleteVariable: variable => dispatch(deleteDescriptor(variable)),
};
