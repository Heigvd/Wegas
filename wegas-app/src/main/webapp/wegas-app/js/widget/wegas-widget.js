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
YUI.add("wegas-widget", function(Y) {
    "use strict";

    var Lang = Y.Lang,
            BOUNDING_BOX = "boundingBox",
            LEVEL = {
        "warn": "warn",
        "error": "error",
        "info": "info",
        "success": "success"
    },
    /**
     * @function
     * @private
     * @description Destroy itself and detach all function closed.
     */
    destroySelf = function() {
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

    /**
     * @name Y.Wegas.Widget
     * @class Extension common to all wegas widgets
     */
    function Widget() {
        this.after("render", function() {
            var bb = this.get(BOUNDING_BOX);
            bb.addClass("wegas-widget");
            if (this.get("cssClass")) {
                bb.addClass(this.get("cssClass"));
            }
        });
        this.constructor.CSS_PREFIX = this.constructor.CSS_PREFIX               // If no prefix is set, use the name (without
                || this.constructor.NAME.toLowerCase();                         // the usual "yui3-" prefix)
        this._cssPrefix = this.constructor.CSS_PREFIX;

        this.publish("exception", {
            emitFacade: true
        });
    }

    Y.mix(Widget.prototype, {
        /** @lends Y.Wegas.Widget# */

        /**
         * @function
         * @private
         * @description function to fire an exception (event 'exception').
         */
        defaultExceptionHandler: function(e) {
            this.fire("exception", e.response.results);
        },
        /**
         * @function
         * @private
         * @description show an loading - overlay on all the screen.
         */
        showOverlay: function() {
            this.get(BOUNDING_BOX)
                    .addClass("wegas-loading")
                    .prepend("<div class='wegas-loading-overlay'></div>");
        },
        /**
         * @function
         * @private
         * @description hide overlay (see function showOverlay).
         */
        hideOverlay: function() {
            this.get(BOUNDING_BOX)
                    .removeClass("wegas-loading")
                    .all("> .wegas-loading-overlay").remove(true);
        },
        /**
         * @function
         * @private
         * @description clear message (see function 'showMessage')
         */
        emptyMessage: function() {						// Form msgs logic
            var msgNode = this.get(BOUNDING_BOX).one(".wegas-systemmessage");
            if (!msgNode) {
                return;
            }
            msgNode.empty();
        },
        /**
         * Display a closable message with a status-image.
         * Status-image of message depends of level parameters
         * Txt parameters is the displayed text.
         * Timeout is the displaying time of this message.
         * @function
         * @private
         * @param level
         * @param txt
         * @param timeout
         * @description
         */
        showMessage: function(level, txt, timeout) {
            var msgNode = this.getMessageNode(),
                    message = Y.Node.create("<div class='" + (LEVEL[level] || "") + "'><span class='icon'></span><span class='content'>" + txt + "</span><span class='close'></span></div>");
            if (level === "success" && !timeout) {                          // @hack successful messages disapear automatically
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
        /**
         * @function
         * @private
         * @description get the message node of the current page.
         * If '.wegas-systemmessage' doesn't exist, create it.
         */
        getMessageNode: function() {
            var msgNode = this.get(BOUNDING_BOX).one(".wegas-systemmessage");
            if (!msgNode) {
                this.get(BOUNDING_BOX).append("<div class='wegas-systemmessage'></div>");
                return this.get(BOUNDING_BOX).one(".wegas-systemmessage");
            }
            return msgNode;
        },
        /**
         * @function
         * @private
         * @param txt
         * @return boolean true is status is set.
         * @description set content of the message.
         */
        setStatusMessage: function(txt) {
            var statusNode = this._getStatusNode();
            if (statusNode === null) {
                return false;
            }
            statusNode.setContent(txt);
            return true;
        },
        /**
         * @function
         * @private
         * @param txt
         * @return Status node
         * @description get the status node of the message.
         * if 'wegas-status-message' doesn't exist, create and return it
         */
        _getStatusNode: function() {
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
        /**
         * @function
         * @private
         * @param txt
         * @return Status node
         * @description Get Class From plugin name. Hopefully a unique name ...
         */
        _getPluginFromName: function(name) {
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
        /**
         * @lends Y.Wegas.Widget
         */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>@pageId: Number of the page</li>
         *    <li>type: Type of the widget</li>
         *    <li>cssClass: Class to add at bounding box</li>
         *    <li>initialized: Informe if widget initialized. Transient</li>
         *    <li>destroyed: Informe if widget is destroyed. Transient</li>
         *    <li>id: Id of the widget. Transient</li>
         *    <li>rendered: Informe if widget is rendered. Transient</li>
         *    <li>boundingBox: Bounding box of the widget. Transient</li>
         *    <li>contentBox: Content box of the widget. Transient</li>
         *    <li>selection: Widget selection. Transient</li>
         *    <li>tabIndex: Index in tab. Transient</li>
         *    <li>focused: Informe if widget is focused. Transient</li>
         *    <li>disabled: Informe if widget is disable. Transient</li>
         *    <li>visible: Informe if widget is visible. Transient</li>
         *    <li>height: Height of the widget. Transient</li>
         *    <li>width:. Width of the widgetTransient</li>
         *    <li>strings: Content of the widget. Transient</li>
         *    <li>render: Informe if widget is rendering. Transient</li>
         *    <li>srcNode: Source node of the widget. Transient</li>
         *    <li>selected: Widget selected. Transient</li>
         *    <li>index: Index of the widget. Transient</li>
         *    <li>parent: Parent of the widget. Transient</li>
         *    <li>depth: Depth of the widget. Transient</li>
         *    <li>root: Root of the widget. Transient</li>
         *    <li>multiple: Widget is multiple. Transient</li>
         *    <li>plugins: Plugins attached to the widget</li>
         * </ul>
         */
        ATTRS: {
            /**
             * Number of the page
             */
            "@pageId": {
                type: "string",
                optional: true,
                value: undefined,
                format: "number",
                _inputex: {
                    _type: "hidden",
                    value: undefined
                },
                validator: function(s) {
                    return (s === undefined || (Y.Lang.isString(s) && s.lenght > 0) || Y.Lang.isNumber(s));
                }
            },
            /**
             * Type of the widget
             */
            type: {
                type: "string",
                _inputex: {
                    _type: "hidden"
                }
            },
            /**
             * Class to add at bounding box
             */
            cssClass: {
                type: "string",
                optional: true,
                _inputex: {
                    label: "CSS class"
                },
                getter: function(val) {
                    if (val === "") {
                        return undefined;       // so this attr wont appear in serialization
                    } else {
                        return val;
                    }
                }
            },
            /**
             * Informe if widget initialized. Transient
             */
            initialized: {
                "transient": true
            },
            /**
             * Informe if widget is destroyed. Transient
             */
            destroyed: {
                "transient": true
            },
            /**
             * Id of the widget. Transient
             */
            id: {
                "transient": true
            },
            /**
             * Informe if widget is rendered. Transient
             */
            rendered: {
                "transient": true
            },
            /**
             * Bounding box of the widget. Transient
             */
            boundingBox: {
                "transient": true
            },
            /**
             * Content box of the widget. Transient
             */
            contentBox: {
                "transient": true
            },
            /**
             * Widget selection. Transient
             */
            selection: {
                "transient": true
            },
            /**
             * Index in tab. Transient
             */
            tabIndex: {
                "transient": true
            },
            /**
             * Informe if widget is focused. Transient
             */
            focused: {
                "transient": true
            },
            /**
             * Informe if widget is disable. Transient
             */
            disabled: {
                "transient": true
            },
            /**
             * Informe if widget is visible. Transient
             */
            visible: {
                "transient": true
            },
            /**
             * Height of the widget. Transient
             */
            height: {
                "transient": true
            },
            /**
             * Width of the widgetTransient
             */
            width: {
                "transient": true
            },
            /**
             * Content of the widget. Transient
             */
            strings: {
                "transient": true
            },
            /**
             * Informe if widget is rendering. Transient
             */
            render: {
                "transient": true
            },
            /**
             * Source node of the widget. Transient
             */
            srcNode: {
                "transient": true
            },
            /**
             * Widget selected. Transient
             */
            selected: {
                "transient": true
            },
            /**
             *Iindex of the widget. Transient
             */
            index: {
                "transient": true
            },
            /**
             * Parent of the widget. Transient
             */
            parent: {
                "transient": true
            },
            /**
             * Depth of the widget. Transient
             */
            depth: {
                "transient": true
            },
            /**
             * Root of the widget. Transient
             */
            root: {
                "transient": true
            },
            /**
             * Widget is multiple. Transient
             */
            multiple: {
                "transient": true
            },
            /**
             * Plugins attached to the widget
             */
            plugins: {//For serialization purpose, get plugin configs
                getter: function() {
                    var i, p = [], plg;
                    for (i in this._plugins) {
                        plg = this[this._plugins[i].NS];
                        if (plg.toObject) {
                            p.push({
                                "fn": this._getPluginFromName(this._plugins[i].NAME), //TODO: find an other referencing way
                                "cfg": plg.toObject("type")
                            });
                        }
                    }
                    return (p.length > 0 ? p : undefined);
                },
                optional: true,
                type: "array",
                "transient": false,
                _inputex: {
                    useButtons: true,
                    _type: "editablelist",
                    label: "Plugins"
                }
            }
        },
        /**
         * @function
         * @private
         * @param config
         * @return child
         * @description function to create and return a widget with the given
         *  configuration. Log an exception if creation isn't possible.
         */
        create: function(config) {
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
         * @function
         * @private
         * @param cfg, cb
         * @description Load the modules from an Wegas widget definition
         */
        use: function(cfg, cb) {
            Y.Wegas.Editable.use(cfg, cb);
        },
        /**
         *
         *  This getter is to be used for any object attribute that references a VariableDescriptor and
         *  has either an name, id or expr parameter.
         *
         */
        /**
         * @function
         * @private
         * @param cfg, cb
         * @return value
         * @description This getter is to be used for any object attribute
         *  that references a VariableDescriptor and has either an name, id
         *  or expr parameter.
         */
        VARIABLEDESCRIPTORGETTER: function(val, fullName) {
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
    Y.WidgetParent.prototype._createChild = function(config) {
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
    Y.DataSource.IO.prototype.plug = function(Plugin, config) {
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
    Y.Widget.prototype.plug = Y.DataSource.IO.prototype.plug;
});
