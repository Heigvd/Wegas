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
YUI.add('wegas-tabview', function(Y) {
    "use strict";

    var Plugin = Y.Plugin, Wegas = Y.Wegas,
            TabView, Tab;
    /**
     * @name Y.Wegas.TabView
     * @extends Y.TabView
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class Manage a tabview specific to Wegas
     * @constructor
     */
    TabView = Y.Base.create("tabview", Y.TabView, [Y.WidgetChild, Wegas.Editable, Wegas.Layout], {
        /** @lends Y.Wegas.TabView# */
        // *** Private fields *** //
        /**
         * Reference to each used functions
         */
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         * init widget parent.
         */
        initializer: function() {
            TabView.superclass.initializer.apply(this, arguments);
            //this.plug(Removeable);
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When selection change on a tab, fire event "layout:resize"
         */
        bindUI: function() {
            TabView.superclass.bindUI.apply(this, arguments);

            // @fixme we notify the editor for any change, so widget can be updated
            // this should be done through wiget-parent, widget-child event bubbling
            this.after("selectionChange", function() {
                Wegas.app.fire("layout:resize");
            });
        },
        useAndAdd: function(cfg) {
            Y.Wegas.use(cfg, Y.bind(function() {
                this.add(cfg);
            }, this));
        },
        /**
         * Override WidgetParent method. Otherwise when a sibling of the tabview is
         * selected (with selection level 2), it's children tab are unselected
         * @param {type} event
         * @returns {unresolved}
         */
        _afterParentSelectedChange: function(event) {
            return;
        }
    }, {
        /** @lends Y.Wegas.TabView# */

        /**
         * Prefix css. Static
         */
        CSS_PREFIX: "yui3-tabview",
        ATTRS: {
            panelNode: {
                "transient": true
            },
            listNode: {
                "transient": true
            },
            defaultChildType: {
                value: "Tab"
            }
        },
        EDITMENU: [{
                type: "Button",
                label: "Edit",
                plugins: [{
                        fn: "EditWidgetAction"
                    }
                ]
            }, {
                type: "Button",
                label: "Add tab",
                plugins: [{
                        fn: "AddChildWidgetAction",
                        cfg: {
                            childType: "Tab"
                        }
                    }
                ]
            }, {
                type: "Button",
                label: "Delete",
                plugins: [{
                        fn: "DeleteLayoutWidgetAction"
                    }
                ]
            }],
        /**
         * References to tab
         */
        tabs: {},
        /**
         * Return A tab from tabview selected by id.
         * @function
         * @private
         * @param id
         * @return A tab from tabview
         */
        getTab: function(id) {
            return TabView.tabs[id];
        },
        /**
         * @function
         * @private
         * @param id
         * @param tabViewSelector
         * @param tabCfg
         * @param {number} tabIndex
         * @return the new tab
         * @description create and return a tab based on a given id, the
         *  tabview reference and the configuration of the new tab.
         */
        createTab: function(id, tabViewSelector, tabCfg, tabIndex) {
            if (!TabView.tabs[id]) {                                            // If the tab does not exist,
                var tabs, tabView = Y.Widget.getByNode(tabViewSelector);        // Look for the parent
                tabCfg = tabCfg || {};
                Y.mix(tabCfg, {
                    label: id,
                    id: id
                });
                tabs = tabView.add(tabCfg, tabIndex);                           // Instantiate a new tab
                return tabs.item(0);
            } else {                                                            // Otherwise,
                //TabView.tabs[id].setAttrs(tabCfg);                            // update the tab config
            }
            return TabView.tabs[id];
        },
        findTab: function(id) {
            return TabView.tabs[id];
        },
        /**
         * @function
         * @private
         * @param id
         * @param tabViewSelector
         * @param tabCfg
         * @param widgetCfg
         * @param fn
         * @description Load a tab corresponding with the given parameters.
         */
        findTabAndLoadWidget: function(id, tabViewSelector, tabCfg, widgetCfg, fn) {
            var nTab = TabView.createTab(id, tabViewSelector, tabCfg);          // create a new one

            nTab.destroyAll();                                                  // Empty it
            nTab.load(widgetCfg, fn);                                           // Load target widget

            return nTab;
        }
    });
    Y.namespace('Wegas').TabView = TabView;

    /**
     * Extension enabling a Tab to be a parent of another Widget.
     *
     * @modified from original WidgetParent module
     *
     * @module widget-parent
     * @param {Object} config
     */
    function Parent(config) {
        //Y.WidgetParent.call(this, config);
        this.publish("addChild", {
            defaultTargetOnly: true,
            defaultFn: this._defAddChildFn
        });
        this.publish("removeChild", {
            defaultTargetOnly: true,
            defaultFn: this._defRemoveChildFn
        });

        this._items = [];

        var children, handle;

        if (config && config.children) {

            children = config.children;

            handle = this.after("initializedChange", function(e) {
                this._add(children);
                handle.detach();
            });

        }

        //  Widget method overlap
        Y.after(this._renderChildren, this, "renderUI");
        Y.after(this._bindUIParent, this, "bindUI");

        //this.after("selectionChange", this._afterSelectionChange);
        //this.after("selectedChange", this._afterParentSelectedChange);
        //this.after("activeDescendantChange", this._afterActiveDescendantChange);

        this._hDestroyChild = this.after("*:destroy", this._afterDestroyChild);
        this.after("*:focusedChange", this._updateActiveDescendant);
    }

    //Y.extend(Parent, Y.WidgetParent);
    Y.mix(Parent, Y.WidgetParent);
    Y.augment(Parent, Y.WidgetParent);
    Parent.ATTRS = {};
    Y.mix(Parent.ATTRS, Y.WidgetParent.ATTRS);
    delete Parent.ATTRS.selected;

    /**
     * @name Y.Wegas.Tab
     * @extends Y.Tab
     * @borrows Y.Wegas.Widget, Parent, Y.WidgetChild
     * @class class to manage a tabspecific to Wegas
     * @constructor
     * @description Manage a tabspecific to Wegas
     */
    Tab = Y.Base.create("tab", Y.Tab, [Parent, Y.WidgetChild, Wegas.Editable, Wegas.Layout], {
        /** @lends Y.Wegas.Tab# */
        PANEL_TEMPLATE: '<div><div class=\"panel-inner\"></div></div>',
        // *** Private Fields *** //
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @param cfg
         * @description Set variables with initials values.
         * call explicitly initializer method of widget parent.
         * assign this tab in owner TabView.
         */
        initializer: function(cfg) {
            Tab.superclass.initializer.apply(this, arguments);
            TabView.tabs[cfg.id || cfg.label] = this;
            this._witems = [];
            this.on("addChild", function(e) {
                this._witems.push(e.child);
            });

            //this.plug(Closable);
            this.plug(Plugin.PopupListener, {
                targetAttr: "panelNode",
                alignAttr: "panelNode"
            });
        },
        /**
         * @function
         * @private
         * @description call render method of widget parent.
         */
        renderUI: function() {
            Tab.superclass.renderUI.apply(this, arguments);
        },
        /**
         * @function
         * @private
         * @description call sync method of widget parent.
         */
        syncUI: function() {
            Tab.superclass.syncUI.apply(this, arguments);
        },
        /**
         * @function
         * @private
         * @description delete Tab in owner Tabview.
         *  call explicitly destructor method of widget parent.
         */
        destructor: function() {
            var i;
            for (i = 0; i < this._witems.length; i += 1) {
                this._witems[i].destroy();
            }

            delete TabView.tabs[this.get("id")];
            Tab.superclass.destructor.apply(this, arguments);
        },
        _onActivate: function(e) {
            if (e.target.get("disabled")) {
                return;
            }
            Tab.superclass._onActivate.apply(this, arguments);
        },
        // *** Private Methods *** //
        /**
         * @function
         * @private
         * @param cfg
         * @param callback
         * @description Retrieves the given widget configuration and add it
         * to the tab
         */
        load: function(cfg, callback) {
            this.showOverlay();
            Wegas.Widget.use(cfg, Y.bind(function(cfg, callback) {            // Load the subpage dependencies
                this.hideOverlay();
                var widgets = this.add(cfg);                                    // Render the subpage
                if (callback) {
                    callback(widgets.item(0), this);                            // Trigger the callback
                }
            }, this, cfg, callback));
        },
        /**
         * @function
         * @private
         * @description Override Y.WidgetParent to render children in the panel node;
         * to the tab
         */
        _renderChildren: function() {
            var renderTo = this._childrenContainer || this.get("panelNode").one("div");    // @modified

            this._childrenContainer = renderTo;

            this.each(function(child) {
                child.render(renderTo);
            }, this);
        },
        /**
         * @function
         * @private
         * @param index
         * @description return the widget item at given index
         */
        witem: function(index) {
            return this._witems[index];
        }
    }, {
        CSS_PREFIX: "yui3-tab",
        /** @lends Y.Wegas.Tab */

        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>Content: Overrides the panelNode management</li>
         * </ul>
         */
        ATTRS: {
            /**
             * Overrides the panelNode management
             */
            label: {
                type: "string"
            },
            content: {
                "transient": true,
                setter: function() {
                }
            },
            panelNode: {
                "transient": true
            }
        }
    });
    Y.namespace('Wegas').Tab = Tab;

    /**
     * Removable plugin for tabview
     *
     * @name Y.Plugin.Removeable
     * @extends Y.Plugin.Base
     * @class plugin to remove a tab in one click.
     * @constructor
     */
    var Removeable = function() {
        Removeable.superclass.constructor.apply(this, arguments);
    };

    Y.extend(Removeable, Plugin.Base, {
        /** @lends Y.Wegas.Removeable# */
        // *** Private fields *** //
        /**
         * Html template added in host's contentbox
         */
        REMOVE_TEMPLATE: '<a class="yui3-tab-remove" title="remove tab">x</a>',
        /**
         * @function
         * @private
         * @description Create a clickable node (in host's bounding box).
         * If this node is clicked, remove host (Tab) and this plugin.
         */
        initializer: function() {
            var tab = this.get('host'),
                    //cb = tab.get("parent").get("contentBox"),
                    bb = tab.get("boundingBox");

            bb.addClass('yui3-tabview-removeable');
            bb.delegate('click', this.onRemoveClick, '.yui3-tab-remove', this);
            bb.append(this.REMOVE_TEMPLATE);

            // Tab events bubble to TabView
            // Here to plug on tabview
            //var tabview = this.get('host'),
            //cb = tabview.get('contentBox');
            //
            //cb.addClass('yui3-tabview-removeable');
            //cb.delegate('click', this.onRemoveClick, '.yui3-tab-remove', this);
            //
            //// Tab events bubble to TabView
            //tabview.after('tab:render', this.afterTabRender, this);
        },
        //afterTabRender: function(e) {
        //    e.target.get('boundingBox').append(this.REMOVE_TEMPLATE);         // boundingBox is the Tab's LI
        //},

        /**
         * @function
         * @private
         * @param e
         * @description stop event propagation and remove host.
         */
        onRemoveClick: function(e) {
            this.get("host").remove().destroy();
            e.stopPropagation();
        }
    }, {
        NS: "removeable",
        NAME: "removeableTabs"
    });
    Y.namespace("Plugin").Removeable = Removeable;

    /**
     * Plugin to toggle visibility of a tab
     *
     * @name Y.Plugin.LayoutToggleTab
     * @extends Y.Plugin.Base
     * @class plugin to toggle visibility of a tab
     * @constructor
     */
    var LayoutToggleTab = function() {
        LayoutToggleTab.superclass.constructor.apply(this, arguments);
    };
    Y.extend(LayoutToggleTab, Plugin.Base, {
        /** @lends Y.Wegas.LayoutToggleTab# */

        // *** Private fields *** //
        /**
         * @function
         * @private
         * @description if "removeChild" is fired by host, hide tab.
         *  If "addChild" is fired by host, show tab.
         */
        initializer: function() {
            this.afterHostEvent("removeChild", function() {
                Y.later(100, this, function() {
                    if (this.get("host").isEmpty()) {
                        Wegas.app.widget.hidePosition("right");
                    }
                });
            });
            this.onHostEvent("addChild", function() {
                if (this.get("host").isEmpty()) {
                    Wegas.app.widget.showPosition("right");
                }
            });
        }
    }, {
        NS: "LayoutToggleTab",
        NAME: "LayoutToggleTab"
    });
    Y.namespace("Plugin").LayoutToggleTab = LayoutToggleTab;

    /**
     * Override to add support for disabled tabs
     * @param {type} e
     */
    Y.Tab.prototype._onActivate = function(e) {
        if (e.target === this && !this.get("disabled")) {   /* modified */
            //  Prevent the browser from navigating to the URL specified by the
            //  anchor's href attribute.
            e.domEvent.preventDefault();
            e.target.set('selected', 1);
        }
    };
});
