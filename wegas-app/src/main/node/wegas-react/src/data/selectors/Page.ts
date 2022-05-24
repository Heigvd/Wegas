import { store } from '../Stores/store';

export function select(pageId?: string): Readonly<WegasComponent> | undefined {
  const state = store.getState();
  if (pageId === undefined) {
    return undefined;
  }
  return state.pages[pageId];
}
