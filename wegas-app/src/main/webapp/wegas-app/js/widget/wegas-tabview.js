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
YUI.add('wegas-tabview', function(Y) {
    "use strict";

    var RemoveRightTab, TabDocker,
        Plugin = Y.Plugin, Wegas = Y.Wegas,
        CONTENTBOX = "contentBox", BOUNDINGBOX = "boundingBox",
        TabView, Tab, RemoveTab;
    /**
     * @name Y.Wegas.TabView
     * @extends Y.TabView
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @class Manage a tabview specific to Wegas
     * @constructor
     */
    TabView = Y.Base.create("tabview", Y.TabView, [Y.WidgetChild, Wegas.Editable, Wegas.Parent], {
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
            this.plug(ResizeTabViewLinks);
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
                    label: tabCfg.label || id,
                    id: id
                });
                tabs = tabView.add(tabCfg, tabIndex);                           // Instantiate a new tab
                return tabs.item(0);
            } else {                                                            // Otherwise,
                TabView.tabs[id].setAttrs(tabCfg);                            // update the tab config
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
    Wegas.TabView = TabView;

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
    Y.mix(Parent.prototype, Y.WidgetParent.prototype);
    //    Y.augment(Parent, Y.WidgetParent);
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
    Tab = Y.Base.create("tab", Y.Tab, [Parent, Y.WidgetChild, Wegas.Editable, Wegas.Parent], {
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
            if (this.get("popupListener")) {
                this.plug(Plugin.PopupListener, {
                    targetAttr: "panelNode",
                    alignAttr: "panelNode",
                    filter: ["success"]
                });
            }
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
            Wegas.Widget.use(cfg, Y.bind(function(cfg, callback) {              // Load the subpage dependencies
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
            var renderTo = this._childrenContainer || this.get("panelNode").one("div");// @modified

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
            },
            popupListener: {
                value: true
            }
        }
    });
    Wegas.Tab = Tab;

    /**
     * Removable plugin for tabview
     * ATTRS: closeCallback : function to call once close is called.
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
                //cb = tab.get("parent").get(CONTENTBOX),
                bb = tab.get(BOUNDINGBOX);
            if (!tab instanceof Tab) {
                return Y.log("error", "Plugin Removable expects a Tab host", "Y.Plugin.Removable");
            }
            bb.addClass('yui3-tabview-removeable');
            bb.delegate('click', this.onRemoveClick, '.yui3-tab-remove', this);
            //            bb.append(this.REMOVE_TEMPLATE);

            // Tab events bubble to TabView
            // Here to plug on tabview
            //var tabview = this.get('host'),
            //cb = tabview.get(CONTENTBOX);
            //
            //cb.addClass('yui3-tabview-removeable');
            //cb.delegate('click', this.onRemoveClick, '.yui3-tab-remove', this);
            //
            //// Tab events bubble to TabView
            this.onceAfterHostEvent('tab:render', this.afterTabRender, this);
        },
        afterTabRender: function(e) {
            this.get("host").get(BOUNDINGBOX).append(this.REMOVE_TEMPLATE);         // boundingBox is the Tab's LI
        },
        /**
         * @function
         * @private
         * @param e
         * @description stop event propagation and remove host.
         */
        onRemoveClick: function(e) {
            this.get("host").remove().destroy();
            e.stopPropagation();
        },
        destructor: function() {
            if (this.get("closeCallback")) {
                this.get("closeCallback")();
            }
        }
    }, {
        NS: "removeable",
        NAME: "removeableTabs",
        ATTRS: {
            closeCallback: {
                validator: Y.Lang.isFunction
            }
        }
    });
    Plugin.Removeable = Removeable;
    /**
     * Remove host tab and creates a button to restore it.
     * @constructor
     */
    TabDocker = function() {
        TabDocker.superclass.constructor.apply(this, arguments);
    };
    Y.extend(TabDocker, Removeable, {
        onRemoveClick: function(e) {
            var host = this.get("host"), parent = host.get("parent"),
                cfg = host.toObject(), label = host.get("label"),
                button = (new Y.Wegas.Button({
                    label: label
                })).render(Y.one(this.get("dockTarget")));
            //get old children config
            cfg.children = host.get("children");
            button.on("click", function() {
                parent.add(cfg).item(0).set('selected', 1).plug(TabDocker);
                this.destroy();
            });
            this.get("host").remove().destroy();
            e.stopPropagation();
        }
    }, {
        NS: "docker",
        NAME: "TabDocker",
        ATTRS: {
            dockTarget: {
                value: ".wegas-layout-hd"
            }
        }
    });
    Plugin.TabDocker = TabDocker;

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
            Wegas.app.after("render", function() {
                if (this.get("host").isEmpty()) {
                    Wegas.app.widget.hidePosition("right");
                }
            }, this);
            this.afterHostMethod("destroyAll", function() {
                Y.later(100, this, function() {
                    if (this.get("host").isEmpty()) {
                        Wegas.app.widget.hidePosition("right");
                    }
                });
            });
            this.onHostEvent("addChild", function() {
                Wegas.app.widget.showPosition("right");
            });
        }
    }, {
        NS: "LayoutToggleTab",
        NAME: "LayoutToggleTab"
    });
    Plugin.LayoutToggleTab = LayoutToggleTab;

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

    /**
     * Plugin for an empty tabview
     *
     * @name Y.Plugin.EmptyTab
     * @extends Y.Plugin.Base
     * @class plugin with an empty tab
     * @constructor
     */
    //    var EmptyTab = function() {
    //        EmptyTab.superclass.constructor.apply(this, arguments);
    //    };
    //    Y.extend(EmptyTab, Plugin.Base, {
    //        /** @lends Y.Wegas.EmptyTab# */
    //
    //        // *** Private fields *** //
    //        /**
    //         * @function
    //         * @private
    //         */
    //        initializer: function() {
    //            var noItem;
    //            this.onceAfterHostEvent("render", function() {
    //                Y.one("#rightTabView .yui3-tabview-panel").append("<p class='wegas-noItem'></p>");
    //            });
    //            this.afterHostEvent("removeChild", function() {
    //                if (this.get("host").isEmpty()) {
    //                    Y.one("#rightTabView .yui3-tabview-panel").append("<p class='wegas-noItem'></p>");
    //                }
    //            });
    //            this.onHostEvent("addChild", function() {
    //                noItem = Y.one("#rightTabView .wegas-noItem");
    //                if (noItem) {
    //                    noItem.remove();
    //                }
    //                if (this.get("host").isEmpty()) {
    //                    Wegas.app.widget.showPosition("right");
    //                }
    //            });
    //        }
    //    }, {
    //        NS: "EmptyTab",
    //        NAME: "EmptyTab"
    //    });
    //    Plugin.EmptyTab = EmptyTab;

    /**
     * Plugin add a tab for remove tabview
     *
     * @name Y.Plugin.Removetab
     * @extends Y.Plugin.Base
     * @class plugin to add a tab for remove tabview
     * @constructor
     */
    RemoveTab = function() {
        RemoveTab.superclass.constructor.apply(this, arguments);
    };

    Y.extend(RemoveTab, Plugin.Base, {
        /** @lends Y.Wegas.Removetab# */
        // *** Private fields *** //
        ADD_TEMPLATE: '<div class="wegas-removeTabview" title="Close tab"><a>x</a></div>',
        /**
         * @function
         * @private
         * @description Create a tab for remove tabview.
         * If this tab is clicked, remove host tabview.
         */
        initializer: function() {
            var tabview = this.get('host');
            tabview.after('render', this.afterRender, this);
            tabview.get(CONTENTBOX).delegate('click', this.onClick, '.wegas-removeTabview a', this);
        },
        afterRender: function(e) {
            var tabview = this.get('host');
            tabview.get(CONTENTBOX).one('> ul').append(this.ADD_TEMPLATE);
        },
        onClick: function(e) {
            e.stopPropagation();
            this.get('host').destroyAll();
        }
    }, {
        NS: "removetab",
        NAME: "removetab"
    });
    Plugin.RemoveTab = RemoveTab;
    /**
     * Right tab management
     * @name Y.Plugin.RemoveRightTab
     * @extends Y.Plugin.RemoveTab
     * @constructor
     */
    RemoveRightTab = function() {
        RemoveRightTab.superclass.constructor.apply(this, arguments);
    };

    Y.extend(RemoveRightTab, RemoveTab, {
        /** @lends Y.Wegas.RemoveRightTab# */
        /**
         * @function
         * @private
         * @description Create a tab for remove tabview.
         * If this tab is clicked, remove host tabview.
         */
        initializer: function() {
            Wegas.app.after("render", function() {
                if (this.get("host").isEmpty()) {
                    Wegas.app.widget.hidePosition("right");
                }
            }, this);
            this.onHostEvent("addChild", function() {
                if (Wegas.app.widget) {
                    Wegas.app.widget.showPosition("right");
                }
            });
        },
        onClick: function(e) {
            e.stopPropagation();
            this.get('host').destroyAll();
            Y.later(100, this, function() {
                if (this.get("host").isEmpty()) {
                    Wegas.app.widget.hidePosition("right");
                }
            });
        }
    }, {
        NS: "removetab",
        NAME: "removetab"
    });
    Plugin.RemoveRightTab = RemoveRightTab;

    /**
     * Plugin that resizes the tabview's button if required
     *
     * @name Y.Plugin.ResizeTabViewLinks
     * @extends Y.Plugin.Base
     * @class plugin to add a tab for remove tabview
     * @constructor
     */
    var ResizeTabViewLinks = function() {
        ResizeTabViewLinks.superclass.constructor.apply(this, arguments);
    };
    Y.extend(ResizeTabViewLinks, Plugin.Base, {
        /** @lends Y.Wegas.Removetab# */
        // *** Private fields *** //
        /**
         * @function
         * @private
         * @description
         */
        initializer: function() {
            this.afterHostEvent(['addChild', 'removeChild', 'render'], this.resizeTabs);
        },
        resizeTabs: function() {
            var tabView = this.get('host');
            Y.once("domready", function() {
                tabView.get(CONTENTBOX).addClass("wegas-tabview-resizetabs");
                tabView.get(CONTENTBOX).all("> ul > li").setStyle("width", (100 / tabView.size()) + "%");
            });
        }
    }, {
        NS: "ResizeTabViewLinks",
        NAME: "ResizeTabViewLinks"
    });
    Plugin.ResizeTabViewLinks = ResizeTabViewLinks;

    var ExtraTabs = Y.Base.create("wegas-extratabs", Plugin.Base, [], {
        initializer: function() {
            if (this.get("host") instanceof TabView) {
                this.afterHostEvent(['render'], this.addExtraTabs);
            } else {
                this.destroy();
            }
        },
        addExtraTabs: function() {
            var tabs = this.get("extraTabs"), dock = this.get("dock"), addTab = function(cfg) {
                var t = this.get("host").add(cfg).item(0);
                if (dock) {
                    t.plug(TabDocker);
                }
            };
            for (var i = 0; i < tabs.length; i += 1) {
                Y.Wegas.Widget.use(tabs[i], Y.bind(addTab, this, tabs[i]));
            }
        }
    }, {
        NS: "extratabs",
        ATTRS: {
            extraTabs: {
                value: Y.namespace("Wegas.Config.ExtraTabs"),
                getter: function(v) {
                    return Y.Lang.isArray(v) ? v : [];
                }
            },
            dock: {
                value: false,
                validator: Y.Lang.isBoolean
            }
        }
    });
    Plugin.ExtraTabs = ExtraTabs;
});
