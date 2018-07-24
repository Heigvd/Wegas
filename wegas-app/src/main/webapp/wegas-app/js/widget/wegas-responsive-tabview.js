/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Maxence
 */
YUI.add('wegas-responsive-tabview', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox',
        ResponsiveTabview;


    ResponsiveTabview = Y.Base.create("wegas-responsive-tabview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        initializer: function() {
            this.tabView = new Y.TabView();
            this.handlers = {};

            this.isRemovingTabs = false;
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            this.tabView.render(cb);
            this.tabView.get("boundingBox").addClass("horizontal-tabview");
        },
        bindUI: function() {
            this.get("contentBox").delegate("click", this.toggleSmallMenu, ".smallscreen li, .smallscreen .menutitle", this);
            this._windowResizeCb = Y.bind(this.checkSize, this);
            window.addEventListener("resize", this._windowResizeCb);
            this.handlers.layoutResize = Y.Wegas.app.on("layout:resize", Y.bind(this.checkSize, this));

            this.tabView.after("selectionChange", this.onTabSelected, this);
            this.handlers.response = Y.Wegas.Facade.Variable.after("update", this.syncUI, this);
        },
        getTabLabel: function(entity) {
            throw "Abstract: Not Yet Implemented";
        },
        updateTab: function(tab, message) {
            tab.set("label", "<div class='menubutton'></div><div class='tablabel'>" + this.getTabLabel(message)) + "</div>";
        },
        createTab: function(entity) {
            var tab = new Y.Wegas.Tab();
            tab.loaded = false;
            tab.entity = entity;
            tab.set("content", "<div class=\"wegas-loading-div\"><div>");
            this.updateTab(tab, entity);
            return tab;
        },
        updateTabs: function(entities) {
            var entity, oldTab, newTab, tabs, toRemove, index, queue,
                oldIndex, selectedTab, lastSelection;
            tabs = this.tabView._items;
            toRemove = tabs.slice(0);

            selectedTab = this.tabView.get('selection');

            queue = entities.slice(0);

            index = 0;
            while (entity = queue.shift()) {
                oldTab = Y.Array.find(tabs, function(item) {
                    return item.entity
                        && item.entity.get("id") === entity.get("id")
                        && item.entity.get("@class") === entity.get("@class");
                });

                if (oldTab) {
                    // Simple Update
                    this.updateTab(oldTab, entity);
                    oldIndex = toRemove.indexOf(oldTab);
                    if (oldIndex >= 0) {
                        toRemove.splice(oldIndex, 1);
                    }
                } else {
                    // Just activated
                    newTab = this.createTab(entity);
                    this.tabView.add(newTab, index);
                }
                index++;
            }

            /*
             * Remove tabs which are to be no longer displayed
             */
            while (entity = toRemove.shift()) {
                if (selectedTab === entity) {
                    selectedTab = null;
                }
                entity.remove();
            }

            if (this.tabView.size()) {
                lastSelection = (selectedTab) ? selectedTab.get('index') : -1;
                if (lastSelection < 0 && this.get("contentBox").one(".smallscreen")) {
                    this.toggleSmallMenu();
                } else {

                    if (lastSelection < 0 && this.get("autoOpenFirst") || lastSelection >= this.tabView.size()) {
                        lastSelection = 0;
                    }

                    if (lastSelection >= 0) {
                        this.tabView.selectChild(lastSelection);
                    }
                }
            }
        },
        getNoContentMessage: function() {
            throw "Abstract: Not Yet Implemented";
        },
        getNothingSelectedInvite: function() {
            throw "Abstract: Not Yet Implemented";
        },
        getEntities: function() {
            throw "Abstract: Not Yet Implemented";
        },
        /**
         * @function
         * @private
         * @description * Update the TabView with entities
         * Display a message if there is nothing to diplay
         */
        syncUI: function() {

            this.checkSize();
            this.updateTabs(this.getEntities());

            this.hideOverlay();

            this.clearInvite();

            if (this.tabView.isEmpty()) {
                this.get("contentBox").addClass("empty");
                this.tabView.add(new Y.Tab({
                    label: "",
                    content: '<div class="wegas-panel-invite">' +
                        this.getNoContentMessage()
                        + "</div>"
                }));
                this.tabView.selectChild(0);
            } else {
                this.get("contentBox").removeClass("empty");

                if (!this.tabView.get('selection')) {
                    this.tabView
                        .get('panelNode')
                        .append(
                            '<div class="wegas-panel-invite">' +
                            this.getNothingSelectedInvite() +
                            '</div>');
                }


            }
        },
        clearInvite: function() {
            this.tabView
                .get('panelNode')
                .all('.wegas-panel-invite')
                .remove(true);
        },
        checkSize: function() {
            var cb = this.tabView.get("contentBox");
            if (cb._node) {
                cb.toggleClass("smallscreen", cb._node.getBoundingClientRect().width < 700);
            }
        },
        toggleSmallMenu: function() {
            var tvCb = this.tabView.get("contentBox");
            if (tvCb.hasClass("smallscreen")) {
                tvCb.toggleClass("open");
                if (tvCb.hasClass("open")) {
                    // add title
                    var selectedTab = tvCb.one(".yui3-tab-selected a");
                    tvCb.prepend("<div class='menutitle'>" + (selectedTab ? selectedTab.getContent() : "") + "</div>");
                    //tvCb.prepend("<div class='menutitle'><div>" +  tvCb.one(".yui3-tab-selected .index-label").getContent() + "</div></div>");
                } else {
                    // remove title
                    tvCb.all(".menutitle").each(function(item) {
                        item.remove();
                    });
                }
            }
        },
        getWidget: function(entity) {
            throw "Abstract: Not yet implemented";
        },
        /**
         * @function
         * @param e description
         * @private
         * @description Display selected question's description on current tab.
         */
        onTabSelected: function(e) {
            var widget,
                entity;
            if (e.newVal && e.newVal.entity
                && !this.isRemovingTabs && !e.newVal.loaded) {

                this.clearInvite();
                this.destroyWidget(e.prevVal);
                e.newVal.loaded = true;
                entity = e.newVal.entity;

                widget = this.getWidget(entity);
                e.newVal.add(widget);
            }
        },
        destroyWidget: function(prevVal) {
            if (prevVal && prevVal.loaded) {
                prevVal.loaded = false;
                prevVal.destroyAll();
            }
        },
        getEditorLabel: function() {
            var variable = this.get("variable.evaluated");
            if (variable && variable.getEditorLabel) {
                return Y.Wegas.InboxDisplay.EDITORNAME + ": " +
                    variable.getEditorLabel();
            }
            return Y.Wegas.InboxDisplay.EDITORNAME;
        },
        /**
         * @function
         * @private
         * @description Destroy TabView and detach all functions created
         *  by this widget
         */
        destructor: function() {
            var i;
            this.tabView.destroy();
            for (i in this.handlers) {
                this.handlers[i].detach();
            }
            window.removeEventListener("resize", this._windowResizeCb);
            this._windowResizeCb = Y.bind(this.checkSize, this);
        }
    }, {
        EDITORNAME: "Responsive tabview",
        ATTRS: {
            /**
             * The target variable, returned either based on the name
             * attribute, and if absent by evaluating the expr attribute.
             */
            variable: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Variable',
                }
            },
            autoOpenFirst: {
                type: 'boolean',
                value: true,
                view: {
                    label: 'Automatically open first item'
                }
            }
        }
    });
    Y.Wegas.ResponsibeTabView = ResponsiveTabview;
});
