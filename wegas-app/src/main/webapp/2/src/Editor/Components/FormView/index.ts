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

const DEFINED_VIEWS = {
  hidden,
  uneditable,
  object: ObjectView,
  string: StringInput,
  number: StringInput,
  boolean: BooleanView,
  textarea: Textarea,
  array: ArrayWidget,
  select: Select,
  html: Html,
  script: Script,
};
setDefaultWidgets(DEFINED_VIEWS);

export type ViewTypes = keyof (typeof DEFINED_VIEWS);
type PropsType<T> = T extends React.ComponentType<infer U>
  ? U
  : T extends (p: infer P) => any ? P : never;

export type View<P extends ViewTypes> = PropsType<
  (typeof DEFINED_VIEWS)[P]
> extends { view: infer V }
  ? V & { type?: P }
  : { type?: P };

type ViewMap = { [P in keyof typeof DEFINED_VIEWS]: View<P> };
type valueof<T> = T[keyof T];
export type AvailableViews = valueof<ViewMap>;
