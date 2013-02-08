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

YUI.add('wegas-tabview', function (Y) {
    "use strict";

    var TabView, Tab;
    /**
     * @name Y.Wegas.TabView
     * @extends Y.TabView
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @class Manage a tabview specific to Wegas
     * @constructor
     */
    TabView = Y.Base.create("tabview", Y.TabView, [Y.WidgetChild, Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.TabView#
         */
        // *** Private fields *** //
        /**
         * Reference to each used functions
         */
        handlers: null,
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         * init widget parent.
         */
        initializer: function () {
            this.handlers = {};
            TabView.superclass.initializer.apply(this, arguments);
            //this.plug(Removeable);
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When selection change on a tab, fire event "layout:resize"
         */
        bindUI: function () {
            TabView.superclass.bindUI.apply(this, arguments);

            // @fixme we notify the editor for any change, so widget can be updated
            // this should be done through wiget-parent, widget-child event bubbling
            this.handlers.selectionChange = this.after("selectionChange", function () {
                Y.Wegas.app.fire("layout:resize");
            });
        },
        /**
         * Detach all functions created by this widget.
         * @function
         * @private
         */
        destructor: function () {
            for (var k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        /**
         * @lends Y.Wegas.TabView#
         */
        /**
         * Prefix css. Static
         */
        CSS_PREFIX: "yui3-tabview",
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
        getTab: function (id) {
            return TabView.tabs[id];
        },
        /**
         * @function
         * @private
         * @param id
         * @param tabViewSelector
         * @param tabCfg
         * @return the new tab
         * @description create and return a tab based on a given id, the
         *  tabview reference and the configuration of the new tab.
         */
        createTab: function (id, tabViewSelector, tabCfg) {
            if (!TabView.tabs[id]) {                                            // If the tab does not exist,
                var tabs, tabView = Y.Widget.getByNode(tabViewSelector);        // Look for the parent
                tabCfg = tabCfg || {};
                Y.mix(tabCfg, {
                    type: "Tab",
                    label: id,
                    id: id
                });
                tabs = tabView.add(tabCfg);                                     // Instantiate a new tab
                return tabs.item(0);
            } else {                                                            // Otherwise,
                //TabView.tabs[id].setAttrs(tabCfg);                              // update the tab config
            }
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
        findTabAndLoadWidget: function (id, tabViewSelector, tabCfg, widgetCfg, fn) {
            var nTab = TabView.createTab(id, tabViewSelector, tabCfg);          // create a new one

            nTab.removeAll().each(function (i) {
                i.destroy();                                                    // Empty it
            });
            nTab.get("panelNode").empty();                                      // @fixme since the above method is not enough
            nTab.load(widgetCfg, fn);                                           // Load target widget
            nTab.set("selected", 2);
            nTab.plug(Removeable);
        }
    });
    Y.namespace('Wegas').TabView = TabView;

    /**
     * Extension enabling a Tab to be a parent of another Widget.
     *
     * @modified from original WidgetParent module
     *
     * @module widget-parent
     */
    function Parent (config) {
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

        var children,
                handle;

        if (config && config.children) {

            children = config.children;

            handle = this.after("initializedChange", function (e) {
                this._add(children);
                handle.detach();
            });

        }

        //  Widget method overlap
        Y.after(this._renderChildren, this, "renderUI");
        Y.after(this._bindUIParent, this, "bindUI");

        //        this.after("selectionChange", this._afterSelectionChange);
        //        this.after("selectedChange", this._afterParentSelectedChange);
        //        this.after("activeDescendantChange", this._afterActiveDescendantChange);

        this._hDestroyChild = this.after("*:destroy", this._afterDestroyChild);
        this.after("*:focusedChange", this._updateActiveDescendant);
        ;
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
    Tab = Y.Base.create("tab", Y.Tab, [Y.Wegas.Widget, Parent, Y.WidgetChild], {
        // *** Private Fields *** //
        /**
         * Array of widget items.
         */
        _witems: null,
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         * call explicitly initializer method of widget parent.
         * assign this tab in owner TabView.
         */
        initializer: function (cfg) {
            Tab.superclass.initializer.apply(this, arguments);
            TabView.tabs[cfg.id || cfg.label] = this;
            this._witems = [];

            //this.plug(Closable);
        },
        /**
         * @function
         * @private
         * @description call render method of widget parent.
         */
        renderUI: function () {
            Tab.superclass.renderUI.apply(this, arguments);
        },
        /**
         * @function
         * @private
         * @description call sync method of widget parent.
         */
        syncUI: function () {
            Tab.superclass.syncUI.apply(this, arguments);
        },
        /**
         * @function
         * @private
         * @description delete Tab in owner Tabview.
         *  call explicitly destructor method of widget parent.
         */
        destructor: function () {
            delete TabView.tabs[this.get("id")];
            Tab.superclass.destructor.apply(this, arguments);
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
        load: function (cfg, callback) {
            Y.Wegas.Widget.use(cfg, Y.bind(function (cfg, callback) {          // Load the subpage dependencies
                var widgets = this.add(cfg);                                    // Render the subpage
                if (callback) {
                    callback(widgets.item(0));                                  // Trigger the callback
                }
            }, this, cfg, callback));
        },
        /**
         * @function
         * @private
         * @description Override Y.WidgetParent to render children in the panel node;
         * to the tab
         */
        _renderChildren: function () {
            var renderTo = this._childrenContainer || this.get("panelNode");    // @modified

            this._childrenContainer = renderTo;

            this.each(function (child) {
                this._witems.push(child);                                       // @modified
                child.render(renderTo);
            }, this);
        },
        /**
         * @function
         * @private
         * @param index
         * @description return the widget item at given index
         */
        witem: function (index) {
            return this._witems[index];
        }

    }, {
        CSS_PREFIX: "yui3-tab",
        /**
         * @lends Y.Wegas.Tab#
         */
        /**
         * @field
         * @static
         * @description
         ** <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>Content: Overrides the panelNode management</li>
         * </ul>
         */
        ATTRS: {
            /**
             * Overrides the panelNode management
             */
            content: {
                setter: function () {
                }
            }
        }
    });
    Y.namespace('Wegas').Tab = Tab;

    /**
     * @function
     * @private
     * @description Removable plugin for tabview
     */
    var Removeable = function () {
        Removeable.superclass.constructor.apply(this, arguments);
    };

    /**
     * @name Y.Plugin.Removeable
     * @extends Y.Plugin.Base
     * @class plugin to remove a tab in one click.
     * @constructor
     * @description Remove a tab in one click.
     */
    Y.extend(Removeable, Y.Plugin.Base, {
        /**
         * @lends Y.Wegas.Removeable#
         */
        // *** Private fields *** //
        /**
         * Html template added in host's contentbox
         */
        REMOVE_TEMPLATE: '<a class="yui3-tab-remove" title="remove tab">x</a>',
        /**
         * @function
         * @private
         * @param config
         * @description Create a clickable node (in host's bounding box).
         * If this node is clicked, remove host (Tab) and this plugin.
         */
        initializer: function (config) {
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
        //    e.target.get('boundingBox').append(this.REMOVE_TEMPLATE);           // boundingBox is the Tab's LI
        //},
        /**
         * @function
         * @private
         * @param e
         * @description stop event propagation and remove host.
         */
        onRemoveClick: function (e) {
            e.stopPropagation();
            var host = this.get("host");

            host.remove();
            host.destroy();

            //var tab = Y.Widget.getByNode(e.target);
            // tab.remove();
        }
    }, {
        NS: "removeable",
        NAME: "removeableTabs"
    });
    Y.namespace("Plugin").Removeable = Removeable;

    var LayoutToggleTab = function () {
        LayoutToggleTab.superclass.constructor.apply(this, arguments);
    };
    /**
     * @name Y.Plugin.LayoutToggleTab
     * @extends Y.Plugin.Base
     * @class plugin to toggle visibility of a tab
     * @constructor
     * @description plugin to toggle visibility of a tab
     */
    Y.extend(LayoutToggleTab, Y.Plugin.Base, {
        /**
         * @lends Y.Wegas.LayoutToggleTab#
         */
        // *** Private fields *** //
        /**
         * Html template added in host's contentbox
         */
        REMOVE_TEMPLATE: '<a class="yui3-tab-remove" title="remove tab">x</a>',
        /**
         * @function
         * @private
         * @description if "removeChild" is fired by host, hide tab.
         *  If "addChild" is fired by host, show tab.
         */
        initializer: function () {
            this.onHostEvent("removeChild", function () {
                if (this.get("host").size() === 1) {
                    Y.Wegas.app.widget.hidePosition("right");
                }
            });
            this.onHostEvent("addChild", function () {
                if (this.get("host").isEmpty()) {
                    Y.Wegas.app.widget.showPosition("right");
                }
            });
        }
    }, {
        NS: "LayoutToggleTab",
        NAME: "LayoutToggleTab"
    });

    Y.namespace("Plugin").LayoutToggleTab = LayoutToggleTab;
});
