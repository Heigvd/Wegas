import { ConfigurationSchema, EntityActions } from '../editionConfig';
import { config as VariableDescriptorConfig } from './VariableDescriptor';
import { config as FSMInstanceConfig } from './FSMInstance';
import { Actions } from '../../data';

export const config: ConfigurationSchema<IFSMDescriptor> = {
  ...VariableDescriptorConfig,
  '@class': {
    value: 'FSMDescriptor',
    view: { type: 'hidden' },
  },
  states: {
    type: 'object',
    value: {
      1: {
        '@class': 'State',
        version: 0,
        editorPosition: {
          '@class': 'Coordinate',
          x: 10,
          y: 10,
        },
      } as IFSMDescriptor.State,
    },
    view: {
      type: 'hidden',
    },
  },
  defaultInstance: {
    type: 'object',
    properties: FSMInstanceConfig,
  },
};
export const actions: EntityActions = {
  edit: Actions.EditorActions.editStateMachine,
};
