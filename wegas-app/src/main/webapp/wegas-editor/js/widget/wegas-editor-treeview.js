/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-editor-treeview", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox",
        DATASOURCE = "dataSource",
        ID = "id",
        CLASS = "@class",
        NAME = "name",
        HOST = "host",
        EXCLUDED_CLASS = "wegas-forbidden-feature",
        Plugin = Y.Plugin,
        Wegas = Y.Wegas, EditorTreeView;

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
        initializer: function() {
            this.handlers = [];
        },
        renderUI: function() {
            this.currentSelection = -1;
            this.treeView = new Y.TreeView({
                emptyMsg: this.get("emptyMessage")
            }).render(this.get(CONTENTBOX)) // Instantiate & render treeview
                .addTarget(this); // Listen to treeview's events
            this.plug(Plugin.EditorTVShortcut);
            this.plug(Plugin.EditorTVContextMenu); // Open context menu on right click
            this.plug(Plugin.RememberExpandedTreeView); // Selected node is preserved across requests
        },
        /**
         * @function
         * @private
         */
        bindUI: function() {
            var ds = this.get(DATASOURCE),
                request = this.get("request");
            if (ds) {
                this.handlers.push(ds.after("update", this.syncUI, this)); // Listen updates on the target datasource
                this.handlers.push(ds.after("failure", this.defaultFailureHandler, this)); // GLOBAL error message

                this.handlers.push(ds.after("added", function(e) { // When an entity is created
                    Y.later(20, this, function() {
                        var target = this.treeView.find(function(item) { // scroll to it in the treeview
                            return item.get("data.entity") && item.get("data.entity").get("id") === e.entity.get("id");
                        });
                        target && Wegas.Helper.scrollIntoViewIfNot(target.get(CONTENTBOX), false);
                    });
                }, this));

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
            this.treeView.destroyAll();
            this.treeView.add(this.getNodes());
            this.treeView.syncUI();
            this.hideOverlay();
        },
        destructor: function() {
            this.treeView.destroy();
            Y.Array.each(this.handlers, function(i) {
                i.detach();
            });
        },
        // *** Private Methods *** //
        /**
         * @function
         * @private
         */
        getNodes: function() {
            var ds = this.get(DATASOURCE),
                selector = this.get("dataSelector"),
                entities = (selector) ? ds.cache.findAll(selector.key, selector.val) : ds.cache.findAll();

            return this.genTreeViewElements(entities);
        },
        genTreeViewElements: function(elements) {
            return Y.Array.filter(Y.Array.map(elements, this.genTreeViewElement, this), Y.Lang.isObject);
        },
        genTreeViewElement: function(entity) {
            var children = entity.get("players"); // @hack so it works for team

            if (entity instanceof Wegas.persistence.User) { // @hack
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
                iconCSS: "wegas-icon-" + entity.get(CLASS).toLowerCase()
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
         *    to display <i>default: "Empty"</i></li>
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
                value: "Empty"
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
    Wegas.EditorTreeView = EditorTreeView;

    /**
     *
     */
    var TeamTreeView = Y.Base.create("wegas-editor-treeview", EditorTreeView, [], {
        CONTENT_TEMPLATE: '<div class="wegas-editor-treeview-team">'
            + '<div class="yui3-g wegas-editor-treeview-table wegas-editor-treeview-tablehd" style="padding-right: 100px">'
            + '<div class="yui3-u yui3-u-col1">Name</div>'
            //+ '<div class="yui3-u yui3-u-col2 yui3-g" style="margin-right: -100px;width:100px">'
            //+ '<div class="yui3-u">Players</div></div>'
            + '</div>' + '<div class="treeview"></div>' + '</div>',
        renderUI: function() {
            this.treeView = new Y.TreeView({
                emptyMsg: this.get("emptyMessage")
            }) // Render the treeview
                .addTarget(this)
                .render(this.get(CONTENTBOX).one(".treeview"));

            this.plug(Plugin.RememberExpandedTreeView);
            this.plug(Plugin.WidgetToolbar);

            //this.plug(Plugin.EditorTVToggleClick);
            //if (this.isFreeForAll()) {                                        // @hack Change the display if the gamemodel is freeforall
            //    this.get("parent").set("label", "Players");
            //}
        },
        getNodes: function() {
            var entity = this.get("entity"),
                acc = [],
                nodes = this.genTreeViewElements(entity.get("teams"));

            if (entity.get("properties.freeForAll")) { // Do not display teams in free for all game
                Y.Array.each(nodes, function(i) {
                    acc = acc.concat(i.children);
                });
                return acc;
            } else
                return nodes;
        },
        genTreeViewElement: function(entity) {
            var elClass = entity.get(CLASS),
                collapsed = !this.isNodeExpanded(entity);
            //selected = (this.currentSelection === entity.get(ID)) ? 2 : 0;

            switch (elClass) {
                case "Team":
                    var children = this.genTreeViewElements(entity.get("players")),
                        expanded = Y.Array.find(children, function(p) {
                            return p.selected;
                        }) || !collapsed;

                    expanded = !collapsed;

                    return {
                        type: "TreeNode",
                        collapsed: !expanded,
                        selected: entity.get("id") === Wegas.Facade.Game.get("currentTeamId") ? 1 : 0,
                        //selected: selected,
                        label: entity.get(NAME),
                        children: children,
                        data: {
                            entity: entity
                        },
                        iconCSS: "wegas-icon-team",
                        cssClass: children.length ? "" : "noPlayer"
                    };

                case "Player":
                    return {
                        label: entity.get(NAME),
                        selected: entity.get("id") === Wegas.Facade.Game.get("currentPlayerId") ? 2 : 0,
                        // selected: selected,
                        data: {
                            entity: entity
                        },
                        iconCSS: "wegas-icon-player"
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
    Wegas.TeamTreeView = TeamTreeView;

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
            this.afterHostEvent("*:click", this.onTreeViewSelection);
        },
        onTreeViewSelection: function(e) {
            var menuItems = this.getMenuItems(e.target.get("data")),
                host = this.get(HOST);

            if (menuItems) {
                host.toolbar.destroyAll();
                host.toolbar.add(menuItems); // Populate the menu with the elements associated to the
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVToolbarMenu");
            }
        },
        getMenuItems: function(data) {
            var menuItems = this.get("children"),
                entity, allowedChildren, addChildrenMenu,
                host = this.get(HOST);

            if (data) {
                entity = data.entity || data.widget;
                data.dataSource = host.get(DATASOURCE);

                if (menuItems) {
                    Wegas.Editable.mixMenuCfg(menuItems, data);
                } else {
                    menuItems = entity.getMenuCfg(data); // If no menu is provided, use a clone of the entity default value
                    allowedChildren = entity.get("allowedTypes");

                    if (allowedChildren && allowedChildren.length > 0) {
                        addChildrenMenu = Y.Array.find(menuItems, function(i) {
                            return i.label === "Add";
                        }, this);
                        if (addChildrenMenu) {
                            Y.Array.each(addChildrenMenu.plugins[0].cfg.children, function(i) {
                                if (!Y.Array.find(allowedChildren, function(j) {
                                    return i.targetClass === j;
                                })) {
                                    i.cssClass = EXCLUDED_CLASS;
                                }
                            }, this);
                        }
                    }
                }

                Y.Array.each(menuItems, function(i) { // @hack add icons to some buttons
                    switch (i.label) {
                        case "Delete":
                        case "New":
                        case "Add":
                        case "Copy":
                        case "Duplicate":
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
            children: {}
        }
    });

    /**
     *
     */
    Plugin.EditorTVDefaultMenuClick = Y.Base.create("admin-menu", Plugin.EditorTVToolbarMenu, [], {
        onTreeViewSelection: function(e) {
            var menuItems = this.getMenuItems(e.target.get("data"));
            var entity = Plugin.EditEntityAction ? Plugin.EditEntityAction.currentEntity : undefined;

            function cancelNewSelection(e) {
                e.stopImmediatePropagation();
                if (entity) {
                    setTimeout(function() {
                        Y.fire("edit-entity:edit", {entity: entity});
                    }, 0);
                }
            }

            //if (Plugin.EditEntityAction) {
            //Plugin.EditEntityAction.allowDiscardingEdits( Y.bind(function() {
            if (menuItems && menuItems.length) {
                var button = Wegas.Widget.create(menuItems[0]);
                button.fire("click");
                button.destroy();
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVToolbarMenu");
            }
            //}, this),
            //Y.bind(function() {
            //cancelNewSelection(e);
            //}, this));
            //} else {
            //cancelNewSelection(e);
            //}
        }
    }, {
        NS: "defaultmenuclick"
    });


    /**
     * @class Open a menu on right click, containing the admin edition field
     * @constructor
     */
    Plugin.EditorTVShortcut = Y.Base.create("admin-menu", Plugin.Base, [], {
        initializer: function() {
            this.handlers = [
                this.onHostEvent("treenode:extraClick", this.onAddChildrenShortcutClick, this)
                    //this.get("host").get("contentBox").delegate("click", this.onAddChildrenShortcutClick, ".add-child-shortcut", this)
            ];
            this.menu = new Wegas.Menu();
        },
        onAddChildrenShortcutClick: function(e) {
            var widget = Y.Widget.getByNode(e.node),
                button,
                cfg,
                entity = widget.get("data").entity,
                addShortcut = entity.get("addShortcut"),
                valids;
            if (addShortcut) {
                if (addShortcut.match(/Descriptor$/)) {
                    cfg = [{
                            type: "AddEntityChildButton",
                            targetClass: addShortcut,
                            dataSource: Y.Wegas.Facade.VariableDescriptor,
                            entity: entity
                        }];
                } else if (addShortcut === "Result") {
                    cfg = [{
                            type: "Button",
                            plugins: [{
                                    fn: "EditEntityArrayFieldAction",
                                    cfg: {
                                        targetClass: "Result",
                                        method: "POST",
                                        attributeKey: "results",
                                        showEditionAfterRequest: true,
                                        dataSource: Y.Wegas.Facade.VariableDescriptor,
                                        entity: entity
                                    }
                                }]
                        }];
                }
            } else {
                cfg = this.getAddMenuItems(widget.get("data"));
            }

            valids = cfg && Y.Array.filter(cfg, function(i) {
                return !i.cssClass || i.cssClass.indexOf(EXCLUDED_CLASS) < 0;
            });
            if (!valids) {

                cfg = [{
                        "type": "Text",
                        "content": "<i>disabled</i>"
                    }];

                this.menu.destroyAll();
                this.menu.add(cfg);
                this.menu.show();
                this.menu.set("xy", [e.domEvent.pageX, e.domEvent.pageY]);
            } else if (valids.length === 1) {
                button = Wegas.Widget.create(valids[0]);
                button.fire("click");
                button.destroy();
            } else if (valids.length > 1) {
                this.menu.destroyAll();
                this.menu.add(cfg);
                this.menu.show();
                this.menu.set("xy", [e.domEvent.pageX, e.domEvent.pageY]);
            }
        },
        getAddMenuItems: function(data) {
            var item = Y.Array.find(Plugin.EditorTVToolbarMenu.prototype.getMenuItems.call(this, data), function(item) {
                return item.label && (item.label.indexOf("wegas-icon-new") + item.label.indexOf("wegas-icon-add") > -2); // one of those exist
            });

            if (item && item.plugins) {
                return item.plugins[0].cfg.children;
            }
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(i) {
                i.detach();
            });
            this.menu.destroy();
        }
    }, {
        NS: "addShortcut",
        ATTRS: {
            children: {}
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
                menuItems = this.getMenuItems(targetWidget.get("data"), targetWidget); // Fetch menu items

            //menuItems.splice(0, 1);                                           // Remove "Edit" button

            Y.Array.each(menuItems, function(i, itemIndex) { // @HACK Fix the submenu positioning
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
                this.menu.add(menuItems); // Populate the menu with the elements associated to the
                this.menu.show(); // Move the right click position
                this.menu.set("xy", [e.domEvent.pageX, e.domEvent.pageY]);
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVToolbarMenu");
            }
        },
        getMenuItems: function(data) {
            return Plugin.EditorTVToolbarMenu.prototype.getMenuItems.call(this, data);
        },
        destructor: function() {
            this.menu.destroy();
        }
    }, {
        NS: "contextmenu",
        ATTRS: {
            children: {}
        }
    });

    /**
     *
     */
    Plugin.EditorTVToggleClick = Y.Base.create("EditorTVToggleClick", Plugin.Base, [], {
        initializer: function() {
            this.onHostEvent("treenode:click", function(e) {
                e.target.toggleTree();
            });
        }
    }, {
        NS: "EditorTVToggleClick"
    });
});
