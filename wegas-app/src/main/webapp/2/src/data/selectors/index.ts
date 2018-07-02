import * as VariableDescriptor from './VariableDescriptor';
import * as VariableInstance from './VariableInstance';
import * as Global from './Global';
import * as GameModel from './GameModel';
import * as Page from './Page';
import * as Player from './Player';
import * as Team from './Team';

export {
  VariableDescriptor,
  Global,
  GameModel,
  Page,
  VariableInstance,
  Player,
  Team,
};

// @TODO remove me
(window as any).selectors = {
  VariableDescriptor,
  Global,
  GameModel,
  Page,
  VariableInstance,
  Player,
  Team,
};
