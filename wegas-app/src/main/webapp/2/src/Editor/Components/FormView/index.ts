import { setDefaultWidgets } from 'jsoninput';
import hidden from './Hidden';
import uneditable from './Uneditable';
import StringInput from './String';
import ObjectView from './Object';
import Textarea from './Textarea';
import BooleanView from './Boolean';
import Select, {
  ListChildrenSelectView,
  ListChildrenNullSelectView,
} from './Select';
import ArrayWidget from './Array';
import { Script } from './Script/Script';
import { Code } from './Code';
import {
  TreeVariableSelect,
  TreeVSelect,
  LabeledScripableVariableSelect,
} from './TreeVariableSelect';
import translatable from './translatable';
import EntityArrayFieldSelect from './EntityArrayFieldSelect';
import FlatVariableSelect from './FlatVariableSelect';
import { LabeledHTMLEditor } from '../../../Components/HTMLEditor';
import { TimestampView } from './Timestamp';
import { VariableInput } from './Script/VariableInput';
import PageSelect from './PageSelect';
import StatementView from './Script/Expressions/ExpressionEditor';
import HashListView from './HashList';
import PageLoaderSelect from './PageLoaderSelect';
import FileSelector from './FileSelector';
import { CustomScript } from './CustomScript';
import ThemeModeSelect from './ThemeModeSelect';
import PathSelector from './PathSelector';
import AttachmentSelector from './AttachmentSelector';
import { ScriptableString } from './ScriptableString';
import { ScriptablePath } from './ScriptablePath';
import { ScriptableBoolean } from './ScriptableBoolean';

export const DEFINED_VIEWS = {
  hidden,
  uneditable,
  object: ObjectView,
  hashlist: HashListView,
  string: StringInput,
  i18nstring: translatable(StringInput),
  number: StringInput,
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
