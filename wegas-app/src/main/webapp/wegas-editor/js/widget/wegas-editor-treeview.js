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
            CLASS = "@class", NAME = "name", HOST = "host",
            Plugin = Y.Plugin, Wegas = Y.Wegas, EditorTreeView;

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
        // ** Lifecycle methods ** //
        /**
         *
         */
        renderUI: function() {
            this.treeView = new Y.TreeView({
                emptyMsg: this.get("emptyMessage")
            });
            this.treeView.addTarget(this);
            this.treeView.render(this.get(CONTENTBOX));

            this.plug(Plugin.EditorTVToolbarMenu);
            this.plug(Plugin.EditorTVContextMenu);
            this.plug(Plugin.RememberExpandedTreeView);
        },
        /**
         * @function
         * @private
         */
        bindUI: function() {
            var ds = this.get(DATASOURCE),
                    request = this.get("request");
            if (ds) {
                this.updateHandler = ds.after("update", this.syncUI, this);     // Listen updates on the target datasource
                this.failureHandler = ds.after("failure", this.defaultFailureHandler, this);// GLOBAL error message

                this.addedHandler = ds.after("added", function(e) {
                    this.currentSelection = e.entity.get("id");
                }, this);

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
                    selector = this.get("dataSelector"),
                    entities = (selector) ? ds.cache.find(selector.key, selector.val) : ds.cache.findAll(),
                    treeNodes = this.genTreeViewElements(entities);

            this.treeView.destroyAll();
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
            return Y.Array.filter(Y.Array.map(elements, this.genTreeViewElement, this), Y.Lang.isObject);
        },
        genTreeViewElement: function(entity) {
            var children = entity.get("players");                               // @hack so it works for team

            if (entity instanceof Wegas.persistence.User) {                     // @hack
                entity = entity.getMainAccount();
            }

            return {
                type: (children) ? "TreeNode" : "TreeLeaf",
                label: entity.get(NAME),
                //label: el.get(CLASS) + ': ' + el.get(NAME),
                selected: (this.currentSelection === entity.get(ID)) ? 2 : 0,
                collapsed: !this.isNodeExpanded(entity),
                children: (children) ? this.genTreeViewElements(children) : [],
                data: {
                    entity: entity
                },
                iconCSS: 'wegas-icon-' + entity.get(CLASS).toLowerCase()
            };
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
                //+ '<div class="yui3-u yui3-u-col2 yui3-g" style="margin-right: -250px;width:250px">'
                //+ '<div class="yui3-u">Players</div></div>'
                + '</div>'
                + '<div class="treeview"></div>'
                //+ "<div class=\"description\">To share this game with your student, you must first create the teams and then give the students their team enrolment key, which they can use on <a href=\"http://wegas.albasim.ch\">wegas.albasim.ch</a>.</div>"
                + '</div>',
        renderUI: function() {
            this.treeView = new Y.TreeView({
                emptyMsg: this.get("emptyMessage")
            });                                                                 // Render the treeview
            this.treeView.addTarget(this);
            this.treeView.render(this.get(CONTENTBOX).one(".treeview"));

            this.plug(Plugin.RememberExpandedTreeView);
            this.plug(Plugin.WidgetToolbar);

            //this.plug(Plugin.EditorTVToggleClick);
            //if (this.isFreeForAll()) {                                          // @hack Change the display if the gamemodel is freeforall
            //    this.get("parent").set("label", "Players");
            //}
        },
        syncUI: function() {
            Y.log("sync()", "info", "Wegas.TeamTreeView");

            if (!this.get(DATASOURCE)) {
                this.get(CONTENTBOX).append("Unable to find datasource");
                return;
            }

            var treeNodes = this.genTreeViewElements(this.get("entity").get("teams"));

            this.treeView.destroyAll();
            this.treeView.add(treeNodes);
            this.treeView.syncUI();

            this.hideOverlay();
        },
        genTreeViewElements: function(entities) {
            var ret = TeamTreeView.superclass.genTreeViewElements.call(this, entities);
            if (entities[0] && entities[0] instanceof Wegas.persistence.Team) {
                if (this.get("entity").get("properties.freeForAll")) {// Do not display teams in free for all game
                    return Y.Array.flatten(Y.Array.map(ret, function(node) {
                        return node.children || [];
                    })).slice(1);
                } else {
                    return ret;
                }
            } else
                return ret;
        },
        genTreeViewElement: function(entity) {
            var elClass = entity.get(CLASS),
                    collapsed = !this.isNodeExpanded(entity),
                    selected = (this.currentSelection === entity.get(ID)) ? 2 : 0;

            switch (elClass) {
                case 'Team':
                    var children = this.genTreeViewElements(entity.get("players")),
                            expanded = Y.Array.find(children, function(p) {
                        return p.selected;
                    }) || !collapsed;

                    return {
                        type: 'TreeNode',
                        collapsed: !expanded,
                        selected: entity.get("id") === Wegas.app.get("currentTeam") ? 2 : 0,
                        //selected: selected,
                        label: entity.get(NAME),
                        children: children,
                        data: {
                            entity: entity
                        },
                        iconCSS: 'wegas-icon-team'
                    };

                case 'Player':
                    return {
                        label: entity.get(NAME),
                        selected: entity.get("id") === Wegas.app.get("currentPlayer") ? 2 : 0,
                        // selected: selected,
                        data: {
                            entity: entity
                        },
                        iconCSS: 'wegas-icon-player'
                    };
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
                        return Wegas.Facade.Game.cache.getCurrentGame();
                    else
                        return val;
                }
            },
            emptyMessage: {
                value: "No player has joined yet"
            }
        }
    });
    Y.namespace('Wegas').TeamTreeView = TeamTreeView;
    /**
     * @class To be plugged on a an EditorTreeview, keeps track of the
     * collapsed nodes.
     * @constructor
     */
    Plugin.RememberExpandedTreeView = Y.Base.create("wegas-rememberexpandedtreeview", Plugin.Base, [], {
        expandedIds: null,
        initializer: function() {
            this.expandedIds = {};
            this.onHostEvent("*:nodeExpanded", function(e) {
                this.expandedIds[e.node.get("data").entity.get(ID)] = true;
            });
            this.onHostEvent("*:nodeCollapsed", function(e) {
                delete this.expandedIds[e.node.get("data").entity.get(ID)];
            });
        }
    }, {
        NS: "RememberExpandedTreeView"
    });

    /**
     * @class Open a menu on click, containing the admin edition field
     * @constructor
     */
    Plugin.EditorTVToolbarMenu = Y.Base.create("admin-menu", Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent("treeview:selectionChange", function(e) {
                if (e.prevVal === e.newVal ||
                        (e.prevVal && e.newVal && e.prevVal._items === e.newVal._items)) {
                    return;
                }
                this.onTreeViewSelection(e);
            }, this);
        },
        onTreeViewSelection: function(e) {
            if (!e.target.getSelection()) {
                //deselect
                return;
            }
            var menuItems = this.getMenuItems(e.target.getSelection().item(0).get("data")),
                    host = this.get(HOST);

            if (menuItems) {
                host.toolbar.destroyAll();
                host.toolbar.add(menuItems);                                    // Populate the menu with the elements associated to the

                if (this.get("autoClick")) {
                    host.toolbar.item(0).set("visible", false).fire("click");   // Excute the actions associated to the first item of the menu
                }
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVToolbarMenu");
                host.currentSelection = null;
            }
        },
        getMenuItems: function(data) {
            var menuItems = this.get("children"), entity,
                    host = this.get(HOST);

            if (data) {
                entity = data.entity || data.widget;
                if (entity) {
                    host.currentSelection = entity.get(ID);
                }
                data.dataSource = host.get(DATASOURCE);

                if (menuItems) {
                    Wegas.Editable.mixMenuCfg(menuItems, data);
                } else {
                    menuItems = entity.getMenuCfg(data).slice(0);               // If no menu is provided, use a clone of the entity default value
                }

                Y.Array.each(menuItems, function(i) {                           // @hack add icons to some buttons
                    switch (i.label) {
                        case "Delete":
                        case "New":
                        case "Add":
                        case "Copy":
                        case "View":
                        case "Open in editor":
                        case "Open":
                        case "Edit":
                            i.label = '<span class="wegas-icon wegas-icon-' + i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                    }
                });
            }
            return menuItems;
        }
    }, {
        NS: "menu",
        ATTRS: {
            children: {},
            autoClick: {
                value: true
            }
        }
    });
    /**
     * @class Open a menu on right click, containing the admin edition field
     * @constructor
     */
    Plugin.EditorTVContextMenu = Y.Base.create("admin-menu", Plugin.Base, [], {
        initializer: function() {
            this.onHostEvent("contextmenu", this.onTreeViewClick, this);

            this.menu = new Wegas.Menu();
            this.menu.addTarget(this.get(HOST));
            this.menu.render();
        },
        onTreeViewClick: function(e) {
            var targetWidget = Y.Widget.getByNode(e.domEvent.target),
                    menuItems = this.getMenuItems(targetWidget.get("data"), targetWidget);    // Fetch menu items

            //menuItems.splice(0, 1);                                             // Remove "Edit" button

            Y.Array.each(menuItems, function(i, itemIndex) {                    // @HACK Fix the submenu positioning
                Y.Array.each(i.plugins, function(p, index) {
                    if (p.fn === "WidgetMenu") {
                        menuItems[itemIndex] = Y.mix({}, menuItems[itemIndex]);
                        menuItems[itemIndex].plugins = menuItems[itemIndex].plugins.slice(0);
                        menuItems[itemIndex].plugins[index] = {
                            fn: "WidgetMenu",
                            cfg: Y.mix({
                                menuCfg: {
                                    points: ["tl", "tr"]
                                },
                                event: "mouseenter"
                            }, p.cfg)
                        };
                    }
                });
            });

            if (menuItems) {
                e.domEvent.preventDefault();
                this.menu.destroyAll();
                this.menu.add(menuItems);                                       // Populate the menu with the elements associated to the
                this.menu.show();                                               // Move the right click position
                this.menu.set("xy", [e.domEvent.pageX, e.domEvent.pageY]);
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVToolbarMenu");
            }
        },
        getMenuItems: function(data) {
            return Plugin.EditorTVToolbarMenu.prototype.getMenuItems.call(this, data);
        }
    }, {
        NS: "contextmenu",
        ATTRS: {
            children: {}
        }
    });

    Plugin.EditorTVToggleClick = Y.Base.create("EditorTVToggleClick", Plugin.Base, [], {
        initializer: function() {
            this.onHostEvent("treenode:click", function(e) {
                //this.collapseAll();
                e.target.toggleTree();
            });
        }
    }, {
        NS: "EditorTVToggleClick"
    });
});
