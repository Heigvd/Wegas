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

YUI.add( 'wegas-tabview', function ( Y ) {
    "use strict";

    var TabView, Tab;

    TabView = Y.Base.create( "tabview", Y.TabView, [Y.WidgetChild, Y.Wegas.Widget], {
        bindUI: function () {
            TabView.superclass.bindUI.apply(this, arguments);

            // @fixme we notify the editor for any change, so widget can be updated
            // this should be done through wiget-parent, widget-child event bubbling
            this.after( "selectionChange", function () {
                Y.Wegas.app.fire( "layout:resize" );
            });
        }
    }, {

        CSS_PREFIX: "yui3-tabview",

        tabs: {},

        getTab: function (id) {
            return TabView.tabs[ id ];
        },
        createTab: function ( id, tabViewSelector, tabCfg ) {
            if ( !TabView.tabs[ id ] ) {                                        // If the tab does not exist,
                var tabView = Y.Widget.getByNode( tabViewSelector );            // Look for the parent
                tabCfg = tabCfg || {};
                Y.mix(tabCfg, {
                    type: "Tab",
                    label: id,
                    id: id
                });
                tabView.add( tabCfg );                                          // Instantiate a new tab
            } else {                                                            // Otherwise,
                TabView.tabs[id].setAttrs( tabCfg )                             // update the tab config
            }
            return TabView.tabs[ id ];
        },
        /**
         *  Helper function
         */
        findTabAndLoadWidget: function (id, tabViewSelector, tabCfg, widgetCfg, fn) {
            var tab = TabView.getTab( id );                                     // Look for the tab
            if (!tab) {                                                         // If it does not exist,
                tab = TabView.createTab( id, tabViewSelector, tabCfg);          // create a new one
                tab.load(widgetCfg, fn);                                        // and load the widget in it.
            } else {                                                            // Otherwise,
                tab.setAttrs(tabCfg);                                           // update the tab config
                if (fn) {
                    fn(tab.item(0));                                            // and trigger the callback
                }
            }
            tab.set("selected", 2);
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
     * Custom Tab implementation
     */
    Tab = Y.Base.create("tab", Y.Tab, [ Y.Wegas.Widget, Parent, Y.WidgetChild ], {

        // *** Private Fields *** //

        // *** Lifecycle Methods *** //
        initializer: function(cfg) {
            Tab.superclass.initializer.apply(this, arguments);
            TabView.tabs[cfg.id] = this;
            this._witems = [];
        },

        renderUI: function () {
            Tab.superclass.renderUI.apply(this, arguments);
        // this.renderToolbar();
        },

        //bindUI: function () {
        //    Tab.superclass.bindUI.apply(this, arguments);
        //},
        syncUI: function () {
            Tab.superclass.syncUI.apply(this, arguments);
        // this.get( "children" );
        },

        // *** Private Methods *** //
        /**
         * Retrieves the given widget configuration and add it to the tab
         *
         * @function load
         *
         */
        load: function ( cfg, callback ) {
            Y.Wegas.Widget.use(cfg,  Y.bind(function (cfg, callback) {          // Load the subpage dependencies
                var widgets = this.add(cfg);                                    // Render the subpage
                if (callback) {
                    callback(widgets.item(0));                                  // Trigger the callback
                }
            }, this, cfg, callback));
        },

        /**
         *  Override Y.WidgetParent to render children in the panel node;
         */
        _renderChildren: function () {
            var renderTo = this._childrenContainer || this.get("panelNode");    // @modified

            this._childrenContainer = renderTo;

            this.each(function (child) {
                this._witems.push( child );                                     // @modified
                child.render( renderTo )
            }, this);
        },
        witem: function ( index ) {
            return this._witems[index];
        }
    }, {

        CSS_PREFIX: "yui3-tab",

        ATTRS : {
            content: {
                setter: function () { }                                         // Overrides the panelNode management
            }
        }
    });
    Y.namespace( 'Wegas' ).Tab = Tab;
});