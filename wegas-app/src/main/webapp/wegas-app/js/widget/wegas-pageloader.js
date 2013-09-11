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

YUI.add('wegas-pageloader', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox', PageLoader;
    /**
     * @name Y.Wegas.PageLoader
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class loader of wegas's pages
     * @constructor
     * @description Load pages and request widget to render.
     */
    PageLoader = Y.Base.create("wegas-pageloader", Y.Widget,
            [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.PageLoader# */

// *** Private fields *** //
        /**
         * Current page id
         */
        currentPageId: null,
        /**
         * Reference to each used functions
         */
        handlers: null,
        // *** Lifecycle Methods ***/
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         * Set page to default page
         * Keep a references of all loaded PageLoaders in PageLoader.pageLoaderInstances.
         */
        initializer: function() {
            this.handlers = [];
            PageLoader.pageLoaderInstances[this.get("pageLoaderId")] = this; // We keep a references of all loaded PageLoaders
            this.publish("contentUpdated", {emitFacade: false});
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When page is updated, syncUI
         * When a response is fire by the VariableDescriptor, do sync
         * When the current player change, do sync
         * When an exception in fire, stop loading page, show error message.
         */
        bindUI: function() {
            var onUpdate = function(e) {
                if ("" + this.get("variable.evaluated") !== "" + this.get('pageId')) {
                    this.syncUI();
                }
            };
            //Y.Wegas.Facade.Page.after("response", this.syncUI, this);
//            this.handlers.push(Y.Wegas.Facade.Page.cache.after("pageUpdated", function(e) {
//                if (e.page && ("" + e.page["@pageId"] === "" + this.get("pageId"))) {
//                    this.currentPageId = null; // @hack force update
//                    this.syncUI();
//                }
//            }, this));

            this.handlers.push(Y.Wegas.Facade.VariableDescriptor.after("update", onUpdate, this));
            this.on("*:exception", function(e) {
                var test;
                e.halt(true);
                if (test = e.message.match(/ConstraintViolationException: (.*) is out of bound/)) {
                    this.showMessage("error", "Insufficient " + test[1] + ".");
                } else {
                    this.showMessage("error", e.message);
                }
            });
        },
        /**
         * @function
         * @private
         * @description Set pageId and displayed new page if the id is
         *  different that the current page id
         */
        syncUI: function() {
            var val = this.get("variable.evaluated");
            if (val && val.getInstance().get('value')) {                        // If there is a variable to refresh
                this.set("pageId", val.getInstance().get('value'));
            } else if (this.get("defaultPageId") && !this.get("pageId")) {      //in case a defaultPageId is defined and no pageId is
                this.set("pageId", this.get("defaultPageId"));
            } else {
                this.set("pageId", this.get("pageId")); // Otherwise use pageId (in case the setter has not been called yet)
            }

        },
        /**
         * @function
         * @private
         * @description Destroy widget and detach all functions created by this widget
         * remove instance kept in PageLoader.pageLoaderInstances.
         */
        destructor: function() {
            var i;
            if (this.get("widget")) {
                this.get("widget").destroy();
            }
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
            delete PageLoader.pageLoaderInstances[this.get("pageLoaderId")];
        },
        /**
         * reload current page from cache
         * @function
         * @public
         */
        reload: function() {
            this.showOverlay();
            this.currentPageId = null;
            this.syncUI();
        },
        getEditorLabel: function() {
            return this.get("pageLoaderId");
        },
// *** Private Methods ***/
        /**
         * @function
         * @private
         * @param {String} pageId check for this page's ID.
         * @return boolean
         * @description Return true if an ancestor already loads pageId
         */
        ancestorWithPage: function(pageId) {                                     //Page loader mustn't load the page who contain itself.
            var same = false;
            this.get("boundingBox").ancestors("." + this.getClassName(), false).some(function(node) {
                var widget = Y.Widget.getByNode(node);
                if (+pageId === +widget.currentPageId || +pageId === +widget.get('variable.evaluated')) {
                    same = true;
                    this.showMessage("warn", "Pageloader [" + this.get("pageLoaderId") + "] tries to load page (" + pageId + ") already loaded by one of its ancestor[" + widget.get("pageLoaderId") + "].");
                    return true;
                }
            }, this);
            return same;
        }

    }, {
        /** @lends Y.Wegas.PageLoader */
        EDITORNAME: "Page display",
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>pageLoaderId: the id of this pageLoader</li>
         *    <li>defaultPageId: the id of the default page to load</li>
         *    <li>pageId: the page id to load</li>
         *    <li>variable: a variable (or expression) which contain the id of the page to load
         *    The target variable, returned either based on the name attribute,
         *    and if absent by evaluating the expr attribute.
         *    </li>
         *    <li>widget: A widget to render in current page (transient)</li>
         * </ul>
         */
        ATTRS: {
            /**
             * the id of this pageLoader
             */
            pageLoaderId: {
                type: "string",
                value: "PageLoader" + Y.Lang.now(), //generate a default pageLoaderId
                _inputex: {
                    label: "Zone id"
                }
            },
            /**
             * the id of the default page to load
             */
            defaultPageId: {
                type: "string",
                _inputex: {
                    label: "Default page",
                    _type: "pageselect",
                    required: false
                }
            },
            /**
             * the page id to load
             */
            pageId: {
                type: "string",
                "transient": true,
                setter: function(val) {
                    if (!val || val === this.currentPageId || this.ancestorWithPage(val)) {// If the widget is currently being loaded, escape
                        return val;
                    }
                    this.currentPageId = val;
                    Y.Wegas.Facade.Page.cache.getPage(val, Y.bind(function(widgetCfg) {
                        if (!widgetCfg) {
                            return val;
                        }
                        if (this.get("widget")) {
                            this.get("widget").destroy(); // @fixme we should remove the widget instead of destroying it
                            this.set("widget", null);
                        }
                        this.set("widgetCfg", widgetCfg);
                        this.get(CONTENTBOX).empty();
                        this.showOverlay();
                        Y.soon(Y.bind(function(cfg) {                        //let the overlay appear during rendering
                            Y.Wegas.Widget.use(cfg, Y.bind(function() {    // Load the subwidget dependencies
                                try {
                                    var widget = Y.Wegas.Widget.create(cfg); // Render the subwidget
                                    widget.render(this.get(CONTENTBOX));
                                    widget['@pageId'] = cfg['@pageId'];
                                    this.set("widget", widget);
                                    widget.addTarget(this); // Event on the loaded widget will be forwarded
                                } catch (e) {
                                    this.get(CONTENTBOX).setContent("<center><i>Could not load sub page.</i></center>");
                                    Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.PageLoader');
                                } finally {
                                    this.hideOverlay();
                                    this.fire("contentUpdated");
                                }
                            }, this));

                        },this, widgetCfg));

                    }, this));
                    return val;
                }
            },
            /**
             * A variable (or expression) which contain the id of the page to load
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER
            },
            /**
             * A widget to render in current page (transient)
             */
            widget: {
                "transient": true
            },
            widgetCfg: {
                "transient": true,
                getter: function(val) {
                    var p;
                    if (this.get("widget")) {
                        return Y.JSON.stringify(this.get("widget").toObject("@pageId"), null, "\t");
                    } else if (val) {
                        p = Y.clone(val);
                        delete p['@pageId'];
                        return Y.JSON.stringify(val, null, "\t");
                    }
                    return val;
                }
            }
        },
        pageLoaderInstances: {},
        find: function(id) {
            return PageLoader.pageLoaderInstances[id];
        }
    });
    Y.namespace('Wegas').PageLoader = PageLoader;
});
