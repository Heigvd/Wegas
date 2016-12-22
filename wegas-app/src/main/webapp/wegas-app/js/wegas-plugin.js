/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-plugin", function(Y) {
    "use strict";

    var HOST = "host",
        Plugin = Y.Plugin,
        Wegas = Y.namespace("Wegas"),
        PREVIEW_PAGELOADER_ID = "previewPageLoader",
        PAGELOADER_CONFIG = {
            FULL_PAGE: {
                display: "<i>Entire page</i>",
                label: "Entire page",
                value: "Entire page"
            },
            CURRENT_PAGE_LOADER: {
                display: "<i>Current page display</i>",
                label: "Current page display",
                value: "Current page display"
            }
        };

    /**
     *  @name Y.Wegas.Plugin
     *  @class Extension that adds editable capacities to plugins
     *  @extends Y.Plugin
     *  @constructor
     */
    Wegas.Plugin = function() {
    };
    Y.mix(Wegas.Plugin.prototype, {
        showMessage: function() {
            return this.get(HOST).showMessage.apply(this.get(HOST), arguments);
        },
        showOverlay: function() {
            return this.get(HOST).showOverlay();
        },
        hideOverlay: function() {
            return this.get(HOST).hideOverlay();
        }
    });
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
            for (var i in Plugin) {
                if (Plugin[i].NAME === name) {
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
            this.get(HOST).get("boundingBox").addClass("wegas-" + this.get("targetEvent"));
            this.onHostEvent(this.get("targetEvent"), this.execute);
        },
        /**
         * @function
         * @protected
         */
        execute: function() {
            Y.error("Y.Plugin.Action.execute() is abstract, should be overridden");
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                if (this.handlers[i].detach) { // EventHandle
                    this.handlers[i].detach();
                } else if (this.handlers[i].cancel) { //Timer
                    this.handlers[i].cancel();
                }
            }
        }
    }, {
        NS: "wegas",
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
     *  @name Y.Plugin.FireAndForgetRequestAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var FireAndForgetRequestAction = Y.Base.create("FireAndForgetRequest", Action, [], {
        execute: function() {
            Y.io(Y.Wegas.app.get("base") + this.get("url"), {
                "method": this.get("method"),
                "data": this.get("data"),
                "headers": {"Content-Type": "application/json"}
            });
        }
    }, {
        NS: "fireandforgetrequestaction",
        ATTRS: {
            url: {
                type: "string",
                _inputex: {
                    label: "Url"
                }
            },
            method: {
                type: "string",
                value: "GET",
                choices: [{
                        value: "GET"
                    }, {
                        value: "POST"
                    }, {
                        value: "DELETE"
                    }, {
                        value: "PUT"
                    }
                ],
                _inputex: {
                    label: ""
                }
            },
            data: {
                type: "string"
            }
        }
    });
    Plugin.FireAndForgetRequestAction = FireAndForgetRequestAction;
    /**
     *  @class
     *  @name Y.Plugin.OpenUrlAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var OpenUrlAction = Y.Base.create("OpenUrlAction", Action, [], {
        execute: function() {
            this.open(this.get("url"));
        },
        open: function(url) {
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
        ATTRS: {
            url: {
                type: "string",
                _inputex: {
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
    var PrintActionPlugin = Y.Base.create("PrintActionPlugin", Action, [], {
        execute: function() {
            var outputType = this.get("outputType"),
                displayPath = this.get("displayPath"),
                title = this.get("title.evaluated"),
                playerId = Wegas.Facade.Game.get("currentPlayerId"),
                roots = this.get("root.evaluated"),
                root = "",
                printUrl;

            if (roots) {
                if (!Y.Lang.isArray(roots)) {
                    roots = [roots];
                }
                Y.Array.each(roots, function(d) {
                    root += d.get("name") + ",";
                }, this);
                root = root.slice(0, -1);
            }

            printUrl = Wegas.app.get("base") + "print.html?id=" + playerId +
                "&outputType=" + outputType +
                "&displayPath=" + displayPath +
                (title ? "&title=" + title : "") +
                "&root=" + encodeURIComponent(root);
            window.open(printUrl);
        }
    }, {
        NS: "PrintActionPlugin",
        ATTRS: {
            root: {
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Variable"
                }
            },
            title: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Variable"
                }
            },
            /**
             * Can be "html" or "pdf"
             */
            outputType: {
                type: "string",
                value: "html",
                choices: ["html", "pdf"],
                _inputex: {
                    label: "output type"
                }
            },
            displayPath: {
                type: "string",
                value: "true",
                choices: ["true", "false"],
                _inputex: {
                    label: "Display Path"
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
    var OpenPageAction = Y.Base.create("OpenPageAction", Action, [], {
        initializer: function() {
            this.afterHostEvent("render", function() {
                var targetPageLoader = this._getTargetPageLoader();
                if (targetPageLoader) {
                    this.get(HOST).set("selected",
                        ("" + targetPageLoader.get("pageId") === "" + this._subpage()) ? 2 : 0);
                    this.handlers.push(targetPageLoader.after("pageIdChange", function() {
                        try {
                            this.get(HOST).set("selected",
                                ("" + targetPageLoader.get("pageId") === "" + this._subpage()) ? 2 : 0);
                        } catch (e) {
                            //no more node...
                        }
                    }, this));
                }
            }, this);
        },
        execute: function() {
            var targetPageLoader = this._getTargetPageLoader();
            if (!targetPageLoader || this.get(HOST).get("disabled")) {
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
            var targetPageLoader,
                plID = this.get("targetPageLoaderId");
            switch (plID) {
                case PAGELOADER_CONFIG.FULL_PAGE.value:
                    targetPageLoader = Wegas.PageLoader.find(PREVIEW_PAGELOADER_ID);
                    break;
                case PAGELOADER_CONFIG.CURRENT_PAGE_LOADER.value:
                    targetPageLoader = Y.Widget.getByNode(this.get(HOST).get("root").get("boundingBox").ancestor());
                    break;
                default:
                    targetPageLoader = Wegas.PageLoader.find(plID);
            }
            return targetPageLoader;
        },
        _subpage: function() {
            if (this.get("variable.content")) {
                var variable = this.get("variable.evaluated");
                if (variable) {
                    return variable.getInstance().get("value");
                }
            }
            return this.get("subpageId");
        }
    }, {
        NS: "OpenPageAction",
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
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
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
    var ExecuteScriptAction = Y.Base.create("ExecuteScriptAction", Action, [], {
        execute: function() {
            if (!this.get(HOST).get("disabled")) {
                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    this.showOverlay();
                    Wegas.Facade.Variable.script.remoteEval(this.get("onClick"), {
                        on: {
                            success: Y.bind(function() {
                                this.hideOverlay();
                            }, this),
                            failure: Y.bind(this.hideOverlay, this)
                        }
                    });
                }, this));
            }
        }
    }, {
        NS: "ExecuteScriptAction",
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
     *  @name Y.Plugin.PlaySoundAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var PlaySoundAction = Y.Base.create("PlaySoundAction", Action, [], {
        execute: function() {
            var audio, url;
            url = Y.Plugin.Injector.getImageUri(this.get("url"));

            if (Y.Lang.isFunction(window.Audio)) {
                audio = new Audio(url);
                audio.play();
            } else {
                new Wegas.Panel({
                    bodyContent: "<div class=''> <span class=\"fa fa-4x fa-bullhorn\"></span> <span>Please listen to that <a target=\"_blank\" href=\"" +
                        url +
                        "\">sound</a>. <br /><br /><p style=\"font-size: 0.6em;color: rgba(153, 153, 153, 0.99);\">(And, btw, upgrade your browser...)</p><span></div>",
                }).render();
            }
        }
    }, {
        NS: "PlaySoundAction",
        ATTRS: {
            url: {
                value: "",
                type: "string",
                _inputex: {
                    label: "Sound",
                    _type: "wegasurl"
                }
            }
        }
    });
    Plugin.PlaySoundAction = PlaySoundAction;

    /**
     *  @class
     *  @name Y.Plugin.ConfirmExecuteScriptAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var ConfirmExecuteScriptAction = Y.Base.create("ConfirmExecuteScriptAction", ExecuteScriptAction, [], {
        execute: function() {
            if (!this.get(HOST).get("disabled")) {
                Wegas.Panel.confirm(Y.Template.Micro.compile(this.get("message") || "")(),
                    Y.bind(ConfirmExecuteScriptAction.superclass.execute, this));
            }
        }
    }, {
        NS: "ExecuteScriptAction",
        ATTRS: {
            message: {
                type: "string",
                value: "",
                _inputex: {
                    label: "message"
                }
            }
        }
    });
    Plugin.ConfirmExecuteScriptAction = ConfirmExecuteScriptAction;

    /**
     *  @class
     *  @name Y.Plugin.SaveObjectAction
     *  @extends Y.Plugin.Action
     *  @constructor
     */
    var SaveObjectAction = Y.Base.create("SaveObjectAction", Action, [], {
        execute: function(e) {
            var overlayGuest, i,
                host = this.get(HOST),
                guest = host.get("root"),
                variable = this.get("variable.evaluated"),
                data = "var objProp = Variable.find(gameModel, \"" + variable.get("name") + "\").getInstance(self)" + ".properties;",
                script = data + (this.get("clearStorage") ? "objProp.clear();" : "");

            if (guest.showOverlay && guest.hideOverlay) {
                overlayGuest = guest;
                overlayGuest.showOverlay();
            }

            for (i in e.value) {
                script += "objProp.put('" + (i + "").replace(/'/g, "\\'") + "','" +
                    (e.value[i] + "").replace(/'/g, "\\'") + "');";
            }

            Wegas.Facade.Variable.script.run(script, {
                on: {
                    success: function() {
                        overlayGuest && overlayGuest.hideOverlay();
                    },
                    failure: function() {
                        overlayGuest && overlayGuest.hideOverlay();
                    }
                }
            });
        }
    }, {
        NS: "SaveObjectAction",
        ATTRS: {
            variable: {
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
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
