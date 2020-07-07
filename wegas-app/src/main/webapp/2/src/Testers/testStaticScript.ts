alert('CACA');

export interface EditorClass extends GlobalEditorClass {
  setLanguage: (lang: { code: ISGameModelLanguage['code'] }) => void;
}
declare const Editor: EditorClass;

Editor.setFeatures({ ADVANCED: true });

alert('CACA');
