/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-mcq-tabview', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
        Wegas = Y.Wegas,
        MCQTabView;

    /**
     * @name Y.Wegas.MCQTabView
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class Class to view and reply to questions and choices.
     * @constructor
     * @description  Display and allow to reply at questions and choice sent
     *  to the current player
     */
    MCQTabView = Y.Base.create("wegas-mcqtabview", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.MCQTabView# */
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
            this.handlers = {};
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
            this.handlers.response = this.dataSource.after("update", this.syncUI, this);
/*
// This code produces an issue with the loading overlay (show-/hideOverlay()):
            this.handlers.response = this.dataSource.after("updatedInstance", function(e) {
                // Quick test before entering the loop:
                if (e.entity.get("@class") !== "QuestionInstance") return;
                var questions = this.get("variable.evaluated");
                // Check for null and undefined:
                if (questions == null) return;
                if (!Y.Lang.isArray(questions)) {
                    questions = [questions];
                }
                for (var i=0; i<questions.length; i++) {
                    var q = questions[i];
                    if (q.getInstance().get("id") === e.entity.get("id")) {
                        this.syncUI();
                        return;
                    }
                }
            }, this);
 */
        },
        /**
         * @function
         * @private
         * @description Clear and re-fill the TabView with active
         * choice/questions and relatives reply.
         * Display a message if there is no message.
         */
        syncUI: function() {
            var questions = this.get("variable.evaluated"),
                selectedTab = this.tabView.get('selection'),
                lastSelection = (selectedTab) ? selectedTab.get('index') : 0;

            this.isRemovingTabs = true;
            this.tabView.destroyAll(); // Empty the tabview
            this.isRemovingTabs = false;

            if (!Y.Lang.isArray(questions)) {
                questions = [questions];
            }

            this.addQuestions(questions);

            this.hideOverlay();

            if (this.tabView.isEmpty()) {
                this.get("contentBox").addClass("empty");
                this.tabView.add(new Y.Tab({
                    label: "",
                    content: "<center><i><br /><br /><br />" + Y.Wegas.I18n.t('mcq.empty') + "</i></center>"
                }));
                this.tabView.selectChild(0);
            } else {
                this.get("contentBox").removeClass("empty");
                if (lastSelection >= this.tabView.size()) { // Can occur when questions list has changed during event
                    lastSelection = 0;
                }
                this.tabView.selectChild(lastSelection);
            }
        },
        addQuestions: function(questions) {

            var i, cReplyLabel, cQuestion, cQuestionInstance,
                tab, choiceDescriptor;

            for (i = 0; i < questions.length; i += 1) {
                cQuestion = questions[i];
                cQuestionInstance = cQuestion.getInstance();
                cReplyLabel = null;
                if (cQuestion instanceof Wegas.persistence.QuestionDescriptor
                    && cQuestionInstance.get("active")) { // If current question is active

                    var cbxType = cQuestion.get("cbx"),
                        validatedCbx = (cbxType ? cQuestionInstance.get('validated') : false),
                        nbReplies = cQuestionInstance.get("replies").length,
                        highlightUnanswered = (this.get("highlightUnanswered") && (cbxType ? !validatedCbx : (nbReplies === 0)));

                    if (cbxType) {
                        if (validatedCbx)
                            cReplyLabel = ""; // Dummy status string
                    } else if (nbReplies > 0) {
                        if (cQuestion.get("allowMultipleReplies")) {
                            cReplyLabel = cQuestionInstance.get("replies").length + "x";
                        } else { // Find the last selected replies
                            choiceDescriptor = cQuestionInstance.get("replies")[cQuestionInstance.get("replies").length - 1 ].getChoiceDescriptor();
                            cReplyLabel = choiceDescriptor.get("title") || "";
                            cReplyLabel = (cReplyLabel.length >= 15) ? cReplyLabel.substr(0, 15) + "..." : cReplyLabel;
                        }
                    }
                    if (Y.Lang.isNull(cReplyLabel)) {
                        cReplyLabel = (!cQuestion.get("allowMultipleReplies")) ? Y.Wegas.I18n.t('mcq.unanswered') : Y.Wegas.I18n.t('mcq.notDone');
                    }
                    tab = new Y.Wegas.Tab({
                        label: '<div class="'
                            + (highlightUnanswered ? "unread" : "")
                            + '"><div class="index-label">' + (cQuestion.get("title") || cQuestion.get("label") || "undefined") + '</div>'
                            + '<div class="index-status">' + cReplyLabel
                            + '</div></div>',
                        content: "<div class=\"wegas-loading-div\"><div>"
                    });
                    tab.loaded = false;
                    tab.cQuestion = cQuestion;
                    this.tabView.add(tab);
                } else if (cQuestion instanceof Wegas.persistence.ListDescriptor) {
                    this.addQuestions(cQuestion.get("items"));
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
            var widget;
            if (e.newVal && e.newVal.cQuestion
                && !this.isRemovingTabs && !e.newVal.loaded) {
                e.newVal.loaded = true;

                widget = new Y.Wegas.MCQView({
                    variable: {
                        "name": e.newVal.cQuestion.get("name")
                    }
                });
                e.newVal.add(widget);
            }
        },
        getEditorLabel: function() {
            var variable = this.get("variable.evaluated");
            if (variable && variable.getEditorLabel) {
                return variable.getEditorLabel();
            }
            return Wegas.MCQTabView.EDITORNAME;
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
        }
    }, {
        EDITORNAME: "Question display",
        /** @lends Y.Wegas.MCQTabView */
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
                    label: "Question folder",
                    classFilter: ["ListDescriptor"]
                }
            },
            highlightUnanswered: {
                type: "boolean",
                value: true,
                _inputex: {
                    label: "Higlight Unanswered",
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                }
            }
        }
    });
    Wegas.MCQTabView = MCQTabView;
});
