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
            WysiwygConsole, Plugin = Y.Plugin;

    WysiwygConsole = Y.Base.create("wegas-console-wysiwyg", Y.Wegas.Console, [Y.WidgetChild, Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.WysiwygConsole#
         */
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
            var cb = this.get(CONTENTBOX), innerHTML;

            this.get("boundingBox").addClass("wegas-form");

            this.plug(Plugin.WidgetToolbar);

            this.srcField = new Y.inputEx.WysiwygScript({
                parentEl: cb
            });
            cb.append('<div class="results"></div>');
            this.srcField.el.rows = 8;
            this.srcField.el.cols = 100;

            this.renderRunButton();
            this.srcField.viewSrc.get("contentBox")._node.attributes.style.value = "";
            innerHTML = this.srcField.viewSrc.get("contentBox").get("innerHTML");
            this.srcField.viewSrc.get("contentBox").set("innerHTML", innerHTML + "Source");
            this.toolbar.add(this.srcField.viewSrc);
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When parent tab change plug or unplug multiple selection plugin.
         */
        bindUI: function() {
            var treeView, editorTreeView = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team"),
                    cGameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(), i,
                    playerId, selected = 0;

            if (!editorTreeView) {
                return;
            }

            treeView = editorTreeView.treeView;

            this.handlers.push(this.get("parent").on("selectedChange", function(e) {
                selected = 0;
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
                    Y.Wegas.Facade.Game.cache.set('currentPlayerId', playerId);
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
         * @description Create and render the button for run the script.
         */
        renderRunButton: function() {
            var el = this.toolbar.get('header'), multiPlayerScript, playerList;

            this.runButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>Run",
                on: {
                    click: Y.bind(function() {
                        playerList = this.playerList();
                        if (playerList.length === 0) {
                            return;
                        }
                        multiPlayerScript = {
                            playerIdList: playerList,
                            script: {
                                "@class": "Script",
                                language: "JavaScript",
                                content: this.srcField.getValue().content
                            }
                        };
                        this.multiExecuteScript(multiPlayerScript);
                    }, this)
                }
            }).render(el);
        },
        /**
         * @function
         * @private
         * @description Gives the list of teams or player selected in the
         * treeview. If no treeview, only the current player is added in the list.
         */
        playerList: function() {
            var treeview = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team .yui3-treeview-content"),
                    playerList = [], selection;

            if (!treeview) {
                playerList.push(Y.Wegas.Facade.Game.get('currentPlayerId'));
                return playerList;
            }

            selection = treeview.get("selection") || new Y.ArrayList();

            if (Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll")) {
                if (!selection.size()) {
                    this.showMessageBis("info", "No player is selected.");
                }
                selection.each(function(item) {
                    playerList.push(item.get("data.entity").get("id"));
                });
            } else {
                if (!selection.size()) {
                    this.showMessageBis("info", "No team is selected! This impact has not been applied");
                }
                selection.each(function(item) {
                    var entity = item.get("data.entity");
                    if (entity.get("players").length > 0) {
                        playerList.push(entity.get("players")[0].get("id"));
                    }
                });
            }
            return playerList;
        },
        /**
         * @function
         * @private
         * @description adds the necessary elements for display the checkbox 
         * and a button for select or deselct all teams/player with the corresponding events.
         */
        addCheckbox: function() {
            var editorTreeview = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team"), i;
            this.emptyTeamList();
            this.selectAll = new Y.Node.create("<span class='emptyCheckbox selectAll'>Select all</span>");
            editorTreeview.toolbar.get("header").append(this.selectAll);
            this.selectAll.on("click", function(e, editorTreeview) {
                if (this.selectAll.hasClass("yui3-treenode-selected")) {
                    this.selectAll.removeClass("yui3-treenode-selected");
                    editorTreeview.treeView.deselectAll();
                } else {
                    this.selectAll.addClass("yui3-treenode-selected");
                    editorTreeview.treeView.selectAll();
                    for (i = 0; i < this.emptyTeam.length; i += 1) {
                        editorTreeview.treeView.item(this.emptyTeam[i]).set("selected", 0);
                    }
                }
            }, this, editorTreeview);

            this.nodeClick = editorTreeview.treeView.on("nodeClick", function(e) {
                if (e.currentTarget.get("selection") && e.currentTarget.get("selection").size() >= (e.currentTarget.size() - this.emptyTeam.length)) {
                    this.selectAll.addClass("yui3-treenode-selected");
                } else {
                    this.selectAll.removeClass("yui3-treenode-selected");
                }
                if (e.node.get("data").entity.get("players") && !e.node.get("data").entity.get("players").length) {
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
         * @description checks if all teams has a player otherwise add a "noPlayer" class.
         */
        emptyTeamList: function() {
            var editorTreeview = Y.Widget.getByNode("#leftTabView .wegas-editor-treeview-team"),
                    i;
            this.emptyTeam = [];
            for (i = 0; i < editorTreeview.treeView.size(); i += 1) {
                if (editorTreeview.treeView.item(i).get("data").entity.get("players") && !editorTreeview.treeView.item(i).get("data").entity.get("players").length) {
                    this.emptyTeam.push(i);
                }
            }
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
