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

    var HOST = "host", Plugin = Y.Plugin, Wegas = Y.namespace("Wegas"),
        PAGELOADER_CONFIG = {
            FULL_PAGE: {
                label: "Entire page",
                value: "Entire page"
            },
            CURRENT_PAGE_LOADER: {
                label: "Current page display",
                value: "Current page display"
            }
        }, PREVIEW_PAGELOADER_ID = "previewPageLoader";

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
            this.get("host").get("boundingBox").addClass("wegas-" + this.get("targetEvent"));
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
                if (this.handlers[i].detach) { // EventHandle
                    this.handlers[i].detach();
                } else if (this.handlers[i].cancel) { //Timer
                    this.handlers[i].cancel();
                }
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
     *  @name Y.Plugin.PrintActionPlugin
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var PrintActionPlugin = function() {
        PrintActionPlugin.superclass.constructor.apply(this, arguments);
    };
    Y.extend(PrintActionPlugin, Action, {
        execute: function() {
            var outputType = this.get("outputType");
            var root = this.get("root");
            var gameModelId = Wegas.Facade.GameModel.get("currentGameModelId");
            var printUrl = Wegas.app.get("base") + "print.html?gameModelId=" + gameModelId + "&outputType=" + outputType + "&root=" + root + "&mode=player";
            window.open(printUrl);
        }
    }, {
        NS: "PrintActionPlugin",
        NAME: "PrintActionPlugin",
        ATTRS: {
            root: {
                type : "string",
                _inputex: {
                    label: "root",
                    required: false
                }
            },
            /**
             * Can be "html" or "pdf"
             */
            outputType: {
                type: "string",
                value: "html",
                choices: [{
                        value: "html",
                        label: "HTML"
                    }, {
                        value: "pdf",
                        label: "PDF"
                    }],
                _inputex: {
                    label: "output type"
                }
            }
        }
    });
    Plugin.PrintActionPlugin = PrintActionPlugin;

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
            this.afterHostEvent("render", function() {
                var targetPageLoader = this._getTargetPageLoader();
                if (targetPageLoader) {
                    this.get(HOST).set("selected", ~~("" + targetPageLoader.get("pageId") === "" + this._subpage()));
                    this.handlers.push(targetPageLoader.after("pageIdChange", function() {
                        try {
                            this.get(HOST).set("selected", ~~("" + targetPageLoader.get("pageId") === "" + this._subpage()));
                        } catch (e) {
                            //no more node...
                        }
                    }, this));
                }
            }, this);
        },
        execute: function() {
            var targetPageLoader = this._getTargetPageLoader();
            if (!targetPageLoader || this.get("host").get("disabled")) {
                return;
            }
            /* 
             * Changing a page may call a page destructor and thus destroying other Action assossiated with this 'targetEvent'
             * in case this' host belongs to destructed page. That's the reason to delay a page change
             */
            this.handlers.push(Y.soon(
                Y.bind(function(pageLoader) {
                    pageLoader.set("pageId", this._subpage());
                }, this, targetPageLoader)));
        },
        _getTargetPageLoader: function() {
            var targetPageLoader, plID = this.get('targetPageLoaderId');
            switch (plID) {
                case PAGELOADER_CONFIG.FULL_PAGE.value:
                    targetPageLoader = Wegas.PageLoader.find(PREVIEW_PAGELOADER_ID);
                    break;
                case PAGELOADER_CONFIG.CURRENT_PAGE_LOADER.value:
                    targetPageLoader = Y.Widget.getByNode(this.get("host").get("root").get("boundingBox").ancestor());
                    break;
                default:
                    targetPageLoader = Wegas.PageLoader.find(plID);
            }
            return targetPageLoader;
        },
        _subpage: function() {
            var variable;
            if (this.get("variable.content")) {
                variable = this.get("variable.evaluated");
                if (variable) {
                    return variable.getInstance().get("value");
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
                value: "",
                _inputex: {
                    label: "Target",
                    _type: "pageloaderselect",
                    choices: [
                        PAGELOADER_CONFIG.FULL_PAGE,
                        PAGELOADER_CONFIG.CURRENT_PAGE_LOADER
                    ]
                }
            },
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                optional: true,
                _inputex: {
                    _type: "variableselect",
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
                Wegas.Facade.VariableDescriptor.script.remoteEval(this.get("onClick"), {
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

            Wegas.Facade.VariableDescriptor.script.run(script, {
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
