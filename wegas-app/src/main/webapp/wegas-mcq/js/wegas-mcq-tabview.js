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
             // This code does not refresh the display when a question list is to be replaced by another list:
             this.handlers.response = this.dataSource.after("updatedInstance", function(e) {
             // Easy test to possibly avoid entering the loop:
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
        updateTab: function(tab, question) {
            var questionInstance = question.getInstance(),
                choiceDescriptor,
                label = null, cbxType = question.get("cbx"),
                validatedCbx = (cbxType ? questionInstance.get('validated') : false),
                nbReplies = questionInstance.get("replies").length,
                highlightUnanswered = (this.get("highlightUnanswered") && (cbxType ? !validatedCbx : (nbReplies === 0)));

            if (cbxType) {
                if (validatedCbx)
                    label = ""; // Dummy status string
            } else if (nbReplies > 0) {
                if (question.get("allowMultipleReplies")) {
                    label = questionInstance.get("replies").length + "x";
                } else { // Find the last selected replies
                    choiceDescriptor = questionInstance.get("replies")[questionInstance.get("replies").length - 1 ].getChoiceDescriptor();
                    label = choiceDescriptor.get("title") || "";
                    label = (label.length >= 15) ? label.substr(0, 15) + "..." : label;
                }
            }

            if (Y.Lang.isNull(label)) {
                label = (!question.get("allowMultipleReplies")) ? Y.Wegas.I18n.t('mcq.unanswered') : Y.Wegas.I18n.t('mcq.notDone');
            }


            label = '<div class="'
                + (highlightUnanswered ? "unread" : "")
                + '"><div class="index-label">'
                + (question.get("title") || question.get("label") || "undefined") + "</div>"
                + '<div class="index-status">' + label + "</div>"
                + '</div>';

            tab.set("label", label);
        },
        createTab: function(question) {
            var tab = new Y.Wegas.Tab();
            tab.loaded = false;
            tab.cQuestion = question;
            tab.set("content", "<div class=\"wegas-loading-div\"><div>");
            this.updateTab(tab, question);
            return tab;
        },
        updateTabs: function(questions) {
            var question, questionInstance, oldTab, newTab, tabs, toRemove, index, queue,
                oldIndex, selectedTab, lastSelection;
            tabs = this.tabView._items;
            toRemove = tabs.slice(0);

            selectedTab = this.tabView.get('selection');

            if (!Y.Lang.isArray(questions)) {
                queue = [questions];
            } else {
                queue = questions;
            }

            index = 0;
            while (question = queue.shift()) {
                if (question instanceof Wegas.persistence.QuestionDescriptor) {
                    oldTab = Y.Array.find(tabs, function(item) {
                        return item.cQuestion && item.cQuestion.get("id") === question.get("id");
                    });
                    questionInstance = question.getInstance();

                    if (questionInstance.get("active")) {
                        if (oldTab) {
                            // Simple Update
                            this.updateTab(oldTab, question);
                            oldIndex = toRemove.indexOf(oldTab);
                            if (oldIndex >= 0) {
                                toRemove.splice(oldIndex, 1);
                            }
                        } else {
                            // Just activated
                            newTab = this.createTab(question);
                            this.tabView.add(newTab, index);
                        }
                        index++;
                    }
                } else if (question instanceof Wegas.persistence.ListDescriptor) {
                    queue = queue.concat(question.get("items"));
                }
            }

            /*
             * Remove tabs which are to be no longer displayed
             */
            while (question = toRemove.shift()) {
                if (selectedTab === question) {
                    selectedTab = null;
                }
                question.remove();
            }

            if (this.tabView.size()) { // There might be no active question to select
                lastSelection = (selectedTab) ? selectedTab.get('index') : 0;
                if (lastSelection >= this.tabView.size()) { // Can occur when questions list has changed during event
                    lastSelection = 0;
                }
                this.tabView.selectChild(lastSelection);
            }

        },
        /**
         * @function
         * @private
         * @description * Update the TabView with active
         * choice/questions and relatives reply.
         * Display a message if there is no message.
         */
        syncUI: function() {
            var questions = this.get("variable.evaluated"),
                selectedTab, lastSelection;

            this.updateTabs(questions);

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
