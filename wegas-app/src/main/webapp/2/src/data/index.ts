import * as GameModelActions from './Reducer/gameModel';
import * as GameActions from './Reducer/game';
import * as TeamActions from './Reducer/teams';
import * as VariableDescriptorActions from './Reducer/VariableDescriptorReducer';
import * as VariableInstanceActions from './Reducer/VariableInstanceReducer';
import * as EditorActions from './Reducer/globalState';
import * as PageActions from './Reducer/pageState';

export const Actions = {
  GameModelActions,
  GameActions,
  TeamActions,
  VariableDescriptorActions,
  VariableInstanceActions,
  EditorActions,
  PageActions,
};
