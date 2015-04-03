/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add("wegas-review-widgets", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", WIDGET = "widget", PAGEID = "pageId",
        Wegas = Y.Wegas, ReviewVariableEditor, pageloaderErrorMessageClass = "wegas-pageloader-error",
        SUBPAGE = "wegas-review-subpage", MAIN = "wegas-review-main", BUTTON = "wegas-review-button",
        ReviewOrchestrator, ReviewWidget, ReviewTabView,
        GradeInput, TextEvalInput, CategorizationInput;

    /**
     * @name Y.Wegas.ReviewOrchestrator
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class loader of wegas's pages
     * @constructor
     * @description 
     */
    ReviewOrchestrator = Y.Base.create("wegas-review-orchestrator", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.ReviewOrchestrator# */
        CONTENT_TEMPLATE: "<div>" +
            "<div class=\"wegas-review-orcherstration-state\"></div>" +
            "<div class=\"wegas-review-orcherstration-buttons\"></div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
        },
        countByStatus: function(instances) {
            var counters = {}, instance, key;
            for (key in instances) {
                if (instances.hasOwnProperty(key)) {
                    instance = instances[key];
                    counters[instance.get("reviewState")] = (counters[instance.get("reviewState")] + 1) || 1;
                }
            }
            return counters;
        },
        renderUI: function() {
            this.dispatchButton = new Y.Button({
                label: "dispatch",
                visible: true
                    //}).render(this.get(CONTENTBOX));
            }).render(this.get(CONTENTBOX).one(".wegas-review-orcherstration-buttons"));
            this.notifyButton = new Y.Button({
                label: "notify",
                visible: true
                    //}).render(this.get(CONTENTBOX));
            }).render(this.get(CONTENTBOX).one(".wegas-review-orcherstration-buttons"));
            this.closeButton = new Y.Button({
                label: "close",
                visible: true
                    //}).render(this.get(CONTENTBOX));
            }).render(this.get(CONTENTBOX).one(".wegas-review-orcherstration-buttons"));
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         */
        bindUI: function() {
            this.handlers.push(Wegas.Facade.Variable.after("update", this.syncUI, this));
            this.dispatchButton.on("click", this.onDispatch, this);
            this.notifyButton.on("click", this.onNotify, this);
            this.closeButton.on("click", this.onClose, this);
        },
        /**
         * @function
         * @private
         */
        syncUI: function() {
            var prd = this.get("variable.evaluated"), instances, counts, summary, key;
            instances = prd.get("scope").get("variableInstances");
            counts = this.countByStatus(instances);
            summary = ["<h1>Summary</h1>", "<ul>"];
            for (key in counts) {
                summary.push("<li>" + key + ": " + counts[key] + "</li>");
            }
            summary.push("</ul>");

            this.get(CONTENTBOX).one(".wegas-review-orcherstration-state").setContent(summary.join(""));
        },
        /**
         * @function
         * @private
         * @description Destroy widget and detach all functions created by this widget
         */
        destructor: function() {
            this.dispatchButton.destroy();
            this.notifyButton.destroy();
            this.closeButton.destroy();
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        getEditorLabel: function() {
            return "Orchestrator";
        },
        onClose: function() {
            this.onAction("Close");
        },
        onNotify: function() {
            this.onAction("Notify");
        },
        onDispatch: function() {
            this.onAction("Dispatch");
        },
        onAction: function(action) {
            var prd = this.get("variable.evaluated");

            Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                this.showOverlay();
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/PeerReviewController/" + prd.get("id") + "/" + action + "/",
                    cfg: {
                        updateCache: true,
                        method: "post"
                    },
                    on: {
                        success: Y.bind(function() {
                            this.hideOverlay();
                        }, this),
                        failure: Y.bind(function() {
                            this.hideOverlay();
                            this.showMessage("error", "Something went wrong");
                        }, this)
                    }
                });
            }, this));
        }
    }, {
        /** @lends Y.Wegas.ReviewOrchestrator */
        EDITORNAME: "Review Orchestrator",
        ATTRS: {
            /**
             * The PeerReviewDescriptor
             * 
             */
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Peer Review Descriptor",
                    classFilter: ["PeerReviewDescriptor"],
                    wrapperClassName: "inputEx-fieldWrapper"
                }
            }
        }
    });
    Wegas.ReviewOrchestrator = ReviewOrchestrator;




    /**
     * @name Y.Wegas.ReviewVariableEditor
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class loader of wegas's pages
     * @constructor
     * @description 
     */
    ReviewVariableEditor = Y.Base.create("wegas-review-variableeditor", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.ReviewVariableEditor# */
        CONTENT_TEMPLATE: "<div class=\"" + MAIN + "\">" +
            "<div class=\"" + SUBPAGE + "\"></div>" +
            "<div class=\"" + BUTTON + "\"></div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
        },
        renderUI: function() {
            this.submitButton = new Y.Button({
                label: "Submit",
                visible: true
            }).render(this.get(CONTENTBOX).one("." + BUTTON));
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
            this.handlers.push(Wegas.Facade.Variable.after("update", function() {// When the variable cache is updated,
                this.syncUI(); // sync the view
            }, this));
            this.submitButton.on("click", this.onSubmit, this);
        },
        /**
         * @function
         * @private
         * @description Set pageId and displayed new page if the id is
         *  different that the current page id
         */
        syncUI: function() {
            var prd = this.get("variable.evaluated"),
                page;
            this.get("page.evaluated");
            if (prd.getInstance().get("reviewState") === "NOT_STARTED") {
                // Time to edit the variable
                this.submitButton.set("visible", true);
                page = this.get("editPage");
            } else {
                // No longer editable
                this.submitButton.set("visible", false);
                page = this.get("showPage");
            }

            if (page && page.getInstance) {
                this.set(PAGEID, page.getInstance().get("value"));
            } else if (page) {                                                  // If there is a page script
                this.set(PAGEID, +page); // display it
            }
        },
        /**
         * @function
         * @private
         * @description Destroy widget and detach all functions created by this widget
         */
        destructor: function() {
            this.submitButton.destroy();
            this.get(WIDGET) && this.get(WIDGET).destroy();
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
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
        ancestorWithPage: function(pageId) {                                    //Page loader mustn't load the page who contain itself.
            return this.get("boundingBox").ancestors("." + this.getClassName(), false).some(function(node) {
                var widget = Y.Widget.getByNode(node);
                if (+pageId === +widget._pageId || +pageId === +widget.get("variable.evaluated")) {
                    this.showMessage("warn", "PeerReview Variable editor tries to load page " + pageId + " which is already loaded by its parent page display");
                    return true;
                }
            }, this);
        },
        onSubmit: function() {

            var prd = this.get("variable.evaluated");

            Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                this.showOverlay();
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/PeerReviewController/" + prd.get("id") + "/Submit/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                    cfg: {
                        updateCache: true,
                        method: "post"
                    },
                    on: {
                        success: Y.bind(function() {
                            this.hideOverlay();
                        }, this),
                        failure: Y.bind(function() {
                            this.hideOverlay();
                            this.showMessage("error", "Error while submiting");
                        }, this)
                    }
                });
            }, this));
        }
    }, {
        /** @lends Y.Wegas.PageLoader */
        EDITORNAME: "Review Variable Editor",
        ATTRS: {
            /**
             * the id of the default page to load
             */
            editPage: {
                type: "string",
                _inputex: {
                    label: "Edit page",
                    _type: "pageselect",
                    required: true
                }
            },
            showPage: {
                type: "string",
                _inputex: {
                    label: "Show page",
                    _type: "pageselect",
                    required: true
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
                    if (!arguments.length || val === this._pageId || this.ancestorWithPage(val)) {// If the widget is currently being loaded,
                        return val; // do not continue
                    }
                    this._pageId = val;
                    Wegas.Facade.Page.cache.getPage(val, Y.bind(function(widgetCfg) {// Retrieve page
                        this.showOverlay();
                        Y.log("Destroy previous widget", "log", "Wegas.ReviewVariableEditor");
                        this.set(WIDGET, null);
                        if (!widgetCfg) {
                            this.get(CONTENTBOX).one("." + SUBPAGE).setContent("<center class=" + pageloaderErrorMessageClass + "><i>Page [" + this._pageId + "] was not found</i></center>");
                            this.hideOverlay();
                            this.fire("contentUpdated");
                            return;
                        }

                        Wegas.Widget.use(widgetCfg, Y.bind(function() {         // Load the subwidget dependencies
                            try {
                                Y.log("Rendering new widget", "log", "Wegas.ReviewVariableEditor");
                                this.get(CONTENTBOX).all("." + pageloaderErrorMessageClass).remove(true);
                                widgetCfg.editable = true;
                                var widget = Wegas.Widget.create(widgetCfg); // Render the subwidget
                                widget.render(this.get(CONTENTBOX).one("." + SUBPAGE));
                                widget["@pageId"] = widgetCfg["@pageId"]; // @HACK set up a reference to the page
                                this.set(WIDGET, widget);
                            } catch (e) {
                                this.set("widgetCfg", widgetCfg);
                                this.get(CONTENTBOX).one("." + SUBPAGE).setContent("<center class=" + pageloaderErrorMessageClass + "><i>Could not load sub page.</i></center>");
                                Y.log("renderUI(): Error rendering widget: " + (e.stack || e), "error", "Wegas.PageLoader");
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
             * The PeerReviewDescriptor
             * 
             */
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Peer Review Descriptor",
                    classFilter: ["PeerReviewDescriptor"],
                    wrapperClassName: "inputEx-fieldWrapper"
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
                        v.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this); // Event on the loaded widget will be forwarded
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
        }
    });
    Wegas.ReviewVariableEditor = ReviewVariableEditor;


    /**
     * @name Y.Wegas.ReviewTabView
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class 
     * @constructor
     * @description  
     */
    ReviewTabView = Y.Base.create("wegas-review-tabview", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.ReviewTabView# */
        // *** Lifecycle Methods *** //
        CONTENT_TEMPLATE: null,
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         */
        initializer: function() {
            /**
             * datasource from Y.Wegas.Facade.Variable
             */
            this.dataSource = Wegas.Facade.Variable;
            this.tabView = new Y.TabView();
            /**
             * Reference to each used functions
             */
            this.handlers = [];
            this.isRemovingTabs = false;
        },
        /**
         * @function
         * @private
         * @description Render the TabView widget in the content box.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            this.tabView.render(cb);
            this.tabView.get("boundingBox").addClass("horizontal-tabview");
            cb.append("<div style='clear:both'></div>");
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When submit button is clicked, send the selected choice
         * When datasource is updated, do syncUI;
         */
        bindUI: function() {

            this.tabView.after("selectionChange", this.onTabSelected, this);

            /*this.get(CONTENTBOX).delegate("click", function(e) {
             
             Wegas.Panel.confirmPlayerAction(Y.bind(function() {
             this.showOverlay();
             this.dataSource.sendRequest({
             request: "/QuestionDescriptor/SelectAndValidateChoice/" + e.target.get('id')
             + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
             cfg: {
             method: "POST"
             },
             on: {
             success: Y.bind(this.hideOverlay, this),
             failure: Y.bind(this.hideOverlay, this)
             }
             });
             }, this));
             }, "button.yui3-button", this);*/

            this.handlers.push(this.dataSource.after("update", this.syncUI, this));
        },
        /**
         * @function
         * @private
         * @description Clear and re-fill the TabView with reviews
         * Display a message if there is not time to review (NOT_STARTED)
         */
        syncUI: function() {
            var prd = this.get("variable.evaluated"),
                pri = prd.getInstance(),
                selectedTab = this.tabView.get('selection'),
                lastSelection = (selectedTab) ? selectedTab.get('index') : 0;

            this.isRemovingTabs = true;
            this.tabView.destroyAll();
            this.isRemovingTabs = false;

            this.hideOverlay();

            if (pri.get("reviewState") !== "DISPATCHED") {
                this.tabView.add(new Y.Tab({
                    label: "",
                    content: "<center><i><br /><br /><br />No review available yet.</i></center>"
                }));
                this.tabView.selectChild(0);
            } else {
                this.addReviews(pri);
                this.tabView.selectChild(lastSelection);
            }
        },
        addReviews: function(pri) {
            var i, j, tab, type, types = ["toReview", "reviewed"], reviews, review;

            for (i = 0; i < 2; i++) {
                type = types[i];
                reviews = pri.get(type);
                for (j = 0; j < reviews.length; j++) {
                    review = reviews[j];
                    tab = new Y.Tab({
                        label: type + " #" + (j + 1)
                            //content: "<div></div>"
                    });
                    tab.loaded = false;
                    tab.review = review;
                    tab.reviewer = (type === types[0]);
                    this.tabView.add(tab);
                }
            }
        },
        /**
         * @function
         * @param e description
         * @private
         * @description Display selected question's description on current tab.
         */
        onTabSelected: function(e) {
            if (e.newVal && e.newVal.review
                && !this.isRemovingTabs && !e.newVal.loaded) {
                e.newVal.loaded = true;
                this.renderTab(e.newVal);
                /*Wegas.Facade.Variable.cache.getWithView(e.newVal.review, "Extended", {
                 on: {
                 success: Y.bind(function(tab, e) {
                 var question = e.response.entity;
                 
                 this.renderTab(tab, question);
                 }, this, e.newVal)
                 }
                 });*/
            }
        },
        renderTab: function(tab) {
            var RewviewW = new Wegas.ReviewWidget({
                "review": tab.review,
                descriptor: this.get("variable"),
                reviewer: tab.reviewer
            }).render(tab.get("panelNode"));
        },
        getEditorLabel: function() {
            var variable = this.get("variable.evaluated");
            if (variable) {
                return variable.getEditorLabel();
            }
            return null;
        },
        /**
         * @function
         * @private
         * @description Destroy TabView and detach all functions created
         *  by this widget
         */
        destructor: function() {
            this.tabView.destroy();
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        }
    }, {
        EDITORNAME: "Review display",
        /** @lends Y.Wegas.ReviewTabView */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>variable: The target variable, returned either based on the name
         *     attribute, and if absent by evaluating the expr attribute.</li>
         * </ul>
         */
        ATTRS: {
            variable: {
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Peer Review",
                    classFilter: ["PeerReviewDescriptor"]
                }
            }
        }
    });
    Wegas.ReviewTabView = ReviewTabView;



    ReviewWidget = Y.Base.create("wegas-review-widget", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>"
            + "<span class=\"wegas-review-widget-title\">Review</span>"
            + "<div class=\"wegas-review-widget-toReview\"></div>"
            + "<div class=\"wegas-review-widget-feedback\">"
            + "<span class=\"wegas-review-widget-feedback-title\">Feedback</span>"
            + "<span class=\"wegas-review-widget-feedback-content\"></span>"
            + "</div>"
            + "<div class=\"wegas-review-widget-feedbackEv\">"
            + "<span class=\"wegas-review-widget-feedbackEv-title\">Feedback Evaluation</span>"
            + "<span class=\"wegas-review-widget-feedbackEv-content\"></span>"
            + "</div>"
            + "<div class=\"wegas-review-widget-submit\"></div>"
            + "</div>",
        initialize: function() {
        },
        /**
         * 
         * @param {type} ev
         * @param {type} container
         * @param {type} mode hidden, read or write, others means hidden
         * @returns {undefined}
         */
        addEvaluation: function(ev, container, mode) {
            if (mode === "write" || mode === "read") {
                var klass = ev.get("@class"),
                    widget, readonly = mode === "read", cfg = {
                        evaluation: ev,
                        readonly: readonly
                    };
                switch (klass) {
                    case "GradeInstance":
                        widget = new Wegas.GradeInput(cfg).render(container);
                        break;
                    case "TextEvaluationInstance":
                        widget = new Wegas.TextEvalInput(cfg).render(container);
                        break;
                    case "CategorizedEvaluationInstance":
                        widget = new Wegas.CategorizationInput(cfg).render(container);
                        break;
                }
            }
        },
        renderUI: function() {
            var review = this.get("review"),
                i, evls,
                reviewer = this.get("reviewer"),
                desc = this.get("descriptor"),
                fbContainer = this.get("contentBox").one(".wegas-review-widget-feedback-content"),
                fbEContainer = this.get("contentBox").one(".wegas-review-widget-feedbackEv-content"),
                modeFb = "hidden",
                modeFbEval = "hidden";

            this.get("contentBox").one(".wegas-review-widget-title").setContent("Review (" + review.get("status") + ")");

            if (reviewer) {
                if (review.get("status") === "DISPATCHED") {
                    modeFb = "write";

                } else {
                    modeFb = "read";
                }
                if (review.get("status") === "CLOSED") {
                    modeFbEval = "read";
                }
            } else { // Author
                if (review.get("status") === "NOTIFIED") {
                    modeFb = "read";
                    modeFbEval = "write";
                } else if (review.get("status") === "CLOSED") {
                    modeFb = "read";
                    modeFbEval = "read";
                }
            }

            if (modeFb === "write" || modeFbEval === "write") {
                this.submitButton = new Y.Button({
                    label: "Submit",
                    visible: true
                }).render(this.get(CONTENTBOX).one('.wegas-review-widget-submit'));
                this.saveButton = new Y.Button({
                    label: "Save",
                    visible: true
                }).render(this.get(CONTENTBOX).one('.wegas-review-widget-submit'));
            }

            evls = review.get("feedback");
            for (i in evls) {
                this.addEvaluation(evls[i], fbContainer, modeFb);
            }

            evls = review.get("feedbackEvaluation");
            for (i in evls) {
                this.addEvaluation(evls[i], fbEContainer, modeFbEval);
            }
        },
        syncUI: function() {
        },
        bindUI: function() {
            if (this.submitButton) {
                this.submitButton.on("click", this.submit, this);
            }
            if (this.saveButton) {
                this.saveButton.on("click", this.save, this);
            }
        },
        destructor: function() {
            if (this.submitButton) {
                this.submitButton.destroy();
            }
            if (this.saveButton) {
                this.saveButton.destroy();
            }
        },
        _sendRequest: function(action, updateCache) {
            this.showOverlay();
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/PeerReviewController/" + action,
                cfg: {
                    updateCache: updateCache,
                    method: "post",
                    data: this.get("review")
                },
                on: {
                    success: Y.bind(function() {
                        this.hideOverlay();
                    }, this),
                    failure: Y.bind(function() {
                        this.hideOverlay();
                        this.showMessage("error", "Something went wrong: " + action + " review");
                    }, this)
                }
            });
        },
        save: function() {
            this._sendRequest("SaveReview");
        },
        submit: function() {
            this._sendRequest("SubmitReview", true);
        }
    }, {
        ATTRS: {
            descriptor: {
                type: "PeerReviewDescriptor"
            },
            review: {
                type: "Review"
            },
            reviewer: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.ReviewWidget = ReviewWidget;

    GradeInput = Y.Base.create("wegas-review-gradeinput", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>" +
            "<div class=\"wegas-review-grade-instance-label\"></div>" +
            "<div class=\"wegas-review-grade-instance-slider\"></div>" +
            "<div class=\"wegas-review-grade-instance-input-container\">" +
            "<input class=\"wegas-review-grade-instance-input\" />" +
            "</div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this.xSlider = null;
        },
        renderUI: function() {
            var ev = this.get("evaluation"), desc = ev.get("descriptor");
            this.get(CONTENTBOX).one(".wegas-review-grade-instance-label").setContent(desc.get("name"));

            if (!this.get("readonly")) {
                this.get(CONTENTBOX).one(".wegas-review-grade-instance-input").set("value", ev.get("value"));
                if (desc.get("minValue") && desc.get("maxValue")) {
                    this.xSlider = new Y.Slider({
                        min: desc.get("minValue"),
                        max: desc.get("maxValue"),
                        value: +ev.get("value")
                    }).render(this.get(CONTENTBOX).one(".wegas-review-grade-instance-slider"));
                }
            } else {
                this.get(CONTENTBOX).one(".wegas-review-grade-instance-input-container").setContent('<p>' +
                    ev.get("value") + '</p>');
            }

        },
        syncUI: function() {
        },
        bindUI: function() {
            var input;
            if (this.xSlider) {
                input = this.get(CONTENTBOX).one(".wegas-review-grade-instance-input");
                this.handlers.push(this.xSlider.after("valueChange", this.updateInput, this));
                this.handlers.push(input.on("keyup", this.updateSlider, this));
            }
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        updateValue: function(value) {
            var ev = this.get("evaluation"),
                desc = ev.get("descriptor");

            if ((desc.get("minValue") && value < desc.get("minValue")) ||
                (desc.get("maxValue") && value > desc.get("maxValue"))
                ) {
                this.showMessage("error", "Grade is out of bound");
                return false;
            }
            ev.set("value", value);

            return true;
        },
        updateInput: function(e) {
            var input = this.get(CONTENTBOX).one(".wegas-review-grade-instance-input"),
                value = this.xSlider.get("value");

            if (this.updateValue(value)) {
                input.set("value", value);
            }
        },
        updateSlider: function(e) {
            var input = this.get(CONTENTBOX).one(".wegas-review-grade-instance-input"),
                data = input.getData(),
                value = +input.get("value");

            if (data.wait) {
                data.wait.cancel();
            }
            data.wait = Y.later(200, this, function() {
                data.wait = null;
                if (this.updateValue(value)) {
                    this.xSlider.set("value", value);
                }
            });
        }
    }, {
        ATTRS: {
            evaluation: {
                type: "GradeInstance"
            },
            readonly: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.GradeInput = GradeInput;




    TextEvalInput = Y.Base.create("wegas-review-textevalinput", Y.Wegas.TextInput, [], {
        CONTENT_TEMPLATE: "<div>" +
            "<span class=\"wegas-review-texteval-label\"></span>" +
            "<div class=\"wegas-text-input-editor\"></div>" +
            "<div class=\"wegas-text-input-toolbar\"><span class=\"status\"></span></div>" +
            "</div>",
        getInitialContent: function() {
            var ev = this.get("evaluation"), desc = ev.get("descriptor"), button;
            this.get("contentBox").one(".wegas-review-texteval-label").setContent(desc.get("name") + ": ");
            return ev.get("value");
        },
        valueChanged: function(newValue) {
            this.save(newValue);
        },
        save: function(value) {
            this.get("evaluation").set("value", value);
            return true;
        }
    }, {
        EDITORNAME: "TextEvalInput",
        ATTRS: {
            evaluation: {
                type: "TextEvaluationInstance"
            },
            readonly: {
                type: "boolean",
                value: false
            },
            showSaveButton: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.TextEvalInput = TextEvalInput;


    CategorizationInput = Y.Base.create("wegas-review-categinput", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>" +
            "<span class=\"wegas-review-categinput-label\"></span>" +
            "<div class=\"wegas-review-categinput-content\"></div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
        },
        renderUI: function() {
            var ev = this.get("evaluation"), desc = ev.get("descriptor"), categs, i,
                categ, frag;
            this.get("contentBox").one(".wegas-review-categinput-label").setContent(desc.get("name") + ": ");
            if (this.get("readonly")) {
                this.get("contentBox").one(".wegas-review-categinput-content").setContent(ev.get("value"));
            } else {
                frag = ['<select>'];
                categs = desc.get("categories");
                for (i in categs) {
                    if (categs.hasOwnProperty(i)) {
                        categ = categs[i];
                        frag.push("<option value=\"" + categ + "\" " +
                            (categ === ev.get("value") ? "selected=''" : "") +
                            ">" + categ + "</option>");
                    }
                }
                frag.push('</select>');
                this.get("contentBox").one(".wegas-review-categinput-content").setContent(frag.join(""));
            }
        },
        syncUI: function() {
            var ev = this.get("evaluation"), desc = ev.get("descriptor");
        },
        bindUI: function() {
            var select;
            select = this.get(CONTENTBOX).one(".wegas-review-categinput-content select");
            if (select) {
                this.handlers.push(select.on("change", this.updateValue, this));
            }
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        updateValue: function(e) {
            var ev = this.get("evaluation"),
                desc = ev.get("descriptor"),
                value = e.target.get("value");

            ev.set("value", value);

            return true;
        }
    }, {
        ATTRS: {
            evaluation: {
                type: "CategorizedEvaluationInstance"
            },
            readonly: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.CategorizationInput = CategorizationInput;

});
