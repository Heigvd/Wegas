import { setDefaultWidgets } from 'jsoninput';
import ArrayWidget from './Array';
import AttachmentSelector from './AttachmentSelector';
import BooleanView from './Boolean';
import { Code } from './Code';
import ColorPickerView from './ColorPickerView';
import { CustomScript } from './CustomScript';
import EntityArrayFieldSelect from './EntityArrayFieldSelect';
import FileSelector from './FileSelector';
import FlatVariableSelect from './FlatVariableSelect';
import HashListView from './HashList';
import hidden from './Hidden';
import IconSelect from './IconSelect';
import { LabeledHTMLEditor } from './LabeledHTMLEditor';
import NumberInput from './Number';
import ObjectView from './Object';
import PageLoaderSelect from './PageLoaderSelect';
import PageSelect from './PageSelect';
import PathSelector from './PathSelector';
import QuestSelect from './QuestSelect';
import StatementView from './Script/Expressions/ExpressionEditor';
import { Script } from './Script/Script';
import { VariableInput } from './Script/VariableInput';
import { ScriptableBoolean } from './ScriptableBoolean';
import { ScriptablePath } from './ScriptablePath';
import { ScriptableString } from './ScriptableString';
import Select, {
  ListChildrenNullSelectView,
  ListChildrenSelectView,
} from './Select';
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
import uneditable from './Uneditable';

export const DEFINED_VIEWS = {
  hidden,
  uneditable,
  object: ObjectView,
  hashlist: HashListView,
  string: StringInput,
  colorpicker: ColorPickerView,
  iconselect: IconSelect,
  questselect: QuestSelect,
  i18nstring: translatable(StringInput),
  number: NumberInput,
  boolean: BooleanView,
  scriptableBoolean: ScriptableBoolean,
  textarea: Textarea,
  array: ArrayWidget,
  select: Select,
  pageselect: PageSelect,
  pagesloaderselect: PageLoaderSelect,
  html: LabeledHTMLEditor,
  i18nhtml: translatable(LabeledHTMLEditor),
  script: Script,
  customscript: CustomScript,
  code: Code,
  variableselect: TreeVariableSelect,
  scriptableVariableSelect: LabeledScripableVariableSelect,
  scriptableString: ScriptableString,
  variableInput: VariableInput,
  entityarrayfieldselect: EntityArrayFieldSelect,
  flatvariableselect: FlatVariableSelect,
  timestamp: TimestampView,
  statement: StatementView,
  listchildren: ListChildrenSelectView,
  listchildrennull: ListChildrenNullSelectView,
  treeselect: TreeVSelect,
  thememodeselect: ThemeModeSelect,
  file: FileSelector,
  path: PathSelector,
  scriptablepath: ScriptablePath,
  attachment: AttachmentSelector,
};
setDefaultWidgets(DEFINED_VIEWS);

export type ViewTypes = keyof typeof DEFINED_VIEWS;
type PropsType<T> = T extends React.ComponentType<infer U>
  ? U
  : T extends (p: infer P) => unknown
  ? P
  : never;
type View<P extends ViewTypes> = PropsType<typeof DEFINED_VIEWS[P]> extends {
  view: infer V;
}
  ? V & { type?: P }
  : { type?: P };

type ViewMap = { [P in keyof typeof DEFINED_VIEWS]: View<P> };

export type AvailableViews = ValueOf<ViewMap>;
