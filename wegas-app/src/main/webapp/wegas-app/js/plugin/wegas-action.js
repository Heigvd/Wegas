/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-action', function(Y) {
    "use strict";

    var HOST = "host", Plugin = Y.Plugin, Wegas = Y.namespace("Wegas");

    /**
     *  @name Y.Wegas.Plugin
     *  @class Extension that adds editable capacities to plugins
     *  @extends Y.Plugin
     *  @constructor
     */
    function WPlugin() {
    }
    Y.mix(WPlugin.prototype, {});
    Y.mix(WPlugin, {
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
        },
        /**
         * @function
         * @private
         * @static
         * @param {String} name
         * @return Status node
         * @description Get Class From plugin name. Hopefully a unique name ...
         */
        getPluginFromName: function(name) {
            var i;
            for (i in Y.Plugin) {
                if (Y.Plugin[i].NAME === name) {
                    return "" + i;
                }
            }
            return undefined;
        }
    });
    Wegas.Plugin = WPlugin;

    /**
     *  @name Y.Plugin.Action
     *  @extends Y.Plugin.Base
     *  @augments Y.Wegas.Plugin
     *  @augments Y.Wegas.Editable
     *  @class
     *  @constructor
     */
    var Action = Y.Base.create("wegas-actionplugin", Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
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
                type: "string",
                value: "click",
                _inputex: {
                    _type: "hidden"
                }
            }
        }
    });
    Plugin.Action = Action;

    /**
     *  @class
     *  @name Y.Plugin.OpenUrlAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var OpenUrlAction = function() {
        OpenUrlAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(OpenUrlAction, Action, {
        execute: function() {
            var targetUrl = Wegas.app.get("base") + this.get("url");

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
            url: {
            },
            /**
             * Can be "self" or "blank"
             */
            target: {
                value: "blank"
            }
        }
    });
    Plugin.OpenUrlAction = OpenUrlAction;


    /**
     *  @class
     *  @name Y.Plugin.OpenPageAction
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
                var targetPageLoader = Wegas.PageLoader.find(this.get('targetPageLoaderId'));
                if (targetPageLoader.get("pageId") === this.get("subpageId")) {
                    this.get(HOST).set("selected", 1);
                }
            }, this);
        },
        execute: function() {
            var targetPageLoader = Wegas.PageLoader.find(this.get('targetPageLoaderId'));
            targetPageLoader.set("pageId", this.get("subpageId"));
            this.get(HOST).set("selected", 1);
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
    Plugin.OpenPageAction = OpenPageAction;

    /**
     *  @class
     *  @name Y.Plugin.ExecuteScriptAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var ExecuteScriptAction = function() {
        ExecuteScriptAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(ExecuteScriptAction, Action, {
        execute: function() {
            var host = this.get(HOST), overlayGuest, guest = host.get("root");
            if (guest.showOverlay && guest.hideOverlay) {
                overlayGuest = guest;
                overlayGuest.showOverlay();
            }

            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Wegas.app.get('currentPlayer'),
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
                    _type: "script",
                    label: "On click"
                }
            }
        }
    });
    Plugin.ExecuteScriptAction = ExecuteScriptAction;

    /**
     *  @class
     *  @name Y.Plugin.SaveEntityAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var SaveEntityAction = function() {
        SaveEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(SaveEntityAction, Action, {
        execute: function(e) {
            var overlayGuest,
                    host = this.get(HOST),
                    guest = host.get("root"),
                    variable = this.get("variable.evaluated"),
                    instance = variable.getInstance();

            if (guest.showOverlay && guest.hideOverlay) {
                overlayGuest = guest;
                overlayGuest.showOverlay();
            }

            //instance.setAttrs(e.value);
            instance.set("properties", e.value);

            Wegas.VariableDescriptorFacade.sendRequest({
                request: "/" + variable.get("id") + "/VariableInstance/" + instance.get("id"),
                cfg: {
                    method: "PUT",
                    data: instance.toObject()
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
                    }
                }
            });
        }
    }, {
        NS: "SaveEntityAction",
        NAME: "SaveEntityAction",
        ATTRS: {
            variable: {
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variabledescriptorselect"
                }
            },
            targetEvent: {
                value: "submit"
            }
        }
    });
    Plugin.SaveEntityAction = SaveEntityAction;

});
