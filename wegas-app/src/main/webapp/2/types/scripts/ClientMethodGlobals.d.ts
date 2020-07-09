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

type ClientMethodAdd = <
  PT extends readonly ReadonlyTuple<
    [string, WegasScriptEditorReturnTypeName]
  >[],
  RT extends WegasScriptEditorReturnTypeName,
  ARG extends ExtractTuppleArray<
    PT,
    string,
    WegasScriptEditorReturnTypeName,
    any[],
    '1',
    WegasScriptEditorNameAndTypes
  >,
  ART extends ArrayedTypeMap<Pick<WegasScriptEditorNameAndTypes, RT>>,
  RA extends keyof ART,
  MET extends (...arg: ARG) => ART[RA]
>(
  name: string,
  parameters: PT,
  returnTypes: RT[],
  returnStyle: RA,
  method: MET,
) => void;

interface ClientMethodPayload {
  name: string;
  parameters: readonly ReadonlyTuple<
    [string, WegasScriptEditorReturnTypeName]
  >[];
  returnTypes: WegasScriptEditorReturnTypeName[];
  returnStyle: keyof ArrayedTypeMap;
  method: (...elements: any[]) => any;
}

interface GlobalClientMethodClass {
  addMethod: ClientMethodAdd;
  getMethod: (
    name: string,
  ) => (
    ...elements: WegasScriptEditorNameAndTypes[WegasScriptEditorReturnTypeName][]
  ) => ArrayedAndNot<WegasScriptEditorNameAndTypes>;
}
