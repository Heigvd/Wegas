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

    var Action = function () {
        Action.superclass.constructor.apply(this, arguments);
    };

    Y.mix(Action, {
        NS: "wegas",
        NAME: "Action"
    });

    Y.extend(Action, Y.Plugin.Base, {
        initializer: function () {
            this.afterHostEvent(this.get("targetEvent"), function () {
                this.setAttrs(this.get("host").get("data"));                       // Pass the action data from the host to the plug
                this.execute();
            }, this);
        },
        execute: function () {
            Y.error("Y.Plugin.Action.execute() is abstract, should be overriddent");
        }
    }, {
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

    Y.mix(OpenUrlAction, {
        NS: "openurlaction",
        NAME: "OpenUrlAction"
    });

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
            subpageId: {},
            targetPageLoaderId: {}
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

    Y.mix(ExecuteScriptAction, {
        NS: "ExecuteScriptAction",
        NAME: "ExecuteScriptAction"
    });

    Y.extend(ExecuteScriptAction, Action, {
        execute: function () {
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": this.get("onClick")
                    })
                }
            });
        }
    }, {
        ATTRS: {
            onClick: {}
        }
    });

    Y.namespace("Plugin").ExecuteScriptAction = ExecuteScriptAction;
});
