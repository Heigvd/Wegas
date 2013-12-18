/*
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
YUI.add('wegas-editor-treeview', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', DATASOURCE = "dataSource", ID = "id",
            CLASS = "@class", NAME = "name", HOST = "host", RENDER = "render",
            EDITBUTTONTPL = "<span class=\"wegas-treeview-editmenubutton\"></span>",
            Wegas = Y.Wegas,
            EditorTreeView;

    /**
     * @name Y.Wegas.EditorTreeView
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @constructor
     * @class Widget that renders the content of a Y.Wegas.Datasource in a Y.Treeview.Widget,
     * generating requires nodes.
     */
    EditorTreeView = Y.Base.create("wegas-editor-treeview", Y.Widget, [Y.WidgetChild, Wegas.Widget], {
        /** @lends Y.Wegas.EditorTreeView# */
        // *** Private fields ** //
        treeView: null,
        // ** Lifecycle methods ** //
        /**
         *
         */
        renderUI: function() {
            this.treeView = new Y.TreeView();
            this.treeView.render(this.get(CONTENTBOX));

            this.plug(Y.Plugin.EditorTVToolbarMenu);
            this.plug(Y.Plugin.RememberExpandedTreeView);
        },
        /**
         * @function
         * @private
         */
        bindUI: function() {
            var ds = this.get(DATASOURCE),
                    request = this.get("request");
            if (ds) {
                this.updateHandler = ds.after("update", this.syncUI, this);                          // Listen updates on the target datasource
                this.failureHandler = ds.after("failure", this.defaultFailureHandler, this);          // GLOBAL error message

                if (request) {
                    ds.sendRequest(request);
                }
            }
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            Y.log("sync()", "info", "Wegas.EditorTreeView");

            if (!this.get(DATASOURCE)) {
                this.get(CONTENTBOX).append("Unable to find datasource");
                return;
            }

            var treeNodes, ds = this.get(DATASOURCE),
                    cb = this.get(CONTENTBOX),
                    selector = this.get("dataSelector"),
                    entities = (selector) ? ds.cache.find(selector.key, selector.val) : ds.cache.findAll(),
                    treeNodes = this.genTreeViewElements(entities);


            this.treeView.removeAll();
            cb.all(".wegas-smallmessage").remove();

            if (treeNodes.length === 0) {
                cb.append('<div class="wegas-smallmessage">' + this.get("emptyMessage") + '</div>');
                return;
            }
            this.treeView.add(treeNodes);
            this.treeView.syncUI();

            this.hideOverlay();
        },
        destructor: function() {
            this.treeView.destroy();
            this.updateHandler.detach();
            this.failureHandler.detach();
        },
        // *** Private Methods *** //
        /**
         * @function
         * @private
         */
        genTreeViewElements: function(elements) {
            var ret = [], i, el, elClass, text, collapsed, selected;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];
                    elClass = el.get(CLASS);
                    collapsed = !this.isNodeExpanded(el);
                    selected = (this.currentSelection === el.get(ID)) ? 2 : 0;

                    switch (elClass) {

                        case 'DebugGame':
                            break;

                        case 'Game':
                            var createdBy = el.get("createdBy"),
                                    gameModel = Wegas.Facade.GameModel.cache.findById(el.get("gameModelId"));
                            if (!gameModel) {
                                Y.log("Unable to find game model for game: " + el.get("name"), "error");
                            } else {
                                ret.push({
                                    type: 'TreeNode',
                                    label: '<div class="yui3-g wegas-editor-treeview-table">'
                                            + '<div class="yui3-u yui3-u-col1">' + el.get(NAME) + '</div>'
                                            + '<div class="yui3-u yui3-u-col2 yui3-g">'
                                            + '<div class="yui3-u-1-4">'
                                            + Wegas.Helper.smartDate(el.get("createdTime"))
                                            + '</div>'
                                            + '<div class="yui3-u-1-4">' + ((createdBy) ? createdBy.get(NAME) : "undefined") + '</div>'
                                            + '<div class="yui3-u-1-4">' + (gameModel.get("properties.freeForAll") ? el.get("token") : "") + '</div>'
                                            + '<div class="yui3-u-1-4">' + gameModel.get(NAME) + '</div></div>'
                                            + '</div>',
                                    collapsed: collapsed,
                                    selected: selected,
                                    children: this.genTreeViewElements(el.get("teams")),
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-game'
                                            //rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                            }
                            break;

                        case 'Team':
                            text = 'Team: ' + el.get(NAME);
                            ret.push({
                                type: 'TreeNode',
                                collapsed: collapsed,
                                selected: selected,
                                label: '<div class="yui3-g wegas-editor-treeview-table">'
                                        + '<div class="yui3-u yui3-u-col1">Team: ' + el.get(NAME) + '</div>'
                                        + '<div class="yui3-u yui3-u-col2 yui3-g">'
                                        + '<div class="yui3-u-1-4"></div>'
                                        + '<div class="yui3-u-1-4"></div>'
                                        + '<div class="yui3-u-1-4">' + el.get("token") + '</div>'
                                        + '<div class="yui3-u-1-4"></div></div>'
                                        + '</div>',
                                children: this.genTreeViewElements(el.get("players")),
                                data: {
                                    entity: el
                                },
                                iconCSS: 'wegas-icon-team'
                                        //rightWidget: Y.Node.create(EDITBUTTONTPL)
                            });
                            break;

                        case 'Player':
                            ret.push({
                                label: 'Player: ' + el.get(NAME),
                                selected: selected,
                                data: {
                                    entity: el
                                },
                                iconCSS: 'wegas-icon-player'
                                        //rightWidget: Y.Node.create(EDITBUTTONTPL)
                            });
                            break;

                        case 'GameModel':
                            if (el.get("canEdit")) {
                                text = el.get(NAME) || "no name";
                                ret.push({
                                    label: text,
                                    selected: selected,
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-gamemodel'
                                            //rightWidget: (el.get("canEdit")) ? Y.Node.create(EDITBUTTONTPL) : null
                                });
                            }
                            break;

                        case 'User':
                            ret.push({
                                label: el.get(NAME),
                                selected: selected,
                                data: {
                                    entity: el.getMainAccount()
                                },
                                iconCSS: 'wegas-icon-player'
                                        //rightWidget: Y.Node.create(EDITBUTTONTPL)
                            });
                            break;

                        case 'Role':
                            ret.push({
                                label: 'Group:' + el.get(NAME),
                                selected: selected,
                                data: {
                                    entity: el
                                },
                                iconCSS: 'wegas-icon-team'
                                        //rightWidget: Y.Node.create(EDITBUTTONTPL)
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
        isNodeExpanded: function(entity) {
            return this.RememberExpandedTreeView.expandedIds[entity.get(ID)] || false;
        }
    }, {
        /** @lends Y.Wegas.EditorTreeView */

        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>includeClasses a list of entity classes names that will be included</li>
         *    <li>excludeClasses a list of entity classes that will be excluded</li>
         *    <li>emptyMessage string message to display if there are no entity
         *    to display <i>default: "No data to display"</i></li>
         *    <li>dataSelector</li>
         *    <li>dataSource</li>
         *    <li>request</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            emptyMessage: {
                value: "No data to display"
            },
            dataSelector: {},
            dataSource: {
                getter: function(val) {
                    if (Y.Lang.isString(val)) {
                        return Wegas.Facade[val];
                    }
                    return val;
                }
            },
            request: {}
        }
    });
    Y.namespace('Wegas').EditorTreeView = EditorTreeView;

    /**
     *
     */
    var TeamTreeView = Y.Base.create("wegas-editor-treeview", EditorTreeView, [], {
        CONTENT_TEMPLATE: '<div class="wegas-editor-treeview-team">'
                + '<div class="yui3-g wegas-editor-treeview-table wegas-editor-treeview-tablehd" style="padding-right: 255px">'
                + '<div class="yui3-u yui3-u-col1">Name</div>'
                + '<div class="yui3-u yui3-u-col2 yui3-g" style="margin-right: -250px;width:250px">'
                + '<div class="yui3-u">Enrolment key</div></div>'
                + '</div>'
                + '<div class="treeview"></div>'
                + "<div class=\"message\"></div>"
                + "<div class=\"description\">To share this game with your student, you must first create the teams and then give the students their team enrolment key, which they can use on <a href=\"http://wegas.albasim.ch\">wegas.albasim.ch</a>.</div>"
                + '</div>',
        renderUI: function() {
            this.treeView = new Y.TreeView();                                   // Render the treeview
            this.treeView.render(this.get(CONTENTBOX).one(".treeview"));

            if (this.isFreeForAll()) {                                          // @hack Change the display if the gamemodel is freeforall
                // //this.set("visible", false);
                //this.get("parent").set("visible", false);
                this.get("contentBox").one(".wegas-editor-treeview-tablehd .yui3-u-col2 .yui3-u").hide();
                this.get("parent").set("label", "Players");
            }

            this.plug(Y.Plugin.EditorTVToolbarMenu, {
                autoClick: false
            });
            this.plug(Y.Plugin.RememberExpandedTreeView);
            this.plug(Y.Plugin.EditorTVToggleClick);
            this.plug(Y.Plugin.WidgetToolbar);
            this.addButton = this.toolbar.add({
                type: "Button",
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>Add teams"
            });
        },
        bindUI: function() {
            TeamTreeView.superclass.bindUI.call(this);

            this.addButton.on("click", function() {                             // When the "add teams" button is clicker
                var i, name,
                        entity = this.get("entity"),
                        offset = entity.get("teams").length,
                        teams = prompt("How many teams?", 1);

                this.showOverlay();
                this.teamsAcc = [];
                for (i = 0; i < parseInt(teams); i += 1) {                      // add the number amount of teams
                    name = entity.get("name") + "-" + (offset + i + 1);
                    this.teamsAcc.push({
                        "@class": "Team",
                        name: name,
                        token: name
                    });
                }
                this.teamsAcc.reverse();
                this.doCreateTeam();
            }, this);
        },
        syncUI: function() {
            Y.log("sync()", "info", "Wegas.TeamTreeView");

            if (!this.get(DATASOURCE)) {
                this.get(CONTENTBOX).append("Unable to find datasource");
                return;
            }

            var cb = this.get(CONTENTBOX),
                    treeNodes = this.genTreeViewElements(this.get("entity").get("teams"));

            cb.one(".message").setHTML("");
            if (treeNodes.length === 0) {
                cb.one(".message").setHTML('<center><em><br />' + this.get("emptyMessage") + '<br /><br /></em></center');
            }
            this.treeView.removeAll();
            this.treeView.add(treeNodes);
            this.treeView.syncUI();

            this.hideOverlay();
        },
        isFreeForAll: function() {
            return Y.Wegas.Facade.GameModel.cache.findById(this.get("entity").get("gameModelId")).get("properties.freeForAll");
        },
        genTreeViewElements: function(elements) {
            var ret = [], i, el, elClass, collapsed, selected,
                    freeForAll = this.isFreeForAll();

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];
                    elClass = el.get(CLASS);
                    collapsed = !this.isNodeExpanded(el);
                    selected = (this.currentSelection === el.get(ID)) ? 2 : 0;

                    switch (elClass) {
                        case 'Team':
                            if (!freeForAll) {
                                ret.push({
                                    type: 'TreeNode',
                                    collapsed: collapsed,
                                    selected: selected,
                                    label: '<div class="yui3-g wegas-editor-treeview-table" style="padding-right: 255px">'
                                            + '<div class="yui3-u yui3-u-col1">' + el.get(NAME) + '</div>'
                                            + '<div class="yui3-u yui3-u-col2 yui3-g"  style="margin-right:-250px;width:250px">'
                                            + '<div class="yui3-u">' + el.get("token") + '</div>'
                                            + '</div>'
                                            + '</div>',
                                    children: this.genTreeViewElements(el.get("players")),
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-team'
                                            //rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                            } else {
                                ret = ret.concat(this.genTreeViewElements(el.get("players")));
                            }
                            break;

                        case 'Player':
                            ret.push({
                                label: el.get(NAME),
                                selected: selected,
                                data: {
                                    entity: el
                                },
                                iconCSS: 'wegas-icon-player'
                                        //rightWidget: Y.Node.create(EDITBUTTONTPL)
                            });
                            break;
                    }
                }
            }
            return ret;
        },
        doCreateTeam: function() {
            var entity = this.get("entity"), team = this.teamsAcc.pop();

            if (team) {
                Y.Wegas.Facade.Game.cache.post(team, entity.toObject(), {
                    success: Y.bind(this.doCreateTeam, this)
                });
            } else {
                this.hideOverlay();
            }
        }
    }, {
        ATTRS: {
            dataSource: {
                value: "Game"
            },
            entity: {
                getter: function(val) {
                    if (!val)
                        return Y.Wegas.Facade.Game.cache.getCurrentGame();
                    else
                        return val;
                }
            },
            emptyMessage: {
                value: "No team created yet"
            }
        }
    });
    Y.namespace('Wegas').TeamTreeView = TeamTreeView;
    /**
     *
     */
    var TeamTreeViewEditor = Y.Base.create("wegas-editor-treeview", TeamTreeView, [], {
        CONTENT_TEMPLATE: '<div class="wegas-editor-treeview-team">'
                + '<div class="treeview"></div>'
                + "<div class=\"message\"></div>"
                + '</div>',
        renderUI: function() {
            this.treeView = new Y.TreeView();                                   // Render the treeview
            this.treeView.addTarget(this);
            this.treeView.render(this.get(CONTENTBOX).one(".treeview"));

            if (this.isFreeForAll()) {                                          // @hack Change the display if the gamemodel is freeforall
                //this.get("parent").set("label", "Players");
            }

//            this.plug(Y.Plugin.EditorTVToolbarMenu, {
//                autoClick: false
//            });
            this.plug(Y.Plugin.RememberExpandedTreeView);
            //this.plug(Y.Plugin.EditorTVToggleClick);
            this.plug(Y.Plugin.WidgetToolbar);
            this.addButton = this.toolbar.add({
                type: "Button",
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>Add teams"
            });
        },
        genTreeViewElements: function(elements) {
            var ret = [], i, el, elClass, collapsed, selected,
                    freeForAll = this.isFreeForAll();

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];
                    elClass = el.get(CLASS);
                    collapsed = !this.isNodeExpanded(el);
                    selected = (this.currentSelection === el.get(ID)) ? 2 : 0;

                    switch (elClass) {
                        case 'Team':
                            if (!freeForAll) {
                                var children = this.genTreeViewElements(el.get("players")),
                                        expanded = Y.Array.find(children, function(p) {
                                    return p.selected;
                                }) || !collapsed

                                ret.push({
                                    type: 'TreeNode',
                                    collapsed: !expanded,
                                    selected: el.get("id") === Y.Wegas.app.get("currentTeam") ? 2 : 0,
                                    //selected: selected,
                                    label: el.get(NAME),
                                    children: children,
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-team'
                                            //rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                            } else {
                                ret = ret.concat(this.genTreeViewElements(el.get("players")));


                            }
                            break;

                        case 'Player':
                            ret.push({
                                label: el.get(NAME),
                                selected: el.get("id") === Y.Wegas.app.get("currentPlayer") ? 2 : 0,
                                // selected: selected,
                                data: {
                                    entity: el
                                },
                                iconCSS: 'wegas-icon-player'
                                        //rightWidget: Y.Node.create(EDITBUTTONTPL)
                            });
                            break;
                    }
                }
            }
            return ret;
        }
    });
    Y.namespace('Wegas').TeamTreeViewEditor = TeamTreeViewEditor;

    /**
     * @class To be plugged on a an EditorTreeview, keeps track of the
     * collapsed nodes.
     * @constructor
     */
    Y.Plugin.RememberExpandedTreeView = Y.Base.create("wegas-rememberexpandedtreeview", Y.Plugin.Base, [], {
        expandedIds: null,
        initializer: function() {
            this.expandedIds = {};
            this.afterHostEvent(RENDER, function() {
                var host = this.get(HOST);

                host.treeView.before("*:nodeExpanded", function(e) {
                    this.expandedIds[e.node.get("data").entity.get(ID)] = true;
                }, this);

                host.treeView.before("*:nodeCollapsed", function(e) {
                    delete this.expandedIds[e.node.get("data").entity.get(ID)];
                }, this);
            });
        }
    }, {
        NS: "RememberExpandedTreeView",
        NAME: "RememberExpandedTreeView"
    });

    /**
     * @class Open a menu on click, containing the admin edition field
     * @constructor
     */
    Y.Plugin.EditorTVAdminMenu = Y.Base.create("admin-menu", Y.Plugin.Base, [], {
        initializer: function() {

            this.menu = new Wegas.Menu();

            this.afterHostEvent(RENDER, function() {
                var host = this.get(HOST);
                this.menu.addTarget(host);
                host.treeView.on("*:click", this.onTreeViewClick, this);
            });
        },
        onTreeViewClick: function(e) {
            //Y.log(e.target.get("label") + " label was clicked", "info", "Wegas.EditorTreeView");

            var menuItems = this.get("children"),
                    data = e.node.get("data"),
                    domTarget = e.domEvent.target,
                    host = this.get(HOST);

            if (data) {
                host.currentSelection = data.entity.get(ID);
                data.dataSource = host.get(DATASOURCE);

                if (menuItems) {
                    Y.Wegas.Editable.mixMenuCfg(this.get("children"), data);
                } else {
                    menuItems = data.entity.getMenuCfg(data);                   // If no menu is provided, use entity default
                }

                if (menuItems.length === 0) {
                    return;
                }

                this.menu.removeAll();                                  // Populate the menu with the elements associated to the
                this.menu.add(menuItems);
                if (this.get("autoClick")) {
                    this.menu.item(0).set("visible", false);
                }

                if (domTarget.hasClass("wegas-treeview-editmenubutton")) {      // If user clicked on the edit button
                    this.menu.attachTo(domTarget);                              // Display the edit button next to it
                } else if (this.get("autoClick")) {                             // Otherwise the user clicked on the node
                    this.menu.item(0).fire("click");             // Excute the actions associated to the first item of the menu
                }
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVAdminMenu");
                host.currentSelection = null;
            }

        }
    }, {
        NS: "EditorTVMenu",
        NAME: "EditorTVAdminMenu",
        ATTRS: {
            children: {},
            autoClick: {
                value: true
            }
        }
    });
    /**
     * @class Open a menu on click, containing the admin edition field
     * @constructor
     */
    Y.Plugin.EditorTVToolbarMenu = Y.Base.create("admin-menu", Y.Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent(RENDER, function() {
                this.get(HOST).treeView.on("*:click", this.onTreeViewClick, this);
            });
        },
        onTreeViewClick: function(e) {
            var menuItems = this.get("children"),
                    data = e.node.get("data"),
                    host = this.get(HOST);

            if (data) {
                host.currentSelection = data.entity.get(ID);
                data.dataSource = host.get(DATASOURCE);

                if (menuItems) {
                    Y.Wegas.Editable.mixMenuCfg(this.get("children"), data);
                } else {
                    menuItems = data.entity.getMenuCfg(data);                   // If no menu is provided, use entity default
                }

                Y.Array.each(menuItems, function(i) {                           // @hack add icons to some buttons
                    switch (i.label) {
                        case "Delete":
                        case "New":
                        case "Copy":
                        case "Duplicate":
                        case "View":
                        case "Open in editor":
                        case "Open":
                        case "Edit":
                            i.label = '<span class="wegas-icon wegas-icon-' + i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                    }
                });

                host.toolbar.removeAll();
                host.toolbar.add(menuItems);                                    // Populate the menu with the elements associated to the

                if (this.get("autoClick")) {
                    host.toolbar.item(0).set("visible", false).fire("click");      // Excute the actions associated to the first item of the menu
                }
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVToolbarMenu");
                host.currentSelection = null;
            }

        }
    }, {
        NS: "EditorTVToolbarMenu",
        NAME: "EditorTVToolbarMenu",
        ATTRS: {
            children: {},
            autoClick: {
                value: true
            }
        }
    });
    Y.Plugin.EditorTVToggleClick = Y.Base.create("admin-menu", Y.Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent(RENDER, function() {
                this.get(HOST).treeView.on("treenode:click", function(e) {
                    //this.collapseAll();
                    e.target.toggleTree();
                });
            });
        }
    }, {
        NS: "EditorTVToggleClick",
        NAME: "EditorTVToggleClick"
    });
});
