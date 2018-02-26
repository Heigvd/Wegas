import { store } from './store';
export namespace VariableDescriptor {
  /**
   * Find a variableDescriptor for an id
   *
   * @export
   * @param {number} [id]  variableDescriptor id
   * @returns {(Readonly<IVariableDescriptor> | undefined)}
   */
  export function select(
    id?: number,
  ): Readonly<IVariableDescriptor> | undefined;
  /**
   * Find a list of variableDescriptor for a list of ids
   *
   * @export
   * @param {number[]} id Array of variableDescriptor ids
   * @returns {((Readonly<IVariableDescriptor> | undefined)[])}
   */
  export function select(
    id: number[],
  ): (Readonly<IVariableDescriptor> | undefined)[];
  export function select(id: number | number[] | undefined) {
    if (id == null) {
      return;
    }
    const state = store.getState();
    if (Array.isArray(id)) {
      return id.map(i => state.variableDescriptors[i]);
    }
    return state.variableDescriptors[id];
  }
}
export namespace Global {
  /**
   * Get the current User.
   *
   * @export
   * @returns Current logged in user
   */
  export function selectCurrentUser() {
    const state = store.getState();
    return state.global.currentUser;
  }
}
export namespace GameModel {
  /**
   * Get the current GameModel
   *
   * @export
   * @returns {Readonly<IGameModel>}
   */
  export function selectCurrent() {
    const state = store.getState();
    return state.gameModels[state.global.currentGameModelId];
  }
}
export namespace Page {
  export function select(pageId?: string): Readonly<Page> | undefined {
    const state = store.getState();
    if (pageId === undefined) {
      return undefined;
    }
    return state.pages[pageId];
  }
  export function selectDefaultId(): string | undefined {
    const state = store.getState();
    const sorted = Object.entries(state.pages).sort((a, b) => {
      return a[1]['@index'] - b[1]['@index'];
    });
    return sorted[0] && sorted[0][0];
  }
}
// @TODO remove me
(window as any).selectors = {
  VariableDescriptor,
  Global,
  GameModel,
  Page,
};
