import { Schema, setDefaultWidgets } from 'jsoninput';
import ArrayWidget from './Array';
import AttachmentSelector from './AttachmentSelector';
import BooleanView from './Boolean';
import CallbackView from './Callback';
import CodeView from './Code';
import ColorPickerView from './ColorPickerView';
import { CustomScript } from './CustomScript';
import DictionaryView from './Dictionary';
import EntityArrayFieldSelect from './EntityArrayFieldSelect';
import FileSelector from './FileSelector';
import FlatVariableSelect from './FlatVariableSelect';
import HashListView from './HashList';
import hidden from './Hidden';
import IconSelect from './IconSelect';
import { LabeledHTMLEditor } from './LabeledHTMLEditor';
import NumberInput from './Number';
import Nupple from './Nupple';
import ObjectView from './Object';
import PageLoaderSelect from './PageLoaderSelect';
import PageSelect from './PageSelect';
import PathSelector from './PathSelector';
import QuestSelect from './QuestSelect';
import StatementView from './Script/Expressions/ExpressionEditor';
import { Script } from './Script/Script';
import { VariableInput } from './Script/VariableInput';
import Scriptable from './Scriptable';
import { ScriptableBoolean } from './ScriptableBoolean';
import ScriptableCallbackView from './ScriptableCallback';
import { ScriptablePath } from './ScriptablePath';
import { ScriptableString } from './ScriptableString';
import Select, {
  ListChildrenNullSelectView,
  ListChildrenSelectView,
} from './Select';
import SerializerView from './SerializerView';
import StringInput from './String';
import Textarea from './Textarea';
import ThemeModeSelect from './ThemeModeSelect';
import { TimestampView } from './Timestamp';
import translatable from './translatable';
import {
  LabeledScripableVariableSelect,
  TreeVariableSelect,
  TreeVSelect,
} from './TreeVariableSelect';
import undefinedable from './undefinedable';
import uneditable from './Uneditable';

export const DEFINED_VIEWS = {
  array: ArrayWidget,
  attachment: AttachmentSelector,
  boolean: BooleanView,
  code: CodeView,
  callback: CallbackView,
  colorpicker: ColorPickerView,
  customscript: CustomScript,
  dictionary: DictionaryView,
  entityarrayfieldselect: EntityArrayFieldSelect,
  file: FileSelector,
  flatvariableselect: FlatVariableSelect,
  hashlist: HashListView,
  hidden,
  html: LabeledHTMLEditor,
  i18nhtml: translatable(LabeledHTMLEditor),
  i18nstring: translatable(StringInput),
  iconselect: IconSelect,
  listchildren: ListChildrenSelectView,
  listchildrennull: ListChildrenNullSelectView,
  number: NumberInput,
  nupple: Nupple,
  object: ObjectView,
  pageselect: PageSelect,
  pagesloaderselect: PageLoaderSelect,
  path: PathSelector,
  questselect: QuestSelect,
  script: Script,
  scriptable: Scriptable,
  scriptablecallback: ScriptableCallbackView,
  scriptableBoolean: ScriptableBoolean,
  scriptableString: ScriptableString,
  scriptableVariableSelect: LabeledScripableVariableSelect,
  scriptablepath: ScriptablePath,
  select: Select,
  serializer: SerializerView,
  statement: StatementView,
  string: StringInput,
  textarea: Textarea,
  thememodeselect: ThemeModeSelect,
  timestamp: TimestampView,
  treeselect: TreeVSelect,
  uneditable,
  undefinedable,
  variableInput: VariableInput,
  variableselect: TreeVariableSelect,
};
setDefaultWidgets(DEFINED_VIEWS);

/**
 * name of the view to be used as id. Eg. in {view: {type:'<VIEW_ID>'}}
 */
export type ViewTypes = keyof typeof DEFINED_VIEWS;

/**
 * Retrieve properties of the view identifed by its type name P. And inject {type: P} property
 * */
type View<P extends ViewTypes> = React.ComponentProps<
  typeof DEFINED_VIEWS[P]
>['view'] & { type?: P };

/** Map all views by their type name */
type ViewMap = { [P in keyof typeof DEFINED_VIEWS]: View<P> };

/**
 * List all available views
 */
export type AvailableViews = ValueOf<ViewMap>;

/**
 * List all available schemas
 */
export type AvailableSchemas = Schema<AvailableViews>;

/**
 * Get schema from view typename
 */
export type SchemaFromView<P extends ViewTypes> = Schema<View<P>>;
