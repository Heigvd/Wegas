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
YUI.add("wegas-pageloader", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox",
        WIDGET = "widget",
        PAGEID = "pageId",
        PAGE_LOADER_INSTANCES = {},
        Wegas = Y.Wegas, PageLoader, GetPageIdFromQueryString,
        pageloaderErrorMessageClass = "wegas-pageloader-error";

    /**
     * @name Y.Wegas.PageLoader
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class loader of wegas' pages
     * @constructor
     * @description Load pages and request widget to render.
     */
    PageLoader = Y.Base.create("wegas-pageloader", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.PageLoader# */

        // *** Private fields *** //
        // *** Lifecycle Methods ***/
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         * Set page to default page
         * Keep a references of all loaded PageLoaders in PAGE_LOADER_INSTANCES.
         */
        initializer: function() {
            this.handlers = [];
            /**
             * Current page id
             */
            this._pageId = null;
            PAGE_LOADER_INSTANCES[this.get("pageLoaderId")] = this; // We keep a references of all loaded
            // PageLoaders
            this.publish("contentUpdated", {
                emitFacade: false
            });
            Y.fire("pageloader:created", this);
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
            this.handlers.push(Wegas.Facade.Variable.after("update", function() { // When the variable cache is update,
                //let other change end. Changing page may destroy other ongoing changes. So delay it a little.
                Y.soon(Y.bind(function() {
                    if (this.get("page.content") && "" + this.get("page.evaluated") !== "" + this.get(PAGEID)) { // and if the current page has change,
                        this.syncUI(); // sync the view
                    }

                    if ((this.get("variable.content") || // @backward compatibility and if the current page has change,
                        this.get("variable.name") ||
                        this.get("variable.expr")) &&
                        this.get("variable.evaluated") !== "" + this.get(PAGEID)) {
                        this.syncUI(); // sync the view
                    }
                }, this));
            }, this));

            //Wegas.Facade.Page.after("response", this.syncUI, this);
            this.handlers.push(Wegas.Facade.Page.cache.after("forcePageUpdate", function(e) {
                if (e.pageId && ("" + e.pageId === "" + this.get("pageId"))) {
                    this.reload();
                }
            }, this));
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

            if (page && page.getInstance) {
                this.set(PAGEID, page.getInstance().get("value"));
            } else if (page) { // If there is a page script
                this.set(PAGEID, +page); // display it

            } else if (val && val.getInstance().get("value")) { // @backward compatibility
                this.set(PAGEID, val.getInstance().get("value"));
            } else if (this.get("defaultPageId") && !this.get(PAGEID)) { // in case a defaultPageId is defined and no pageId is
                this.set(PAGEID, this.get("defaultPageId"));
            } else {
                this.set(PAGEID, this.get(PAGEID)); // Otherwise use pageId (in case the
                // setter has not been called yet)
            }
        },
        /**
         * @function
         * @private
         * @description Destroy widget and detach all functions created by this widget
         * remove instance kept in PAGE_LOADER_INSTANCES.
         */
        destructor: function() {
            if (this.get(WIDGET)) {
                this.get(WIDGET).destroy();
            }
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
            if (PAGE_LOADER_INSTANCES[this.get("pageLoaderId")] === this) {
                delete PAGE_LOADER_INSTANCES[this.get("pageLoaderId")];
            }
        },
        /**
         * reload current page from cache
         * @function
         * @public
         */
        reload: function() {
            this.showOverlay();
            this._pageId = null;
            this.syncUI();
            this.hideOverlay();
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
        ancestorWithPage: function(pageId) { //Page loader mustn't load the page who contain itself.
            return this.get("boundingBox").ancestors("." + this.getClassName(), false).some(function(node) {
                var widget = Y.Widget.getByNode(node);
                if (+pageId === +widget._pageId || +pageId === +widget.get("variable.evaluated")) {
                    this.showMessage("warn",
                        "Page display \"" + this.get("pageLoaderId") + "\" tries to load page " + pageId +
                        " which is already loaded by its parent page display \"" + widget.get("pageLoaderId") + "\"");
                    return true;
                }
            }, this);
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
                view: {
                    label: "Page display id"
                }
            },
            /**
             * the id of the default page to load
             */
            defaultPageId: {
                type: "string",
                view: {
                    label: "Default page",
                    type: "pageselect"
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
                    if (!arguments.length || val === this._pageId || this.ancestorWithPage(val)) { // If the widget is currently being loaded,
                        return val; // do not continue
                    }
                    this._pageId = val;
                    Y.log("Getting page: " + val + ", pageLoaderId: " + this.get("pageLoaderId"),
                        "log",
                        "Wegas.PageLoader");

                    Wegas.Facade.Page.cache.getPage(val, Y.bind(function(widgetCfg) { // Retrieve page
                        this.showOverlay();

                        Y.log("Destroy previous widget (page " + (widgetCfg ? widgetCfg["@pageId"] : "N/A") + ")", "log", "Wegas.PageLoader");
                        this.set(WIDGET, null);
                        if (!widgetCfg) {
                            this.get(CONTENTBOX).setContent("<center class=" + pageloaderErrorMessageClass +
                                "><i>Page [" + this._pageId +
                                "] was not found</i></center>");
                            this.hideOverlay();
                            this.fire("contentUpdated");
                            return;
                        }

                        Wegas.Widget.use(widgetCfg, Y.bind(function() { // Load the sub-widget dependencies
                            try {
                                Y.log("Rendering new widget (page " + widgetCfg["@pageId"] + ")", "log", "Wegas.PageLoader");
                                this.get(CONTENTBOX).all("." + pageloaderErrorMessageClass).remove(true);
                                widgetCfg.editable = true;
                                var widget = Wegas.Widget.create(widgetCfg); // Render the sub-widget
                                widget.render(this.get(CONTENTBOX));
                                widget["@pageId"] = widgetCfg["@pageId"]; // @HACK set up a reference to the page
                                this.set(WIDGET, widget);
                                this.set("pageId", widget["@pageId"], {
                                    noquery: true
                                });
                            } catch (e) {
                                this.set("widgetCfg", widgetCfg);
                                this.get(CONTENTBOX).setContent("<center class=" + pageloaderErrorMessageClass +
                                    "><i>Could not load sub page.</i></center>");
                                Y.log("renderUI(): Error rendering widget: " + (e.stack || e),
                                    "error",
                                    "Wegas.PageLoader");
                            } finally {
                                this.hideOverlay();
                                this.fire("contentUpdated", {
                                    page: val
                                });
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
                view: {
                    type: "hidden"
                }
            },
            /**
             *
             */
            page: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Variable",
                    classFilter: ["NumberDescriptor", "TextDescriptor"],
                    className: "wegas-advanced-feature"
                }
            },
            /**
             * A widget to render in current page (transient)
             */
            widget: {
                "transient": true,
                setter: function(v) {
                    if (this.get(WIDGET)) {
                        this.get(WIDGET).destroy();
                    }
                    if (v) {
                        v.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this); // Event on the loaded
                        // widget will be
                        // forwarded
                    }
                    return v;
                }
            },
            widgetCfg: {
                "transient": true,
                getter: function(val) {
                    var p;
                    if (this.get(WIDGET)) {
                        return Y.JSON.stringify(this.get(WIDGET).toObject("@pageId"), null, "\t");
                    } else if (val) {
                        p = Y.clone(val);
                        delete p["@pageId"];
                        return Y.JSON.stringify(val, null, "\t");
                    }
                    return val;
                }
            }
        },
        find: function(id) {
            return PAGE_LOADER_INSTANCES[id];
        }
    });
    Wegas.PageLoader = PageLoader;

    GetPageIdFromQueryString = Y.Base.create("wegas-getpageidfromquerystring", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        initializer: function() {
            var host, query, pageLoaderId;
            query = Y.QueryString.parse(window.location.search.substr(1));
            host = this.get("host");
            pageLoaderId = host.get("pageLoaderId");

            if (query[pageLoaderId]) {
                host.set("pageId", query[pageLoaderId]);
            }
        },
        destructor: function() {
        }
    }, {
        NS: "GetPageIdFromQueryString",
        NAME: "GetPageIdFromQueryString",
        ATTRS: {
        }
    });
    Y.Plugin.GetPageIdFromQueryString = GetPageIdFromQueryString;
});
