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

    EditorTreeView = Y.Base.create("wegas-treeview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // *** Private fields ** //
        dataSource: null,
        treeView: null,

        // ** Lifecycle methods ** //
        initializer: function () {
            this.dataSource = Y.Wegas.app.dataSources[this.get('dataSource')];
        },

        renderUI: function () {
            this.treeView = new Y.TreeView();
            this.treeView.render(this.get(CONTENTBOX));
            this.menu = new Y.Wegas.Menu();
        },

        bindUI: function () {
            if (this.dataSource) {
                this.dataSource.after("response", this.syncUI, this);           // Listen updates on the target datasource
            }
            this.treeView.on("*:click", this.onTreeViewClick, this);
        },

        syncUI: function () {
            if (!this.dataSource) {
                this.get(CONTENTBOX).setContent("Unable to find datasource")
                return;
            }
            var treeViewElements = this.genTreeViewElements(this.dataSource.rest.getCache());
            this.treeView.removeAll();
            this.treeView.add(treeViewElements);
        },

        destroyer: function () {
            this.treeView.destroy();
            this.menu.destroy();
        },

        // ** Private methods ** //

        setItemsByEntity: function(entity, dataSource) {

        },

        // *** Private Methods *** //
        onTreeViewClick: function (e) {
            Y.log(e.target.get("label") + " label was clicked", "info", "Wegas.EditorTreeView");

            var entity = e.node.get("data"),
            menuItems = entity.getMenuCfg(this.dataSource),
            domTarget = e.domEvent.target;

            if (menuItems.length == 0) {
                return;
            }

            this.menu.removeAll();                                              // Populate the menu with the elements associated to the
            this.menu.add(menuItems);

            if (domTarget && domTarget.hasClass("wegas-treeview-editmenubutton")){           // If user clicked on the edit button
                this.menu.attachTo(domTarget);                                  // Display the edit button next to it
            } else {                                                            // Otherwise the user clicked on the node
                this.menu.item(0).fire("click");                                // Excute the actions associated to the first item of the menu
            }
        },

        genTreeViewElements: function (elements) {
            var ret = [], i, el, elClass, text;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];
                    elClass = (el.get) ? el.get('@class') : el['type'];

                    if ((this.get("excludeClasses") === null
                        || !this.get('excludeClasses').hasOwnProperty(elClass))
                    && (this.get('includeClasses') === null
                        || this.get('includeClasses').hasOwnProperty(elClass))) {

                        switch (elClass) {
                            case 'StringDescriptor':
                            case 'NumberDescriptor':
                            case 'InboxDescriptor':
                            case 'ChoiceDescriptor':
                            case 'TriggerDescriptor':
                            case 'TaskDescriptor':
                            case 'ResourceDescriptor':
                            case 'DialogueDescriptor':
                                text = el.get('@class').replace("Descriptor", "") + ': ' + el.get("name");
                                ret.push({
                                    type: 'TreeNode',
                                    label: text,
                                    children: this.genScopeTreeViewElements(el),
                                    data: el,
                                    rightWidget: Y.Node.create(EDITBUTTONTPL),
                                    iconCSS: "wegas-icon-variabledescriptor"
                                //iconCSS: "wegas-icon-" + el.get('@class')
                                });
                                break;

                            case 'ListDescriptor':
                            case 'QuestionDescriptor':
                                text = el.get('@class').replace("Descriptor", "") + ': ' + el.get("name");
                                ret.push({
                                    type: 'TreeNode',
                                    label: text,
                                    children: this.genTreeViewElements(el.get("items")),
                                    data: el,
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'Game':
                                text = 'Game: ' + el.get("name") + ' (token:' + el.get("token") + ')';
                                ret.push({
                                    type: 'TreeNode',
                                    label: text,
                                    collapsed: false,
                                    children: this.genTreeViewElements(el.get("teams")),
                                    data: el,
                                    iconCSS: 'wegas-icon-game',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'Team':
                                text = 'Team: ' + el.get("name");
                                ret.push({
                                    type: 'TreeNode',
                                    label: text,
                                    children: this.genTreeViewElements(el.get("players")),
                                    data: el,
                                    iconCSS: 'wegas-icon-team',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'Player':
                                ret.push({
                                    label: 'Player: ' + el.get("name"),
                                    data: el,
                                    iconCSS: 'wegas-icon-player',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                                break;

                            case 'GameModel':
                                text = 'Game model: ' + el.get("name");
                                ret.push({
                                    type: "TreeNode",
                                    label: text,
                                    children: this.genTreeViewElements(el.get("games")),
                                    data: el
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
            var l;
            switch (el.get('@class')) {
                case 'StringInstance':
                case 'NumberInstance':
                case 'ListInstance':
                    return {
                        label: label + ': ' + el.get("value"),
                        data: el
                    };

                case 'QuestionInstance':
                    l = label + ((el.get("replies").length > 0) ? ': ' + el.get("replies").get("name") : ': unanswered');
                    return {
                        label: l,
                        data: el
                    };

                case 'InboxInstance':
                    var k, children = [];

                    label += "(" + el.get("messages").length + ")";

                    for (k = 0; k < el.get("messages").length; k += 1) {
                        children.push({
                            label: el.get("messages")[k].get("subject")
                        //data: el.get("messages")[k]
                        });
                    }
                    return {
                        type: 'TreeNode',
                        label: label,
                        data: el,
                        children: children
                    };

                default:
                    return {
                        label: label,
                        data: el
                    };
            }
        },

        genPageTreeViewElements: function (elts) {
            var ret = [], j, text, el;
            if (!Y.Lang.isArray(elts)) {
                elts = [ elts ]
            }

            for (j = 0; j < elts.length; j += 1) {
                el = elts[j];
                text =  el.type + ': ' + (el.label || el.name || el.id || 'unnamed');
                switch (el.type) {
                    case 'List':
                        ret.push({
                            type: 'TreeNode',
                            label: 'List: ' + (el.label || 'unnamed'),
                            data: el,
                            children: this.genPageTreeViewElements(el.children)
                        });
                        break;
                    case 'VariableDisplay':
                        text = 'Variable displayer: ' + (el.variable);
                        ret.push({
                            label: text,
                            data: el
                        });
                        break;
                    case 'Text':
                        ret.push({
                            label: 'Text: ' + el.content.substring(0, 15) + "...",
                            data: el
                        });
                        break;
                    case 'Button':
                        ret.push({
                            label: text,
                            data: el
                        });
                        break;
                    default:
                        ret.push({
                            label: text,
                            data: el
                        });
                        break;

                }
            }
            return ret;
        }
    }, {
        ATTRS : {
            includeClasses: {
                value: null
            },
            excludeClasses: {
                value: null
            },
            dataSource: {}
        }
    });


    Y.namespace('Wegas').EditorTreeView = EditorTreeView;
});