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
YUI.add('wegas-plugin', function(Y) {
    "use strict";

    var HOST = "host", Plugin = Y.Plugin, Wegas = Y.namespace("Wegas");

    /**
     *  @name Y.Wegas.Plugin
     *  @class Extension that adds editable capacities to plugins
     *  @extends Y.Plugin
     *  @constructor
     */
    Wegas.Plugin = function() {
    };
    Y.mix(Wegas.Plugin.prototype, {});
    Y.mix(Wegas.Plugin, {
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
            this.handlers = [];
            this.handlers.push(this.get("host").get("boundingBox").addClass("wegas-" + this.get("targetEvent")));
            this.onHostEvent(this.get("targetEvent"), this.execute);
        },
        /**
         * @function
         * @protected
         */
        execute: function() {
            Y.error("Y.Plugin.Action.execute() is abstract, should be overriddent");
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
            var url = this.get("url");
            if (url.indexOf("http://") === -1) {
                url = Wegas.app.get("base") + url;
            }
            if (this.get("target") === "blank") {
                window.open(url);
            } else {
                window.location.href = url;
            }
        }
    }, {
        NS: "openurlaction",
        NAME: "OpenUrlAction",
        ATTRS: {
            url: {
                type: "string",
                _inputex: {
                    //_type: "wegasurl"
                    label: "Open url"
                }
            },
            /**
             * Can be "self" or "blank"
             */
            target: {
                type: "string",
                value: "blank",
                choices: [{
                        value: "blank",
                        label: "In a new page"
                    }, {
                        value: "self",
                        label: "In the same page"
                    }],
                _inputex: {
                    label: ""
                }
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
                if (targetPageLoader) {
                    targetPageLoader.onceAfter("render", function(e, targetPageLoader) {
                        if ("" + targetPageLoader.get("pageId") === "" + this.subpage()) {
                            this.get(HOST).set("selected", 1);
                        }
                    }, this, targetPageLoader);
                }
            }, this);
        },
        execute: function() {
            var targetPageLoader = Wegas.PageLoader.find(this.get('targetPageLoaderId'));
            targetPageLoader.set("pageId", this.subpage());
            this.get(HOST).set("selected", 1);
        },
        subpage: function() {
            if (!this.get("subpageId")) {
                if (this.get("subpageVariable.evaluated")) {
                    return this.get("subpageVariable.evaluated").getInstance().get("value");
                }
            }
            return this.get("subpageId");
        }
    }, {
        NS: "OpenPageAction",
        NAME: "OpenPageAction",
        ATTRS: {
            subpageId: {
                type: "string",
                _inputex: {
                    label: "Open page",
                    _type: "pageselect",
                    required: false
                }
            },
            targetPageLoaderId: {
                type: "string",
                value: "maindisplayarea",
                _inputex: {
                    label: "Target zone",
                    //_type: "pageloaderselect",//@fixme There a bug with this widget when the target page is not loaded
                    value: "maindisplayarea",
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            subpageVariable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "hidden",
                    //_type: "variableselect",
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
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
            var host = this.get(HOST);
            if (!host.get("disabled")) {
                host.showOverlay();
                Wegas.Facade.VariableDescriptor.script.run(this.get("onClick"), {
                    on: {
                        success: Y.bind(host.hideOverlay, host),
                        failure: Y.bind(host.defaultFailureHandler, host)
                    }
                });
            }
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
     *  @name Y.Plugin.SaveObjectAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var SaveObjectAction = function() {
        SaveObjectAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(SaveObjectAction, Action, {
        execute: function(e) {
            var overlayGuest,
                host = this.get(HOST),
                guest = host.get("root"),
                variable = this.get("variable.evaluated"),
                data = variable.get("name") + ".properties",
                script = this.get("clearStorage") ? data + ".clear();" : "", i;
            if (guest.showOverlay && guest.hideOverlay) {
                overlayGuest = guest;
                overlayGuest.showOverlay();
            }

            for (i in e.value) {
                script += data + ".put('" + (i + "").replace(/'/g, "\\'") + "','" + (e.value[i] + "").replace(/'/g, "\\'") + "');";
            }

            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "Script",
                        language: "JavaScript",
                        content: script
                    }
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
        NS: "SaveObjectAction",
        NAME: "SaveObjectAction",
        ATTRS: {
            variable: {
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    legend: "Save to",
                    classFilter: ["ObjectDescriptor"]
                }
            },
            targetEvent: {
                value: "submit"
            },
            clearStorage: {
                type: "boolean",
                value: true,
                _inputex: {
                    label: "Replace Storage",
                    description: "Will remove existing data. Else add them to the existing one."
                }
            }
        }
    });
    Plugin.SaveObjectAction = SaveObjectAction;
});
