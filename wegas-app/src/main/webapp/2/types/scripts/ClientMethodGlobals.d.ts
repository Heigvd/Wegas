type WegasEntitiesNamesAndClasses = import('wegas-ts-api').WegasEntitiesNamesAndClasses;

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
