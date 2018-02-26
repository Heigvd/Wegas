import { setDefaultWidgets } from 'jsoninput';
import views from 'jsoninput/lib/views.es2015';
import hidden from './Hidden';
import uneditable from './Uneditable';
import StringInput from './String';
import ObjectView from './Object';
import Textarea from './Textarea';
import BooleanView from './Boolean';
import Select from './Select';
import ArrayWidget from './Array';

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
  html: StringInput, // @TODO
  script: views.object, // @TODO
};
setDefaultWidgets(views);
setDefaultWidgets(DEFINED_VIEWS);

export type AvailableViews =
  | keyof (typeof DEFINED_VIEWS)
  | keyof (typeof views);
