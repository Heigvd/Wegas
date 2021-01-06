/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-widget', function(Y) {
    'use strict';
    var Lang = Y.Lang,
        Wegas = Y.Wegas,
        BOUNDING_BOX = 'boundingBox',
        BUTTON = 'Button',
        PARENT = 'parent';

    /**
     * @name Y.Wegas.Widget
     * @class Extension common to all wegas widgets
     */
    function Widget() {
        this.before('destroy', this.hideAllOverlay);
        /* When a child is going to be removed, hide its overlay */
        this.on('removeChild', function(e) {
            e.child.hideAllOverlay && e.child.hideAllOverlay();
        });
        this.after('render', function() {
            this.overlayCounter = 0;
            this.get(BOUNDING_BOX)
                .addClass('wegas-widget')
                .toggleClass(this.get('cssClass'), this.get('cssClass')); // Add cssClass atrribute if the widget has one

            Y.later(0, this, function() {
                this.get(BOUNDING_BOX)._node && this.get(BOUNDING_BOX)
                    .toggleClass('wegas-widget-editable', this.isEditable());
            });
        });
        this._cssPrefix = this.constructor.CSS_PREFIX =
            this.constructor.CSS_PREFIX || this.constructor.NAME.toLowerCase(); // If no prefix is set, use the name (without // the usual "yui3-" prefix)

        this.publish('showOverlay', {
            // Add custom event
            emitFacade: true
        });
        this.publish('hideOverlay', {
            emitFacade: true
        });
        this.publish('message', {
            emitFacade: true
        });
        this.publish('AttributesChange', {
            bubbles: false,
            defaultFn: function() {
                var widget = this.rebuild();
                if (Y.Plugin.EditEntityAction.currentEntity === this) {
                    // @FIXME @fx wtf?
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
         * @description show an loading - overlay on all the screen.
         */
        showOverlay: function(klass) {
            this.fire('wegas:showOverlay', klass);
            if (this.overlayCounter === undefined || this.overlayCounter <= 0) {
                this.overlayCounter = 1;
            } else {
                this.overlayCounter += 1;
            }
            return this;
        },
        /**
         * @function
         * @private
         * @description hide overlay (see function showOverlay).
         */
        hideOverlay: function(klass) {
            this.fire('wegas:hideOverlay', klass);
            if (this.overlayCounter === undefined || this.overlayCounter <= 0) {
                this.overlayCounter = 0;
            } else {
                this.overlayCounter -= 1;
            }
            return this;
        },
        hideAllOverlay: function() {
            while (this.overlayCounter > 0) {
                this.hideOverlay();
            }
            // If this is a Wegas.Parent, hide its children overlay too
            this.hideAllChildrenOverlay();
        },
        hideAllChildrenOverlay: function() {
            if (this.each) {
                this.each(function(child) {
                    child.hideAllOverlay && child.hideAllOverlay();
                });
            }
        },
        /**
         *
         * YUI Node's Delegate makes intensive use of the document.querySelectorAll function.
         * This function is quite slow on Firefox and MS Edge, escpecially when delegating to a very deep deep DOM.
         *
         * This wegasDelegate function imitates behaviour of the YUI one, but way faster.
         *
         * @param {String} type event to delegate
         * @param {Function} fn the one callback
         * @param {String} spec CSS selector to select children
         * @param {Objject} context thiz is the context
         * @param {any} extraArgs* extra args to provive to callback
         * @returns {EventHandle} the detach handle
         */
        wegasDelegate: function(type, fn, spec, context) {
            return Widget.wegasDelegate(this.get("contentBox"), type, fn, spec, context, Array.prototype.slice.call(arguments, 4));
        },
        /**
         * Same as wegasDelegate but with a keyPress parameter
         *
         * @param {String} type event to delegate
         * @param {Function} fn the one callback
         * @param {String} keyCode key spec
         * @param {String} spec CSS selector to select children
         * @param {Objject} context thiz is the context
         * @param {any} extraArgs* extra args to provive to callback
         * @returns {EventHandle} the detach handle
         */
        wegasDelegateKey: function(type, fn, keyCode, spec, context) {
            return Widget.wegasDelegateKey(this.get("contentBox"), type, fn, keyCode, spec, context, Array.prototype.slice.call(arguments, 5));
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
         */
        showMessage: function(level, txt, timeout) {
            this.fire('wegas:message', {
                level: level,
                content: txt,
                timeout: timeout
            });
            return this;
        },
        rebuild: function() {
            var parent, index, cfg;
            if (this.isRoot()) {
                parent = Y.Widget.getByNode(
                    this.get(BOUNDING_BOX).get('parentNode')
                    );
                parent.reload();
                return parent.get('widget'); // dependencies should (and must) be loaded by now that way we obtain the new widget
            }
            parent = this.get(PARENT);
            index = parent.indexOf(this);
            cfg = this.toObject();
            this.remove();
            this.destroy();
            return parent.add(cfg, index).item(0);
        },
        isPageRoot: function() {
            var ancestor;
            return this.isRoot && this.isRoot() && (ancestor = this.get("boundingBox")
                .ancestor()) && ancestor.hasClass("wegas-pageloader-content");
        },
        isEditable: function() {
            return (
                this.get('editable') &&
                !!(this.isPageRoot() ||
                    this.get(PARENT) &&
                    this.get(PARENT).isEditable &&
                    this.get(PARENT).isEditable())
                );
        },
        _enable: function(token) {
            this.disableCounter = this.disableCounter || {};
            delete this.disableCounter[token];
            if (Object.keys(this.disableCounter).length === 0) {
                this.enable();
            }
        },
        _disable: function(token) {
            this.disableCounter = this.disableCounter || {};
            this.disableCounter[token] = true;
            this.disable();
        }
    });
    Y.mix(Widget, {
        /** @lends Y.Wegas.Widget */
        /**
         *  Defines edition menu to be used in editor
         */
        EDITMENU: {
            editBtn: {
                index: -1,
                cfg: {
                    type: BUTTON,
                    label: "Edit",
                    plugins: [{
                            fn: "EditWidgetAction"
                        }]
                }
            },
            copyBtn: {
                index: 20,
                cfg: {
                    type: BUTTON,
                    label: "Duplicate",
                    plugins: [{
                            fn: "DuplicateWidgetAction"
                        }]
                }
            }, deleteBtn: {
                index: 30,
                cfg: {
                    type: BUTTON,
                    label: "Delete",
                    plugins: [{
                            fn: "DeleteWidgetAction"
                        }]
                }
            }
        },
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
             * editable specify if this widget may be edited in the scenarist's UI
             * If it was added as a child and it's parent is editable, this parameter is useless
             * Usefull if this widget is rendered by an other widget.
             * @type {Boolean} default to true
             */
            editable: {
                transient: true,
                value: true
            },
            /**
             * Number of the page
             */
            '@pageId': {
                type: 'string',
                optional: true,
                value: undefined,
                view: {
                    type: 'hidden'
                },
                validator: function(s) {
                    return (
                        s === undefined ||
                        (Y.Lang.isString(s) && s.length > 0) ||
                        Y.Lang.isNumber(s)
                        );
                }
            },
            /**
             * Type of the widget
             */
            type: {
                type: 'string',
                required: true,
                view: {
                    type: 'hidden'
                }
            },
            /**
             * Class to add at bounding box
             */
            cssClass: {
                type: ['null', 'string'],
                optional: true,
                index: 4,
                view: {
                    label: 'CSS class'
                },
                getter: Wegas.Editable.removeNullValue
            },
            /**
             * Informe if widget initialized. Transient
             */
            initialized: {
                transient: true
            },
            /**
             * Informe if widget is destroyed. Transient
             */
            destroyed: {
                transient: true
            },
            /**
             * Id of the widget.
             */
            id: {
                transient: false,
                value: undefined,
                type: ['string', 'number'],
                getter: function(v) {
                    if (v === '' || ('' + v).indexOf('yui') === 0) {
                        return undefined;
                    } else {
                        return v;
                    }
                },
                view: {
                    type: 'hidden'
                }
            },
            /**
             * Informe if widget is rendered. Transient
             */
            rendered: {
                transient: true
            },
            /**
             * Bounding box of the widget. Transient
             */
            boundingBox: {
                transient: true
            },
            /**
             * Content box of the widget. Transient
             */
            contentBox: {
                transient: true
            },
            /**
             * Widget selection. Transient
             */
            selection: {
                transient: true
            },
            /**
             * currently focused child
             */
            activeDescendant: {
                transient: true
            },
            /**
             * Index in tab. Transient
             */
            tabIndex: {
                transient: true
            },
            /**
             * Informe if widget is focused. Transient
             */
            focused: {
                transient: true
            },
            /**
             * Informe if widget is disable. Transient
             */
            disabled: {
                transient: true
            },
            /**
             * Informe if widget is visible. Transient
             */
            visible: {
                transient: true
            },
            /**
             * Height of the widget. Transient
             */
            height: {
                transient: true
            },
            /**
             * Width of the widgetTransient
             */
            width: {
                transient: true
            },
            /**
             * Content of the widget. Transient
             */
            strings: {
                transient: true
            },
            /**
             * Informe if widget is rendering. Transient
             */
            render: {
                transient: true
            },
            /**
             * Source node of the widget. Transient
             */
            srcNode: {
                transient: true
            },
            /**
             * Widget selected. Transient
             */
            selected: {
                transient: true
            },
            /**
             *Iindex of the widget. Transient
             */
            index: {
                transient: true
            },
            /**
             * Parent of the widget. Transient
             */
            parent: {
                transient: true
            },
            /**
             * Depth of the widget. Transient
             */
            depth: {
                transient: true
            },
            /**
             * Root of the widget. Transient
             */
            root: {
                transient: true
            },
            /**
             * Widget is multiple. Transient
             */
            multiple: {
                transient: true
            },
            /**
             * Plugins attached to the widget
             */
            plugins: {
                //For serialization purpose, get plugin configs
                getter: function() {
                    var i, p = [], plg;
                    for (i in this._plugins) {
                        plg = this[this._plugins[i].NS];
                        if (plg.toObject) {
                            p.push({
                                fn: Wegas.Plugin.getPluginFromName(
                                    this._plugins[i].NAME
                                    ), //TODO: find an other referencing way
                                cfg: plg.toObject('type')
                            });
                        }
                    }
                    return p.length > 0 ? p : undefined;
                },
                optional: true,
                type: 'array',
                value: [],
                transient: false,
                view: {
                    label: 'Options', // The term "Plugins" doesn't mean anything to the user
                    tooltip: 'Add option',
                    choices: [
                        {
                            label: 'On click',
                            children: [
                                {
                                    label: 'Open page',
                                    value: {fn: 'OpenPageAction'}
                                },
                                {
                                    label: 'Open url',
                                    value: {fn: 'OpenUrlAction'}
                                },
                                {
                                    label: 'Open file',
                                    value: {fn: 'OpenFileAction'}
                                },
                                {
                                    label: 'Impact variables',
                                    value: {fn: 'ExecuteScriptAction'}
                                },
                                {
                                    label: 'Confirm Click',
                                    value: {fn: 'ConfirmClick'}
                                },
                                {
                                    label: 'Local ScriptEval',
                                    value: {fn: 'ExecuteLocalScriptAction'}
                                },
                                {
                                    label: 'Close Popup Panel',
                                    value: {fn: 'ClosePanel'},
                                    className: 'wegas-advanced-feature'
                                },
                                {
                                    label: 'Open Popup page',
                                    value: {fn: 'OpenPanelPageloader'}
                                },
                                {
                                    label: 'Play sound',
                                    value: {fn: 'PlaySoundAction'}
                                },
                                {
                                    label: 'Print Variables',
                                    value: {fn: 'PrintActionPlugin'}
                                }, {
                                    label: "Show Inbox Overlay",
                                    value: {fn: "ShowInboxListOnClick"}
                                }, {
                                    label: "Toggle class",
                                    value: {fn: "ToggleOnClick"}
                                }
                            ]
                        },
                        {
                            label: 'Styles',
                            children: [
                                {
                                    label: 'Tooltip',
                                    value: {fn: 'Tooltip'}
                                },
                                {
                                    label: 'Background',
                                    value: {fn: 'CSSBackground'}
                                },
                                {
                                    label: 'Background Image',
                                    value: {fn: 'CSSBackgroundImage'}
                                },
                                {
                                    label: 'Position',
                                    value: {fn: 'CSSPosition'}
                                },
                                {
                                    label: 'Size',
                                    value: {fn: 'CSSSize'}
                                },
                                {
                                    label: 'Text',
                                    value: {fn: 'CSSText'}
                                },
                                {
                                    label: 'Resize Observer',
                                    value: {fn: 'ResizeListener'}
                                },
                                {
                                    label: 'Other styles',
                                    value: {fn: 'CSSStyles'}
                                }
                            ]
                        },
                        {
                            label: 'Animations',
                            children: [
                                {
                                    label: 'Show after',
                                    value: {fn: 'ShowAfter'}
                                },
                                {
                                    label: 'Hide after',
                                    value: {fn: 'HideAfter'}
                                }
                            ]
                        },
                        {
                            label: 'Variables',
                            children: [
                                {
                                    label: 'Conditional display',
                                    value: {fn: 'ConditionalDisplay'}
                                },
                                {
                                    label: 'Conditional disable',
                                    value: {fn: 'ConditionalDisable'},
                                    className: "wegas-advanced-feature"
                                },
                                {
                                    label: 'Unread count',
                                    value: {fn: 'UnreadCount'}
                                },
                                {
                                    label: 'Lock',
                                    value: {fn: 'Lockable'}
                                }, {
                                    label: "Event Logger",
                                    value: {fn: "EventLogger"},
                                    className: "wegas-advanced-feature"
                                }
                            ]
                        }
                    ]
                },
                index: 10,
                items: {
                    type: 'object',
                    properties: {
                        fn: {
                            type: 'string'
                        },
                        cfg: {
                            type: 'object'
                        }
                    },
                    view: {
                        type: 'plugin'
                    }
                }
            }
        },
        /**
         * The static version of wegasDelegateKey
         *
         * @param {Node} node the node which delegate
         * @param {String} type event to delegate
         * @param {Function} fn the one callback
         * @param {String} keyCode key spec
         * @param {String} spec CSS selector to select children
         * @param {Objject} context thiz is the context
         * @param {Array} extraArgs* extra args to provive to callback
         * @returns {unresolved} {EventHandle} the detach handle
         */
        wegasDelegateKey: function(node, type, fn, keyCode, spec, context, extraArgs) {
            return node.on(type, function(e) {
                var target = e.target.getDOMNode();
                var domRoot = node.getDOMNode();

                var id = Y.Selector._escapeId(Y.DOM.getId(domRoot));
                if (!id) {
                    id = Y.guid();
                    Y.DOM.setId(domRoot, id);
                }

                document.querySelectorAll("#" + id + " " + spec).forEach(function(node) {
                    if (node.contains(target)) {
                        e.currentTarget = Y.Node(node);
                        fn.apply(context, [e].concat(extraArgs));
                    }
                });
            }, keyCode, this);
        },

        /**
         * The static version of wegasDelegateKey
         *
         * @param {Node} node the node which delegate
         * @param {String} type event to delegate
         * @param {Function} fn the one callback
         * @param {String} spec CSS selector to select children
         * @param {Object} context thiz is the context
         * @param {Array} extraArgs extra arge to provive to callback
         * @returns {unresolved} {EventHandle} the detach handle
         */
        wegasDelegate: function(node, type, fn, spec, context, extraArgs) {
            return node.on(type, function(e) {
                var target = e.target.getDOMNode();
                var domRoot = node.getDOMNode();

                var id = Y.Selector._escapeId(Y.DOM.getId(domRoot));
                if (!id) {
                    id = Y.guid();
                    Y.DOM.setId(domRoot, id);
                }

                document.querySelectorAll("#" + id + " " + spec).forEach(function(node) {
                    if (node.contains(target)) {
                        e.currentTarget = Y.Node(node);
                        fn.apply(context, [e].concat(extraArgs));
                    }
                });
            }, this);
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
                Fn = Lang.isString(type) ? Wegas[type] || Y[type] : type;
            }

            if (Lang.isFunction(Fn)) {
                child = new Fn(config);
            } else {
                Y.log('Could not create a child widget because its constructor is either undefined or invalid(' + type + ').',
                    'error', 'Wegas.Widget');
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
            Wegas.Editable.use(cfg, cb);
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
            var ds = Wegas.Facade.Variable, toEval;
            if (val && fullName.split('.')[1] === 'evaluated') {
                // If evaluated value is required

                if (val.content) {
                    // Eval based on the field (new pattern)
                    try {
                        toEval = val.content;

                        if (toEval) {
                            val.evaluated = ds.script.localEval(toEval);
                        }
                    } catch (e) {
                        Y.log('Unable to read expression: ' + val.content, 'error', 'Wegas.Widget');
                        val.evaluated = null;
                    }
                } else if (val.name) {
                    // @backwardcompatibility
                    val.evaluated = ds.cache.find('name', val.name);
                } else if (val.expr) {
                    // @backwardcompatibility if absent evaluate the expr field
                    try {
                        val.evaluated = ds.cache.findById(ds.script.localEval(val.expr));
                    } catch (e) {
                        Y.log('Unable to read expression: ' + val.expr, 'error', 'Wegas.Widget');
                        val.evaluated = null;
                    }
                }
            }

            if (val && fullName.indexOf('.') < 0) {
                // If the getter requires the full object (e.g. serialisation)
                delete val.evaluated; // Remove the ref to the evaluated descriptor
            }

            return val;
        },
        _buildCfg: {
            aggregates: ["EDITMENU"]
                /*statics: ["EDITMENU"]*/
        }
    });
    Wegas.Widget = Widget;

    /**
     * @hack We override this function so widget are looked for in Wegas ns.
     */
    Y.WidgetParent.prototype.o_createChild =
        Y.WidgetParent.prototype._createChild;
    Y.WidgetParent.prototype._createChild = function(config) {
        config = config || {};
        var altType = config.childType || config.type;
        if (altType) {
            config.childType = Y.Lang.isString(altType)
                ? Wegas[altType] || Y[altType]
                : altType;
        }
        return Y.WidgetParent.prototype.o_createChild.call(this, config); //reroute
    };
    /**
     *
     */
    Y.WidgetParent.ATTRS.defaultChildType = {
        setter: function(val) {
            var returnVal = Y.Attribute.INVALID_VALUE,
                FnConstructor = Lang.isString(val) ? Wegas[val] || Y[val] : val;
            if (Lang.isFunction(FnConstructor)) {
                returnVal = FnConstructor;
            }
            return returnVal;
        }
    };
    /**
     *
     */
    Y.WidgetParent.prototype.destroyAll = function() {
        this.deselectAll();
        this.removeAll().each(function() {
            this.destroy();
        });
        // Optim delay object destruction
        //Y.soon(Y.bind(function(widgets) {
        //    widgets.each(function() {
        //        this.destroy();
        //    });
        //}, this, this.removeAll()));
    };
    /**
     * @hack
     */
    Y.Widget.prototype.oPlug = Y.Widget.prototype.plug;
    Y.Widget.prototype.plug = function(Plugin, config) {
        if (!Lang.isArray(Plugin)) {
            if (Plugin && !Lang.isFunction(Plugin)) {
                config = Plugin.cfg;
                Plugin = Plugin.fn;
            }
            if (Plugin && !Lang.isFunction(Plugin)) {
                // @hacked to allow string plug definition
                Plugin = Y.Plugin[Plugin];
            }
        }
        Y.Widget.prototype.oPlug.call(this, Plugin, config); //reroute
    };
    /**
     *
     */
    Widget.prototype.renderer = function() {
        try {
            Y.Widget.prototype.renderer.call(this, arguments);
        } catch (e) {
            this.get(BOUNDING_BOX).setHTML(
                "<div class='wegas-widget-errored'><i>Failed to render<br>" +
                e.message +
                '</i><span class="wegas-advanced-feature">' + e.stack + '</span></div>');

            Y.log('Failed to render ' + this.getType() + ': ' + (e.message || ''), "error", this.constructor.NAME);
            Y.log("Stack:" + e.stack, "error", this.constructor.NAME);
            //Y.error("Failed to render " + this.getType() + ": " + (e.message || ""), e, this.constructor.NAME);//do crash parent widget in debug mode
            //throw e;
        }
    };
});
