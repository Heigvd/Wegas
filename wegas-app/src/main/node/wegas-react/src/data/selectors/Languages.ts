import { State } from '../Reducer/reducers';

export function selectCurrentEditorLanguage(store: State) {
  return store.global.languages.currentEditorLanguageCode;
}
