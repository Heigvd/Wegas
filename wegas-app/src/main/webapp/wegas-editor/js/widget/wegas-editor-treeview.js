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

            this.plug(Y.Plugin.EditorTVAdminMenu);
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
                ds.after("update", this.syncUI, this);                          // Listen updates on the target datasource
                ds.after("failure", this.defaultFailureHandler, this);          // GLOBAL error message

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
                                    //label: 'Game: ' + el.get(NAME) + ' (token:' + el.get("token") + ')',
                                    label: '<div class="yui3-g wegas-editor-treeview-table">'
                                            + '<div class="yui3-u yui3-u-col1">' + el.get(NAME) + '</div>'
                                            + '<div class="yui3-u yui3-u-col2 yui3-g">'
                                            + '<div class="yui3-u-1-4">'
                                            + Wegas.Helper.smartDate(el.get("createdTime"))
                                            + '</div>'
                                            + '<div class="yui3-u-1-4">' + ((createdBy) ? createdBy.get(NAME) : "undefined") + '</div>'
                                            + '<div class="yui3-u-1-4">' + ((gameModel.get("properties.freeForAll") === "true") ? el.get("token") : "") + '</div>'
                                            + '<div class="yui3-u-1-4">' + gameModel.get(NAME) + '</div></div>'
                                            + '</div>',
                                    collapsed: collapsed,
                                    selected: selected,
                                    children: this.genTreeViewElements(el.get("teams")),
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-game',
                                    rightWidget: Y.Node.create(EDITBUTTONTPL)
                                });
                            }
                            break;

                        case 'Team':
                            text = 'Team: ' + el.get(NAME) + ' (token: ' + el.get("token") + ")";
                            ret.push({
                                type: 'TreeNode',
                                collapsed: collapsed,
                                selected: selected,
                                label: '<div class="yui3-g wegas-editor-treeview-table">'
                                        + '<div class="yui3-u yui3-u-col1">Team' + el.get(NAME) + '</div>'
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
                                iconCSS: 'wegas-icon-team',
                                rightWidget: Y.Node.create(EDITBUTTONTPL)
                            });
                            break;

                        case 'Player':
                            ret.push({
                                label: 'Player: ' + el.get(NAME),
                                selected: selected,
                                data: {
                                    entity: el
                                },
                                iconCSS: 'wegas-icon-player',
                                rightWidget: Y.Node.create(EDITBUTTONTPL)
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
                                    iconCSS: 'wegas-icon-gamemodel',
                                    rightWidget: (el.get("canEdit")) ? Y.Node.create(EDITBUTTONTPL) : null
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
                                iconCSS: 'wegas-icon-player',
                                rightWidget: Y.Node.create(EDITBUTTONTPL)
                            });
                            break;

                        case 'Role':
                            ret.push({
                                label: 'Group:' + el.get(NAME),
                                selected: selected,
                                data: {
                                    entity: el
                                },
                                iconCSS: 'wegas-icon-team',
                                rightWidget: Y.Node.create(EDITBUTTONTPL)
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
         *    to display <i>default: No data to display</i></li>
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
     *  A treeview used in lobby left panel.
     *
     */
    var GameModelTreeView = Y.Base.create("wegas-editor-treeview", EditorTreeView, [], {
        CONTENT_TEMPLATE: '<div class="wegas-editor-treeviewgame">'
                + '<div class="yui3-g wegas-editor-treeview-table wegas-editor-treeview-tablehd" style="padding-right: 461px">'
                + '<div class="yui3-u yui3-u-col1">Name</div>'
                + '<div class="yui3-u yui3-u-col2 yui3-g" style="margin-right: -461px;">'
                + '<div class="yui3-u-1-2">Created</div>'
                + '<div class="yui3-u-1-2">Created by</div>'
                + '</div></div>',
        /**
         * @function
         * @private
         */
        bindUI: function() {
            GameModelTreeView.superclass.bindUI.apply(this);

            this.treeView.on("*:click", function(e) {
                var entity = e.node.get("data.entity");
                //sourceUri = "rest/GameModel//Game", // If click on "All game models" node
                //registeredGamesUri = "rest/RegisteredGames/" + Wegas.app.get("currentUser.id");

                //if (entity) {                                                   // If click on a particular game model
                //sourceUri = "rest/GameModel/" + entity.get(ID) + "/Game";
                //registeredGamesUri += "/" + entity.get(ID);
                //}
                GameModelTreeView.currentGameModel = entity;

                //Y.all(".wegas-editor-treeviewgame").each(function() {           // Filter existing tabs
                //    Y.Widget.getByNode(this).treeView.filter.set("searchVal", entity);
                //});
            }, this);
        },
        //syncUI: function() {
        //    GameModelTreeView.superclass.syncUI.apply(this);
        //    this.treeView.add({
        //        label: "All models",
        //        iconCSS: 'wegas-icon-gamemodel',
        //        selected: (!this.currentSelection) ? 2 : 0
        //    }, 0);
        //}
    });
    Y.namespace("Wegas").GameModelTreeView = GameModelTreeView;
    /**
     *
     */
    var CreatedGameTreeView = Y.Base.create("wegas-editor-treeview", EditorTreeView, [], {
        CONTENT_TEMPLATE: '<div class="wegas-editor-treeviewgame">'
                + '<div class="yui3-g wegas-editor-treeview-table wegas-editor-treeview-tablehd">'
                + '<div class="yui3-u yui3-u-col1">Name</div>'
                + '<div class="yui3-u yui3-u-col2 yui3-g">'
                + '<div class="yui3-u-1-4 yui3-u-selected">Created</div>'
                + '<div class="yui3-u-1-4">Created by</div>'
                + '<div class="yui3-u-1-4">Token</div>'
                + '<div class="yui3-u-1-4">Model</div></div>'
                + '</div></div>',
        renderUI: function() {
            CreatedGameTreeView.superclass.renderUI.apply(this);
            //this.treeView.plug(Y.Plugin.TreeViewFilter, {
            //    testFn: function(searchVal) {
            //        if (searchVal) {
            //            return this.get("data.entity").get("gameModelId") === searchVal.get("id");
            //        } else {
            //            return true;
            //        }
            //    },
            //    autoExpand: false
            //});

            //this.treeView.on("*:click", function(e) {
            //    this.collapseAll();
            //    e.target.expand();
            //});
        }
    });
    Y.namespace("Wegas").CreatedGameTreeView = CreatedGameTreeView;


    /**
     *
     */
    var JoinedGameTreeView = Y.Base.create("wegas-editor-treeview", CreatedGameTreeView, [], {
        CONTENT_TEMPLATE: '<div class="wegas-editor-treeviewgame">'
                + '<div class="yui3-g wegas-editor-treeview-table wegas-editor-treeview-tablehd" style="padding-right: 461px">'
                + '<div class="yui3-u yui3-u-col1">Name</div>'
                + '<div class="yui3-u yui3-u-col2 yui3-g" style="margin-right: -461px;">'
                + '<div class="yui3-u-1-3 yui3-u-selected">Joined</div>'
                + '<div class="yui3-u-1-3">Created by</div>'
                + '<div class="yui3-u-1-3">Model</div></div>'
                + '</div></div>',
        // ** Lifecycle methods ** //
        genTreeViewElements: function(elements) {
            var ret = [], i, el;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];

                    switch (el.get(CLASS)) {
                        case 'Game':
                            var createdBy = el.get("createdBy"),
                                    gameModel = Wegas.Facade.GameModel.cache.findById(el.get("gameModelId"));
                            
                            if (gameModel) {
                                ret.push({
                                    //label: el.get(NAME),
                                    label: '<div class="yui3-g wegas-editor-treeview-table">'
                                            + '<div class="yui3-u yui3-u-col1">' + el.get(NAME) + '</div>'
                                            + '<div class="yui3-u yui3-u-col2 yui3-g">'
                                            + '<div class="yui3-u-1-3">'
                                            + Wegas.Helper.smartDate(el.get("createdTime"))
                                            + '</div>'
                                            + '<div class="yui3-u-1-3">' + ((createdBy) ? createdBy.get(NAME) : "undefined") + '</div>'
                                            + '<div class="yui3-u-1-3">' + gameModel.get(NAME) + '</div></div>'
                                            + '</div>',
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-game'
                                });
                            } else {
                                Y.log("Unable to find game model associated with game:" + el.get(NAME), "error", "Wegas.EditorTreeView");
                            }
                            break;
                    }
                }
            }
            return ret;
        }
    });
    Y.namespace('Wegas').JoinedGameTreeView = JoinedGameTreeView;

    /**
     *
     */
    var PublicGameTreeView = Y.Base.create("wegas-editor-treeview", JoinedGameTreeView, [], {
        // ** Lifecycle methods ** //
        genTreeViewElements: function(elements) {
            var ret = [], i, el;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    el = elements[i];

                    switch (el.get(CLASS)) {
                        case 'Game':
                            var createdBy = el.get("createdBy"),
                                    gameModel = Wegas.Facade.GameModel.cache.findById(el.get("gameModelId"));

                            if (gameModel) {
                                ret.push({
                                    //label: el.get(NAME),
                                    label: '<div class="yui3-g wegas-editor-treeview-table">'
                                            + '<div class="yui3-u yui3-u-col1">' + el.get(NAME) + '</div>'
                                            + '<div class="yui3-u yui3-u-col2 yui3-g">'
                                            + '<div class="yui3-u-1-3">'
                                            + Wegas.Helper.smartDate(el.get("createdTime"))
                                            + '</div>'
                                            + '<div class="yui3-u-1-3">' + ((createdBy) ? createdBy.get(NAME) : "undefined") + '</div>'
                                            + '<div class="yui3-u-1-3">' + gameModel.get(NAME) + '</div></div>'
                                            + '</div>',
                                    data: {
                                        entity: el
                                    },
                                    iconCSS: 'wegas-icon-game'
                                });
                            } else {
                                Y.log("Unable to find game model associated with game:" + el.get(NAME), "error", "Wegas.EditorTreeView");
                            }
                            break;
                    }
                }
            }
            return ret;
        }
    });
    Y.namespace('Wegas').PublicGameTreeView = PublicGameTreeView;

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

});
