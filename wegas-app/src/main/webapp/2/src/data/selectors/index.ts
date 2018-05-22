import * as VariableDescriptor from './VariableDescriptor';
import * as Global from './Global';
import * as GameModel from './GameModel';
import * as Page from './Page';

export { VariableDescriptor, Global, GameModel, Page };

// @TODO remove me
(window as any).selectors = {
  VariableDescriptor,
  Global,
  GameModel,
  Page,
};
