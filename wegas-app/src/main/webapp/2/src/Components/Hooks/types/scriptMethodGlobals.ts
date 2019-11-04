export interface WegasScriptEditorNameAndTypes
  extends WegasEntitesNamesAndClasses {
  boolean: boolean;
  number: number;
  string: string;
  object: object;
  never: never;
  void: void;
  undefined: undefined;
}

export type WegasScriptEditorReturnTypeName = keyof WegasScriptEditorNameAndTypes;

export type WegasScriptEditorReturnType = WegasScriptEditorNameAndTypes[WegasScriptEditorReturnTypeName];

export type GlobalMethodAdd = <T extends WegasScriptEditorReturnTypeName>(
  name: string,
  returnType: T,
  method: () => WegasScriptEditorNameAndTypes[T],
) => void;

export interface GlobalMethodClass {
  addMethod: GlobalMethodAdd;
  getMethod: (name: string) => () => WegasScriptEditorReturnType;
}
