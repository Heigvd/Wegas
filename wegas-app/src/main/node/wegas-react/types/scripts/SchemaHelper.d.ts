type TYPESTRING = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

type SchemaLayout =
  | 'inline'
  | 'shortInline'
  | 'extraShortInline'
  | 'flexInline'
  | 'longinline'
  | 'fullWidth';

type WegasTypeString = TYPESTRING | 'identifier';

type WegasMethodReturnType = 'number' | 'string' | 'boolean';

type ScriptMode = 'SET' | 'GET' | 'SET_CLIENT' | 'GET_CLIENT';

type ScriptLanguage = 'JavaScript' | 'JSON' | 'TypeScript' | 'CSS';

type CodeLanguage = ScriptLanguage | 'PlainText';

interface SelectItem {
  label: string;
  value: {};
}

interface Item<T> extends ClassStyleId {
  label: React.ReactNode;
  value?: T;
  selectable?: boolean;
  expanded?: boolean;
  items?: Item<T>[];
}

interface TreeSelectItem<T> extends Item<T> {
  label: string;
  items?: TreeSelectItem<T>[];
}

interface HashListProp {
  prop: string;
}

interface HashListValue {
  prop: string;
  schema: SchemaPropsDefinedSchemas;
}

type HashListItem = HashListValue | HashListProp;

interface DropMenuItem<T> extends Item<T> {
  disabled?: boolean;
  noCloseMenu?: boolean;
  items?: DropMenuItem<T>[];
}

type HashListChoice = DropMenuItem<HashListItem> & {
  value: HashListItem;
  items?: HashListChoices;
};

type HashListChoices = HashListChoice[];

interface CleaningHashmapMethods {
  errorDetector: (value?: object | null) => boolean;
  cleaningMethod: (value?: object | null) => object;
}

type FilePickingType = 'FILE' | 'FOLDER' | 'BOTH' | undefined;

type FileType = 'directory' | 'audio' | 'video' | 'image';
type FilterType = 'show' | 'hide' | 'grey';
interface FileFilter {
  filterType: FilterType;
  fileType: FileType;
}

interface SimpleSchemaProps {
  required?: boolean;
  index?: number;
}

interface CommonSchemaProps extends SimpleSchemaProps {
  label?: string;
  featureLevel?: FeatureLevel;
  layout?: SchemaLayout;
  borderTop?: boolean;
  noMarginTop?: boolean;
  description?: string;
  visible?: (value: unknown, formValue: unknown, path: string[]) => boolean;
}

interface ReadOnlySchemaProps {
  readOnly?: boolean;
}

interface ValueSchemaProps<T> {
  value?: T | string;
}

type SchemaPropsHiddenFn = (
  props: {
    type?: TYPESTRING | TYPESTRING[];
  } & SimpleSchemaProps,
) => {};

type SchemaPropsBooleanFn = (
  props: CommonSchemaProps & ReadOnlySchemaProps & ValueSchemaProps<boolean>,
) => {};

type SchemaPropsNumberFn = (
  props: CommonSchemaProps & ReadOnlySchemaProps & ValueSchemaProps<number>,
) => {};

type SchemaPropsStringFn = (
  props: CommonSchemaProps & ReadOnlySchemaProps & ValueSchemaProps<string>,
) => {};

type SchemaPropsHTMLFn = (
  props: CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<ITranslatableContent> & { noResize?: boolean },
) => {};

type SchemaPropsCustomFn = (
  props: {
    type?: WegasMethodReturnType;
    viewType?: string;
  } & CommonSchemaProps &
    ReadOnlySchemaProps &
    ValueSchemaProps<WegasScriptEditorNameAndTypes[WegasMethodReturnType]>,
) => {};

type SchemaPropsScriptFn = (
  props: {
    mode?: ScriptMode;
    language?: ScriptLanguage;
  } & CommonSchemaProps &
    ValueSchemaProps<string>,
) => {};

type SchemaPropsCustomScriptFn = (
  props: {
    returnType?: string[];
    language?: ScriptLanguage;
    args?: [string, string[]][];
  } & CommonSchemaProps &
    ValueSchemaProps<string>,
) => {};

type SchemaPropsCodeFn = (
  props: {
    language?: CodeLanguage;
  } & CommonSchemaProps &
    ValueSchemaProps<{} | string>,
) => {};

type SchemaPropsSelectFn = <V extends string | SelectItem>(
  props: {
    values?: readonly V[];
    returnType?: TYPESTRING | TYPESTRING[];
    openChoices?: boolean;
  } & CommonSchemaProps &
    ValueSchemaProps<V>,
) => {};

