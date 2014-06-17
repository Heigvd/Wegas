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

    var CONTENTBOX = 'contentBox', PAGEID = "pageId", Wegas = Y.Wegas, PageLoader;
    /**
     * @name Y.Wegas.PageLoader
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class loader of wegas's pages
     * @constructor
     * @description Load pages and request widget to render.
     */
    PageLoader = Y.Base.create("wegas-pageloader", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.PageLoader# */

        // *** Private fields *** //
        /**
         * Current page id
         */
        currentPageId: null,
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
            PageLoader.pageLoaderInstances[this.get("pageLoaderId")] = this;    // We keep a references of all loaded PageLoaders
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
            this.handlers.push(Wegas.Facade.VariableDescriptor.after("update", function() {// When the variable cache is update,
                if (this.get("page.content") && "" + this.get("page.evaluated") !== "" + this.get(PAGEID)) {// and if the current page has change,
                    this.syncUI();                                              // sync the view
                }
                if (this.get("variable.content") && "" + this.get("variable.evaluated") !== "" + this.get(PAGEID)) {// @backwardcompatibilityand if the current page has change,
                    this.syncUI();                                              // sync the view
                }
            }, this));

            //Wegas.Facade.Page.after("response", this.syncUI, this);
            //this.handlers.push(Wegas.Facade.Page.cache.after("pageUpdated", function(e) {
            //    if (e.page && ("" + e.page["@pageId"] === "" + this.get("pageId"))) {
            //        this.currentPageId = null; // @hack force update
            //        this.syncUI();
            //    }
            //}, this));
        },
        /**
         * @function
         * @private
         * @description Set pageId and displayed new page if the id is
         *  different that the current page id
         */
        syncUI: function() {
            var val = this.get("variable.evaluated"),
                page = this.get("page.evaluated");
            if (page) {                                                         // If there is a page script
                this.set(PAGEID, +page);                                        // display it
            } else if (val && val.getInstance().get('value')) {                 // @backwardcompatibility
                this.set(PAGEID, val.getInstance().get('value'));
            } else if (this.get("defaultPageId") && !this.get(PAGEID)) {        //in case a defaultPageId is defined and no pageId is
                this.set(PAGEID, this.get("defaultPageId"));
            } else {
                this.set(PAGEID, this.get(PAGEID));                             // Otherwise use pageId (in case the setter has not been called yet)
            }
        },
        /**
         * @function
         * @private
         * @description Destroy widget and detach all functions created by this widget
         * remove instance kept in PageLoader.pageLoaderInstances.
         */
        destructor: function() {
            if (this.get("widget")) {
                this.get("widget").destroy();
            }
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
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
        ancestorWithPage: function(pageId) {                                    //Page loader mustn't load the page who contain itself.
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
                value: "maindisplayarea",
                //value: "PageLoader" + Y.Lang.now(), //generate a default pageLoaderId
                _inputex: {
                    label: "Page display id"
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
                setter: function(val, name, opts) {
                    if (Y.Lang.isObject(opts) && opts.noquery) {
                        return val;
                    }
                    if (!arguments.length || val === this.currentPageId || this.ancestorWithPage(val)) {// If the widget is currently being loaded,
                        return val;                                             // do not continue
                    }
                    this.currentPageId = val;
                    Y.log("Getting page", "log", "Wegas.PageLoader");
                    Wegas.Facade.Page.cache.getPage(val, Y.bind(function(widgetCfg) {// Retrieve page
                        this.showOverlay();

                        if (this.get("widget")) {
                            Y.log("Destroy previous widget", "log", "Wegas.PageLoader");
                            this.get("widget").destroy();
                            this.set("widget", null);
                        }
                        if (!widgetCfg) {
                            this.get(CONTENTBOX).setContent("<center><i>Page [" + this.currentPageId + "] was not found</i></center>");
                            this.hideOverlay();
                            this.fire("contentUpdated");
                            return;
                        }
                        this._set(PAGEID, val);
                        this.get(CONTENTBOX).empty();                           // Let the overlay appear during rendering

                        Wegas.Widget.use(widgetCfg, Y.bind(function() {         // Load the subwidget dependencies
                            try {
                                Y.log("Rendering new widget", "log", "Wegas.PageLoader");
                                widgetCfg.editable = true;
                                var widget = Wegas.Widget.create(widgetCfg);    // Render the subwidget
                                widget.render(this.get(CONTENTBOX));
                                widget['@pageId'] = widgetCfg['@pageId'];       // @HACK set up a reference to the page
                                this.set("widget", widget);
                            } catch (e) {
                                this.set("widgetCfg", widgetCfg);
                                this.get(CONTENTBOX).setContent("<center><i>Could not load sub page.</i></center>");
                                Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.PageLoader');
                            } finally {
                                this.hideOverlay();
                                this.fire("contentUpdated");
                            }
                        }, this));
                    }, this));
                    return val;
                }
            },
            /**
             * A variable (or expression) which contain the id of the page to load
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             * 
             * @deprecated
             */
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                optional: true,
                _inputex: {
                    _type: "hidden"
                }
            },
            /**
             * 
             */
            page: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                optional: true,
                _inputex: {
                    _type: "variableselect",
//                    _type: "hidden",
                    classFilter: ["NumberDescriptor", "TextDescriptor"],
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            },
            /**
             * A widget to render in current page (transient)
             */
            widget: {
                "transient": true,
                setter: function(v) {
                    if (this.get("widget")) {
                        this.get("widget").removeTarget(this);
                    }
                    if (v) {
                        v.addTarget(this);
                    }                                                           // Event on the loaded widget will be forwarded
                    return v;
                }
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
    Y.Wegas.PageLoader = PageLoader;
});
