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

/**
 * Add a custom client method that can be used in client scripts
 * @param name - the name of the method
 * @param types - the returned types of the method
 * @param array - the method will return a signle object or an array of objects
 * @param method - the method to add
 */
type ClientMethodAdd = <
  PT extends readonly [readonly string, keyof WegasScriptEditorNameAndTypes][],
  RT extends keyof WegasScriptEditorNameAndTypes,
  ARG extends ExtractTuppleArray<
    PT,
    string,
    keyof WegasScriptEditorNameAndTypes
  >,
  // extends keyof WegasScriptEditorNameAndTypes[]
  //   ? WegasScriptEditorNameAndTypes[ExtractTuppleArray<
  //       PT,
  //       string,
  //       keyof WegasScriptEditorNameAndTypes
  //     >]
  //   : unknown[],
  ART extends ArrayedTypeMap<Pick<WegasScriptEditorNameAndTypes, RT>>,
  RA extends keyof ART,
  MET extends (...arg: ARG) => ART[RA]
>(
  name: string,
  parameters: PT,
  returnTypes: RT[],
  returnStyle: RA,
  // method: (...args: ARG) => ART[RA],
  method: MET,
) => void;

interface ClientMethodPayload {
  name: string;
  parameters: [string, keyof WegasScriptEditorNameAndTypes][];
  returnTypes: WegasScriptEditorReturnTypeName[];
  returnStyle: keyof ArrayedTypeMap;
  method: (...elements: unknown[]) => unknown;
}

interface GlobalClientMethodClass {
  addMethod: ClientMethodAdd;
  getMethod: (
    name: string,
  ) => (
    ...elements: WegasScriptEditorNameAndTypes[keyof WegasScriptEditorNameAndTypes][]
  ) => ArrayedAndNot<WegasScriptEditorNameAndTypes>;
}
