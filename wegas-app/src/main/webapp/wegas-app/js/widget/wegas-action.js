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

YUI.add('wegas-action', function (Y) {
    "use strict";

    function Plugin() {}

    Y.mix(Plugin.prototype, {});

    Y.mix(Plugin, {
        ATTRS: {
            host: {
                "transient": true
            },
            initialized: {
                "transient": true
            },
            destroyed: {
                "transient": true
            },
            /* Shortcur */
            data: {
                readonly: true,
                getter: function() {
                    return this.get("host").get("data");
                }
            }
        }
    });

    Y.namespace("Wegas").Plugin = Plugin;

    var Action = Y.Base.create("wegas-actionplugin", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {

        initializer: function () {
            this.onHostEvent(this.get("targetEvent"), function () {
                this.setAttrs(this.get("host").get("data"));                    // Pass the action data from the host to the plug
                this.execute();
            }, this);
        },
        execute: function () {
            Y.error("Y.Plugin.Action.execute() is abstract, should be overriddent");
        }
    }, {
        NS: "wegas",
        NAME: "Action",
        ATTRS: {
            targetEvent: {
                value: "click"
            }
        }
    });
    Y.namespace("Plugin").Action = Action;

    /**
     *  @class OpenGameAction
     *  @module Wegas
     *  @constructor
     */
    var OpenUrlAction = function () {
        OpenUrlAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(OpenUrlAction, Action, {
        execute: function () {
            var targetUrl  = Y.Wegas.app.get("base") + this.get("url");

            if (this.get("target") === "blank") {
                window.open(targetUrl);
            } else {
                window.location.href = targetUrl;
            }
        }
    }, {
        NS: "openurlaction",
        NAME: "OpenUrlAction",
        ATTRS: {
            url: { },
            /**
             * Can be "self" or "blank"
             */
            target: {
                value : "blank"
            }
        }
    });

    Y.namespace("Plugin").OpenUrlAction = OpenUrlAction;


    /**
     *  @class OpenPageAction
     *  @module Wegas
     *  @constructor
     */
    var OpenPageAction = function () {
        OpenPageAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(OpenPageAction, Action, {

        initializer: function () {
            OpenPageAction.superclass.initializer.apply(this, arguments);
            this.afterHostEvent("render", function () {
                var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
                if (targetPageLoader.get("pageId") === this.get("subpageId")) {
                    this.get("host").set("selected", 1);
                }
            }, this);
        },

        execute: function () {
            var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
            targetPageLoader.set("pageId", this.get("subpageId"));
            this.get("host").set("selected", 1);
        }
    }, {
        NS: "OpenPageAction",
        NAME: "OpenPageAction",
        ATTRS: {
            subpageId: {
                type: "string",
                _inputex: {
                    label: "Page to display"
                }
            },
            targetPageLoaderId: {
                type: "string",
                _inputex: {
                    label: "Target page loader"
                }
            }
        }
    });

    Y.namespace("Plugin").OpenPageAction = OpenPageAction;

    /**
     *  @class ExecuteScriptAction
     *  @module Wegas
     *  @constructor
     */
    var ExecuteScriptAction = function () {
        ExecuteScriptAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(ExecuteScriptAction, Action, {
        execute: function () {
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify(this.get("onClick"))
                }
            });
        }
    }, {
        NS: "ExecuteScriptAction",
        NAME: "ExecuteScriptAction",
        ATTRS: {
            onClick: {
                _inputex: {
                    _type: "script"
                }
            }
        }
    });

    Y.namespace("Plugin").ExecuteScriptAction = ExecuteScriptAction;
});
