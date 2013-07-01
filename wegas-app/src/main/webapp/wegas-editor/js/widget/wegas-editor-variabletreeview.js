/*vv
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-editor-variabletreeview', function(Y) {
    "use strict";

    var NODE = 'node',
            PARENT_NODE = 'parentNode',
            CONTENTBOX = 'contentBox',
            ID = "id",
            CLASS = "@class",
            NAME = "name",
            NODES = 'nodes',
            EDITBUTTONTPL = "<span class=\"wegas-treeview-editmenubutton\"></span>",
            Wegas = Y.Wegas,
            GROUPS = ["question", "list"],
            VariableTreeView;

    /**
     * @name Y.Wegas.VariableTreeView
     * @extends Y.Wegas.EditorTreeView
     * @constructor
     * @class
     */
    VariableTreeView = Y.Base.create("wegas-editor-treeview", Wegas.EditorTreeView, [], {
        /** @lends Y.Wegas.VariableTreeView# */
        // *** Private fields ** //
        CONTENT_TEMPLATE: "<div class=\"wegas-editor-variabletreeview\"></div>",
        // ** Lifecycle methods ** //
        renderUI: function() {
            VariableTreeView.superclass.renderUI.apply(this);
            var cb = this.get(CONTENTBOX);

            cb.setStyles({
                overflowY: "auto",
                overflowX: "hidden"
            });

            this.sortable = new VariableSortable({
                container: cb,
                nodes: 'li',
                opacity: '.2',
//                invalid: ".wegas-editor-dummy"
                // handles: ['.yui3-treenode-content-icon', '.yui3-treeleaf-content-icon']
            });
            this.sortable.delegate.dd.plug(Y.Plugin.DDNodeScroll, {
                node: cb,
                horizontal: false
            });
//this.sortable.delegate.dd.after('drag:over', this.syncDummies, this);
            this.sortable.delegate.dd.after('drag:end', this.onDragEnd, this);

            // .plug(Y.Plugin.DDConstrained, {
            //    constrain2node: cb
            // });
            // this.sortable.plug(Y.Plugin.SortScroll);
            // list1.delegate.dd.plug(Y.Plugin.DDConstrained, {
            //      constrain2node: '#demo'
            // });
        },
        syncDummies: function() {
            var cb = this.get(CONTENTBOX), i;
            cb.all(".wegas-editor-dummy").remove(true);
            for (i = 0; i < GROUPS.length; i += 1) {                       // Add dummies to allow drag on empty nodes
                cb.all(".wegas-editor-" + GROUPS[i] + " ul")
                        .each(function(item) {
                    if (item.get("children").isEmpty()) {
                        item.append("<li class=\"wegas-editor-dummy wegas-editor-" + GROUPS[i] + "item \">empty</li>")
                    }
                }, this);
            }
            this.sortable.sync();
        },
        syncUI: function() {
            VariableTreeView.superclass.syncUI.call(this);
            this.syncDummies();
        },
        onDragEnd: function(e) {
            var node = this.sortable.delegate.get('currentNode'),
                    //  prev = node.previous(), next = node.next(),
                    dragWidget = Y.Widget.getByNode(node),
                    entity = dragWidget.get("data.entity"),
                    dropNode = node.get("parentNode"),
                    dropWidget = Y.Widget.getByNode(dropNode),
                    dropEntity = dropWidget.get("data.entity"),
                    index = dropNode.get("children").indexOf(node);

            Y.log("onDragEnd()", "info", "Wegas.VariableTreeView");

            dropWidget.add(dragWidget, index);                                  // Update treeview positions
            this.syncDummies();
            Wegas.Facade.VariableDescriptor.cache.move(entity, dropEntity, index);// Sync cache

        },
        //
        // *** Private Methods *** //
        /**
         * @function
         * @private
         */
        genTreeViewElements: function(elements) {
            var ret = [], i, el, elClass, text, collapsed, selected,
                    l, result, children = [];

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];
                    elClass = el.get(CLASS);
                    collapsed = !this.isNodeExpanded(el);
                    selected = (this.currentSelection === el.get(ID)) ? 2 : 0;

                    switch (elClass) {
                        case 'StringDescriptor':
                        case 'TextDescriptor':
                        case 'NumberDescriptor':
                        case 'InboxDescriptor':
                        case 'TriggerDescriptor':
                        case 'FSMDescriptor':
                        case 'TaskDescriptor':
                        case 'ObjectDescriptor':
                        case 'ResourceDescriptor':
                        case 'DialogueDescriptor':
                            text = el.get(CLASS).replace("Descriptor", "") + ': ' + el.getPrivateLabel();
                            var els = this.genScopeTreeViewElements(el);
                            ret.push({
                                type: 'TreeNode',
                                label: text,
                                children: els,
                                //children: (els.length >= 1) ? els : null, //no children now, loaded on expands
                                //children: null, //no children now, loaded on expands
                                data: {
                                    entity: el
                                },
                                collapsed: collapsed,
                                selected: selected,
                                rightWidget: Y.Node.create(EDITBUTTONTPL),
                                iconCSS: "wegas-icon-variabledescriptor",
                                cssClass: "wegas-editor-listitem"
                                        //iconCSS: "wegas-icon-" + el.get(CLASS)
                            });
                            break;

                        case 'ListDescriptor':
                            text = el.get(CLASS).replace("Descriptor", "") + ': ' + el.getPrivateLabel();
                            ret.push({
                                type: 'TreeNode',
                                label: text,
                                collapsed: collapsed,
                                selected: selected,
                                children: this.genTreeViewElements(el.get("items")),
                                data: {
                                    entity: el
                                },
                                rightWidget: Y.Node.create(EDITBUTTONTPL),
                                cssClass: "wegas-editor-listitem wegas-editor-list"
                            });
                            break;

                        case 'QuestionDescriptor':
                            text = el.get(CLASS).replace("Descriptor", "") + ': ' + el.getPrivateLabel();
                            ret.push({
                                type: 'TreeNode',
                                label: text,
                                collapsed: collapsed,
                                selected: selected,
                                children: this.genTreeViewElements(el.get("items")),
                                data: {
                                    entity: el
                                },
                                iconCSS: "wegas-icon-variabledescriptor",
                                rightWidget: Y.Node.create(EDITBUTTONTPL),
                                cssClass: "wegas-editor-listitem wegas-editor-question"
                            });
                            break;

                        case 'ChoiceDescriptor':
                            text = el.get(CLASS).replace("Descriptor", "") + ': ' + el.getPrivateLabel();
                            children = [];

                            for (l = 0; l < el.get("results").length; l += 1) {
                                result = el.get("results")[l];
                                children.push({
                                    label: "Result: " + result.get(NAME),
                                    selected: (result.get(ID) === this.currentSelection) ? 2 : 0,
                                    data: {
                                        entity: result,
                                        parentEntity: el
                                    },
                                    rightWidget: Y.Node.create(EDITBUTTONTPL),
                                    iconCSS: "wegas-icon-variabledescriptor"
                                });
                            }

                            ret.push({
                                type: 'TreeNode',
                                label: text,
                                children: children,
                                data: {
                                    entity: el
                                },
                                collapsed: collapsed,
                                selected: selected,
                                rightWidget: Y.Node.create(EDITBUTTONTPL),
                                iconCSS: "wegas-icon-variabledescriptor",
                                cssClass: "wegas-editor-questionitem"
                            });
                            break;

                        case 'SingleResultChoiceDescriptor':
                            text = 'Choice: ' + el.getPrivateLabel();
                            ret.push({
                                type: 'TreeLeaf',
                                label: text,
                                selected: selected,
                                data: {
                                    entity: el
                                },
                                rightWidget: Y.Node.create(EDITBUTTONTPL),
                                iconCSS: "wegas-icon-variabledescriptor",
                                cssClass: "wegas-editor-questionitem"
                            });
                            break;

                        default:
                            text = el.get(CLASS) + ': ' + el.get(NAME);
                            ret.push({
                                label: text,
                                data: el
                            });
                            break;
                    }
                }
            }
            return ret;
        },
        /**
         * @function
         * @private
         */
        genScopeTreeViewElements: function(el) {
            var children = [], i, label, team, player, instance,
                    instances = el.get("scope").get("variableInstances");

            for (i in instances) {
                if (instances.hasOwnProperty(i)) {
                    instance = instances[i];
                    label = '';
                    switch (el.get("scope").get(CLASS)) {
                        case 'PlayerScope':
                            player = Wegas.Facade.Game.cache.getPlayerById(i);

                            if (!player)
                                continue;

                            label = (player) ? player.get(NAME) : "undefined";
                            break;
                        case 'TeamScope':
                            team = Wegas.Facade.Game.cache.getTeamById(i);

                            if (!team)
                                continue;

                            label = (team) ? team.get(NAME) : "undefined";
                            break;
                        case 'GameScope':
                        case 'GameModelScope':
                            label = 'Global';
                            break;
                    }
                    children.push(this.genVariableInstanceElements(label, instance));
                }
            }
            return children;
        },
        /**
         * @function
         * @private
         */
        genVariableInstanceElements: function(label, el) {
            var l,
                    selected = (this.currentSelection == el.get(ID)) ? 2 : 0;

            switch (el.get(CLASS)) {
                case 'StringInstance':
                case 'TextInstance':
                case 'NumberInstance':
                case 'ListInstance':
                    return {
                        label: label + ': ' + el.get("value"),
                        selected: selected,
                        data: {
                            entity: el
                        }
                    };

                case 'QuestionInstance':
                    l = label + ((el.get("replies").length > 0) ? ': ' + el.get("replies").get(NAME) : ': unanswered');
                    return {
                        label: l,
                        selected: selected,
                        data: {
                            entity: el
                        }
                    };

                case 'InboxInstance':
                    var k, children = [], collapsed = !this.isNodeExpanded(el);

                    label += "(" + el.get("messages").length + ")";

                    for (k = 0; k < el.get("messages").length; k += 1) {
                        children.push({
                            label: el.get("messages")[k].get("subject")
                        });
                    }
                    return {
                        type: 'TreeNode',
                        label: label,
                        selected: selected,
                        collapsed: collapsed,
                        data: {
                            entity: el
                        },
                        children: children
                    };

                default:
                    return {
                        label: label,
                        selected: selected,
                        data: {
                            entity: el
                        }
                    };
            }
        }
    }, {
    });
    Y.namespace('Wegas').VariableTreeView = VariableTreeView;

    /**
     * Not yet in usese
     */
    //var SortableTreeview = Y.Base.create("wegas-sortabletreeview", Y.Plugin.Base, [], {
    //    initializer: function() {
    //        this.afterHostEvent(RENDER, function() {
    //            this.sortable = new Y.Sortable({
    //                container: this.get("contentBox"),
    //                nodes: 'li',
    //                opacity: '.2'
    //            });
    //        });
    //    }
    //}, {
    //    NS: "treeviewmenu",
    //    NAME: "treeviewmenu"
    //});
    //Y.namespace("Plugin").SortableTreeview = SortableTreeview;

    /**
     * Extend so in works with nested lists
     *
     * @returns {undefined}
     */
    function VariableSortable() {
        VariableSortable.superclass.constructor.apply(this, arguments);
    }
    Y.extend(VariableSortable, Y.Sortable, {
        _onDragStart: function() {
//            var i = 0;
//            this.dummies = [];
//            for (i = 0; i < GROUPS.length; i += 1) {                       // Add dummies to allow drag on empty nodes
//                this.get("container").all(".wegas-editor-" + GROUPS[i] + " ul")
//                        .each(function(item) {
//                    if (item.get("children").isEmpty()) {
////                            var w = Y.Widget.getByNode(item);
////                            w.add({
////                                type: 'TreeLeaf',
////                                label: "empty",
////                                iconCSS: "",
////                                cssClass: "wegas-editor-" + this.GROUPS[i] + "item",
////                                data: {
////                                    entity: null
////                                }
////                            })
////                            w.add({
////                                type: 'TreeLeaf',
////                                label: "",
////                                iconCSS: "",
////                                cssClass: "wegas-editor-" + this.GROUPS[i] + "item",
////                                data: {
////                                    entity: null
////                                }
////                            });
//                        item.append("<li class=\"wegas-editor-dummy wegas-editor-" + GROUPS[i] + "item \">empty</li>")
//                        item.append("<li class=\"wegas-editor-dummy wegas-editor-" + GROUPS[i] + "item \"></li>")
//                    }
////                          item.append("<li class=\"wegas-editor-dummy wegas-editor-" + this.GROUPS[i] + "item \"></li>")
//                }, this);//.append("<li class=\"wegas-editor-dummy wegas-editor-" + this.GROUPS[i] + "item \"></li>");
//                // .append("<li class=\"wegas-editor-dummy wegas-editor-" + this.GROUPS[i] + "item \"></li>")
//            }

            VariableSortable.superclass._onDragStart.apply(this, arguments);
        },
        _onDropEnter: function(e) {
            var dropNode = e.drop.get(NODE),
                    dragNode = e.drag.get(NODE);

            if (!dropNode.test(this.get(NODES)) &&
                    !dragNode.get(PARENT_NODE).compareTo(dropNode)) {
//                dropNode.append(dragNode);
            }
        },
        _onDragOver: function(e) {

            var i, CLASSES = [".wegas-editor-questionitem", ".wegas-editor-listitem"],
                    found = false,
                    dragNode = e.drag.get(NODE),
                    dropNode = e.drop.get(NODE);


            for (i = 0; i < CLASSES.length; i += 1) {                           // Added custom class mathing for variable groups
                found = found || (dragNode.test(CLASSES[i]) && dropNode.test(CLASSES[i]));
            }
            if (!found) {
                return;
            }

            if (!e.drop.get(NODE).test(this.get(NODES))) {
                return;
            }
            if (dragNode == e.drop.get(NODE)) {
                return;
            }
            // is drop a child of drag?  - this is the bit that's added:
            if (dragNode.contains(e.drop.get(NODE))) {
                return;
            }

            switch (this.get('moveType').toLowerCase()) {
                case 'insert':
                    var dir = ((this._up) ? 'before' : 'after');
                    e.drop.get(NODE).insert(e.drag.get(NODE), dir);
                    break;
                case 'swap':
                    Y.DD.DDM.swapNode(e.drag, e.drop);
                    break;
                case 'move':
                case 'copy':
                    var dropsort = Y.Sortable.getSortable(e.drop.get(NODE).get(PARENT_NODE)),
                            oldNode, newNode;

                    if (!dropsort) {
                        Y.log('No delegate parent found', 'error');
                        return;
                    }

                    Y.DD.DDM.getDrop(e.drag.get(NODE)).addToGroup(dropsort.get(ID));

                    //Same List
                    if (e.drag.get(NODE).get(PARENT_NODE).contains(e.drop.get(NODE))) {
                        Y.DD.DDM.swapNode(e.drag, e.drop);
                    } else {
                        if (this.get('moveType') == 'copy') {
                            //New List
                            oldNode = e.drag.get(NODE);
                            newNode = oldNode.cloneNode(true);

                            newNode.set(ID, '');
                            e.drag.set(NODE, newNode);
                            dropsort.delegate.createDrop(newNode, [dropsort.get(ID)]);
                            oldNode.setStyles({
                                top: '',
                                left: ''
                            });
                        }
                        e.drop.get(NODE).insert(e.drag.get(NODE), 'before');
                    }
                    break;
            }
        }
    });
});
