import Form from 'jsoninput';
import StringView from './Views/string';
import BooleanView from './Views/boolean';
import UneditableView from './Views/uneditable';
import HiddenView from './Views/hidden';
import TextareaView from './Views/textarea';
import SelectView from './Views/select';
import ObjectView from './Views/object';
import ArrayView from './Views/array';
import ReviewView from './Views/review';
import HTMLView from './Views/html';
import HashlistView from './Views/hashlist';
import WegasUrl from './Views/wegas-url';
import WegasImageUrl from './Views/wegas-image-url';
import FlatVariableSelect from './Views/Interacting/flatvariableselect';
import PluginList from './Views/Interacting/pluginlist';
import EntityArrayFieldSelect from './Views/Interacting/entityarrayfieldselect';
import PageSelect from './Views/Interacting/pageselect';
import TreeVariableSelect from './Views/Interacting/treevariableselect';
import { VariableStatement, MultiVariableMethod, MultiVariableCondition } from './Script/index';

Form.setDefaultWidgets({
    object: ObjectView,
    array: ArrayView,
    PeerReviewDescriptor: ReviewView,
    string: StringView,
    number: StringView,
    boolean: BooleanView,
    uneditable: UneditableView,
    hidden: HiddenView,
    textarea: TextareaView,
    select: SelectView,
    html: HTMLView,
    hashlist: HashlistView,
    wegasurl: WegasUrl,
    wegasimageurl: WegasImageUrl,
    flatvariableselect: FlatVariableSelect,
    pluginlist: PluginList,
    entityarrayfieldselect: EntityArrayFieldSelect,
    pageselect: PageSelect,
    variableselect: VariableStatement,
    script: MultiVariableMethod,
    scriptcondition: MultiVariableCondition,
    treevariableselect: TreeVariableSelect
});
