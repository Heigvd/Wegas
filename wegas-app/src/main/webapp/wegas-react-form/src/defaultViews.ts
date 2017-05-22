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
import HTMLView from './Views/html';
import EntityArrayFieldSelect from './Views/Interacting/entityarrayfieldselect';
import FlatVariableSelect from './Views/Interacting/flatvariableselect';
import PageSelect from './Views/Interacting/pageselect';
import PluginList from './Views/Interacting/pluginlist';
import TreeVariableSelect from './Views/Interacting/treevariableselect';
import ObjectView from './Views/object';
import ReviewView from './Views/review';
import SelectView from './Views/select';
import StringView from './Views/string';
import TextareaView from './Views/textarea';
import UneditableView from './Views/uneditable';
import WegasImageUrl from './Views/wegas-image-url';
import WegasUrl from './Views/wegas-url';

setDefaultWidgets({
    array: ArrayView,
    peerReviewDescriptor: ReviewView,
    string: StringView,
    number: StringView,
    boolean: BooleanView,
    entityarrayfieldselect: EntityArrayFieldSelect,
    flatvariableselect: FlatVariableSelect,
    hashlist: HashlistView,
    hidden: HiddenView,
    html: HTMLView,
    number: StringView,
    object: ObjectView,
    pageselect: PageSelect,
    pluginlist: PluginList,
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
