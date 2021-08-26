import { setDefaultWidgets } from 'jsoninput';
import {
    MultiVariableCondition,
    MultiVariableMethod,
    VariableStatement,
} from './Script/index';
import ArrayView from './Views/array';
import BooleanView from './Views/boolean';
import HashlistView from './Views/hashlist';
import HiddenView from './Views/hidden';
import EntityArrayFieldSelect from './Views/Interacting/entityarrayfieldselect';
import FlatVariableSelect from './Views/Interacting/flatvariableselect';
import PageSelect from './Views/Interacting/pageselect';
import EventSelect from './Views/Interacting/eventselect';
import QuestSelect from './Views/Interacting/questselect';
import PluginElement from './Views/Interacting/pluginelement';
import TreeVariableSelect from './Views/Interacting/treevariableselect';
import ObjectView from './Views/object';
import SelectView from './Views/select';
import StringView from './Views/string';
import TextareaView from './Views/textarea';
import UneditableView from './Views/uneditable';
import WegasImageUrl from './Views/wegas-image-url';
import WegasUrl from './Views/wegas-url';
import ColorPicker from './Views/color-picker';
import KeyChoice from './Views/keychoice';
import PageLoaderSelect from './Views/Interacting/pageloaderselect';
import html from './Views/html';
import Tuple from './Views/tuple';
import translatable from './HOC/translatable';
import jseditor from './Views/jseditor';
import matrix from './Views/matrix';

setDefaultWidgets({
    array: ArrayView,
    boolean: BooleanView,
    colorpicker: ColorPicker,
    entityarrayfieldselect: EntityArrayFieldSelect,
    flatvariableselect: FlatVariableSelect,
    tuple: Tuple,
    hashlist: HashlistView,
    hidden: HiddenView,
    html,
    I18nhtml: translatable(html),
    jseditor,
    keychoice: KeyChoice,
    matrix,
    number: StringView,
    object: ObjectView,
    pageloaderselect: PageLoaderSelect,
    pageselect: PageSelect,
    eventselect: EventSelect,
    questselect: QuestSelect,
    plugin: PluginElement,
    script: MultiVariableMethod,
    scriptcondition: MultiVariableCondition,
    select: SelectView,
    string: StringView,
    I18nstring: translatable(StringView),
    textarea: TextareaView,
    treevariableselect: TreeVariableSelect,
    uneditable: UneditableView,
    variableselect: VariableStatement,
    wegasimageurl: WegasImageUrl,
    wegasurl: WegasUrl,
    I18nwegasurl: translatable(WegasUrl),
});
// Make TS happy ...
export default undefined;
