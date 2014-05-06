/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-console-wysiwyg', function(Y) {
    'use strict';

    /**
     *  @class wysiwyg console for impacts 
     *  @name Y.Wegas.WysiwygConsole
     *  @extends Y.Wegas.Console
     *  @constructor
     */
    var CONTENTBOX = 'contentBox',
            WysiwygConsole, Wegas = Y.Wegas, Plugin = Y.Plugin;

    WysiwygConsole = Y.Base.create("wegas-console-wysiwyg", Wegas.Console, [Y.WidgetChild, Wegas.Widget], {
        /**
         * @lends Y.Wegas.WysiwygConsole#
         */
        BOUNDING_TEMPLATE: '<div class="wegas-form"></div>',
        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         */
        initializer: function() {
            this.handlers = [];
        },
        /**
         * @function
         * @private
         * @description create and render the Y.inputEx.WysiwygScript.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);

            this.plug(Plugin.WidgetToolbar);

            this.srcField = new Y.inputEx.WysiwygScript({
                parentEl: cb
            });
            cb.append('<div class="results"></div>');

            this.renderRunButton();

            this.srcField.viewSrc.get("boundingBox").removeClass("inputEx-WysiwigScript-viewsrc")
                    .append("Source");
            this.toolbar.add(this.srcField.viewSrc);
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When parent tab change plug or unplug multiple selection plugin.
         */
        bindUI: function() {
            if (!Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team")) {
                return;
            }

            this.handlers.push(this.get("parent").on("selectedChange", function(e) {
                var treeView = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team").treeView,
                        cGameModel = Wegas.Facade.GameModel.cache.getCurrentGameModel(), i,
                        playerId, selected = 0;

                if (e.newVal !== 1) {
                    treeView.unplug(Plugin.CheckBoxTV);
                    this.removeCheckbox();
                    for (i = 0; i < treeView.size(); i += 1) {
                        if (treeView.item(i).get("selected")) {
                            selected = i;
                            break;
                        }
                    }
                    treeView.deselectAll();
                    // Check if a player or team is selected
                    if (!treeView.size()) {
                        return;
                    }

                    // Select only first team or player
                    if (cGameModel.get("properties.freeForAll")) {
                        playerId = treeView.item(selected).get("data").entity.get("id");
                        treeView.item(selected).set("selected", 2);
                    } else {
                        while (!playerId) {
                            if (treeView.item(selected).get("data").entity.get("players").length !== 0) {
                                playerId = treeView.item(selected).get("data").entity.get("players")[0].get("id");
                            } else {
                                selected += 1;
                            }
                        }
                        treeView.item(selected).selectAll();
                    }
                    Wegas.Facade.Game.cache.set('currentPlayerId', playerId);
                    playerId = null;
                } else {
                    treeView.plug(Plugin.CheckBoxTV);
                    this.addCheckbox();
                }
            }, this));
        },
        /**
         * @function
         * @private
         * @description Gives the list of teams or player selected in the
         * treeview. If no treeview, only the current player is added in the list.
         */
        getPlayerList: function() {
            var players, selection,
                    freeForAll = Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll"),
                    treeview = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team .yui3-treeview-content"),
                    playerList = [];

            if (!treeview) {
                return [Wegas.Facade.Game.get('currentPlayerId')];
            }

            selection = treeview.get("selection") || new Y.ArrayList();

            if (!selection.size()) {
                this.showMessageBis("info", (freeForAll)
                        ? "No player is selected. This impact has not been run"
                        : "No team is selected. This impact has not been run");
            }

            selection.each(function(item) {
                if (freeForAll) {
                    playerList.push(item.get("data.entity").get("id"));
                } else {
                    players = item.get("data.entity").get("players");
                    if (players.length > 0) {
                        playerList.push(players[0].get("id"));
                    }
                }
            });
            return playerList;
        },
        /**
         * @function
         * @private
         * @description checks if all teams has a player otherwise add a "noPlayer" class.
         */
        getTeams: function() {
            var i, treeView = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team").treeView,
                    teams = [];
            for (i = 0; i < treeView.size(); i += 1) {
                if (!this.isEmptyTeam(treeView.item(i))) {
                    teams.push(i);
                }
            }
            return teams;
        },
        isEmptyTeam: function(treeNode) {
            var team = treeNode.get("data").entity;
            return team.get("players") && team.get("players").length === 0;
        },
        /**
         * @function
         * @private
         * @description adds the necessary elements for display the checkbox 
         * and a button for select or deselct all teams/player with the corresponding events.
         */
        addCheckbox: function() {
            var i, editorTreeview = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team");

            this.selectAll = new Y.Node.create("<span class='emptyCheckbox selectAll'>Select all</span>");
            editorTreeview.toolbar.get("header").append(this.selectAll);

            this.selectAll.on("click", function(e, treeView) {                   // When "Select all" button is clicked
                if (this.selectAll.hasClass("yui3-treenode-selected")) {        // select treeview nodes
                    treeView.deselectAll();
                } else {
                    treeView.selectAll();
                    for (i = 0; i < treeView.size(); i += 1) {
                        if (this.isEmptyTeam(treeView.item(i))) {
                            treeView.item(i).set("selected", 0);
                        }
                    }
                }
                this.selectAll.toggleClass("yui3-treenode-selected");           // and toggle class
            }, this, editorTreeview.treeView);

            this.nodeClick = editorTreeview.treeView.on("nodeClick", function(e) {
                this.selectAll.toggleClass("yui3-treenode-selected",
                        e.currentTarget.get("selection")
                        && e.currentTarget.get("selection").size() >= this.getTeams().length);// Update selectAll visibility when all teams are selected

                if (this.isEmptyTeam(e.node)) {                                 // Not allowed to select empty teams
                    e.node.deselectAll();
                }
            }, this);
        },
        /**
         * @function
         * @private
         * @description removes all elements corresponding to checkboxes.
         */
        removeCheckbox: function() {
            this.selectAll.remove();
            this.nodeClick.detach();
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    });
    Y.namespace('Wegas').WysiwygConsole = WysiwygConsole;

});
