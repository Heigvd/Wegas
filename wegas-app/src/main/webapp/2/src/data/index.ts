import * as GameModelActions from './Reducer/gameModel';
import * as VariableDescriptorActions from './Reducer/variableDescriptor';
import * as VariableInstanceActions from './Reducer/variableInstance';
import * as EditorActions from './Reducer/globalState';
import * as PageActions from './Reducer/pageState';
import * as LibraryActions from './Reducer/libraryState';

export const Actions = {
  GameModelActions,
  VariableDescriptorActions,
  VariableInstanceActions,
  EditorActions,
  PageActions,
  LibraryActions,
};
