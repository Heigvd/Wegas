/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-tabview', function (Y) {
    "use strict";

    var TabView, Tab;

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
            if (!TabView.tabs[id]) {
                var tabView = Y.Widget.getByNode(tabViewSelector);

                tabCfg = tabCfg || {};
                Y.mix(tabCfg, {
                    type: "Tab",
                    label: id
                });
                TabView.tabs[id] = tabView.add(tabCfg).item(0);
            }
            return TabView.tabs[id];
        },
        /**
         *  Helper function
         */
        findTabAndLoadWidget: function (id, tabViewSelector, tabCfg, widgetCfg, fn) {
            var tab = TabView.getTab( id, tabViewSelector, tabCfg);
            if (!tab) {
                tab = TabView.createTab( id, tabViewSelector, tabCfg);
                tab.load(widgetCfg, fn);                              // load the widget
            }
            tab.set("selected", 2);
        }

    });


    /**
     * Extension enabling a Tab to be a parent of another Widget.
     *
     * @modified from original WidgetParent module
     *
     * @module widget-parent
     */
    function Parent(config) {

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
    //        this.after("*:focusedChange", this._updateActiveDescendant);

    }

    Y.mix(Parent, Y.WidgetParent);
    Y.augment(Parent, Y.WidgetParent);
    delete Parent.ATTRS.selected;
    Parent.prototype._renderChildren = function () {
        var renderTo = this._childrenContainer || this.get("panelNode").one(".yui3-tab-panel-content");        // @modified

        this._childrenContainer = renderTo;

        this.each(function (child) {
            child.render(renderTo);
        });
    }
    Parent.prototype._createChild =  Y.WidgetParent.prototype._createChild;


    /**
     * Custom Tab implementation
     */
    Tab = Y.Base.create("tab", Y.Tab, [Y.Wegas.Widget, Parent], {

        // *** Private Fields *** //

        // *** Lifecycle Methods *** //
        renderUI: function () {
            Tab.superclass.renderUI.apply(this, arguments);

            this.renderToolbar();
        },
        bindUI: function () {
            Tab.superclass.bindUI.apply(this, arguments);
        },
        destructor: function (){
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
        addToolbarWidget: function(widget) {

            if (!(widget instanceof Y.Widget)) {
                widget = Y.Wegas.Widget.create(widget);

            }
            widget.render(this.get("toolbarNode"));
            //            widget.on("click", function(e){
            //                this.get("children").fire("toolbarEvent", e);
            //            }, this);
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
        }
    }, {
        ATTRS : {
            content: {
                setter: function() { }                                          // Overrides the panelNode management
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

    Y.namespace('Wegas').TabView = TabView;
    Y.namespace('Wegas').Tab = Tab;
});