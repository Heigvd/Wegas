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
// import HTMLView from './Views/html';
import EntityArrayFieldSelect from './Views/Interacting/entityarrayfieldselect';
import FlatVariableSelect from './Views/Interacting/flatvariableselect';
import PageSelect from './Views/Interacting/pageselect';
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

setDefaultWidgets({
    array: ArrayView,
    boolean: BooleanView,
    colorpicker: ColorPicker,
    entityarrayfieldselect: EntityArrayFieldSelect,
    flatvariableselect: FlatVariableSelect,
    hashlist: HashlistView,
    hidden: HiddenView,
    html: html,
    keychoice: KeyChoice,
    number: StringView,
    object: ObjectView,
    pageloaderselect: PageLoaderSelect,
    pageselect: PageSelect,
    plugin: PluginElement,
    script: MultiVariableMethod,
    scriptcondition: MultiVariableCondition,
    select: SelectView,
    string: StringView,
    textarea: TextareaView,
    treevariableselect: TreeVariableSelect,
    uneditable: UneditableView,
    variableselect: VariableStatement,
    wegasimageurl: WegasImageUrl,
    wegasurl: WegasUrl,
});
