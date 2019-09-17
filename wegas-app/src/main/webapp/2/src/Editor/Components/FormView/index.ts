import { setDefaultWidgets } from 'jsoninput';
import hidden from './Hidden';
import uneditable from './Uneditable';
import StringInput from './String';
import ObjectView from './Object';
import Textarea from './Textarea';
import BooleanView from './Boolean';
import Select from './Select';
import ArrayWidget from './Array';
import Html from './Html';
import { Script } from './Script';
import { TreeVariableSelect } from './TreeVariableSelect';
import translatable from './translatable';
import EntityArrayFieldSelect from './EntityArrayFieldSelect';
import FlatVariableSelect from './FlatVariableSelect';
import {TimestampView} from './Timestamp';

const DEFINED_VIEWS = {
  hidden,
  uneditable,
  object: ObjectView,
  string: StringInput,
  i18nstring: translatable(StringInput),
  number: StringInput,
  boolean: BooleanView,
  textarea: Textarea,
  array: ArrayWidget,
  select: Select,
  html: Html,
  i18nhtml: translatable(Html),
  script: Script,
  variableselect: TreeVariableSelect,
  entityarrayfieldselect: EntityArrayFieldSelect,
  flatvariableselect: FlatVariableSelect,
  timestamp: TimestampView,
};
setDefaultWidgets(DEFINED_VIEWS);

type ViewTypes = keyof (typeof DEFINED_VIEWS);
type PropsType<T> = T extends React.ComponentType<infer U>
  ? U
  : T extends (p: infer P) => unknown
  ? P
  : never;
type View<P extends ViewTypes> = PropsType<(typeof DEFINED_VIEWS)[P]> extends {
  view: infer V;
}
  ? V & { type?: P }
  : { type?: P };

type ViewMap = { [P in keyof typeof DEFINED_VIEWS]: View<P> };

export type AvailableViews = ValueOf<ViewMap>;
