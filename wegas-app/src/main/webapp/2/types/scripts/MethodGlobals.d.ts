interface WegasScriptEditorNameAndTypes extends WegasEntitesNamesAndClasses {
  boolean: boolean;
  'boolean[]': boolean[];
  number: number;
  'number[]': number[];
  string: string;
  'string[]': string[];
  object: object;
  'object[]': object[];
  never: never;
  'never[]': never[];
  void: void;
  'void[]': void[];
  undefined: undefined;
  'undefined[]': undefined[];
}

interface ArrayedTypeMap<T = {}> {
  single: T[keyof T];
  array: T[keyof T][];
}

type WegasScriptEditorReturnTypeName = keyof WegasScriptEditorNameAndTypes;

type WegasScriptEditorReturnType = WegasScriptEditorNameAndTypes[WegasScriptEditorReturnTypeName];

type ArrayedAndNot<T extends {}> = ArrayedTypeMap<T>[keyof ArrayedTypeMap];

type GlobalMethodAdd = <
  RT extends keyof WegasScriptEditorNameAndTypes,
  ART extends ArrayedTypeMap<Pick<WegasScriptEditorNameAndTypes, RT>>,
  RA extends keyof ART
>(
  name: string,
  returnTypes: RT[],
  returnStyle: RA,
  method: () => ART[RA],
) => void;

interface GlobalMethodPayload {
  name: string;
  returnTypes: WegasScriptEditorReturnTypeName[];
  returnStyle: keyof ArrayedTypeMap;
  method: () => unknown;
}

interface GlobalMethodClass {
  addMethod: GlobalMethodAdd;
  getMethod: (
    name: string,
  ) => () => ArrayedAndNot<WegasScriptEditorNameAndTypes>;
}
