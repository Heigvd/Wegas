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

    var ID = "id",
            CLASS = "@class",
            NAME = "name",
            EDITBUTTONTPL = "<span class=\"wegas-treeview-editmenubutton\"></span>",
            Wegas = Y.Wegas,
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

            this.treeView.plug(Y.Plugin.TreeViewSortable, {
                nodeGroups: [{
                        nodeClass: "wegas-editor-questionitem",
                        parentNode: ".wegas-editor-question"
                    }, {
                        nodeClass: "wegas-editor-listitem",
                        parentNode: ".wegas-editor-list"
                    }]
            });                                                                 // Add sortable plugin to the treeview
            this.treeView.sortable.on("sort", function(e) {                     // On sort event,
                var entity = e.dragWidget.get("data.entity"),
                        dropEntity = e.dropWidget.get("data.entity");

                Wegas.Facade.VariableDescriptor.cache.move(entity, dropEntity, e.index);// call facade method
            });
        },
        syncUI: function() {
            VariableTreeView.superclass.syncUI.call(this);
            this.treeView.syncUI();                                             // Needed by treeview sort plugin
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
                    text = el.getType().replace("Descriptor", "") + ': ' + el.getEditorLabel();

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
                                iconCSS: "wegas-icon-variabledescriptor wegas-icon-" + elClass.toLowerCase(),
                                cssClass: "wegas-editor-listitem"
                                        //iconCSS: "wegas-icon-" + el.get(CLASS)
                            });
                            break;

                        case 'ListDescriptor':
                            ret.push({
                                type: 'TreeNode',
                                label: text,
                                collapsed: collapsed,
                                selected: selected,
                                children: (!collapsed) ? this.genTreeViewElements(el.get("items")) : [],
                                data: {
                                    entity: el
                                },
                                rightWidget: Y.Node.create(EDITBUTTONTPL),
                                cssClass: "wegas-editor-listitem wegas-editor-list"
                            });
                            break;

                        case 'QuestionDescriptor':
                            ret.push({
                                type: 'TreeNode',
                                label: text,
                                collapsed: collapsed,
                                selected: selected,
                                children: (!collapsed) ? this.genTreeViewElements(el.get("items")) : [],
                                data: {
                                    entity: el
                                },
                                iconCSS: "wegas-icon-questiondescriptor",
                                rightWidget: Y.Node.create(EDITBUTTONTPL),
                                cssClass: "wegas-editor-listitem wegas-editor-question"
                            });
                            break;

                        case 'ChoiceDescriptor':
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
                                iconCSS: "wegas-icon-choicedescriptor",
                                cssClass: "wegas-editor-questionitem"
                            });
                            break;

                        case 'SingleResultChoiceDescriptor':
                            ret.push({
                                type: 'TreeLeaf',
                                label: text,
                                selected: selected,
                                data: {
                                    entity: el
                                },
                                rightWidget: Y.Node.create(EDITBUTTONTPL),
                                iconCSS: "wegas-icon-choicedescriptor",
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
    });
    Y.namespace('Wegas').VariableTreeView = VariableTreeView;

    /**
     * @class When a descriptor node is toggled, expand it
     * @constructor
     */
    Y.Plugin.EditorTVNodeLoader = Y.Base.create("admin-action", Y.Plugin.Base, [], {
        expandedIds: {},
        lastOpenedNode: null,
        initializer: function() {
            this.afterHostEvent("render", function() {
                this.get("host").treeView.before("*:nodeExpanded",
                        this.fillsLeaf, this);                                  //if treeleaf is empty, load elements from sever
            });

            //this.afterHostMethod("syncUI", function () {
            //    var i, doExpand = function (e) {
            //        for (i = 0; i < e.size(); i += 1) {
            //            if (!e.item(i).get("collapsed")) {
            //                this.fillsLeaf(e.item(i));
            //                doExpand.call(this, e.item(i));
            //            }
            //        }
            //    };
            //
            //    doExpand.call(this, this.get(HOST).treeView);         // Recursively walk treeview to reload expanded nodes
            //});
        },
        fillsLeaf: function(e) {
            var node = e.node,
                    entity = node.get("data.entity"),
                    id = entity.get(ID);

            if (entity instanceof Wegas.persistence.ListDescriptor) {
                if (node.size() > 0) {
                    return;
                }
                node.add(this.get("host").genTreeViewElements(entity.get("items")));
            } else if (entity instanceof Wegas.persistence.VariableDescriptor
                    && !(Wegas.persistence.ChoiceDescriptor && entity instanceof Wegas.persistence.ChoiceDescriptor)) { // @hack

                if (node.size() > 1) {  /* @fixme @hack What if there is only 1 player in the game ? */
                    return;
                }
                node.removeAll();
                node.set("loading", true);

                Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/" + id + "?view=Editor"
                });
            }
        }
    }, {
        NS: "EditorTVNodeLoader",
        NAME: "EditorTVNodeLoader"
    });

});
