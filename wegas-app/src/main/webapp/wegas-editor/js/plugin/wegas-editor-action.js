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

    var Linkwidget, EditFSMAction,
            Plugin = Y.Plugin, Action = Plugin.Action, Wegas = Y.Wegas,
            CONTENTBOX = 'contentBox';

    /**
     *  @name Y.Plugin.EditFSMAction
     *  @extends Y.Plugin.EntityAction
     *  @class Open a state machine viewer in the edition tab
     *  @constructor
     */
    EditFSMAction = function() {
        EditFSMAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EditFSMAction, Plugin.EntityAction, {
        /** @lends Y.Plugin.EditFSMAction# */

        /**
         * @private
         * @function
         */
        execute: function() {
            Wegas.TabView.findTabAndLoadWidget("State machine editor", // Load and display the editor in a new tab
                    "#centerTabView", null, {
                type: "StateMachineViewer",
                plugins: [{
                        fn: "WidgetToolbar"
                    }]
            }, Y.bind(function(entity, widget) {
                widget.set("entity", entity);
            }, this, this.get("entity")));
        }

    }, {
        NS: "wegas",
        NAME: "EditFSMAction"
    });
    Plugin.EditFSMAction = EditFSMAction;

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
            if (confirm("This will restart every game depending on this model. Are you sure?")) {
                Wegas.Facade.VariableDescriptor.sendRequest({
                    request: '/Reset/'
                });
            }
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
            Wegas.TabView.findTabAndLoadWidget(this.get("host").get("label"),
                    this.get("tabSelector"), {}, this.get("wchildren"));        // Forward plugin data to the target widget
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
            tabSelector: {
                value: '#centerTabView'
            },
            wchildren: {
                value: []
            }
        }
    });
    Plugin.OpenTabAction = OpenTabAction;

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
            var params,
                    entity = this.get("entity");
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
         *    <li>editorUrl: url of the editor page<i>default: wegas-app/view/editor.html?</i></li>
         *    <li>entity: the team, game, gamemodel or player entity that will be opened</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            editorUrl: {
                value: 'wegas-app/view/editor.html?'
            },
            entity: {}
        }
    });
    Plugin.OpenGameAction = OpenGameAction;

    /**
     *  @name Y.Plugin.LoadTreeviewNodeAction
     *  @extends Y.Plugin.Action
     *  @class Open a game in the editor
     *  @constructor
     */
    var LoadTreeviewNodeAction = function() {
        LoadTreeviewNodeAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(LoadTreeviewNodeAction, Action, {
        /** @lends Y.Plugin.LoadTreeviewNodeAction# */

        /**
         * @function
         * @private
         */
        execute: function() {
            var entity = this.get("entity"),
                    tabId = this.get("tabId") || this.get("host").get("label"),
                    tabCfg = {
                label: entity.get("name") || "Unnamed"
            },
            tab = Wegas.TabView.createTab(tabId, this.get("tabSelector"), tabCfg);
            tab.set("visible", true);
            tab.set("selected", 2);
            tab.witem(0).set("emptyMessage", "This model has no games.");
            tab.witem(0).toolbar.item(0).set("disabled", false);  // Allow game creation

            Wegas.Facade.Game.set("source", // Change the source attribute on the datasource
                    Wegas.app.get("base") + "rest/GameModel/" + entity.get("id") + "/Game");

            Wegas.Facade.Game.sendRequest({
                request: "/"
            });
        }
    }, {
        /** @lends Y.Plugin.LoadTreeviewNodeAction */

        NS: "LoadTreeviewNodeAction",
        NAME: "LoadTreeviewNodeAction",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>tabId: the id of the Y.Wegas.Tab widget that will bo opened.</li>
         *    <li>tabSelector: the id of a Y.Wegas.TabView where a new tab will be created if none
         *    was found <i>default: #centerTabView</i></li>
         *    <li>entity: the entity, which the link will point to.</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            tabId: {},
            tabSelector: {
                value: '#centerTabView'
            },
            entity: {}
        }
    });
    Plugin.LoadTreeviewNodeAction = LoadTreeviewNodeAction;

    // *** Buttons *** //
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

        /**
         * 1) Add a <div class="playerlink-label"><p>Player link</p><div> node fordisplay a label in the menu
         * 2) Add the inputeExStringField
         * 3) Stop the click event on this contentbox
         * @function
         * @private
         */
        renderUI: function() {
            Linkwidget.superclass.renderUI.apply(this);
            var cb = this.get(CONTENTBOX);

            cb.append('<div class="playerlink-label"><p>Share link</p><div>');

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
            var gm = this.get("entity");
            if (!gm) {
                gm = Y.Wegas.Facade.Game.cache.getCurrentGame();
            }
            var url = Wegas.app.get("base") + "game.html?token=" + gm.get("token");
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
            entity: {}
        }
    });
    Y.namespace("Wegas").Linkwidget = Linkwidget;

});
