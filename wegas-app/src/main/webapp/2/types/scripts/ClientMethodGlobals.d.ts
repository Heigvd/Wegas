type WegasEntitiesNamesAndClasses = import('wegas-ts-api/typings/WegasScriptableEntities').WegasEntitiesNamesAndClasses;

interface WegasScriptEditorNameAndTypes extends WegasEntitiesNamesAndClasses {
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
  RT extends keyof WegasScriptEditorNameAndTypes,
  ART extends ArrayedTypeMap<Pick<WegasScriptEditorNameAndTypes, RT>>,
  RA extends keyof ART
>(
  name: string,
  returnTypes: RT[],
  returnStyle: RA,
  method: () => ART[RA],
) => void;

interface ClientMethodPayload {
  name: string;
  returnTypes: WegasScriptEditorReturnTypeName[];
  returnStyle: keyof ArrayedTypeMap;
  method: () => unknown;
}

interface GlobalClientMethodClass {
  addMethod: ClientMethodAdd;
  getMethod: (
    name: string,
  ) => () => ArrayedAndNot<WegasScriptEditorNameAndTypes>;
}
