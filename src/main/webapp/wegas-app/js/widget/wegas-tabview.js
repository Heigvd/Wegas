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

YUI.add('wegas-tabview', function (Y) {
    "use strict";

    var Lang = Y.Lang,
    TabView, Tab;

    TabView = Y.Base.create("tabview", Y.TabView, [Y.WidgetChild, Y.Wegas.Widget], {
        bindUI: function () {
            TabView.superclass.bindUI.apply(this, arguments);

            // @fixme we notify the editor for any change, so widget can be updated
            // this should be done through wiget-parent, widget-child event bubbling
            this.after("selectionChange", function() {
                Y.Wegas.app.fire("layout:resize");
            });
        }
    }, {
        tabs: {},

        getTab: function (id) {
            return TabView.tabs[id];
        },
        createTab: function (id, tabViewSelector, tabCfg) {
            if (!TabView.tabs[id]) {                                            // If the tab does not exist,
                var tabView = Y.Widget.getByNode(tabViewSelector);              // Look for the parent
                tabCfg = tabCfg || {};
                Y.mix(tabCfg, {
                    type: "Tab",
                    label: id,
                    id: id
                });
                tabView.add(tabCfg);                                            // Instantiate a new tab
            } else {                                                            // Otherwise,
                TabView.tabs[id].setAttrs(tabCfg)                               // update the tab config
            }
            return TabView.tabs[id];
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
        Y.WidgetParent.call(this, config);
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
    Tab = Y.Base.create("tab", Y.Tab, [ Y.Wegas.Widget, Parent], {

        // *** Private Fields *** //

        // *** Lifecycle Methods *** //
        initializer: function(cfg) {
            Tab.superclass.initializer.apply(this, arguments);
            TabView.tabs[cfg.id] = this;
            this._witems = [];
        },

        renderUI: function () {
            Tab.superclass.renderUI.apply(this, arguments);
            this.renderToolbar();
        },

        bindUI: function () {
            Tab.superclass.bindUI.apply(this, arguments);
        },
        syncUI: function () {
            Tab.superclass.syncUI.apply(this, arguments);
        //            this.get( "children" );
        },
        destructor: function (){
            Tab.superclass.destructor.call( this );
            var toolbarChildren = this.get("toolbarChildren");
            for (var i in toolbarChildren){
                toolbarChildren[i].destroy();
            }
        },

        // *** Private Methods *** //
        renderToolbar: function () {
            var panelNode = this.get('panelNode'),
            toolbarChildren = this.get("toolbarChildren");

            panelNode.prepend('<div class="wegas-tab-toolbar"><div class="wegas-tab-toolbar-header"></div><div class="wegas-tab-toolbar-panel"></div></div><div class="yui3-tab-panel-content"></div>');
            for (var i = 0; i < toolbarChildren.length; i = i + 1) {
                toolbarChildren[i] = this.addToolbarWidget(toolbarChildren[i]);
            }
        },
        addToolbarWidget: function( widget ) {
            if (!(widget instanceof Y.Widget)) {
                widget = Y.Wegas.Widget.create(widget);
            }
            widget.render(this.get("toolbarNode"));
            widget.addTarget(this.item(0));
            return widget;
        },
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
            var renderTo = this._childrenContainer || this.get("panelNode").one(".yui3-tab-panel-content");        // @modified

            this._childrenContainer = renderTo;

            this.each(function (child) {
                this._witems.push( child );
                child.render( renderTo )
            }, this);
        },
        witem: function ( index ) {
            return this._witems[index];
        }
    }, {
        ATTRS : {
            content: {
                setter: function () { }                                         // Overrides the panelNode management
            },
            toolbarNode: {
                lazyAdd: false,
                value: false,
                getter : function () {
                    return this.get('panelNode').one(".wegas-tab-toolbar-header");
                }
            },
            toolbarPanel: {
                lazyAdd: false,
                value: false,
                getter : function () {
                    return this.get('panelNode').one(".wegas-tab-toolbar-panel");
                }
            },
            toolbarChildren: {
                value: []
            }
        }
    });
    Y.namespace('Wegas').Tab = Tab;
});