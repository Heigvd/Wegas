/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-editor-action', function(Y) {
    "use strict";

    var Linkwidget, Plugin = Y.Plugin, Action = Plugin.Action, Wegas = Y.Wegas,
        CONTENTBOX = "contentBox", OpenTabAction, OpenTabActionSec, OnDeleteListener;

    /**
     *  @name Y.Plugin.ResetAction
     *  @extends Y.Plugin.Action
     *  @class Reset the target game model
     *  @constructor
     */
    var ResetAction = Y.Base.create("ResetAction", Action, [], {
        /** @lends Y.Plugin.ResetAction# */
        /**
         * @function
         * @private
         */
        execute: function() {
            var editGame = Y.one("body.wegas-editmode-game");


            // Ask confirmation when editing the scenario of a real game
            if (!editGame || confirm("This action will reset all players in the game you're editing the scenario for. Do you really want to continue?")) {
                this.showOverlay();
                Wegas.Facade.Variable.sendRequest({
                    request: '/Reset/',
                    on: {
                        success: Y.bind(this.hideOverlay, this),
                        failure: Y.bind(this.hideOverlay, this)
                    }
                });
            }
        }
    }, {
        NS: "reset"
    });
    Plugin.ResetAction = ResetAction;

    /**
     *  @name Y.Plugin.OpenTabAction
     *  @extends Y.Plugin.Action
     *  @class Reset the target game model
     *  @constructor
     */
    OpenTabAction = Y.Base.create(OpenTabAction, Action, [], {
        /** @lends Y.Plugin.OpenTabAction# */
        /**
         * @function
         * @private
         */
        execute: function() {
            if (this.get("emptyTab")) {
                Y.Widget.getByNode("#rightTabView").destroyAll();
            }

            var label = this.get("label") || this.get("host").get("label"),
                tab = Wegas.TabView.findTabAndLoadWidget(label, this.get("tabSelector"),
                    this.get("tabCfg"), this.get("wchildren"));                 // Forward plugin data to the target widget

            tab.set("selected", this.get("selected"));

            if (this.get("emptyTab") || this.get("tabSelector") !== "#rightTabView") {// @hack
                tab.set("selected", 2);
            }

            tab.plug(Plugin.Removeable);
        }
    }, {
        /** @lends Y.Plugin.OpenTabAction */
        NS: "wegas",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>tabSelector: the id of a Y.Wegas.TabView where a new tab will be created if none
         *    was found <i>default: #centerTabView</i></li>
         *    <li>wchildren: the element to render in the opened tab</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            label: {},
            emptyTab: {
                value: false
            },
            tabSelector: {
                value: '#centerTabView'
            },
            selected: {
                value: 2
            },
            wchildren: {
                value: []
            },
            tabCfg: {
                value: {}
            }
        }
    });
    Plugin.OpenTabAction = OpenTabAction;

    /**
     * Duplicate the plugin to allow multiple tab creation
     * @returns {undefined}
     */
    OpenTabActionSec = Y.Base.create("OpenTabActionSec", OpenTabAction, [], {}, {
        /** @lends Y.Plugin.OpenTabAction */
        NS: "OpenTabActionSec",
        ATTRS: {
            selected: {
                value: 0
            }
        }
    });
    Plugin.OpenTabActionSec = OpenTabActionSec;
    Plugin.OpenTabActionThi = Y.Base.create("OpenTabActionThi", OpenTabActionSec, [], {}, {
        NS: "OpenTabActionThi"
    });
    Plugin.OpenTabActionFou = Y.Base.create("OpenTabActionFou", OpenTabActionSec, [], {}, {
        NS: "OpenTabActionFou"
    });
    Plugin.OpenTabActionFiv = Y.Base.create("OpenTabActionFiv", OpenTabActionSec, [], {}, {
        NS: "OpenTabActionFiv"
    });

    /**
     *  @name Y.Plugin.OpenEntityAction
     *  @extends Y.Plugin.OpenUrlAction
     *  @class Open a game in the editor
     *  @constructor
     */
    var OpenEntityAction = Y.Base.create("OpenEntityAction", Plugin.OpenUrlAction, [], {
        /** @lends Y.Plugin.OpenEntityAction# */
        execute: function() {
            this.open(Y.Lang.sub(this.get("url"), this.get("entity").toJSON()));
        }
    }, {
        NS: "OpenEntityAction",
        /** @lends Y.Wegas.OpenEntityAction */
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>entity: the team, game, gamemodel or player entity that will be opened</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            url: {
                value: 'edit.html?'
            },
            entity: {}
        }
    });
    Plugin.OpenEntityAction = OpenEntityAction;

    /**
     *  @name Y.Plugin.OpenGameAction
     *  @extends Y.Plugin.OpenUrlAction
     *  @class Open a game in the editor
     *  @constructor
     */
    var OpenGameAction = Y.Base.create("OpenGameAction", Plugin.OpenUrlAction, [], {
        /** @lends Y.Plugin.OpenGameAction# */
        /**
         * @function
         * @private
         */
        execute: function() {
            var params, entity = this.get("entity");

            if (entity instanceof Wegas.persistence.GameModel) {
                params = "gameModelId=" + entity.get("id");
            } else if (entity instanceof Wegas.persistence.Player) {
                params = "id=" + entity.get("id");
            } else if (entity instanceof Wegas.persistence.Team) {
                params = "teamId=" + entity.get("id");
            } else {
                params = "gameId=" + entity.get("id");
            }
            this.open(this.get("url") + params);
        }
    }, {
        /** @lends Y.Wegas.OpenGameAction */
        NS: "wegas",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>url: url of the editor page<i>default: edit.html?</i></li>
         *    <li>entity: the team, game, gamemodel or player entity that will be opened</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            url: {
                value: 'edit.html?'
            },
            entity: {}
        }
    });
    Plugin.OpenGameAction = OpenGameAction;

    /**
     *  @name Y.Plugin.PrintAction
     *  @extends Y.Plugin.OpenUrlAction
     *  @class print the current entity
     *  @constructor
     */
    var PrintAction = Y.Base.create("PrintAction", Plugin.OpenUrlAction, [], {
        /** @lends Y.Plugin.PrintAction# */

        /**
         * @function
         * @private
         */
        execute: function() {
            var params, entity = this.get("entity");

            if (entity instanceof Wegas.persistence.GameModel) {
                params = "gameModelId=" + entity.get("id");
            } else if (entity instanceof Wegas.persistence.Game) {
                params = "gameModelId=" + entity.get("gameModelId");
            } else if (entity instanceof Wegas.persistence.VariableDescriptor) {
                params = "id=" + Wegas.Facade.Game.get("currentPlayerId");
                params += "&root=" + entity.get("name");
            } else {
                // @ TODO ERROR
            }
            this.set("url", this.get("editorUrl") + params
                + "&outputType=" + this.get("outputType")
                + "&mode=" + this.get("mode")
                + "&defaultValues=" + this.get("defaultValues"));

            PrintAction.superclass.execute.call(this);
        }
    }, {
        /** @lends Y.Wegas.PrintAction */
        NS: "printaction",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>editorUrl: url of the print page <i>default: print.html?</i></li>
         *    <li>outputType: either html or pdf, incorrect values means html<i>default & fallback: html</i></li>
         *    <li>mode: player or editor. editor is only to users who can edit the specified entity <i>default & fallback : player</i> </li>
         *    <li>entity: the game, gamemodel or variabledescriptor entity that will be printed</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            editorUrl: {
                value: 'print.html?'
            },
            outputType: {
                value: 'html'
            },
            mode: {
                value: 'editor'
            },
            defaultValues: {
                value: 'true'
            },
            entity: {}
        }
    });
    Plugin.PrintAction = PrintAction;

    // *** Buttons *** //
    /**
     * @name Y.Wegas.PrintButton
     * @extends Y.Wegas.Button
     * @class Shortcut to create a Button with an PrintAction plugin
     * @constructor
     */
    Wegas.PrintButton = Y.Base.create("button", Wegas.Button, [], {
        /** @lends Y.Wegas.PrintButton# */
        /**
         * @function
         * @private
         */
        initializer: function(cfg) {
            this.plug(PrintAction, cfg);
        }
    });

    /**
     * @name Y.Wegas.OpenEntityButton
     * @extends Y.Wegas.Button
     * @class Shortcut to create a Button with an OpenEntityButton plugin
     * @constructor
     */
    Wegas.OpenEntityButton = Y.Base.create("button", Wegas.Button, [], {
        /** @lends Y.Wegas.OpenEntityButton# */
        /**
         * @function
         * @private
         */
        initializer: function(cfg) {
            this.plug(OpenEntityAction, cfg);
        }
    });

    /**
     * @name Y.Wegas.OpenTabButton
     * @extends Y.Wegas.Button
     * @class Shortcut to create a Button with an OpenTabAction plugin
     * @constructor
     */
    Wegas.OpenTabButton = Y.Base.create("button", Wegas.Button, [], {
        /** @lends Y.Wegas.OpenTabButton# */
        /**
         * @function
         * @private
         */
        initializer: function(cfg) {
            this.plug(OpenTabAction, cfg);
        }
    });

    /**
     * Class for display the player link in menu's
     *
     * @name Y.Wegas.Linkwidget
     * @extends Y.Widget
     * @class  Allows to display the player link in a menu.
     * the link is in a textField. For this field inputEx is used.
     * @constructor
     * @param Object Will be used to fill attributes field
     */
    Linkwidget = Y.Base.create("wegas-playerlink-buttons", Y.Widget, [Wegas.Widget, Wegas.Editable, Y.WidgetChild], {
        /** @lends Y.Wegas.Linkwidget# */
        CONTENT_TEMPLATE: '<div><div class="playerlink-label"><p>Link</p><div></div>',
        /**
         * 1) Add a <div class="playerlink-label"><p>Player link</p><div> node fordisplay a label in the menu
         * 2) Add the inputeExStringField
         * 3) Stop the click event on this contentbox
         * @function
         * @private
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            this.textField = new Y.inputEx.StringField({
                parentEl: cb
            });
            cb.on("click", function(e) {
                e.halt(true);
                this.textField.el.select();
            }, this);
        },
        /**
         * Add the new url
         * @function
         * @private
         */
        syncUI: function() {
            var game = this.get("entity") || Wegas.Facade.Game.cache.getCurrentGame(),
                url = Wegas.app.get("base") + "game.html?token=" + game.get("token");
            this.textField.setValue(url);
        },
        destructor: function() {
            this.textField.destroy();
        }
    }, {
        /** @lends Y.Wegas.Linkwidget */
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>entity: the gamemodel or team entity, which the link will point to.</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            entity: {
                "transient": true
            }
        }
    });
    Wegas.Linkwidget = Linkwidget;

    /**
     * Class for display the player link in menu's
     *
     * @name Y.Wegas.Linkwidget
     * @extends Y.Widget
     * @class  Allows to display the player link in a menu.
     * the link is in a textField. For this field inputEx is used.
     * @constructor
     * @param Object Will be used to fill attributes field
     */
    var JoinOrResumeButton = Y.Base.create("button", Wegas.Button, [], {
        /** @lends Y.Wegas.Linkwidget# */
        renderUI: function() {
            JoinOrResumeButton.superclass.renderUI.apply(this);

            var entity = this.get("entity"),
                findInTeam = function(team) {
                    return Y.Array.find(team.get("players"), function(p) {
                        return p.get("userId") === Wegas.Facade.User.get("currentUserId");
                    });
                },
                findInGame = function(game) {
                    return game && Y.Array.find(game.get("teams"), findInTeam);
                };

            if (entity instanceof Wegas.persistence.Team) { // 1st case: clicked on an team
                if (findInTeam(Wegas.Facade.RegisteredGames.cache.findById(entity.get("id")))) {
                    this.set("label", "Open as Player")
                        .plug(OpenGameAction, {
                            url: "game-play.html?"
                        });
                    return;
                } else if (findInGame(Wegas.Facade.RegisteredGames.cache.findById(entity.get("gameId")))) {
                    this.set("disabled", true);
                    return;
                }
            } else if (findInGame(Wegas.Facade.RegisteredGames.cache.findById(entity.get("id")))) {
                this.set("label", "Open as Player")
                    .plug(OpenGameAction, {
                        entity: entity,
                        url: "game-play.html?"
                    });
                return;
            }
            this.plug(OpenTabAction, {
                tabSelector: "#rightTabView",
                emptyTab: true,
                wchildren: [{
                        type: "JoinTeam",
                        entity: this.get("entity")
                    }]
            });
        }
    }, {
        /** @lends Y.Wegas.Linkwidget */
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>entity: the gamemodel or team entity, which the link will point to.</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            entity: {}
        }
    });
    Wegas.JoinOrResumeButton = JoinOrResumeButton;

    /**
     *  @name Y.Plugin.LeaveGameAction
     *  @extends Y.Plugin.Action
     *  @class Open a game in the editor
     *  @constructor
     */
    Plugin.LeaveGameAction = Y.Base.create("LeaveGameAction", Plugin.Action, [], {
        /** @lends Y.Plugin.LeaveGameAction# */
        /**
         * @function
         * @private
         */
        execute: function() {
            Wegas.Panel.confirm("Are you sure you want to leave this game?", Y.bind(function() {
                var entity = this.get("entity"),
                    player;

                this.showOverlay();

                Y.Array.find(entity.get("teams"), function(t) {
                    player = Y.Array.find(t.get("players"), function(p) {
                        return p.get("userId") === Wegas.Facade.User.cache.get("currentUserId");
                    });
                    return player;
                });

                Wegas.Facade.Game.cache.deleteObject(player, {
                    cfg: {
                        updateCache: false
                    },
                    on: {
                        success: Y.bind(function() {
                            this.hideOverlay();
                            Wegas.Facade.RegisteredGames.sendInitialRequest();      // Refresh the list of games
                            Y.Widget.getByNode(".wegas-joinedgamesdatatable")
                                //.showMessage("successPopup", "Game left", 2000)  // Popup
                                .showMessage("success", "Game left");            // toolbar

                            Y.Plugin.EditEntityAction.hideRightTabs();              // Empty right tab on join
                        }, this)
                    }
                });
            }, this));
        }
    }, {
        /** @lends Y.Wegas.LeaveGameAction */
        NS: "LeaveGameAction",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>entity: the game entity that will be left</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            entity: {}
        }
    });

    OnDeleteListener = Y.Base.create("wegas-ondeletelistener", Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Action */
        /**
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = {
                onDelete: Y.Wegas.Facade.Variable.after("delete", Y.bind(this.onDescriptorDelete, this))
            };
        },
        _removeStateMachinePanel: function(entity) {
            var tab = Wegas.TabView.findTab("State machine");
            if (tab && tab.item(0).get("entity").get("id") === entity.get("id")) {
                tab.remove().destroy();
            }
        },
        _removeEditTab: function(entity) {
            var inFormEntity = Y.Plugin.EditEntityAction.currentEntity,
                removeTab = false;
            if (inFormEntity) {

                if (inFormEntity.get("id") === entity.get("id")) {
                    // Same Entity
                    removeTab = true;
                } else {
                    if (inFormEntity instanceof Y.Wegas.persistence.VariableInstance) {
                        // Care about the descriptor
                        inFormEntity = Y.Wegas.Facade.Variable.cache.find("id", inFormEntity.get("descriptorId"));
                    }

                    if (Y.Wegas.persistence.FSMDescriptor && entity instanceof Y.Wegas.persistence.FSMDescriptor) {
                        if (inFormEntity.get("@class") === "Transition" || inFormEntity.get("@class") === "State") {
                            removeTab = inFormEntity.get("stateMachineId") === entity.get("id");
                        }
                    } else if (entity.get("@class") === "ChoiceDescriptor") {
                        if (inFormEntity.get("@class") === "Result") {
                            removeTab = inFormEntity.get("choiceDescriptorId") === entity.get("id");
                        }
                    }
                }
            }
            if (removeTab) {
                Y.Plugin.EditEntityAction.hideRightTabs();
            }
        },
        onDescriptorDelete: function(e) {
            if (e.entity instanceof Y.Wegas.persistence.VariableDescriptor) {
                if (Y.Wegas.persistence.FSMDescriptor && e.entity instanceof Y.Wegas.persistence.FSMDescriptor) {
                    this._removeStateMachinePanel(e.entity);
                }
                this._removeEditTab(e.entity);
            }
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function() {
            var event, handler;
            for (event in this.handlers) {
                if (this.handlers.hasOwnProperty(event)) {
                    handler = this.handlers[event];
                    if (handler.detach) { // EventHandle
                        handler.detach();
                    } else if (handler.cancel) { //Timer
                        handler.cancel();
                    }
                }
            }
        }
    }, {
        NS: "OnDeleteListener",
        ATTRS: {
        }
    });
    Plugin.OnDeleteListener = OnDeleteListener;

});