type SchemaPropsCommonFn = (props: CommonSchemaProps) => {};

type SchemaPropsVariableFn = (
  props: {
    returnType?: string[];
    items?: TreeSelectItem<string>[];
  } & CommonSchemaProps,
) => {};

type SchemaPropsTreeFn = <T>(
  props: {
    items?: TreeSelectItem<T>[];
    returnType?: string[];
    type?: TYPESTRING | TYPESTRING[];
    borderBottom?: boolean;
  } & CommonSchemaProps,
) => {};

type SchemaPropsScriptVariableFn = (
  props: {
    returnType?: string[];
  } & CommonSchemaProps,
) => {};

type SchemaPropsScriptStringFn = (
  props: {
    richText?: boolean;
  } & CommonSchemaProps &
    ValueSchemaProps<IScript>,
) => {};

type SchemaPropsScriptBooleanFn = (
  props: CommonSchemaProps & ValueSchemaProps<IScript>,
) => {};

type SchemaPropsArrayFn = (
  props: {
    itemSchema: {};
    userOnChildAdd?: (value?: {}) => {};
    requiredItems?: boolean;
    itemType?: TYPESTRING;
    highlight?: boolean;
    sortable?: boolean;
  } & CommonSchemaProps,
) => {};

type SchemaPropsStatementFn = (
  props: {
    mode?: ScriptMode;
  } & CommonSchemaProps &
    ValueSchemaProps<unknown>,
) => {};

type SchemaPropsHashlistFn = (
  props: {
    choices?: HashListChoices;
    objectViewStyle?: boolean;
    cleaning?: CleaningHashmapMethods;
  } & CommonSchemaProps &
    ValueSchemaProps<object>,
) => {};

type SchemaPropsFileFn = (
  props: {
    pickType?: FilePickingType;
    filter?: FileFilter;
  } & CommonSchemaProps &
    ValueSchemaProps<IAbstractContentDescriptor>,
) => {};

type SchemaPropsPathFn = (
  props: {
    pickType?: FilePickingType;
    filter?: FileFilter;
    scriptable?: boolean;
  } & CommonSchemaProps &
    ValueSchemaProps<string>,
) => {};

interface SimpleSchemaPropsType {
  hidden: SchemaPropsHiddenFn;
  boolean: SchemaPropsBooleanFn;
  number: SchemaPropsNumberFn;
  string: SchemaPropsStringFn;
  html: SchemaPropsHTMLFn;
  custom: SchemaPropsCustomFn;
  script: SchemaPropsScriptFn;
  customScript: SchemaPropsCustomScriptFn;
  code: SchemaPropsCodeFn;
  select: SchemaPropsSelectFn;
  pageSelect: SchemaPropsCommonFn;
  pageLoaderSelect: SchemaPropsCommonFn;
  themeModeSelect: SchemaPropsCommonFn;
  variable: SchemaPropsVariableFn;
  tree: SchemaPropsTreeFn;
  scriptVariable: SchemaPropsScriptVariableFn;
  scriptString: SchemaPropsScriptStringFn;
  scriptBoolean: SchemaPropsScriptBooleanFn;
  array: SchemaPropsArrayFn;
  statement: SchemaPropsStatementFn;
  hashlist: SchemaPropsHashlistFn;
  file: SchemaPropsFileFn;
  path: SchemaPropsPathFn;
}

type SimpleSchemaPropsDefinedValues = keyof SimpleSchemaPropsType;

type SimpleSchemaPropsDefinedSchemas = ReturnType<
  SimpleSchemaPropsType[SimpleSchemaPropsDefinedValues]
>;

type SchemaPropsObjectFn = (
  props: {
    properties?: { [key: string]: SimpleSchemaPropsDefinedSchemas };
  } & CommonSchemaProps &
    ValueSchemaProps<object>,
) => {};

interface ObjectSchemaPropsType {
  object: SchemaPropsObjectFn;
}

type ObjectSchemaPropsDefinedValues = keyof ObjectSchemaPropsType;

type ObjectSchemaPropsDefinedSchemas = ReturnType<
  ObjectSchemaPropsType[ObjectSchemaPropsDefinedValues]
>;

type SchemaPropsDefinedValues =
  | SimpleSchemaPropsDefinedValues
  | ObjectSchemaPropsDefinedValues;

type SchemaPropsDefinedSchemas =
  | SimpleSchemaPropsDefinedSchemas
  | ObjectSchemaPropsDefinedSchemas;

type SchemaPropsDefinedType = SimpleSchemaPropsType & ObjectSchemaPropsType;
