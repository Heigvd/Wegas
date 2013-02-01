/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-action', function(Y) {
    "use strict";

    /**
     *  Extension that adds editable capacities to plugins
     *
     *  @class Y.Wegas.Plugin
     *  @constructor
     */
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
            }
        }
    });
    Y.namespace("Wegas").Plugin = Plugin;

    /**
     *  @class Y.Plugin.Action
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Action = Y.Base.create("wegas-actionplugin", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /** @lends Y.Plugin.Action */
        /**
         * @function
         * @private
         */
        initializer: function() {
            this.onHostEvent(this.get("targetEvent"), this.execute, this);
        },
        /**
         * @function
         * @protected
         */
        execute: function() {
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
     *  @extends Y.Plugin.Action
     */
    var OpenUrlAction = function() {
        OpenUrlAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(OpenUrlAction, Action, {
        execute: function() {
            var targetUrl = Y.Wegas.app.get("base") + this.get("url");

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
            url: {},
            /**
             * Can be "self" or "blank"
             */
            target: {
                value: "blank"
            }
        }
    });
    Y.namespace("Plugin").OpenUrlAction = OpenUrlAction;


    /**
     *  @class Y.Plugin.OpenPageAction
     *  @extends Y.Plugin.Action
     *  @module Wegas
     *  @constructor
     */
    var OpenPageAction = function() {
        OpenPageAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(OpenPageAction, Action, {
        initializer: function() {
            OpenPageAction.superclass.initializer.apply(this, arguments);
            this.afterHostEvent("render", function() {
                var targetPageLoader = Y.Wegas.PageLoader.find(this.get('targetPageLoaderId'));
                if (targetPageLoader.get("pageId") === this.get("subpageId")) {
                    this.get("host").set("selected", 1);
                }
            }, this);
        },
        execute: function() {
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
                    label: "Page to display",
                    _type: "pageselect",
                    required: false
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
    var ExecuteScriptAction = function() {
        ExecuteScriptAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(ExecuteScriptAction, Action, {
        execute: function() {
            var host = this.get("host"), overlayGuest, guest = host.get("root");
            if (guest.showOverlay && guest.hideOverlay) {
                overlayGuest = guest;
                overlayGuest.showOverlay();
            }

            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify(this.get("onClick"))
                },
                on: {
                    success: function(r) {
                        if (overlayGuest) {
                            overlayGuest.hideOverlay();
                        }
                    },
                    failure: function(r) {
                        if (overlayGuest) {
                            overlayGuest.hideOverlay();
                        }
                        Y.bind(host.defaultExceptionHandler, host, r);
                    }
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

    var PopupPlg = function() {
        PopupPlg.superclass.constructor.apply(this, arguments);
    };
    Y.extend(PopupPlg, Y.Plugin.Base, {
        initializer: function() {
            this.afterHostEvent("render", function() {
                this.get("host").showMessage("info", this.get("content"));
            });
        }
    }, {
        NS: "PopupPlg",
        NAME: "PopupPlg",
        ATTRS: {
            content: {
                type: "string",
                format: "text"
            }
        }
    });
    Y.namespace("Plugin").PopupPlg = PopupPlg;

});
