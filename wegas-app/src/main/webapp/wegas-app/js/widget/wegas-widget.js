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

YUI.add("wegas-widget", function (Y) {
    "use strict";

    var Lang = Y.Lang,
    BOUNDING_BOX = "boundingBox",
    LEVEL = {
        "warn": "warn",
        "error": "error",
        "info": "info",
        "success": "success"
    },
    destroySelf = function () {
        if (!this._node) {
            return;                                                             // The node has already been destroyed
        }

        if (this.timeout) {
            this.timeout.cancel();
        }
        this.closeHandler.detach();
        var anim = new Y.Anim({
            node: this,
            to: {
                opacity: 0
            },
            duration: 0.2
        });
        anim.on("end", this.remove, this, true);
        anim.run();
    };

    function Widget() {
        this.after("render", function () {
            var bb = this.get(BOUNDING_BOX);
            bb.addClass("wegas-widget");
            if (this.get("cssClass")) {
                bb.addClass(this.get("cssClass"));
            }
        });
        this.constructor.CSS_PREFIX = this.constructor.CSS_PREFIX               // If no prefix is set, use the name (without
            || this.constructor.NAME.toLowerCase();                                 // the usual "yui3-" prefix)
        this._cssPrefix = this.constructor.CSS_PREFIX;

        this.publish("exception", {
            emitFacade: true
        });
    }

    Y.mix(Widget.prototype, {

        defaultExceptionHandler: function (e) {
            this.fire("exception", e.response.results);
        },

        showOverlay: function () {
            this.get(BOUNDING_BOX)
            .addClass("wegas-loading")
            .prepend("<div class='wegas-loading-overlay'></div>");
        },

        hideOverlay: function () {
            this.get(BOUNDING_BOX)
            .removeClass("wegas-loading")
            .all("> .wegas-loading-overlay").remove(true);
        },

        emptyMessage: function () {						// Form msgs logic
            var msgNode = this.get(BOUNDING_BOX).one(".wegas-systemmessage");
            if (!msgNode) {
                return;
            }
            msgNode.empty();
        },

        showMessage: function (level, txt, timeout) {
            var msgNode = this.getMessageNode(),
            message = Y.Node.create("<div class='" + (LEVEL[level] || "") + "'><span class='icon'></span><span class='content'>" + txt + "</span><span class='close'></span></div>");
            if (level === "success" && !timeout) {                              // @hack successful messages disapear automatically
                if (this.toolbar instanceof Y.Plugin.WidgetToolbar) {
                    this.setStatusMessage(txt);
                    return;
                } else {
                    timeout = 800;
                }
            }
            msgNode.append(message);
            message.closeHandler = message.one(".close").once("click", destroySelf, message);

            if (timeout) {
                message.timeout = Y.later(timeout, message, destroySelf);
            }
        },

        getMessageNode: function () {
            var msgNode = this.get(BOUNDING_BOX).one(".wegas-systemmessage");
            if (!msgNode) {
                this.get(BOUNDING_BOX).append("<div class='wegas-systemmessage'></div>");
                return this.get(BOUNDING_BOX).one(".wegas-systemmessage");
            }
            return msgNode;
        },
        setStatusMessage: function (txt) {
            var statusNode = this._getStatusNode();
            if (statusNode === null) {
                return false;
            }
            statusNode.setContent(txt);
            return true;
        },
        _getStatusNode: function () {
            var statusNode;
            if (!(this.toolbar instanceof Y.Plugin.WidgetToolbar)) {
                return null;
            }
            statusNode = this.toolbar.get("header").one(".wegas-status-message");
            if (!statusNode) {
                statusNode = new Y.Node.create("<span class='wegas-status-message'></span>");
                this.toolbar.get("header").append(statusNode);
            }
            return statusNode;
        },
        //Get Class From plugin name. Hopefully a unique name ...
        _getPluginFromName: function (name) {
            var i;
            for (i in Y.Plugin) {
                if (Y.Plugin[i].NAME === name) {
                    return "" + i;
                }
            }
            return undefined;
        }

    });

    Y.mix(Widget, {

        /**
         *  Defines edition menu to be used in editor
         */
        //EDITMENU: [{
        //    type: "EditEntityButton"
        //}, {
        //    type: "DeleteEntityButton"
        //}],

        ATTRS: {
            "@pageId": {
                type: "string",
                optional: true,
                value: undefined,
                format: "number",
                _inputex: {
                    _type: "hidden",
                    value: undefined
                },
                validator: function (s) {
                    return (s === undefined || (Y.Lang.isString(s) && s.lenght > 0) || Y.Lang.isNumber(s));
                }
            },
            type: {
                type: "string",
                _inputex: {
                    _type: "hidden"
                }
            },
            cssClass: {
                type: "string",
                optional: true,
                _inputex: {
                    label: "CSS class"
                }
            },
            initialized: {
                "transient": true
            },
            destroyed: {
                "transient": true
            },
            id: {
                "transient": true
            },
            rendered: {
                "transient": true
            },
            boundingBox: {
                "transient": true
            },
            contentBox: {
                "transient": true
            },
            selection: {
                "transient": true
            },
            tabIndex: {
                "transient": true
            },
            focused: {
                "transient": true
            },
            disabled: {
                "transient": true
            },
            visible: {
                "transient": true
            },
            height: {
                "transient": true
            },
            width: {
                "transient": true
            },
            strings: {
                "transient": true
            },
            render: {
                "transient": true
            },
            srcNode: {
                "transient": true
            },
            selected: {
                "transient": true
            },
            index: {
                "transient": true
            },
            parent: {
                "transient": true
            },
            depth: {
                "transient": true
            },
            root: {
                "transient": true
            },
            multiple: {
                "transient": true
            },
            plugins: {                                                          //For serialization purpose, get plugin configs
                getter: function () {
                    var i, p = [], plg;
                    for (i in this._plugins) {
                        plg = this[this._plugins[i].NS];
                        if (plg.toObject) {
                            p.push({
                                "fn": this._getPluginFromName(this._plugins[i].NAME),   //TODO: find an other referencing way
                                "cfg": plg.toObject()
                            });
                        }
                    }
                    return (p.length > 0 ? p : undefined);
                },
                optional: true,
                type: "array",
                "transient": true,
                _inputex: {
                    useButtons: true,
                    _type: "editablelist",
                    label: "Plugins"
                }
            }
        },

        /**
         *
         */
        create: function (config) {
            var child, Fn, type = config.childType || config.type;

            if (type) {
                Fn = Lang.isString(type) ? Y.Wegas[type] || Y[type] : type;
            }

            if (Lang.isFunction(Fn)) {
                child = new Fn(config);
            } else {
                Y.log("Could not create a child widget because its constructor is either undefined or invalid(" + type + ").", "error", "Wegas.Widget");
            }

            return child;
        },

        /**
         * Load the modules from an Wegas widget definition
         */
        use: function (cfg, cb) {
            Y.Wegas.Editable.use(cfg, cb);
        },

        /**
         *
         *  This getter is to be used for any object attribute that references a VariableDescriptor and
         *  has either an name, id or expr parameter.
         *
         */
        VARIABLEDESCRIPTORGETTER: function (val, fullName) {
            var ds = Y.Wegas.VariableDescriptorFacade;
            if (val && fullName.split(".")[1] === "evaluated") {                // If evaluated value is required

                if (val.name) {                                                 // Eval based on the name field
                    val.evaluated = ds.rest.find('name', val.name);

                } else if (val.expr) {                                          // if absent evaluate the expr field
                    val.evaluated = ds.rest.findById(Y.Wegas.VariableDescriptorFacade.script.scopedEval(val.expr));

                } else if (val.id) {
                    val.evaluated = ds.rest.findById(val.id);
                }
            }

            if (val && fullName.indexOf(".") < 0) {                             // If the getter requires the full object (e.g. serialisation)
                delete val.evaluated;                                           // Remove the ref to the evaluated descriptor
            }

            return val;
        }
    });

    Y.namespace("Wegas").Widget = Widget;

    /**
     * @hack We override this function so widget are looked for in Wegas ns.
     */
    Y.WidgetParent.prototype._createChild = function (config) {
        var defaultType = this.get("defaultChildType"),
        altType = config.childType || config.type,
        child,
        Fn,
        FnConstructor;

        if (altType) {
            Fn = Lang.isString(altType) ? Y.Wegas[altType] || Y[altType] : altType;           // @hacked
        }

        if (Lang.isFunction(Fn)) {
            FnConstructor = Fn;
        } else if (defaultType) {
            // defaultType is normalized to a function in it's setter
            FnConstructor = defaultType;
        }

        if (FnConstructor) {
            child = new FnConstructor(config);
        } else {
            Y.error("Could not create a child instance because its constructor is either undefined or invalid (" + altType + ")");
        }
        return child;
    };

    /*
     * @hack Override so plugin host accepts string definition of classes and
     * look it up in the Y.Wegas.* package.
     */
    var newPlug = Y.DataSource.IO.prototype.plug = function (Plugin, config) {
        var i, ln, ns;

        if (Lang.isArray(Plugin)) {
            for (i = 0, ln = Plugin.length; i < ln; i += 1) {
                this.plug(Plugin[i]);
            }
        } else {
            if (Plugin && !Lang.isFunction(Plugin)) {
                config = Plugin.cfg;
                Plugin = Plugin.fn;
            }
            if (Plugin && !Lang.isFunction(Plugin)) {			// @hacked
                Plugin = Y.Plugin[Plugin];
            }

            // Plugin should be fn by now
            if (Plugin && Plugin.NS) {
                ns = Plugin.NS;

                config = config || {};
                config.host = this;

                if (this.hasPlugin(ns)) {
                    // Update config
                    this[ns].setAttrs(config);
                } else {
                    // Create new instance
                    this[ns] = new Plugin(config);
                    this._plugins[ns] = Plugin;
                }
            }
        }
        return this;
    };
    Y.Widget.prototype.plug = newPlug;
    Y.DataSource.IO.prototype.plug = newPlug;
});
