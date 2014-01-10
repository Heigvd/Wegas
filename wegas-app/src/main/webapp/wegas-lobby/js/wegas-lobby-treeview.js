/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @deprecated Not in use anymore
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-lobby-treeview', function(Y) {
    "use strict";
    var NAME = "name", CLASS = "@class", Wegas = Y.Wegas,
            GameModelTreeView;

    /**
     *
     *  A treeview used in lobby left panel.
     *
     */
    GameModelTreeView = Y.Base.create("wegas-editor-treeview", Wegas.EditorTreeView, [], {
        CONTENT_TEMPLATE: '<div>'
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
                //registeredGamesUri = "rest/RegisteredGames/" + Wegas.app.get("currentUser");

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
    var CreatedGameTreeView = Y.Base.create("wegas-editor-treeview", Wegas.EditorTreeView, [], {
        CONTENT_TEMPLATE: '<div>'
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
        }
    });
    Y.namespace("Wegas").CreatedGameTreeView = CreatedGameTreeView;


    /**
     *
     */
    var JoinedGameTreeView = Y.Base.create("wegas-editor-treeview", CreatedGameTreeView, [], {
        CONTENT_TEMPLATE: '<div>'
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
                            ret.push({
                                //label: el.get(NAME),
                                label: '<div class="yui3-g wegas-editor-treeview-table">'
                                        + '<div class="yui3-u yui3-u-col1">' + el.get(NAME) + '</div>'
                                        + '<div class="yui3-u yui3-u-col2 yui3-g">'
                                        + '<div class="yui3-u-1-3">'
                                        + Wegas.Helper.smartDate(el.get("createdTime"))
                                        + '</div>'
                                        + '<div class="yui3-u-1-3">' + (el.get("createdByName") || "undefined") + '</div>'
                                        + '<div class="yui3-u-1-3">' + el.get("gameModelName") + '</div></div>'
                                        + '</div>',
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
                            ret.push({
                                //label: el.get(NAME),
                                label: '<div class="yui3-g wegas-editor-treeview-table">'
                                        + '<div class="yui3-u yui3-u-col1">' + el.get(NAME) + '</div>'
                                        + '<div class="yui3-u yui3-u-col2 yui3-g">'
                                        + '<div class="yui3-u-1-3">'
                                        + Wegas.Helper.smartDate(el.get("createdTime"))
                                        + '</div>'
                                        + '<div class="yui3-u-1-3">' + (el.get("createdByName") || "undefined") + '</div>'
                                        + '<div class="yui3-u-1-3">' + el.get("gameModelName") + '</div></div>'
                                        + '</div>',
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
    Y.namespace('Wegas').PublicGameTreeView = PublicGameTreeView;
});
