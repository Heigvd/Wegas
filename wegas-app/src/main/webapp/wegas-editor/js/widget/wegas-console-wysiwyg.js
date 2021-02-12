/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
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

    WysiwygConsole = Y.Base.create("wegas-console-wysiwyg", Y.Widget, [Y.WidgetChild, Wegas.Widget], {
        /**
         * @lends Y.Wegas.WysiwygConsole#
         */
        BOUNDING_TEMPLATE: '<div></div>',
        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         */
        initializer: function() {
            this.handlers = [];
        },
        destructor: function() {
            this.srcField.destroy();
        },
        /**
         * @function
         * @private
         * @description create and render the Y.Wegas.RFomr.Script.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            var reactContainer = cb.appendChild('<div></div>');
            cb.appendChild("<div class='qrcode-thumbnail wegas-advanced-feature'></div>");
            this.plug(Plugin.WidgetToolbar);
            Y.Wegas.RForm.Script
                .MultiVariableMethod(
                    {
                        onChange: Y.bind(function(value) {
                            try {
                                this.updateQrCode(value);
                            } catch (e) {
                                if (this.qrCode) {
                                    this.qrCode.clear();
                                    this.get("contentBox").one('.qrcode-thumbnail').setHTML();
                                    this.qrCode = null;
                                }
                                this.get(CONTENTBOX).one(".results").prepend('<div class="result error">Error generating qrcode: ' +
                                    e + "</div>");
                            }
                        }, this),
                        value: {'@class': 'Script', content: ';'}},
                    reactContainer.getDOMNode()
                    )
                .then(Y.bind(function(ret) {
                    this.srcField = ret;
                }, this));
            cb.append('<div class="results"></div>');


            this.renderRunButton();


            this.renderClearButton();
        },
        executeScript: function(scriptEntity, player) {
            this.showOverlay();
            Y.Wegas.Facade.Variable.script.run(scriptEntity, {
                on: {
                    success: Y.bind(function(e) {
                        this.hideOverlay();
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result">Script executed. Returned value: ' +
                            Y.JSON.stringify(e.response.entities[0]) +
                            "</div>");
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result error">Error executing script: ' +
                            e.response.results.message + "</div>");
                    }, this)
                }
            }, player);
        },
        multiExecuteScript: function(multiPlayerScript) {
            this.showOverlay();
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/Script/Multirun",
                cfg: {
                    method: "POST",
                    data: multiPlayerScript
                },
                on: {
                    success: Y.bind(function(e) {
                        this.hideOverlay();
                        this.showMessage("success", "The impact has been successfully completed", 4000);
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result">Script executed. Returned value: ' +
                            Y.JSON.stringify(e.response.entities[0]) +
                            "</div>");
                        if (!this.get("boundingBox").hasClass("wegas-editor-console")) {
                            this.srcField.setValue();
                            this.srcField.addButton.getNode().simulate("click");
                        }
                    }, this),
                    failure: Y.bind(function(e) {
                        this.hideOverlay();
                        var res = e.response && e.response.results;
                        if (res && res.exception === "com.wegas.core.exception.ScriptException") {
                            this.showMessage("error", res.message, 4000);
                        } else {
                            this.showMessage("error", "An error has occurred, please retry again", 4000);
                        }
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result error">Error executing script: ' +
                            res.message + "</div>");
                    }, this)
                }
            });
        },
        /**
         * @function
         * @private
         * @description Create and render the button for run the script.
         */
        renderRunButton: function() {
            this.toolbar.add(new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>Run",
                on: {
                    click: Y.bind(function() {
                        if (!this.srcField.validate()) {
                            this.showMessage("error", "Some fields are invalid", 1000);
                            return;
                        }
                        var playerList = this.getPlayerList(),
                            multiPlayerScript = {
                                playerIdList: playerList,
                                script: {
                                    "@class": "Script",
                                    language: "JavaScript",
                                    content: this.srcField.getValue().content
                                }
                            };
                        if (playerList.length === 0) {
                            return;
                        }

                        this.multiExecuteScript(multiPlayerScript);

                        // Single user version
                        //this.executeScript({
                        //    "@class": "Script",
                        //    language: "JavaScript",
                        //    content: this.srcField.getValue()
                        //});

                    }, this)
                }
            }));
        },
        updateQrCode: function(newValue) {
            var script = newValue || this.srcField.getValue();
            if (newValue && newValue.content) {
                if (!this.qrCode) {
                    this.qrCode = Y.Wegas.QrCodeScanner.generateRunScript(this.get("contentBox").one('.qrcode-thumbnail').getDOMNode(), script);
                } else {
                    Y.Wegas.QrCodeScanner.updateRunScript(this.qrCode, script);
                }
            } else {
                if (this.qrCode) {
                    this.qrCode.clear();
                    this.get("contentBox").one('.qrcode-thumbnail').setHTML();
                    this.qrCode = null;
                }
            }
        },
        renderClearButton: function() {
            this.toolbar.add(new Y.Wegas.Button({
                label: "<span class=\"fa fa-eraser\"></span> Clear logs",
                cssClass: "wegas-advanced-feature",
                on: {
                    click: Y.bind(function() {
                        this.get("contentBox").one(".results").setHTML("");
                    }, this)
                }
            }));
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
                this.showMessage("info",
                    (freeForAll) ?
                    "No player is selected. This impact has not been run" :
                    "No team is selected. This impact has not been run");
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
                    e.currentTarget.get("selection") &&
                    e.currentTarget.get("selection").size() >= this.getTeams().length);// Update selectAll
                // visibility when all teams
                // are selected

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
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    });
    Wegas.WysiwygConsole = WysiwygConsole;

});
