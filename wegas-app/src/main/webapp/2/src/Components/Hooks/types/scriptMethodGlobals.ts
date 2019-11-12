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

export interface GlobalMethodReturnTypesName {
  // @ts-ignore
  [type: WegasScriptEditorReturnTypeName]: true;
}

export type GlobalMethodReturn<
  T extends GlobalMethodReturnTypesName
  // @ts-ignore
> = WegasScriptEditorNameAndTypes[keyof T];

export type GlobalMethodAdd = <T extends GlobalMethodReturnTypesName>(
  name: string,
  returnType: T,
  method: () => GlobalMethodReturn<T>,
) => void;

export interface GlobalMethodClass {
  addMethod: GlobalMethodAdd;
  getMethod: (name: string) => () => WegasScriptEditorReturnType;
}
