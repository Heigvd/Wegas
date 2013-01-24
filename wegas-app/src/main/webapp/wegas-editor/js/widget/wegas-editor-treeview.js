/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor-treeview', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', EditorTreeView,
    EDITBUTTONTPL = "<span class=\"wegas-treeview-editmenubutton\"></span>";

    EditorTreeView = Y.Base.create("wegas-editor-treeview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // *** Private fields ** //
        treeView: null,
        expandedIds: null,

        // ** Lifecycle methods ** //
        renderUI: function () {
            this.treeView = new Y.TreeView();
            this.treeView.render(this.get(CONTENTBOX));
            this.expandedIds = {};

            this.plug(EditMenuTreeviewPlugin);
        },

        bindUI: function () {
            if (this.get("dataSource")) {
                this.get("dataSource").after("response", this.syncUI, this);    /* Listen updates on the target datasource */
                this.get("dataSource").after("error", function (e) {             /* GLOBAL error message */
                    this.showMessage("error", e.response.results.message);
                }, this);
            }

            this.treeView.before("*:nodeExpanded", function (e) {
                this.expandedIds[e.node.get("data").entity.get("id")] = true;
            }, this);

            this.treeView.before("*:nodeCollapsed", function (e) {
                delete this.expandedIds[e.node.get("data").entity.get("id")];
            }, this);
        },

        syncUI: function () {
            this.set("dataSource", this.get("dataSource"));

            if (!this.get("dataSource")) {
                this.get(CONTENTBOX).append("Unable to find datasource");
                return;
            }

            var ds = this.get("dataSource"),
            selector = this.get("dataSelector"),
            entities =  (selector) ? ds.rest.find(selector.key, selector.val) : ds.rest.getCache(),
            msg = this.get(CONTENTBOX).one(".wegas-smallmessage");

            if (msg) {
                msg.remove(true);
            }
            this.treeView.removeAll();
            if (entities.length === 0) {
                this.get(CONTENTBOX).append('<div class="wegas-smallmessage">' + this.get("emptyMessage") + '</div>');
                return;
            }
            this.treeView.add(this.genTreeViewElements(entities));
            this.treeView.syncUI();
        },

        // *** Private Methods *** //
        isNodeExpanded: function (id) {
            return this.expandedIds[id] || false;
        },

        genTreeViewElements: function (elements) {
            var ret = [], i, el, elClass, text, collapsed, selected,
            l, result, children = [];

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];
                    elClass = el.get('@class');
                    collapsed = !this.isNodeExpanded(el.get("id"));
                    selected = (this.currentSelection === el.get("id")) ? 2 : 0;

                    if ((this.get("excludeClasses") === null
                        || !this.get('excludeClasses').hasOwnProperty(elClass))
                    && (this.get('includeClasses') === null
                        || this.get('includeClasses').hasOwnProperty(elClass))) {

                        switch (elClass) {
                            case 'StringDescriptor':
                            case 'NumberDescriptor':
                            case 'InboxDescriptor':
                            case 'TriggerDescriptor':
                            case 'TaskDescriptor':
                            case 'ResourceDescriptor':
                            case 'DialogueDescriptor':
                                text = el.get('@class').replace("Descriptor", "") + ': ' + el.getPrivateLabel();
                                ret.push({
                                    type: 'TreeNode',
                                    label: text,
                                    children: this.genScopeTreeViewElements(el),
                                    data: {
                                        entity: el
                                    },
                                    collapsed: collapsed,
                                    selected: selected,
                                    rightWidget: Y.Node.create(EDITBUTTONTPL),
                                    iconCSS: "wegas-icon-variabledescriptor"
                                //iconCSS: "wegas-icon-" + el.get('@class')
                                });
                                break;

                            case 'ListDescriptor':
                                text = el.get('@class').replace("Descriptor", "") + ': ' + el.getPrivateLabel();
                                ret.push({
                                    type: 'TreeNode',
                                    label: text,
                                    collapsed: collapsed,
                                    selected: selected,
                                    children: this.genTreeViewElements(el.get("items")),
                                    data: {
                                        entity: el
                                    },
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'QuestionDescriptor':
                                text = el.get('@class').replace("Descriptor", "") + ': ' + el.getPrivateLabel();
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
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'ChoiceDescriptor':
                                text = el.get('@class').replace("Descriptor", "") + ': ' + el.getPrivateLabel();

                                for (l = 0; l < el.get("results").length; l += 1) {
                                    result = el.get("results")[l];
                                    //TODO : result should be an entity
                                    if (!(result instanceof Y.Wegas.persistence.Entity)) {
                                        result = Y.Wegas.Editable.reviver(result);
                                    }
                                    children.push({
                                        label: "Result: " + result.get("name"),
                                        selected: (result.get("id") === this.currentSelection) ? 2 : 0,
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
                                    iconCSS: "wegas-icon-variabledescriptor"
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
                                    iconCSS: "wegas-icon-variabledescriptor"
                                });
                                break;

                            case 'Game':
                                text = 'Game: ' + el.get("name") + ' (token:' + el.get("token") + ')';
                                ret.push({
                                    type: 'TreeNode',
                                    label: text,
                                    collapsed:  false,
                                    selected: selected,
                                    children: this.genTreeViewElements(el.get("teams")),
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-game',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'Team':
                                text = 'Team: ' + el.get("name") + ' (token: ' + el.get("token") + ")";
                                ret.push({
                                    type: 'TreeNode',
                                    collapsed: collapsed,
                                    selected: selected,
                                    label: text,
                                    children: this.genTreeViewElements(el.get("players")),
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-team',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'Player':
                                ret.push({
                                    label: 'Player: ' + el.get("name"),
                                    selected: selected,
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-player',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'GameModel':
                                text = 'Game model: ' + el.get("name");
                                ret.push({
                                    label: text,
                                    selected: selected,
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-gamemodel',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'User':
                                ret.push({
                                    label: 'User:' + el.get("name"),
                                    selected: selected,
                                    data: {
                                        entity: el.getMainAccount()
                                    },
                                    iconCSS: 'wegas-icon-player',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'Role':
                                ret.push({
                                    label: 'Group:' + el.get("name"),
                                    selected: selected,
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-team',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'List':
                            case 'Folder':
                            case "TaskList":
                            case "InboxDisplay":
                            case "Score":
                            case "Layout":
                            case "Dialogue":
                                ret = ret.concat(this.genPageTreeViewElements(el));
                                break;

                            default:
                                text = el.get('@class') + ': ' + el.get("name");
                                ret.push({
                                    label: text,
                                    data: el
                                });
                                break;
                        }
                    }
                }
            }
            return ret;
        },

        genScopeTreeViewElements: function (el) {
            var children = [], i, label, team, player, instance;

            for (i in el.get("scope").get("variableInstances")) {
                if (el.get("scope").get("variableInstances").hasOwnProperty(i)) {
                    instance = el.get("scope").get("variableInstances")[i];
                    label = '';
                    switch (el.get("scope").get('@class')) {
                        case 'PlayerScope':
                            player = Y.Wegas.GameFacade.rest.getPlayerById(i);
                            label = (player) ? player.get("name") : "undefined";
                            break;
                        case 'TeamScope':
                            team = Y.Wegas.GameFacade.rest.getTeamById(i);
                            label = (team) ? team.get("name") : "undefined";
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

        genVariableInstanceElements: function (label, el) {
            var l, k, children = [],
            selected = (this.currentSelection === el.get("id")) ? 2 : 0;

            switch (el.get('@class')) {
                case 'StringInstance':
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
                    l = label + ((el.get("replies").length > 0) ? ': ' + el.get("replies").get("name") : ': unanswered');
                    return {
                        label: l,
                        selected: selected,
                        data: {
                            entity: el
                        }
                    };

                case 'InboxInstance':
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
        },

        genPageTreeViewElements: function (elts) {
            var ret = [], j, text, el;
            if (!Y.Lang.isArray(elts)) {
                elts = [ elts ];
            }

            for (j = 0; j < elts.length; j += 1) {
                el = elts[j];
                text =  el.type + ': ' + (el.label || el.name || el.id || 'unnamed');
                switch (el.type) {
                    case 'List':
                        ret.push({
                            type: 'TreeNode',
                            label: 'List: ' + (el.label || 'unnamed'),
                            data: {
                                entity: el
                            },
                            children: this.genPageTreeViewElements(el.children)
                        });
                        break;
                    case 'VariableDisplay':
                        text = 'Variable displayer: ' + (el.variable);
                        ret.push({
                            label: text,
                            data: {
                                entity: el
                            }
                        });
                        break;
                    case 'Text':
                        ret.push({
                            label: 'Text: ' + el.content.substring(0, 15) + "...",
                            data: {
                                entity: el
                            }
                        });
                        break;
                    case 'Button':
                        ret.push({
                            label: text,
                            data: {
                                entity: el
                            }
                        });
                        break;
                    default:
                        ret.push({
                            label: text,
                            data: {
                                entity: el
                            }
                        });
                        break;

                }
            }
            return ret;
        }
    }, {
        ATTRS: {
            includeClasses: {
                value: null
            },
            excludeClasses: {
                value: null
            },
            emptyMessage: {
                value: "No data to display"
            },
            dataSelector: {},
            dataSource: {
                setter: function (val) {
                    if (Y.Lang.isString(val)) {
                        val = Y.Wegas.app.dataSources[val];
                    }
                    return val;
                }
            }
        }
    });


    Y.namespace('Wegas').EditorTreeView = EditorTreeView;

    var VariableDescriptorTreeview = Y.Base.create("wegas-editor-variabledescriptortreeview", Y.Wegas.EditorTreeView, [], {
        bindUI: function () {
            VariableDescriptorTreeview.superclass.bindUI.call(this);

        }
    });

    Y.namespace('Wegas').VariableDescriptorTreeview = VariableDescriptorTreeview;

    /**
     * To be plugged on a Y.Wedance.EditorTreeview, when an node is clicked,
     * show the default admin menu, retrieved using Y.Wegas.Editable.getMenuCfg()
     * method.
     *
     */
    var EditMenuTreeviewPlugin = Y.Base.create("wegas-editmenutreeviewplugin", Y.Plugin.Base, [], {
        initializer: function () {
            this.menu = new Y.Wegas.Menu();

            this.afterHostEvent("render", function () {
                this.get("host").treeView.on("*:click", this.onTreeViewClick, this);
            });
        },
        onTreeViewClick: function (e) {
            //Y.log(e.target.get("label") + " label was clicked", "info", "Wegas.EditorTreeView");

            var menuItems, data = e.node.get("data"),
            domTarget = e.domEvent.target,
            host = this.get("host");

            host.currentSelection = data.entity.get("id");
            data.dataSource = host.get("dataSource");

            menuItems = data.entity.getMenuCfg(data);

            if (menuItems.length === 0) {
                return;
            }

            this.menu.removeAll();                                             // Populate the menu with the elements associated to the
            this.menu.add(menuItems);

            if (domTarget.hasClass("wegas-treeview-editmenubutton")) {          // If user clicked on the edit button
                this.menu.attachTo(domTarget);                                  // Display the edit button next to it
            } else {                                                            // Otherwise the user clicked on the node
                this.menu.item(0).fire("click");                         // Excute the actions associated to the first item of the menu
            }
        }
    }, {
        NS: "treeviewmenu",
        NAME: "treeviewmenu"
    });
    Y.namespace("Plugin").EditMenuTreeviewPlugin = EditMenuTreeviewPlugin;


    /**
    * Not yet in usese
    */
    var SortableTreeview = Y.Base.create("wegas-sortabletreeview", Y.Plugin.Base, [], {
        initializer: function () {
            this.afterHostEvent("render", function () {
                //this.sortable = new Y.Sortable({
                //    container: this.get("contentBox"),
                //    nodes: 'li',
                //    opacity: '.2'
                //});
                });
        }
    }, {
        NS: "treeviewmenu",
        NAME: "treeviewmenu"
    });
    Y.namespace("Plugin").SortableTreeview = SortableTreeview;

    /**
     *
     */
    var LobbyTreeView = Y.Base.create("wegas-editor-treeview", Y.Wegas.EditorTreeView, [], {

        bindUI: function () {
            LobbyTreeView.superclass.bindUI.apply(this);
            //this.treeView.on("*:click", this.onTreeViewClick, this);
            this.treeView.on("addChild", function (e) {
                e.child.plug(Y.Plugin.OpenUrlAction, {
                    url: "wegas-app/view/play.html?gameId=" + e.child.get("data.entity").get("id"),
                    target: "self"
                });
            })
        },

        genTreeViewElements: function (elements) {
            var ret = [], i, el;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];

                    switch (el.get('@class')) {
                        case 'Game':
                            ret.push({
                                label: el.get("name"),
                                data: {
                                    entity: el
                                },
                                iconCSS: 'wegas-icon-game'
                            });
                            break;

                    }
                }
            }
            return ret;
        }
    });

    Y.namespace('Wegas').LobbyTreeView = LobbyTreeView;
});
