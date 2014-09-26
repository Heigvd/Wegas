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
YUI.add("wegas-lobby-datatable", function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.JoinTeam
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class class for join a team
     * @constructor
     * @description Allows just to join a team
     */
    var CONTENTBOX = "contentBox", DATASOURCE = "dataSource", NAME = "name",
        RENDER = "render", HOST = "host", ENTITY = "entity", ID = "id",
        Wegas = Y.Wegas, Plugin = Y.Plugin, GameDataTable, sortByDateDesc;

    sortByDateDesc = function(e) {
        var sortBy = Y.Array(e.sortBy),
            column = sortBy.pop();

        if (column['createdTime']) {
            column['createdTime'] = -1;
        }

        sortBy.push(column);
        e.sortBy = sortBy;
        this.detach('sort',sortByDateDesc);
    };

    GameDataTable = Y.Base.create("wegas-lobby-datatable", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        // *** Private fields *** //
        /**
         * @function
         * @private
         * @description All button and fields are created.
         * For creating the field inputEx libary is used
         */
        renderUI: function() {
            var cfg = this.get("dataTableCfg");

            cfg.columns = Y.Array.map(cfg.columns, function(c) {                // Add some default properties to columns
                return Y.mix(c, {
                    allowHTML: true,
                    sortable: true
                });
            });
            cfg = Y.mix(cfg, {//                                                // Add cfg default values
                width: "100%"
            });
            this.table = new Y.DataTable(cfg)                                   // Render datatable
                .addAttr("selectedRow", {value: null})
                .render(this.get(CONTENTBOX))
                .set("strings.emptyMessage", "<em><center><br /><br />" + this.get("emptyMessage") + "</center></em>");

            this.table.on('sort', sortByDateDesc);

            this.get(CONTENTBOX).addClass("yui3-skin-wegas");

            this.plug(Plugin.ViewsDT);                                          // Add views support (grid, list, datatable)
            this.plug(Plugin.SearchDT);                                         // Add search support
        },
        /**
         * @function
         * @private
         */
        bindUI: function() {
            var ds = this.get(DATASOURCE);

            if (ds) {
                this.updateHandler = ds.after("update", this.syncUI, this);     // Listen updates on the target datasource
                this.failureHandler = ds.after("failure", this.defaultFailureHandler, this);// GLOBAL error message
            }

            this.table.delegate("click", function(e) {
                if (e.target.ancestor(".yui3-datatable-col-menu"))
                    return;                                                     // @hack Prevent event on menu click
                if (!this.getRecord(e.target).get(ENTITY))
                    Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVAdminMenu");
                this.set("selectedRow", e.currentTarget);
            }, ".yui3-datatable-data tr[data-yui3-record]", this.table);

            this.table.on("selectedRowChange", function(e) {
                this.get(CONTENTBOX).all(".wegas-datatable-selected").removeClass("wegas-datatable-selected");
                e.newVal.addClass("wegas-datatable-selected");
                this.currentSelection = this.getRecord(e.newVal).get(ENTITY).get(ID);
            });

            this.addedHandler = ds.after("added", function(e) {                 // When an entity is created
                if (this.requestdt)
                    return;

                var newEntityId = e.entity.get(ID);                           // view it in the table
                this.table.currentSelection = null;
                Y.later(20, this, function() {
                    this.table.get("data").each(function(r) {
                        if (newEntityId === r.get(ENTITY).get(ID)) {
                            var row = this.table.getRow(r);

                            this.table.get("selectedRow") !== row
                                && this.get("parent")
                                && !this.get("parent").get("selected")
                                && this.get("parent").set("selected", 2);       // @hack Ensure the parent tab is currently not visible befor displaying

                            row.scrollIntoView();
                            this.table.set("selectedRow", row);
                        }
                    }, this);
                });
            }, this);

            Y.Do.after(function() {
                this.table.get("data").each(function(r) {
                    if (this.currentSelection === r.get(ENTITY).get(ID)) {
                        this.getRow(r).addClass("wegas-datatable-selected");
                    }
                }, this.table);
            }, this, "syncUI", this);
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            Y.log("sync()", "info", "Wegas.LobbyDataTable");

            if (!this.get(DATASOURCE)) {
                this.get(CONTENTBOX).append("Unable to find datasource");
                return;
            }

            var data = this.genData(this.get(DATASOURCE).cache.findAll());

            this.table.set("data", data);
            this.hideOverlay();
        },
        destructor: function() {
            this.table.destroy();
            this.addedHandler.detach();
            this.updateHandler.detach();
            this.failureHandler.detach();
        },
        // *** Private Methods *** //
        /**
         * @function
         * @private
         */
        genData: function(elements) {
            var ret = [], i, entity, data;

            for (i in elements) {
                if (elements.hasOwnProperty(i)) {
                    entity = elements[i];
                    data = this.genEntityData(entity);
                    if (data) {
                        Y.mix(data, {//                                         // Add some default properties
                            entity: entity
                        });
                        ret.push(data);
                    }
                }
            }
            return ret;
        },
        genEntityData: function(entity) {
            switch (entity.get("@class")) {
                case "DebugGame":
                    break;

                case "Game":
                    return {
                        name: entity.get(NAME),
                        createdTime: entity.get("createdTime"),
                        gameModelName: entity.get("gameModelName") || "",
                        createdBy: entity.get("createdByName") || "undefined",
                        playersCount: entity.get("playersCount"),
                        iconUri: entity.get("properties.iconUri"),
                        imageUri: entity.get("properties.imageUri")
                            //teamsCount: gameModel && gameModel.get("properties.freeForAll") ? -1 : entity.get("teams").length,
                            //token: entity.get("properties.freeForAll") ? entity.get("token") : "", 
                    };
                    break;

                case "Team":
                    return {
                        name: entity.get(NAME),
                        token: entity.get("token")
                    };

                case "Player":
                    return {
                        name: entity.get(NAME)
                    };

                case "GameModel":
                    if (entity.get("canEdit")) {
                        return {
                            name: entity.get(NAME),
                            createdBy: entity.get("createdByName"),
                            createdTime: entity.get("createdTime"),
                            iconUri: entity.get("properties.iconUri"),
                            imageUri: entity.get("properties.imageUri")
                        };
                    }
                    break;

                case "User":
                    return {
                        label: entity.get(NAME),
                        entity: entity.getMainAccount()
                    };

                case "Role":
                    return {
                        label: entity.get(NAME)
                    };

                default:
                    Y.log("Unable to generate data for entity " + entity.get("@class") + "(" + entity.get(NAME) + ")");
                    return null;
            }
        }
    }, {
        ATTRS: {
            dataSource: {
                getter: function(val) {
                    if (Y.Lang.isString(val)) {
                        return Wegas.Facade[val];
                    }
                    return val;
                }
            },
            emptyMessage: {
                value: "You have not joined any game yet"
            },
            dataTableCfg: {
                value: {
                    columns: [{
                            formatter: "icon",
                            label: " ",
                            sortable: false,
                            width: "27px"
                        }, {
                            key: NAME,
                            label: "Name",
                            formatter: "link"
                        }, {
                            key: "gameModelName",
                            label: "Scenario",
                            width: "150px"
                        }, {
                            key: "playersCount",
                            label: "Players",
                            width: "70px",
                            formatter: "count"
                        }, {
                            key: "createdBy",
                            label: "Created by",
                            width: "150px"
                        }, {
                            key: "createdTime",
                            label: "Created",
                            width: "125px",
                            formatter: "date"
                        }]
                }
            }
        }
    });
    Wegas.GameDataTable = GameDataTable;

    /**
     *  Request current user on host widget loaded
     * @constructor
     */
    Plugin.RequestDT = Y.Base.create("RequestDT", Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent(RENDER, function() {
                var host = this.get(HOST);
                host.showOverlay();
                host.get(DATASOURCE).cache.clear();
                host.get(DATASOURCE).sendRequest({
                    request: "/" + Wegas.Facade.User.get("currentUserId")
                });
            });
        }
    }, {
        NS: "requestdt"
    });

    Y.DataTable.BodyView.Formatters.icon = function(col) {
        col.className = "wegas-lobby-datatable-icon";
        function makeUri(uri, o) {
            return Plugin.Injector.getImageUri(uri, o.data.entity.get("gameModelId") || o.data.entity.get(ID));
        }
        return function(o) {
            return '<img class="wegas-lobby-icon" src="' + (makeUri(o.data.iconUri || o.data.imageUri, o) || "wegas-lobby/images/wegas-game-icon.png") + '" />'
                + '<img class="wegas-lobby-thumb" src="' + (makeUri(o.data.imageUri, o) || "wegas-lobby/images/wegas-game-thumb.png") + '" />';
        };
    };
    Y.DataTable.BodyView.Formatters.link = function() {
        return function(o) {
            return '<a href="#">' + o.value + '</a>';
        };
    };
    Y.DataTable.BodyView.Formatters.date = function() {
        return function(o) {
            return Wegas.Helper.smartDate(o.value);
        };
    };
    Y.DataTable.BodyView.Formatters.count = function(col) {
        col.className = "wegas-datatable-center";
        return function(o) {
            return (o.value === 0) ? o.value : (o.value === -1) ? "" : o.value;
        };
    };

    /**
     * @class Open a menu on click, containing the admin edition field
     * @constructor
     */
    Plugin.EditorDTMenu = Y.Base.create("admin-menu", Plugin.Base, [], {
        initializer: function() {
            this.onceAfterHostEvent(RENDER, function() {
                this.get(HOST).table.after("selectedRowChange", this.onClick, this);
            });
        },
        onClick: function(e) {
            var host = this.get(HOST), button, tmp,
                menuItems = this.get("children"),
                entity = host.table.getRecord(e.newVal).get(ENTITY),
                data = {
                    entity: entity,
                    dataSource: host.get(DATASOURCE)
                };

            Plugin.EditorDTMenu.currentGameModel = entity;                      // @hack so game model creation will work

            if (menuItems) {                                                    // If there are menu items in the cfg
                Wegas.Editable.mixMenuCfg(menuItems, data);                     // use them
            } else {                                                            // Otherwise
                menuItems = entity.getMenuCfg(data);                            // use entity default menu
            }

            button = Wegas.Widget.create(menuItems[0]);
            button.render().fire("click");                                      // launch first button action
            button.destroy();
        }
    }, {
        NS: "menu",
        ATTRS: {
            children: {}
        }
    });

    /**
     * @class Open a menu on click, containing the admin edition field
     * @constructor
     */
    Plugin.EditorDTMouseOverMenu = Y.Base.create("admin-mouseovermenu", Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent(RENDER, function() {
                this.get(HOST).table.addColumn({
                    key: "menu",
                    label: " ",
                    sortable: false,
                    className: "wegas-datatable-menu"
                }).delegate("mouseover", this.onMouseOver, ".yui3-datatable-data tr[data-yui3-record]", this);
            });
        },
        onMouseOver: function(e) {
            if (e.currentTarget.menu) {
                return;
            }
            var host = this.get(HOST), tmp,
                rec = host.table.getRecord(e.currentTarget), // the current Record for the clicked TR
                menuItems = this.get("children") || (host.menu && host.menu.get("children")),
                entity = rec.get(ENTITY),
                data = {
                    entity: entity,
                    dataSource: host.get(DATASOURCE)
                };

            if (entity) {
                if (menuItems) {                                                // If there are menu items in the cfg
                    Wegas.Editable.mixMenuCfg(menuItems, data);                 // use them
                } else {                                                        // Otherwise
                    menuItems = entity.getMenuCfg(data).slice(0);               // use entity default menu
                }
                Y.Array.each(menuItems, function(i) {                           // @hack add icons to some buttons
                    switch (i.label) {
                        case "Delete":
                        case "Leave":
                        case "Copy":
                        case "Open":
                        case "Edit":
                        case "View":
                            i.label = '<span class="wegas-icon wegas-icon-' + i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                    }
                });

                tmp = menuItems[0];                                             // Swap the 2 first element (aka place the open menu first
                menuItems[0] = menuItems[1];
                menuItems[1] = tmp;

                e.currentTarget.menu = new Wegas.List({
                    children: menuItems
                });
                e.currentTarget.menu.on(["*:message", "*:showOverlay", "*:hideOverlay"], host.fire, host);
                e.currentTarget.menu.render(e.currentTarget.one("td.yui3-datatable-col-menu"));
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVAdminMenu");
            }
        }
    }, {
        NS: "EditorDTMouseOverMenu",
        ATTRS: {
            children: {}
        }
    });

    //Plugin.EditorDTLink = Y.Base.create("admin-menu", Plugin.Base, [], {
    //    initializer: function() {
    //        this.afterHostEvent(RENDER, function() {
    //            var host = this.get(HOST);
    //            host.table.delegate('click', function(e) {
    //                var rec = host.table.getRecord(e.currentTarget),
    //                        entity = rec.get(ENTITY),
    //                        url = this.get("url");
    //
    //                if (entity instanceof Wegas.persistence.GameModel) {
    //                    url += "gameModelId=" + entity.get(ID);
    //                } else if (entity instanceof Wegas.persistence.Player) {
    //                    url += "id=" + entity.get(ID);
    //                } else if (entity instanceof Wegas.persistence.Team) {
    //                    url += "teamId=" + entity.get(ID);
    //                } else {
    //                    url += "gameId=" + entity.get(ID);
    //                }
    //                window.open(url);
    //                e.halt(true);
    //            }, '.yui3-datatable-data tr[data-yui3-record] a', this);
    //        });
    //    }
    //}, {
    //    NS: "EditorDTLink",
    //    ATTRS: {
    //        url: {
    //            value: "game-play.html?"
    //        }
    //    }
    //});

    /**
     * @class Open a menu on right click, containing the admin edition field
     * @constructor
     */
    Plugin.ViewsDT = Y.Base.create("viewsdt", Plugin.Base, [], {
        initializer: function() {
            this.onHostEvent(RENDER, this.render);
        },
        render: function() {
            var host = this.get(HOST);

            host.get(CONTENTBOX).addClass("wegas-datatable-list");

            if (host.toolbar) {
                host.toolbar.get("header").append("<div class='wegas-datatable-viewbuttons'>"
                    + "<button class='yui3-button button-grid'><span class='wegas-icon wegas-icon-gridview'></span></button>"
                    + "<button class='yui3-button button-list yui3-button-selected'><span class='wegas-icon wegas-icon-listview'></span></button>"
                    + "<button class='yui3-button button-table'><span class='wegas-icon wegas-icon-tableview'></span></button>"
                    + "</div>");
                this.buttonGroup = new Y.ButtonGroup({
                    srcNode: host.toolbar.get("header").one(".wegas-datatable-viewbuttons"),
                    type: "radio",
                    on: {
                        selectionChange: Y.bind(function(e) {
                            var button = e.target.getSelectedButtons()[0];
                            Y.all(".wegas-datatable-viewbuttons > button").removeClass("yui3-button-selected");
                            Y.all(".wegas-datatable-viewbuttons > ." + button.getAttribute("class").split(" ").join(".")).addClass("yui3-button-selected");
                            Y.fire("viewChange", {button: button});
                        })
                    }
                }).render();
                this.viewHandler = Y.on("viewChange", function(e) {             // Global handler so any button fired will trigger view change
                    host.get(CONTENTBOX).toggleClass("wegas-datatable-grid", e.button.hasClass("button-grid"))
                        .toggleClass("wegas-datatable-list", e.button.hasClass("button-list"))
                        .toggleClass("wegas-datatable-table", e.button.hasClass("button-table"));
                });
            }
        },
        destructor: function() {
            this.buttonGroup && this.buttonGroup.destroy();
            this.viewHandler && this.viewHandler.detach();
        }
    }, {
        NS: "views"
    });

    /**
     * @class Open a menu on right click, containing the admin edition field
     * @constructor
     */
    Plugin.SearchDT = Y.Base.create("searchdatatable", Plugin.Base, [], {
        initializer: function() {
            this.afterHostEvent(RENDER, this.render);
            this.doAfter("syncUI", this.sync);
            this.data = new Y.ModelList();
            this.filterValue = "";
        },
        destructor: function() {
            this.data.destroy();
        },
        render: function() {
            var host = this.get(HOST);

            if (host.toolbar) {
                host.toolbar.get("header").append("<div class='wegas-filter-input wegas-datatable-search'><input placeholder='Search...' /></div>")
                    .one(".wegas-datatable-search input").on("valueChange", function(e) {
                    this.filterValue = e.newVal;
                    host.table.set("strings.emptyMessage", "<em><center><br /><br />There are no records that match your search</center></em>");
                    this.applyFilters();
                }, this);
            }
        },
        sync: function() {
            var host = this.get(HOST);
            this.data.reset();
            this.data.add(host.table.get("data"));
            this.applyFilters();
        },
        applyFilters: function() {
            var filter = Y.Lang.trim(this.filterValue);
            this.get(HOST).table.set("data", this.data.filter(function(item) {  // Update the records in the table's Recordset with the results of
                return filter === ""
                    || new RegExp(filter, "i").test(Y.Object.values(item.toJSON()).join("|"));// filtering the full data set by a substring search in all fields
            }));
        }
    }, {
        NS: "filter"
    });
    /**
     * @class Open a menu on right click, containing the admin edition field
     * @constructor
     */
    Plugin.EditorDTContextMenu = Y.Base.create("admin-menu", Plugin.Base, [], {
        initializer: function() {
            this.onHostEvent("contextmenu", this.onTreeViewClick);

            this.menu = new Wegas.Menu();
            this.menu.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.get(HOST).fire, this.get(HOST));
            this.menu.render();
        },
        onTreeViewClick: function(e) {
            var host = this.get(HOST),
                tr = e.domEvent.target.ancestor("tr"), // the Node for the TR clicked ...
                rec = host.table.getRecord(tr), // the current Record for the clicked TR
                menuItems = this.get("children") || (host.menu && host.menu.get("children")),
                entity = rec.get(ENTITY),
                data = {
                    entity: entity,
                    dataSource: host.get(DATASOURCE)
                };

            if (menuItems) {                                                    // If there are menu items in the cfg
                Wegas.Editable.mixMenuCfg(menuItems, data);                     // use them
            } else {                                                            // Otherwise
                menuItems = entity.getMenuCfg(data);                            // use entity default menu
            }

            menuItems = Y.Array.map(menuItems, function(i) {                    // @HACK Fix the submenu positioning menuItems[itemIndex]
                if (i.plugins) {
                    return Y.mix({
                        plugins: Y.Array.map(i.plugins, function(p) {
                            if (p.fn === "WidgetMenu") {
                                return Y.mix({
                                    cfg: Y.mix({
                                        menuCfg: {
                                            points: ["tl", "tr"]
                                        },
                                        event: "mouseenter"
                                    }, p.cfg)
                                }, p);
                            }
                            return p;
                        })
                    }, i);
                }
                return i;
            });

            if (menuItems) {
                e.domEvent.preventDefault();
                this.menu.destroyAll();
                this.menu.add(menuItems);                                       // Populate the menu with the elements associated to the
                this.menu.show();                                               // Move the right click position
                this.menu.set("xy", [e.domEvent.pageX, e.domEvent.pageY]);
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorDTContextMenu");
            }
        }
    }, {
        NS: "contextmenu",
        ATTRS: {
            children: {}
        }
    });

    /** 
     * Shortcut to create public game treeview
     */
    Wegas.PublicGameDataTable = Y.Base.create("wegas-lobby-datatable", GameDataTable, [], {
        renderUI: function() {
            this.setAttrs({
                dataSource: "PublicGames",
                dataTableCfg: {
                    columns: [{
                            formatter: "icon",
                            label: " ",
                            sortable: false,
                            width: "27px"
                        }, {
                            key: NAME,
                            label: "Name"
                        }, {
                            key: "gameModelName",
                            label: "Scenario",
                            width: "150px"
                        }, {
                            key: "createdBy",
                            label: "Created by",
                            width: "150px"
                        }]
                },
                emptyMessage: "No game available to play"
            });
            Wegas.PublicGameDataTable.superclass.renderUI.call(this);
            this.plug(Plugin.RequestDT);
            this.plug(Plugin.EditorDTMenu, {
                children: [{
                        type: "Button",
                        label: "Join game",
                        plugins: [{
                                fn: "OpenTabAction",
                                cfg: {
                                    label: "Public games",
                                    tabSelector: "#rightTabView",
                                    emptyTab: true,
                                    wchildren: [{
                                            type: "JoinTeam",
                                            customEvent: true,
                                            plugins: [{
                                                    fn: "WidgetToolbar",
                                                    cfg: {
                                                        children: [{
                                                                type: "Button",
                                                                label: "<span class=\"wegas-icon wegas-icon-back\"></span>Back",
                                                                plugins: [{
                                                                        fn: "OpenTabAction",
                                                                        cfg: {
                                                                            label: "Public games",
                                                                            tabSelector: "#rightTabView",
                                                                            emptyTab: true,
                                                                            wchildren: [{
                                                                                    type: "PublicGameDataTable"
                                                                                }]
                                                                        }
                                                                    }]
                                                            }]
                                                    }
                                                }]
                                        }]
                                }
                            }]
                    }]
            });
        }
    });
});
