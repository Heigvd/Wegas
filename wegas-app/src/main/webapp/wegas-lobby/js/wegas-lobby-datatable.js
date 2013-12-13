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
YUI.add('wegas-lobby-datatable', function(Y) {
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
            RENDER = "render", HOST = "host", Wegas = Y.Wegas,
            GameDataTable;

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
                //data: data,
                width: "100%"
            });
            this.dataTable = new Y.DataTable(cfg);                              // Render datatable
            this.dataTable.render(this.get(CONTENTBOX));
            this.dataTable.set('strings.emptyMessage', "<em><center><br /><br />" + this.get("emptyMessage") + "<br /><br /><br /></center></em>");
            this.plug(Y.Plugin.EditorDTMenu);

            this.get(CONTENTBOX).addClass("yui3-skin-wegas");
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
            Y.log("sync()", "info", "Wegas.LobbyDataTable");

            if (!this.get(DATASOURCE)) {
                this.get(CONTENTBOX).append("Unable to find datasource");
                return;
            }

            var ds = this.get(DATASOURCE),
                    data = this.genData(ds.cache.findAll());

            this.dataTable.set("data", data);
            this.hideOverlay();
        },
        destructor: function() {
            this.dataTable.destroy();
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
                            entity: entity,
                            iconCSS: 'wegas-icon-' + entity.get("@class").toLowerCase()
                        });
                        ret.push(data);
                    }
                }
            }
            return ret;
        },
        genEntityData: function(entity) {
            switch (entity.get("@class")) {

                case 'DebugGame':
                    break;

                case 'Game':
                    var createdBy = entity.get("createdBy"),
                            gameModel = Wegas.Facade.GameModel.cache.findById(entity.get("gameModelId"))

                    if (!gameModel) {
                        Y.log("Unable to find game model for game: " + entity.get(NAME) + "(" + entity.get("gameModelId") + ")", "error");
                    }
                    return {
                        name: entity.get(NAME),
                        createdTime: entity.get("createdTime"),
                        token: gameModel && gameModel.get("properties.freeForAll") ? entity.get("token") : "",
                        gameModelName: gameModel ? gameModel.get(NAME) : "",
                        createdBy: createdBy ? createdBy.get(NAME) : "undefined",
                        teamsCount: gameModel && gameModel.get("properties.freeForAll") ? -1 : entity.get("teams").length,
                        playersCount: entity.get("playersCount")
                    };
                    break;

                case 'Team':
                    return {
                        name: entity.get(NAME),
                        token: entity.get("token")
                    };

                case 'Player':
                    return {
                        name: entity.get(NAME)
                    };

                case 'GameModel':
                    if (entity.get("canEdit")) {
                        return {
                            name: entity.get(NAME)
                        };
                    }
                    break;

                case 'User':
                    return {
                        label: entity.get(NAME),
                        entity: entity.getMainAccount()
                    };

                case 'Role':
                    return {
                        label: entity.get(NAME)
                    };

                default:
                    Y.log("Unable to generate data for entity " + entity.get("@class") + '(' + entity.get(NAME) + ")");
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
            }, emptyMessage: {
                value: "You have not joined any game yet"
            },
            dataTableCfg: {
                value: {
                    columns: [{
                            key: "iconCSS",
                            formatter: "icon",
                            label: " ",
                            sortable: false,
                            width: "22px"
                        }, {
                            key: "name",
                            label: "Name"
                        }, {
                            key: "createdBy",
                            label: "Created by",
                            width: "150px"
                        }, {
                            key: "createdTime",
                            label: "Created",
                            width: "140px",
                            formatter: "date"
                        }, {
                            key: "playersCount",
                            label: "Players",
                            width: "80px",
                            formatter: "count"
                        }, {
                            key: "gameModelName",
                            label: "Game model",
                            width: "150px"
                        }
//                        {
//                            key: "teamsCount",
//                            label: "Teams",
//                            width: "80px",
//                            formatter: "count"
//                        }, {
//                            key: "menu",
//                            label: " ",
//                            sortable: false,
//                            formatter: "menu",
//                            allowHTML: true,
//                            emptyCellValue: "<em>(not set)</em>"
//  formatter: function(o){
//                    // just retrieve the selected Master record and return the
//                    // "aname" column
//                    var parent_rec = dt_master.getRecord(
//                        dt_master.get('selectedRow') );
//
//                    return parent_rec.get('aname');
//                }
//                        }
                    ]
                }
            }
        }
    });
    Y.namespace('Wegas').GameDataTable = GameDataTable;
    /**
     * @class Open a menu on click, containing the admin edition field
     * @constructor
     */
    Y.Plugin.EditorDTMenu = Y.Base.create("admin-menu", Y.Plugin.Base, [], {
        initializer: function() {

            this.buttons = [];

            this.afterHostEvent(RENDER, function() {
                var host = this.get(HOST);
                host.dataTable.addAttr("selectedRow", {value: null});

                host.dataTable.delegate('click', function(e) {
                    this.set('selectedRow', e.currentTarget);
                }, '.yui3-datatable-data tr[data-yui3-record]', host.dataTable);

                host.dataTable.after('selectedRowChange', this.onClick, this);
            });
        },
        onClick: function(e) {
            var host = this.get(HOST),
                    tr = e.newVal, // the Node for the TR clicked ...
                    last_tr = e.prevVal, //  "   "   "   the last TR clicked ...
                    rec = host.dataTable.getRecord(tr), // the current Record for the clicked TR
                    menuItems = this.get("children"),
                    entity = rec.get("entity"),
                    data = {
                entity: entity,
                dataSource: host.get(DATASOURCE)
            };

            Y.Plugin.EditorDTMenu.currentGameModel = entity;                  // @hack so game model creation will work

            if (last_tr) {
                last_tr.removeClass("wegas-datatable-selected");
            }
            tr.addClass("wegas-datatable-selected");
            if (entity) {
                if (menuItems) {                                                // If there are menu items in the cfg
                    Wegas.Editable.mixMenuCfg(menuItems, data);                 // use them
                } else {                                                        // Otherwise
                    menuItems = entity.getMenuCfg(data);                        // use entity default menu
                }

                Y.Array.each(menuItems, function(i) {                           // @hack add icons to some buttons
                    switch (i.label) {
                        case "Delete":
                        case "Duplicate":
                        case "Open in editor":
                        case "Open":
                            i.label = '<span class="wegas-icon wegas-icon-' + i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                    }
                });
                if (menuItems.length === 0) {
                    return;
                }
                Y.Array.each(this.buttons, function(b) {                        // Remove existing buttons,
                    b.destroy();
                });
                //this.buttons = Y.Array.map(menuItems, function(i) {           // Add new buttons to the toolbar
                //    return host.toolbar.add(i);
                //});
                if (this.get("autoClick")) {                                    // If we are in autoclick,

                    //Y.once("rightTabShown", function() {
                    //    var target = Y.Widget.getByNode("#rightTabView").item(0).witem(0);

                    var target = host;
                    if (target && target.toolbar) {
                        this.buttons = Y.Array.map(menuItems, function(i) { // Add new buttons to the right tab's toolbar
                            return target.toolbar.add(i);
                        });
                        this.buttons[0].set("visible", false)
                        this.buttons[1].get(CONTENTBOX).setStyle("marginLeft", "15px");
                    }
                    //.fire("click");                                       // launch first button actionF
                    //}, this);

                    var button = Wegas.Widget.create(menuItems[0]);
                    button.render().fire("click");
                    button.destroy();
                }
            } else {
                Y.log("Menu item has no target entity", "info", "Y.Plugin.EditorTVAdminMenu");
                host.currentSelection = null;
            }
        }
    }, {
        NS: "EditorDTMenu",
        NAME: "EditorDTMenu",
        ATTRS: {
            children: {},
            autoClick: {
                value: true
            }
        }
    });

    Y.DataTable.BodyView.Formatters.icon = function(col) {
        col.className = 'wegas-lobby-datatable-icon';
        col.sortable = false;
        return function(o) {
            return '<span class="wegas-icon ' + o.value + '"></span>';
        };
    };
    Y.DataTable.BodyView.Formatters.menu = function(col) {
        col.className = 'wegas-datatable-menu';
        col.label = " ";
        col.sortable = false;
        return function(o) {
            return '<span class="wegas-icon-menu"></span>';
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
});
