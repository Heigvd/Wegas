interface WegasScriptEditorNameAndTypes extends WegasEntitiesNamesAndClasses {
  boolean: boolean;
  'boolean[]': boolean[];
  'Readonly<boolean>': Readonly<boolean>;
  'Readonly<boolean[]>': Readonly<boolean[]>;
  number: number;
  'number[]': number[];
  'Readonly<number>': Readonly<number>;
  'Readonly<number[]>': Readonly<number[]>;
  string: string;
  'string[]': string[];
  'Readonly<string>': Readonly<string>;
  'Readonly<string[]>': Readonly<string[]>;
  object: object;
  'object[]': object[];
  'Readonly<object>': Readonly<object>;
  'Readonly<object[]>': Readonly<object[]>;
  never: never;
  'never[]': never[];
  'Readonly<never>': Readonly<never>;
  'Readonly<never[]>': Readonly<never[]>;
  void: void;
  'void[]': void[];
  'Readonly<void>': Readonly<void>;
  'Readonly<void[]>': Readonly<void[]>;
  undefined: undefined;
  'undefined[]': undefined[];
  'Readonly<undefined>': Readonly<undefined>;
  'Readonly<undefined[]>': Readonly<undefined[]>;
}

interface ArrayedTypeMap<T = AnyValuesObject> {
  single: T[keyof T];
  array: T[keyof T][];
}

type WegasScriptEditorReturnTypeName = keyof WegasScriptEditorNameAndTypes;

/** @deprecated */
type WegasScriptEditorReturnType =
  WegasScriptEditorNameAndTypes[WegasScriptEditorReturnTypeName];

/** @deprecated */
type ArrayedAndNot<T extends AnyValuesObject> =
  ArrayedTypeMap<T>[keyof ArrayedTypeMap];

/** @deprecated */
type ArgumentsType = [string, WegasScriptEditorReturnTypeName][];

/**
 * @deprecated use import/export
 */
type ClientMethodAdd = <
  PT extends ArgumentsType,
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
  MET extends (...arg: ARG) => ART[RA],
>(
  name: string,
  parameters: PT,
  returnTypes: RT[],
  returnStyle: RA,
  method: MET,
) => void;

/**
 * @deprecated use import/export
 */
interface ClientMethodPayload {
  name: string;
  parameters: readonly ReadonlyTuple<[string, string]>[];
  returnTypes: string[];
  returnStyle: keyof ArrayedTypeMap;
  method: (...elements: any[]) => any;
}

/**
 * @deprecated
 */
interface GlobalClientMethodClass {
  /**
   * @deprecated use export
   */
  addMethod: ClientMethodAdd;
  /**
   * @deprecated use import
   */
  getMethod: (
    name: string,
  ) => (
    ...elements: WegasScriptEditorNameAndTypes[WegasScriptEditorReturnTypeName][]
  ) => ArrayedAndNot<WegasScriptEditorNameAndTypes>;
}
