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
YUI.add("wegas-widget", function(Y) {
    "use strict";
    var Lang = Y.Lang,
            BOUNDING_BOX = "boundingBox",
            baseCreateChild = Y.WidgetParent.prototype._createChild,
            basePlug = Y.Widget.prototype.plug,
            rebuild;
    rebuild = function() {
        var parent, index, cfg;
        if (this.isRoot()) {
            parent = Y.Widget.getByNode(this.get(BOUNDING_BOX).get("parentNode"));
            parent.reload();
            return parent.get("widget"); // dependencies should (and must) be loaded by now that way we obtain the new widget
        }
        parent = this.get("parent");
        index = parent.get("children").indexOf(this);
        cfg = this.toObject();
        this.destroy();
        return parent.add(cfg, index).item(0);
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

        this.publish("showOverlay", {// Add custom event
            emitFacade: true
        });
        this.publish("hideOverlay", {
            emitFacade: true
        });
        this.publish("message", {
            emitFacade: true
        });
        this.publish("AttributesChange", {
            defaultFn: function() {
                var widget = rebuild.call(this);
                if (Y.Plugin.EditEntityAction.currentEntity === this) {
                    Y.Plugin.EditEntityAction.currentEntity = widget;
                }
            }
        });
    }

    Y.mix(Widget.prototype, {
        /** @lends Y.Wegas.Widget# */

        /**
         * @function
         * @private
         */
        defaultFailureHandler: function(e) {
            this.hideOverlay();
            var error = e.response.message || e.response.results.message || "Error during request.",
                    test = error.match(/ConstraintViolationException: (.*) is out of bound/);
            if (test) {
                this.showMessageBis("error", "You don't have enough " + test[1] + ".");
            } else {
                this.showMessageBis("error", error);
            }
            // e.halt(true);
        },
        /**
         * @function
         * @private
         * @description show an loading - overlay on all the screen.
         */
        showOverlay: function() {
            this.fire("wegas:showOverlay")
            // this.emitDOMMessage("showOverlay");
        },
        /**
         * @function
         * @private
         * @description hide overlay (see function showOverlay).
         */
        hideOverlay: function() {
            this.fire("wegas:hideOverlay");
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
         *
         * @deprecated Will be replace by showMessageBis
         */
        showMessage: function(level, txt, timeout) {
            this.emitDOMMessage(level, {content: txt, timeout: timeout});
        },
        emitDOMMessage: function() {
            var bb = this.get("boundingBox");
            bb.emitDOMMessage.apply(bb, arguments);
        },
        /**
         * Will replace the original showMessage
         */
        showMessageBis: function(level, msg, timeout) {
            this.fire("wegas:message", {
                level: level,
                content: msg,
                timeout: timeout
            });
        },
        highlight: function(bool) {
            if (!this.get("destroyed")) {
                bool ? this.get(BOUNDING_BOX).addClass("highlighted") : this.get(BOUNDING_BOX).removeClass("highlighted");
            }
        }
    });
    Y.mix(Widget, {
        /**
         *  Defines edition menu to be used in editor
         */
        EDITMENU: [{
                type: "Button",
                label: "Edit",
                cssClass: "editor-exploreGameModel-button",
                plugins: [{
                        fn: "EditWidgetAction"
                    }]
            }, {
                type: "Button",
                label: "Delete",
                cssClass: "editor-exploreGameModel-button",
                plugins: [{
                        fn: "DeleteWidgetAction"
                    }]
            }],
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
         *    <li>activeDescendant: Currently focused child</li>
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
                    return (s === undefined || (Y.Lang.isString(s) && s.length > 0) || Y.Lang.isNumber(s));
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
                    label: "CSS class",
                    index: 4,
                    wrapperClassName: "wegas-advanced-feature"
                },
                getter: Y.Wegas.Editable.removeNullValue
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
                "transient": false,
                value: undefined,
                optional: true,
                type: "string",
                getter: function(v) {
                    if (v === "" || ("" + v).indexOf("yui") === 0) {
                        return undefined;
                    } else {
                        return v;
                    }
                },
                _inputex: {
                    _type: "hidden"
                }
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
             * currently focused child
             */
            activeDescendant: {
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
                "transient": true,
                _inputex: {
                    index: 9
                }
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
                                "fn": Y.Wegas.Plugin.getPluginFromName(this._plugins[i].NAME), //TODO: find an other referencing way
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
                    index: 10,
                    useButtons: true,
                    _type: "pluginlist",
                    legend: "Plugins",
                    items: [{
                            type: "Button",
                            label: "On click",
                            plugins: [{
                                    fn: "WidgetMenu",
                                    cfg: {
                                        menuCfg: {
                                            points: ["tl", "tr"]
                                        },
                                        event: "mouseenter",
                                        children: [{
                                                type: "Button",
                                                label: "Open page",
                                                data: "OpenPageAction"
                                            }, {
                                                type: "Button",
                                                label: "Impact variables",
                                                data: "ExecuteScriptAction"
                                            }]
                                    }
                                }]
                        }, {
                            type: "Button",
                            label: "Styles",
                            plugins: [{
                                    fn: "WidgetMenu",
                                    cfg: {
                                        menuCfg: {
                                            points: ["tl", "tr"]
                                        },
                                        event: "mouseenter",
                                        children: [{
                                                type: "Button",
                                                label: "Tooltip",
                                                data: "Tooltip"
                                            }, {
                                                type: "Button",
                                                label: "Background",
                                                data: "CSSBackground"
                                            }, {
                                                type: "Button",
                                                label: "Position",
                                                data: "CSSPosition"
                                            }, {
                                                type: "Button",
                                                label: "Size",
                                                data: "CSSSize"
                                            }, {
                                                type: "Button",
                                                label: "Text",
                                                data: "CSSText"
                                            }, {
                                                type: "Button",
                                                label: "Other styles",
                                                data: "CSSStyles"
                                            }]
                                    }
                                }]
                        }, {
                            type: "Button",
                            label: "Animations",
                            plugins: [{
                                    fn: "WidgetMenu",
                                    cfg: {
                                        menuCfg: {
                                            points: ["tl", "tr"]
                                        },
                                        event: "mouseenter",
                                        children: [{
                                                type: "Button",
                                                label: "Show after",
                                                data: "ShowAfter"
                                            }, {
                                                type: "Button",
                                                label: "Hide after",
                                                data: "HideAfter"
                                            }]
                                    }
                                }]
                        }]
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
         * @param cfg
         * @param {function} cb
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
            var ds = Y.Wegas.Facade.VariableDescriptor;
            if (val && fullName.split(".")[1] === "evaluated") {                // If evaluated value is required

                if (val.name) {                                                 // Eval based on the name field
                    val.evaluated = ds.cache.find('name', val.name);

                } else if (val.expr) {                                          // if absent evaluate the expr field
                    try {
                        val.evaluated = ds.cache.findById(Y.Wegas.Facade.VariableDescriptor.script.localEval(val.expr));
                    } catch (e) {
                        Y.log("Unable to read expression: " + val.expr, "error", "Wegas.Widget");
                        val.evaluated = null;
                    }

                } else if (val.id) {
                    val.evaluated = ds.cache.findById(val.id);
                }
            }

            if (val && fullName.indexOf(".") < 0) {                             // If the getter requires the full object (e.g. serialisation)
                delete val.evaluated;                                           // Remove the ref to the evaluated descriptor
            }

            return val;
        },
        _buildCfg: {
            aggregates: ["EDITMENU"]
        }
    });
    Y.namespace("Wegas").Widget = Widget;
    /**
     * @hack We override this function so widget are looked for in Wegas ns.
     */
    Y.WidgetParent.prototype._createChild = function(config) {
        var altType = config.childType || config.type;
        if (altType) {
            config.childType = Y.Lang.isString(altType) ? Y.Wegas[altType] || Y[altType] : altType;
        }
        return baseCreateChild.call(this, config);                                        //reroute
    };
    /*
     * @hack Override so plugin host accepts string definition of classes and
     * look it up in the Y.Wegas.* package.
     */
    Y.Widget.prototype.plug = function(Plugin, config) {
        if (!Lang.isArray(Plugin)) {
            if (Plugin && !Lang.isFunction(Plugin)) {
                config = Plugin.cfg;
                Plugin = Plugin.fn;
            }
            if (Plugin && !Lang.isFunction(Plugin)) {			// @hacked
                Plugin = Y.Plugin[Plugin];
            }
        }
        basePlug.call(this, Plugin, config);                                    //reroute
    };

    /**
     * Simulate a DOM Event bubbling up to a listener and stops.
     * @param {String} type
     * @param {Object} data
     */
    Y.Node.prototype.emitDOMMessage = function(type, data) {
        var ev = "dom-message:" + type;
        data = data || {};
        data.type = type;
        try {
            this.ancestor(function(node) {
                return node.getEvent(ev) ? true : false;
            }, true).fire(ev, data);
        } catch (e) {
            //no ancestor found
        }
    };
});
