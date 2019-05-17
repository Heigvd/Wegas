import { ConfigurationSchema, EActions } from '../editionConfig';
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
export const actions: EActions = {
  edit: Actions.EditorActions.editStateMachine,
};
export const label = 'State-machine';
export const icon = 'project-diagram';
