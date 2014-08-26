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
YUI.add('wegas-editor-action', function(Y) {
    "use strict";

    var Linkwidget, Plugin = Y.Plugin, Action = Plugin.Action, Wegas = Y.Wegas,
        CONTENTBOX = 'contentBox';

    /**
     *  @name Y.Plugin.ResetAction
     *  @extends Y.Plugin.Action
     *  @class Reset the target game model
     *  @constructor
     */
    var ResetAction = function() {
        ResetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(ResetAction, Action, {
        /** @lends Y.Plugin.ResetAction# */
        /**
         * @function
         * @private
         */
        execute: function() {
            //if (confirm("This will restart for every player. Are you sure?")) {
            var host = this.get("host");
            host.showOverlay();
            Wegas.Facade.Variable.sendRequest({
                request: '/Reset/',
                on: {
                    success: Y.bind(host.hideOverlay, host),
                    failure: Y.bind(host.defaultFailureHandler, host)
                }
            });
            //}
        }
    }, {
        NS: "wegas",
        NAME: "ResetAction"
    });
    Plugin.ResetAction = ResetAction;

    /**
     *  @name Y.Plugin.OpenTabAction
     *  @extends Y.Plugin.Action
     *  @class Reset the target game model
     *  @constructor
     */
    var OpenTabAction = function() {
        OpenTabAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(OpenTabAction, Action, {
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

            tab.plug(Y.Plugin.Removeable);
        }
    }, {
        /** @lends Y.Plugin.OpenTabAction */

        NS: "wegas",
        NAME: "OpenTabAction",
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
    Plugin.OpenTabActionSec = function() {
        Plugin.OpenTabActionSec.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Plugin.OpenTabActionSec, Plugin.OpenTabAction, {}, {
        /** @lends Y.Plugin.OpenTabAction */
        NS: "OpenTabActionSec",
        NAME: "OpenTabActionSec",
        ATTRS: {
            selected: {
                value: 0
            }
        }
    });
    Plugin.OpenTabActionThi = function() {
        Plugin.OpenTabActionThi.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Plugin.OpenTabActionThi, Plugin.OpenTabActionSec, {}, {
        NS: "OpenTabActionThi",
        NAME: "OpenTabActionThi"
    });
    Plugin.OpenTabActionFou = function() {
        Plugin.OpenTabActionFou.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Plugin.OpenTabActionFou, Plugin.OpenTabActionSec, {}, {
        NS: "OpenTabActionFou",
        NAME: "OpenTabActionFou"
    });

    /**
     *  @name Y.Plugin.OpenEntityAction
     *  @extends Y.Plugin.OpenUrlAction
     *  @class Open a game in the editor
     *  @constructor
     */
    var OpenEntityAction = function() {
        OpenEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(OpenEntityAction, Plugin.OpenUrlAction, {
        /** @lends Y.Plugin.OpenEntityAction# */
        _getUrl: function() {
            var entity = this.get("entity");
            return this.get("url").replace("{id}", entity.get("id"));
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
    var OpenGameAction = function() {
        OpenGameAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(OpenGameAction, Plugin.OpenUrlAction, {
        /** @lends Y.Plugin.OpenGameAction# */

        /**
         * @function
         * @private
         */
        execute: function() {
            var params, entity = this.get("entity");
            //        testPlayer = function(game) {
            //    var teams = game.get("teams"), i, ret = false;
            //    for (i = 0; i < teams.length; i += 1) {
            //        ret = teams[i].get("players").length > 0;
            //        if (ret) {
            //            break;
            //        }
            //    }
            //    return ret;
            //};

            if (entity instanceof Wegas.persistence.GameModel) {
                params = "gameModelId=" + entity.get("id");
            } else if (entity instanceof Wegas.persistence.Player) {
                params = "id=" + entity.get("id");
            } else if (entity instanceof Wegas.persistence.Team) {
                //if (entity.get("players").length < 1) {
                //    alert("Team " + entity.get("name") + " has no player");
                //    return;
                //}
                params = "teamId=" + entity.get("id");
            } else {
                //if (entity.get("teams").length < 1) {
                //    alert("Game " + entity.get("name") + " has no Team");
                //    return;
                //}
                //else if (!testPlayer(entity)) {
                //    alert("Game " + entity.get("name") + " has no player");
                //    return;
                //}
                params = "gameId=" + entity.get("id");
            }
            this.set("url", this.get("editorUrl") + params);
            OpenGameAction.superclass.execute.call(this);
        }
    }, {
        /** @lends Y.Wegas.OpenGameAction */
        NS: "wegas",
        NAME: "OpenGameAction",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>editorUrl: url of the editor page<i>default: edit.html?</i></li>
         *    <li>entity: the team, game, gamemodel or player entity that will be opened</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            editorUrl: {
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
    var PrintAction = function() {
        PrintAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(PrintAction, Plugin.OpenUrlAction, {
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
                params = "id=" + Y.Wegas.Facade.Game.get("currentPlayerId");
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
        NS: "wegas",
        NAME: "PrintAction",
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
            var game = this.get("entity");
            if (!game) {
                game = Y.Wegas.Facade.Game.cache.getCurrentGame();
            }
            var url = Wegas.app.get("base") + "game.html?token=" + game.get("token");
            this.textField.setValue(url);
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
                        return p.get("userId") === Y.Wegas.Facade.User.get("currentUserId");
                    });
                },
                findInGame = function(game) {
                    return Y.Array.find(game.get("teams"), findInTeam);
                };

            if (entity instanceof Y.Wegas.persistence.Team) { // 1st case: clicked on an team
                if (findInTeam(entity)) {
                    this.set("label", "Resume");
                    this.plug(Y.Plugin.OpenGameAction);
                    return;
                } else if (findInGame(Y.Wegas.Facade.Game.cache.findById(entity.get("gameId")))) {
                    this.set("disabled", true);
                    return;
                }
            } else if (findInGame(entity)) {
                this.set("label", "Resume");
                this.plug(Y.Plugin.OpenGameAction, {
                    entity: this.get("entity")
                });
                return;
            }
            this.plug(Y.Plugin.OpenTabAction, {
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
});
