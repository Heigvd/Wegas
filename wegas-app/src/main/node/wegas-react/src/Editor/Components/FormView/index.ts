import { setDefaultWidgets } from 'jsoninput';
import ArrayWidget from './Array';
import AttachmentSelector from './AttachmentSelector';
import BooleanView from './Boolean';
import { Code } from './Code';
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
import SerializerView from './SerializerView';
import StringInput from './String';
import Textarea from './Textarea';
import ThemeModeSelect from './ThemeModeSelect';
import { TimestampView } from './Timestamp';
import translatable from './translatable';
import { TreeVariableSelect, TreeVSelect } from './TreeVariableSelect';
import uneditable from './Uneditable';

export const DEFINED_VIEWS = {
  array: ArrayWidget,
  attachment: AttachmentSelector,
  boolean: BooleanView,
  code: Code,
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
  object: ObjectView,
  pageselect: PageSelect,
  pagesloaderselect: PageLoaderSelect,
  path: PathSelector,
  questselect: QuestSelect,
  script: Script,
  scriptableBoolean: ScriptableBoolean,
  scriptableString: ScriptableString,
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
  variableInput: VariableInput,
  variableselect: TreeVariableSelect,
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
