import { store } from '../Stores/store';

export function select(pageId?: string): Readonly<WegasComponent> | undefined {
  const state = store.getState();
  if (pageId === undefined) {
    return undefined;
  }
  return state.pages[pageId];
}
// export function selectDefaultId(): string | undefined {
//   const state = store.getState();
//   const sorted = Object.entries(state.pages).sort((a, b) => {
//     return a[1]['@index'] - b[1]['@index'];
//   });
//   return sorted[0] && sorted[0][0];
// }
