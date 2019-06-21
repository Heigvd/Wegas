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

    var RemoveTabView,
        Plugin = Y.Plugin, Wegas = Y.Wegas,
        CONTENTBOX = "contentBox", BOUNDINGBOX = "boundingBox",
        TabView, Tab, RemoveTab;

    var EDITOR_TAB_LABEL = "Attributes",
        PREVIEW_TAB_LABEL = "Preview",
        DEFAULT_EDIT_COLUMN = "#centerTabView",
        WEGAS_EDITOR_COL_LOCALSTORAGE = "wegas-editor-col";

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
        EDITMENU: {
            addBtn: {
                cfg: {
                    type: "Button",
                    label: "Add tab",
                    plugins: [{
                            fn: "AddChildWidgetAction",
                            cfg: {
                                childType: "Tab"
                            }
                        }

                    ]
                }
            },
            deletBtn: {
                index: 30,
                cfg: {
                    type: "Button",
                    label: "Delete",
                    plugins: [{
                            fn: "DeleteLayoutWidgetAction"
                        }]
                }
            }
        },
        /**
         * References to tabs
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
            return this.tabs[id];
        },
        /**
         * Setter for the tabs structure
         */
        setTab: function(id, value) {
            this.tabs[id] = value;
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
            if (id === EDITOR_TAB_LABEL) {
                this.setDefaultEditorTabView(tabViewSelector);
            }
            tabCfg = tabCfg || {};
            var existingTab = this.getTab(id);
            if (!existingTab) {                                                 // If the tab does not exist,
                var tabs, tabView = Y.Widget.getByNode(tabViewSelector);        // Look for the parent
                Y.mix(tabCfg, {
                    label: tabCfg.label || id,
                    id: id,
                    tabSelector: tabViewSelector
                });
                if (tabView) {
                    tabView.deselectAll();
                    if (!tabIndex) {
                        tabIndex = tabView.size() - 1;                              // Insert tab just before the + button
                    }
                    tabs = tabView.add(tabCfg, tabIndex);                           // Instantiate a new tab
                    return tabs.item(0);
                } else {
                    Y.log("Tabbiew " + tabViewSelector + "not found");
                }
            } else {                                                            // If the tab exists ...
                var prevSelector = existingTab.get("tabSelector");
                if (prevSelector !== tabViewSelector) {                         // ... and is on another tabview, move it
                    return this.moveToTabView(id, tabViewSelector, tabCfg, tabIndex, true);
                } else {                                                        // The tab exists in the correct tabView:
                    existingTab.setAttrs(tabCfg);                               // just update the tab config
                }
            }
            return existingTab;
        },

        // Sets the given tab as selected (inside its current tabView):
        setSelected: function(tab) {
            var tabView = Y.Widget.getByNode(tab.get("tabSelector"));
            tabView.deselectAll();
            tab.set("selected", 1);
            tab.get("panelNode").addClass("yui3-tab-panel-selected");
        },

        // Returns the tab, which is currently selected inside the given tabView.
        // May return undefined if no tab is currently selected.
        getSelected: function(tabViewSelector) {
            var res;
            for (var tab in this.tabs) {
                var currTab = this.tabs[tab];
                if (currTab && currTab.get("tabSelector") === tabViewSelector && currTab.get("selected") >= 1) {
                    res = currTab;
                }
            }
            return res;
        },

        // Moves all tabs away (except 'keepThisTab') from the given tabView to the opposite one.
        // The order of tabs is preserved, but not the "selected" state of tabs.
        moveTabsAwayFrom: function(tabView, keepThisTab) {
            // Move all other tabs while keep their original order
            var tabsToMove = Y.Widget.getByNode(tabView),
                nbTabsToMove = tabsToMove.size(),
                otherTabView = this.getOppositeTabView(tabView),
                keepThisTabId = keepThisTab ? keepThisTab.get("id") : "",
                firstTabIndex = 0;
            // Append the tabs one by one from left to right, at the last - 1 position in the target tabView:
            for (var i = 0; i < nbTabsToMove; i++) {
                var currTab = tabsToMove.item(firstTabIndex),
                    currTabLabel = currTab.get("id") || currTab.get("label");

                // Skip buttons and other stuff, as well as the 'keepThisTab' tab:
                if (currTab.name !== "tab" || currTabLabel === keepThisTabId) {
                    firstTabIndex++;
                    continue;
                }
                this.moveToTabView(currTabLabel, otherTabView, {});
            }
        },

        // Move the given tab to the given tabView (right or center).
        // @return the new tab.
        moveToTabView: function(id, tabViewSelector, tabCfg, tabIndex, forceSelect) {
            var tabs,
                existingTab = this.getTab(id),
                newTabView = Y.Widget.getByNode(tabViewSelector);
            // Temporarily remove a reference to this tab:
            this.setTab(id, undefined);
            tabCfg = tabCfg || {};
            Y.mix(tabCfg, {
                label: tabCfg.label || id,
                id: id,
                tabSelector: tabViewSelector,
                panelNode: existingTab.get("panelNode")
            });
            tabIndex = tabIndex || newTabView.size() - 1;
            tabs = newTabView.add(tabCfg, tabIndex);                    // Instantiate new tab with old panel
            var newTab = tabs.item(0),
                newPanelNode = newTab.get("panelNode");
            if (existingTab.hasPlugin("hideable")) {
                newTab.plug(Hideable);
            }
            if (existingTab.hasPlugin("removeable")) {
                newTab.plug(Removeable);
            }
            forceSelect = forceSelect || existingTab.get("selected") >= 1;
            if (forceSelect) {
                newTabView.deselectAll();
                newTab.set("selected", 1);
                newPanelNode.addClass("yui3-tab-panel-selected");
            } else {
                newTab.set("selected", 0);
            }
            // @HACK Special treatment for the Preview panel, which needs reloading to become fully usable,
            // especially because of TinyMce:
            if (id === PREVIEW_TAB_LABEL) {
                newTab.get("panelNode").show();
                Y.Wegas.PageLoader.find("previewPageLoader").reload();
            }
            // Make the old tab coherent to enable its deletion:
            existingTab.set("panelNode", Y.Node.create('<div class="yui3-tab-panel">To delete</div>'));
            existingTab.set("selected", 0);
            this.setTab(id, newTab);
            // @HACK Special treatment for the editor/attributes panel: the EditEntityAction plugin needs to be informed
            if (id === EDITOR_TAB_LABEL) {
                Plugin.EditEntityAction.setEditionTab(newTab);
            }
            existingTab.remove(); //.destroy();

            return newTab;
        },
        /**
         * Destroy and remove given tab id
         * @param {string} id tab to destroy
         */
        destroyTab: function(id) {
            var tab = this.getTab(id);
            if (tab && typeof tab.remove === 'function') {
                tab.remove().destroy();
                delete this.tabs[id];
            }
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
            var isNew = !(this.getTab(id));
            var nTab = this.createTab(id, tabViewSelector, tabCfg);          // create a new one

            if (nTab && (isNew || widgetCfg.type === "StateMachineViewer")) {
                nTab.destroyAll();                                                  // Empty it
                nTab.load(widgetCfg, fn);                                           // Load target widget
                this.restoreColumn(tabViewSelector);
            }
            return nTab;
        },
        // Re-opens the given column/tabview if it's hidden:
        restoreColumn: function(tabViewSelector) {
            if (!Wegas.app.widget) {
                Y.log("*** Wegas.app.widget is not yet available");
                return;
            }
            var tabView = this.getShortPositionName(tabViewSelector);
            if (tabView && Wegas.app.widget.isHidden(tabView)) {
                Wegas.app.widget.showPosition(tabView);
                // Hide icons for restoring this tabview from other tabview
                //var tabviewNode = Y.Widget.getByNode(this.getOppositeTabView(tabViewSelector));
                //tabviewNode.get(CONTENTBOX).one('.wegas-open-' + tabView + '-tabview').addClass("hidden");
            }
        },

        /*
         ** Shows the plus-menu of the given tabView and hides the other one.
         ** If we are showing the menu of the Preview tabView, hide the "Preview" entry, otherwise show it.
         */
        showPlusMenu: function(tabViewId) {
            tabViewId = this.getLongPositionName(tabViewId);
            var plusMenu = Y.one(tabViewId + " .wegas-plus-tab");
            if (!plusMenu) {
                return;
            }
            plusMenu.show();
            if (!Y.Wegas.Config.EditorAdvancedTabs) {
                Y.one(TabView.getOppositeTabView(tabViewId) + " .wegas-plus-tab").hide();
            }

            var previewTabView = this.getCurrentPreviewTabViewId(),
                isPreviewTabView = previewTabView.indexOf(tabViewId) > -1,
                previewEntry = this.getPreviewEntry(tabViewId);
            if (isPreviewTabView) {
                var tab = this.getTab(PREVIEW_TAB_LABEL);
                if (tab && tab.get("visible")) {
                    previewEntry.hide();
                } else {
                    previewEntry.show();
                }
            } else {
                previewEntry.show();
            }
        },

        /*
         ** Returns the "Preview" entry of the plus-menu of the given tabView.
         */
        getPreviewEntry: function(tabViewId) {
            tabViewId = this.getLongPositionName(tabViewId);
            var plusMenu = Y.one(tabViewId + " .wegas-plus-tab");
            if (!plusMenu) {
                return null;
            }
            var menu = Y.Widget.getByNode(plusMenu).hasPlugin("menu"),
                previewEntry = menu.getMenu().item(0);
            return previewEntry;
        },

        // Returns the default tabView identifier for the editor tab, taking the user's last setting if available:
        getDefaultEditorTabView: function() {
            var colId = localStorage.getItem(WEGAS_EDITOR_COL_LOCALSTORAGE);
            if (colId === "center") {
                return "#centerTabView";
            } else if (colId === "right") {
                return "#rightTabView";
            } else {
                return DEFAULT_EDIT_COLUMN;
            }
        },

        // Persists to localStorage the given tabView identifier as the default for the editor tab:
        setDefaultEditorTabView: function(newCol) {
            localStorage.setItem(WEGAS_EDITOR_COL_LOCALSTORAGE, this.getShortPositionName(newCol));
        },

        // NB: Returns undefined if the editor tab is not currently displayed!
        getCurrentEditorTabViewId: function() {
            var tab = this.getTab(EDITOR_TAB_LABEL);
            return tab ? tab.get("tabSelector") : undefined;
        },

        // NB: Returns undefined if the Preview tab is not currently displayed!
        getCurrentPreviewTabViewId: function() {
            var tab = this.getTab(PREVIEW_TAB_LABEL);
            return tab ? tab.get("tabSelector") : undefined;
        },

        // Returns the Id of the tabView, which is opposite to the given one ("right" vs "center").
        getOppositeTabView: function(tabViewSelector) {
            if (tabViewSelector.indexOf("center") >= 0) {
                return "#rightTabView";
            } else if (tabViewSelector.indexOf("right") >= 0) {
                return "#centerTabView";
            }
        },

        // Returns the Id of the tabView, which is NOT occupied NOR targeted by the editor tab ("center" vs "right").
        getNonEditorTabViewId: function() {
            var editorTabView = this.getCurrentEditorTabViewId() || this.getDefaultEditorTabView();
            return this.getOppositeTabView(editorTabView);
        },

        // Translates '#centerTabView' into 'center' etc.
        getShortPositionName: function(position) {
            if (position) {
                if (position.indexOf('center') >= 0) {
                    return 'center';
                } else if (position.indexOf('right') >= 0) {
                    return 'right';
                } else if (position.indexOf('left') >= 0) {
                    return 'left';
                } else if (position.indexOf('top') >= 0) {
                    return 'top';
                }
            }
        },

        // Translates 'center' into '#centerTabView' etc.
        getLongPositionName: function(position) {
            if (position.indexOf('center') >= 0) {
                return '#centerTabView';
            } else if (position.indexOf('right') >= 0) {
                return '#rightTabView';
            } else if (position.indexOf('left') >= 0) {
                return '#leftTabView';
            } else if (position.indexOf('top') >= 0) {
                return '.wegas-layout-hd';
            }
        },

        // Global getter for this constant.
        getEditorTabLabel: function() {
            return EDITOR_TAB_LABEL;
        },

        // Convenience function. Returns the tab object of the editor, or undefined if the editor is not currently open.
        getEditorTab: function() {
            return this.getTab(EDITOR_TAB_LABEL);
        },

        // Global getter for this constant.
        getPreviewTabLabel: function() {
            return PREVIEW_TAB_LABEL;
        },

        // Public method used in games to display messages in the correct editor column.
        // Returns the widget corresponding to #centerTabView or #rightTabView depending on user preferences.
        // Returns null if no suitable tabView is found.
        getPreviewTabView: function() {
            if (Y.one("body").hasClass("wegas-editmode")) {
                // Try to make this work even if the Preview tab is not yet rendered:
                var previewTabView = this.getNonEditorTabViewId();
                return Y.Widget.getByNode(previewTabView);
            } else {
                // no editmode, no preview
                return null;
            }
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
        PANEL_TEMPLATE: '<div><div class="panel-inner"></div></div>',
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
            if (!cfg.id) {
                cfg.id = cfg.label;
            }
            Tab.superclass.initializer.apply(this, arguments);
            TabView.tabs[cfg.id] = this;
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

            if (cfg.selected === true) {
                this.set("selected", 1);     // Make this tab selected by default
            }

            if (cfg.tabSelector) {
                this.set("tabSelector", cfg.tabSelector);   // Remember where the tab is placed
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
        REMOVE_TEMPLATE: '<a class="yui3-tab-remove" title="Close tab"><i class="fa fa-times"></i></a>',
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
            if (!(tab instanceof Tab)) {
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
            var tab = this.get("host");
            tab.get(BOUNDINGBOX).append(this.REMOVE_TEMPLATE);         // boundingBox is the Tab's LI
            // Unhide the tabView closing button and the first entry "Attributes" in the plus-menu:
            var tabView = tab.get("tabSelector");
            if (!tabView) {
                // The tab is not yet being rendered, it's only the instantiation of the plugin...
                return;
            }
            var cross = Y.Widget.getByNode(tabView).get(CONTENTBOX).one('.wegas-removeTabview');
            if (cross) {
                cross.show();
            }
            if (e.target.get("label") !== EDITOR_TAB_LABEL) {
                Wegas.TabView.showPlusMenu(tabView);
            }
        },
        /**
         * @function
         * @private
         * @param e
         * @description stop event propagation and remove host.
         */
        onRemoveClick: function(e) {
            var tab = this.get("host"),
                tabView = tab.get("tabSelector"),
                isEditTab = tab.get("label") === EDITOR_TAB_LABEL, // Must be true even if the form is empty.
                doDelete = function() {
                    tab.remove().destroy();
                    delete TabView.tabs[tab.get("id")];
                };
            e.stopPropagation();
            if (isEditTab) {
                Plugin.EditEntityAction.allowDiscardingEdits(doDelete);
                // Also close the tabView:
                var cross = Y.Widget.getByNode(tabView).get(CONTENTBOX).one(".wegas-removeTabview");
                if (cross) {
                    cross.simulate("click");
                }
            } else {
                doDelete();
            }
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
     * Hide the tab (and its corresponding panel) instead of deleting it when the user closes it.
     * @constructor
     */
    var Hideable = function() {
        Hideable.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Hideable, Removeable, {
        initializer: function() {
            // Empty for the time being...
        },
        onRemoveClick: function(e) {
            this.close();
            e.stopPropagation();
        },
        close: function() {
            var tab = this.get("host");
            tab.hide();
            tab.get("panelNode").hide();
            // Unhide the Preview entry of the current plus-menu each time the tab is closed:
            if (tab.get("tabSelector")) {
                Wegas.TabView.getPreviewEntry(tab.get("tabSelector")).show();
            }
            //var parentId = tab._parentNode.ancestor(".wegas-tabview-fullheight")._node.id
            //var previous = Wegas.TabView.getPreviewEntry(parentId);
            //previous.show();
            //previous.set("selected", 1);
        },
        expand: function() {
            var tab = this.get("host");
            tab.show();
            tab.get("panelNode").show();
            // Unhide the tabView closing button and the first entry "Attributes" in the plus-menu:
            var tabView = tab.get("tabSelector");
            var cross = Y.Widget.getByNode(tabView).get(CONTENTBOX).one('.wegas-removeTabview');
            if (cross) {
                cross.show();
            }
            Wegas.TabView.showPlusMenu(tabView);
        }
    }, {
        NS: "hideable",
        NAME: "HideableTabs",
        ATTRS: {
        }
    });
    Plugin.Hideable = Hideable;

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
        ADD_TEMPLATE: '<div class="wegas-removeTabview fa fa-times" title="Close %name% column"></div>',
        /**
         * @function
         * @private
         * @description Create a tab for remove tabview.
         * If this tab is clicked, remove host tabview.
         */
        initializer: function() {
            var tabview = this.get('host');
            tabview.after('render', this.afterRender, this);
            // This will call the onClick method of RemoveTabView:
            tabview.get(CONTENTBOX).delegate('click', this.onClick, '.wegas-removeTabview', this);
        },
        afterRender: function(e) {
            var tabview = this.get('host'),
                side = tabview.get("id"),
                name = Wegas.TabView.getShortPositionName(side);
            tabview.get(CONTENTBOX).one('> ul').append(this.ADD_TEMPLATE.replace("%name%", name));
        },
        // This should normally never be called, as sub-classes will redefine it and call stopPropagation:
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
     * Tabview (tab group) management.
     * @name Y.Plugin.RemoveTabView
     * @extends Y.Plugin.RemoveTab
     * @constructor
     */
    RemoveTabView = function() {
        RemoveTabView.superclass.constructor.apply(this, arguments);
    };

    Y.extend(RemoveTabView, RemoveTab, {
        /** @lends Y.Wegas.RemoveTabView# */
        /**
         * @function
         * @private
         * @description Create a button for *hiding* this tabview.
         */
        initializer: function() {
            Wegas.app.after("render", function() {
                if (this.get("host").isEmpty()) {
                    Wegas.app.widget.hidePosition(this.get("tabViewName"));
                }
            }, this);
            this.onHostEvent("addChild", function() {
                if (Wegas.app.widget) {
                    var tabViewId = this.get("tabViewName");
                    Wegas.app.widget.showPosition(tabViewId);
                    // Display the tabView removal icon in the other tabView in case it was empty (no tabs)
                    var otherTabView = Wegas.TabView.getOppositeTabView(tabViewId),
                        cross = Y.Widget.getByNode(otherTabView).get(CONTENTBOX).one('.wegas-removeTabview');
                    if (cross) {
                        cross.show();
                    }
                }
            });
        },
        onClick: function(e) {
            e.stopPropagation();
            var tabView = this.get("tabViewName"),
                editorTabView = Wegas.TabView.getCurrentEditorTabViewId();
            // Are we closing the tabView containing the edit/form tab?
            if ((editorTabView && editorTabView.indexOf(tabView) > -1) ||
                Wegas.TabView.getDefaultEditorTabView().indexOf(tabView) > -1) {
                // We are closing the tabview with the edit/form tab. Make it close itself properly:
                Plugin.EditEntityAction.allowDiscardingEdits(Y.bind(function() {
                    Plugin.EditEntityAction.discardEdits();
                    var tab = Wegas.TabView.getTab(EDITOR_TAB_LABEL);
                    if (tab) {
                        tab.get("boundingBox").one('.yui3-tab-remove').simulate("click");
                    }

                    // If the other column is NOT visible, show it and activate its plus-menu
                    var otherTabView = Wegas.TabView.getOppositeTabView(tabView);
                    if (Wegas.app.widget.isHidden(otherTabView)) {
                        Wegas.app.widget.showPosition(otherTabView);
                        Wegas.TabView.showPlusMenu(otherTabView);
                    }
                    Wegas.app.widget.hidePosition(tabView);
                }));
            } else {
                // It's the other tabView (Preview, plus-menu, ...)
                // Keep the tabView open, but do the following: (1) hide the close button, (2) close all its tabs, (3) adjust the plus-menu
                e.target.hide();
                var tabViewObj = this.get("host"),
                    nbTabs = tabViewObj.size(),
                    index = 0;
                for (var i = nbTabs - 1; i >= 0; i--) {
                    var currTab = tabViewObj.item(i);
                    if (currTab.name === "tab") {
                        var cross = currTab.get("boundingBox").one('.yui3-tab-remove');
                        if (cross) {
                            cross.simulate("click");
                        }
                    }
                }
                // If the other column is visible, activate its plus-menu
                var otherTabView = Wegas.TabView.getOppositeTabView(tabView);
                if (Wegas.app.widget.isHidden(otherTabView) === false) {
                    Wegas.TabView.showPlusMenu(otherTabView);
                    Wegas.app.widget.hidePosition(tabView);
                } else {
                    Wegas.TabView.showPlusMenu(tabView);
                }
            }
        }
    }, {
        NS: "removetab",
        NAME: "removetab",
        ATTRS: {
            tabViewName: ''
        }
    });
    Plugin.RemoveTabView = RemoveTabView;

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
                //var plusMenu = new Y.Node.create('<span class="wegas-plus-menu">+</span>');
                //tabView.get(CONTENTBOX).append(plusMenu);
            });
        }
    }, {
        NS: "ResizeTabViewLinks",
        NAME: "ResizeTabViewLinks"
    });
    Plugin.ResizeTabViewLinks = ResizeTabViewLinks;

    /**
     * Plugin that allows games to add their own tabs (Statistics, Orchestrator, Properties, etc).
     * Items are added to the "plus" menu of all tabViews
     * @extends Y.Plugin.Base
     */
    var ExtraTabs = Y.Base.create("wegas-extratabs", Plugin.Base, [], {
        initializer: function() {
            if (this.get("host") instanceof TabView) {
                Y.Wegas.app.once('ready', Y.bind(this.addExtraTabs, this));
            } else {
                this.destroy();
            }
        },
        _addTab: function(cfg) {
            var addTab = function(cfg) {
                var target = Wegas.TabView.getPreviewTabView();
                if (target) {
                    var t = target.add(cfg, target.size() - 1).item(0),
                        // Complete the 'plus' menus:
                        menu1 = Y.Widget.getByNode("#centerTabView .wegas-plus-tab").hasPlugin("menu"),
                        menu2 = Y.Widget.getByNode("#rightTabView .wegas-plus-tab").hasPlugin("menu"),
                        menuCfg = {
                            type: "OpenTabButton",
                            label: cfg.label,
                            tabSelector: "#centerTabView",
                            cssClass: "wegas-editor-menu-separator-above",
                            wchildren: cfg.children
                        };
                    menu1.add(menuCfg, menu1.size() - 1); // Insert before the "Attributes" entry
                    menuCfg.tabSelector = "#rightTabView";
                    menu2.add(menuCfg, menu2.size() - 1); // Insert before the "Attributes" entry
                    t.plug(Hideable);
                } else {
                    // This is not the scenario editor, just add the given tab to the center tabView:
                    Y.Widget.getByNode("#centerTabView").add(cfg);
                }
            };

            Y.Wegas.Widget.use(cfg, Y.bind(addTab, this, cfg));
        },
        addExtraTabs: function() {
            var tabs = Y.namespace("Wegas.Config.ExtraTabs") || [];
            for (var i = 0; i < tabs.length; i += 1) {
                this._addTab(tabs[i]);
            }
        }
    }, {
        NS: "extratabs",
        ATTRS: {
            dock: {
                value: false,
                validator: Y.Lang.isBoolean
            }
        }
    });
    Plugin.ExtraTabs = ExtraTabs;
});
