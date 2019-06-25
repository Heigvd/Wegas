import * as VariableDescriptor from './VariableDescriptor';
import * as VariableInstance from './VariableInstance';
import * as Global from './Global';
import * as GameModel from './GameModel';
import * as Game from './Game';
import * as Page from './Page';
import * as Player from './Player';
import * as Team from './Team';
import * as Helper from './Helper';

export {
  VariableDescriptor,
  Global,
  GameModel,
  Game,
  Page,
  VariableInstance,
  Player,
  Team,
  Helper,
};

// @TODO remove me
(window as any).selectors = {
  VariableDescriptor,
  Global,
  GameModel,
  Game,
  Page,
  VariableInstance,
  Player,
  Team,
  Helper,
};
