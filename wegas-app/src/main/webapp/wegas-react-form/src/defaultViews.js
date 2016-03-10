import { setDefaultWidgets } from 'jsoninput';
import StringView from './Views/string.jsx';
import BooleanView from './Views/boolean.jsx';
import UneditableView from './Views/uneditable.jsx';
import HiddenView from './Views/hidden.jsx';
import TextareaView from './Views/textarea.jsx';
import SelectView from './Views/select.jsx';
import ObjectView from './Views/object.jsx';
import ArrayView from './Views/array.jsx';
import HTMLView from './Views/html.jsx';
import HashlistView from './Views/hashlist.jsx';

setDefaultWidgets({
    object: ObjectView,
    array: ArrayView,
    string: StringView,
    number: StringView,
    boolean: BooleanView,
    uneditable: UneditableView,
    hidden: HiddenView,
    textarea: TextareaView,
    select: SelectView,
    html: HTMLView,
    hashlist: HashlistView
});
