/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { getGame } from './slices/game';
import { getGameModel } from './slices/gameModel';
import { getAll as getAllPages } from './slices/pages';
import { getTeams } from './slices/teams';
import { getAll as getAllVariableDescriptors } from './slices/variableDescriptors';
import { getAll as getAllVariableInstances } from './slices/variableInstances';
import { dispatch } from './store';

/**
 * Load the data every app (editor, player, host) starts from.
 *
 * Called explicitly by each entry point, from its own body: by then the whole
 * module graph is evaluated, so the store and its slices are initialized even
 * though they import each other (store/store -> slices -> API/rest ->
 * store/store).
 */
export function bootstrap() {
  dispatch(getAllVariableDescriptors());
  dispatch(getAllVariableInstances());
  dispatch(getAllPages());
  dispatch(getTeams());
  dispatch(getGame());
  dispatch(getGameModel(CurrentGM.id!));
}