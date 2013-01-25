/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-editor-action', function (Y) {
    "use strict";
    /**
     *  @class Action
     *  @module Wegas
     *  @constructor
     */
    var Action = Y.Plugin.Action;

    /**
     *  @class EditFSMAction
     *  @module Wegas
     *  @constructor
     */
    var EditFSMAction = function () {
        EditFSMAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(EditFSMAction, Y.Plugin.EntityAction, {
        execute: function () {
            Y.Wegas.TabView.findTabAndLoadWidget("State machine editor",        // Load and display the editor in a new tab
                "#centerTabView", null, {
                    type: "StateMachineViewer",
                    plugins: [{
                        fn: "WidgetToolbar"
                    }]
                }, Y.bind(function (entity, widget) {
                    widget.set("entity", entity);
                }, this, this.get("entity")));
        }
    }, {
        NS: "wegas",
        NAME: "EditFSMAction"
    });

    Y.namespace("Plugin").EditFSMAction = EditFSMAction;

    /**
     *  @class ResetAction
     *  @module Wegas
     *  @constructor
     */
    var ResetAction = function () {
        ResetAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(ResetAction, Action, {
        execute: function () {
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: '/Reset/'
            });
        }
    }, {
        NS: "wegas",
        NAME: "ResetAction"
    });

    Y.namespace("Plugin").ResetAction = ResetAction;

    /**
     *  @class OpenTabAction
     *  @module Wegas
     *  @constructor
     */
    var OpenTabAction = function () {
        OpenTabAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(OpenTabAction, Action, {
        execute: function () {
            var childCfg = this.get("children");                                // Forward plugin data to the target widget
            childCfg.data = this;                                               // @fixme Usde in wegas-inputex-permissionselect
            Y.Wegas.TabView.findTabAndLoadWidget(this.get("host").get("label"),
                this.get("tabSelector"), {}, childCfg);
        }
    }, {
        NS: "wegas",
        NAME: "OpenTabAction",
        ATTRS: {
            tabSelector: {
                value: '#centerTabView'
            },
            children: {}
        }
    });

    Y.namespace("Plugin").OpenTabAction = OpenTabAction;

    /**
     *  @class OpenGameAction
     *  @module Wegas
     *  @constructor
     */
    var OpenGameAction = function () {
        OpenGameAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(OpenGameAction, Y.Plugin.OpenUrlAction, {
        execute: function () {
            var params, entity = this.get("entity");

            if (entity instanceof Y.Wegas.persistence.GameModel) {
                params = "gameModelId=" + entity.get("id");
            } else if (entity instanceof Y.Wegas.persistence.Player) {
                params = "id=" + entity.get("id");
            } else {
                params = "gameId=" + entity.get("id");
            }
            this.set("url",  this.get("editorUrl") + params);
            OpenGameAction.superclass.execute.call(this);
        }
    }, {
        NS: "wegas",
        NAME: "OpenGameAction",
        ATTRS: {
            editorUrl: {
                value: 'wegas-app/view/editor.html?'
            },
            entity: {}
        }
    });

    Y.namespace("Plugin").OpenGameAction = OpenGameAction;

    /**
     *  @class LoadTreeviewNodeAction
     *  @module Wegas
     *  @constructor
     */
    var LoadTreeviewNodeAction = function () {
        LoadTreeviewNodeAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(LoadTreeviewNodeAction, Action, {
        execute: function () {
            var entity = this.get("entity"),
            tabId = this.get("tabId") || this.get("host").get("label"),
            tabCfg = {
                label: entity.get("name") || "Unnamed"
            },
            tab = Y.Wegas.TabView.createTab(tabId, this.get("tabSelector"), tabCfg);

            tab.set("selected", 2);

            tab.witem(0).set("emptyMessage", "This game model has no games.");
            tab.witem(0).toolbar.item(0).set("disabled", false);  // Allow game creation

            Y.Wegas.GameFacade.set("source",                                    // Change the source attribute on the datasource
                Y.Wegas.app.get("base") + "rest/GameModel/" + entity.get("id") + "/Game");

            Y.Wegas.GameFacade.sendRequest({
                request: "/"
            });
        }
    }, {
        NS: "LoadTreeviewNodeAction",
        NAME: "LoadTreeviewNodeAction",
        ATTRS: {
            tabId: {},
            tabSelector: {
                value: '#centerTabView'
            },
            entity: {}
        }
    });

    Y.namespace("Plugin").LoadTreeviewNodeAction = LoadTreeviewNodeAction;

    // *** Buttons *** //

    /**
     * Shortcut to create a Button with an OpenTabAction plugin
     */
    Y.Wegas.OpenTabButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(OpenTabAction, cfg);
        }
    });

    /**
     *
     */
    var CONTENTBOX = 'contentBox',
    Linkwidget;

    Linkwidget = Y.Base.create("wegas-playerlink-buttons", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        renderUI: function(){
            Linkwidget.superclass.renderUI.apply(this);

            this.p = Y.Node.create('<div class="playerlink-label"><p>Player link</p><div>');
            this.get(CONTENTBOX).append(this.p);

            this.textField = new Y.inputEx.StringField({
                parentEl: this.get(CONTENTBOX)
                });
            this.get(CONTENTBOX).on("click", function (e) {
                e.halt(true);
            });
        },

        syncUI: function() {
            var url = document.URL + "game.html?token=" + this.get("entity").get("token");
            this.textField.setValue(url);
        }
    }, {
        ATTRS: {
            entity: {}
        }
    });
    Y.namespace("Wegas").Linkwidget = Linkwidget;
});
