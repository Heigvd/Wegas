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
YUI.add('wegas-mcq-tabview', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
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
    MCQTabView = Y.Base.create("wegas-mcqtabview", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.MCQTabView# */
        // *** Lifecycle Methods *** //
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         */
        initializer: function() {
            /**
             * datasource from Y.Wegas.Facade.Variable
             */
            this.dataSource = Y.Wegas.Facade.Variable;
            this.tabView = new Y.TabView();
            /**
             * TabView widget used to display question/choices and corresponding reply
             */
            this.gallery = null;
            /**
             * Reference to each used functions
             */
            this.handlers = {};
            this.isRemovingTabs = false;
            /**
             * JS translator
             */
            this.jsTranslator = new Y.Wegas.Translator();
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

            this.get(CONTENTBOX).delegate("click", function(e) {
                this.showOverlay();
                this.dataSource.sendRequest({
                    request: "/QuestionDescriptor/SelectAndValidateChoice/" + e.target.get('id')
                            + "/Player/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                    cfg: {
                        method: "POST"
                    },
                    on: {
                        failure: Y.bind(this.defaultFailureHandler, this)
                    }

                });
            }, "button.yui3-button", this);

            this.handlers.response = this.dataSource.after("update", this.syncUI, this);
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
            this.tabView.destroyAll();                                          // Empty the tabview
            this.isRemovingTabs = false;

            if (this.gallery) {
                this.gallery.destroy();
                this.gallery = null;
            }
            if (questions) {
                this.addQuestions(questions.get("items"));
            }

            if (this.gallery) {
                this.gallery.syncUI();
            }
            this.hideOverlay();

            if (this.tabView.isEmpty()) {
                this.tabView.add(new Y.Tab({
                    label: "",
                    content: "<center><i><br /><br /><br />No questions available yet.</i></center>"
                }));
                this.tabView.selectChild(0);
            } else {
                if (lastSelection >= this.tabView.size()) {                     // Can occur when questions list has changed during event
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
                if (cQuestion instanceof Y.Wegas.persistence.QuestionDescriptor
                        && cQuestionInstance.get("active")) {                   // If current question is active

                    if (cQuestionInstance.get("replies").length > 0) {          // Find the last selected replies
                        if (cQuestion.get("allowMultipleReplies")) {
                            cReplyLabel = cQuestionInstance.get("replies").length + "x";
                        } else {
                            choiceDescriptor = cQuestionInstance.get("replies")[cQuestionInstance.get("replies").length - 1 ].getChoiceDescriptor();
                            cReplyLabel = choiceDescriptor.get("title") || "";
                            cReplyLabel = (cReplyLabel.length >= 15) ? cReplyLabel.substr(0, 15) + "..." : cReplyLabel;
                        }
                    }
                    if (Y.Lang.isNull(cReplyLabel)) {
                        cReplyLabel = (!cQuestion.get("allowMultipleReplies")) ? this.jsTranslator.getRB().Unanswered : this.jsTranslator.getRB().NotDone;
                    }

                    tab = new Y.Tab({
                        label: '<div class="'
                                + ((this.get("showUnanswered") && cQuestionInstance.get("replies").length === 0) ? "unread" : "")
                                + '"><div class="label">' + (cQuestion.get("title") || cQuestion.get("label") || "undefined") + '</div>'
                                + '<div class="status">' + cReplyLabel
                                + '</div></div>',
                        content: "<div class=\"wegas-loading-div\"><div>"
                    });
                    tab.loaded = false;
                    tab.cQuestion = cQuestion;
                    this.tabView.add(tab);
                } else if (cQuestion instanceof Y.Wegas.persistence.ListDescriptor) {
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
            if (e.newVal && e.newVal.cQuestion
                    && !this.isRemovingTabs && !e.newVal.loaded) {
                e.newVal.loaded = true;
                Y.Wegas.Facade.Variable.cache.getWithView(e.newVal.cQuestion, "Extended", {// Retrieve the question/choice description from the server
                    on: {
                        success: Y.bind(function(tab, e) {
                            var question = e.response.entity;

                            this.renderTab(tab, question);

                            if (question.get("pictures").length > 0) {
                                this.gallery = new Y.Wegas.util.FileLibraryGallery({
                                    render: tab.get("panelNode").one(".description"),
                                    selectedHeight: 150,
                                    selectedWidth: 235,
                                    gallery: Y.clone(question.get("pictures"))
                                });
                            }
                        }, this, e.newVal)
                    }
                });
            }
        },
        /**
         *
         * @param tab
         * @param extendedQuestion
         */
        renderTab: function(tab, extendedQuestion) {
            var j, ret, firstChild, cChoices, choiceDescriptor, reply, title,
                    cQuestion = tab.cQuestion,
                    cQuestionInstance = cQuestion.getInstance(),
                    firstChild = "first-child",
                    numberOfReplies, isReplied;
            cChoices = cQuestion.get("items");
            extendedQuestion = extendedQuestion || cQuestion;

            ret = ['<div class="content">',
                '<div class="title">', cQuestion.get("title") || cQuestion.get("label") || "undefined", '</div>',
                '<div class="description">', extendedQuestion.get("description"), '</div>'];

            if (cQuestionInstance.get("replies").length === 0                   // If the question is not replied,
                    || cQuestion.get("allowMultipleReplies")) {                 // or it allows to reply multiple times
                ret.push('<div class="replies">');                              // we display its available replies
                for (j = 0; j < cChoices.length; j += 1) {
                    if (cChoices[j].getInstance().get("active")) {

                        numberOfReplies = '';                                   //add informations about number of replies for MultipleReplies questions
                        isReplied = '';
                        if (cQuestion.get("allowMultipleReplies")) {
                            numberOfReplies = -1;
                            numberOfReplies = this.getNumberOfReplies(cQuestionInstance, cChoices[j]);
                            if (numberOfReplies === 0) {
                                numberOfReplies = '<span class="numberOfReplies zeroReplie">' + 0 + '<span class="symbole">x</span></span>';
                            } else if (numberOfReplies > 0) {
                                isReplied = 'replied';
                                numberOfReplies = '<span class="numberOfReplies">' + numberOfReplies + '<span class="symbole">x</span></span>';
                            }
                        }
                        ret.push('<div class="reply ', firstChild, ' ', isReplied, '">',
                                '<div class="name">', cChoices[j].get("title"), '</div>',
                                //'<div class="content">', cChoices[j].get("description"), '</div>',
                                '<div class="content">',
                                extendedQuestion.get("items")[j].get("description"),
                                '</div>',
                                numberOfReplies,
                                '<button class="yui3-button" id="', cChoices[j].get("id"), '">Submit</button>',
                                '<div style="clear:both"></div>',
                                '</div>');
                        firstChild = "";
                    }
                }
                ret.push('</div>');
            }

            if (cQuestionInstance.get("replies").length > 0) {                  // Display the selected replies
                ret.push('<div class="subtitle">Results</div><div class="replies">');  //Selected replies
                for (j = cQuestionInstance.get("replies").length - 1; j >= 0; j -= 1) {
                    reply = cQuestionInstance.get("replies")[j];
                    choiceDescriptor = reply.getChoiceDescriptor();
                    title = choiceDescriptor.get("title");
                    ret.push('<div class="replyDiv"><div class="reply"><div class="name">', title, '</div>',
                            '<div>',
                            (!cQuestion.get("allowMultipleReplies") || !title) ? extendedQuestion.find(choiceDescriptor.get("id")).get("description") : "",
                            '</div>',
                            //'<div>', extendedQuestion.find(choiceDescriptor.get("id")).get("description"), '</div>',
                            '<div style="clear:both"></div></div>');

                    if (reply.get("result").get("answer")) {
                        ret.push('<div class="replies"><div class="reply first-child">', reply.get("result").get("answer"), '</div></div></div>');
                    }
                }
                ret.push("</div>");
            }
            ret.push("</div>");

            tab.set("content", ret.join(""));
        },
        /**
         * @function
         * @private
         * @param {type} questionInstance
         * @param {type} choice
         * @returns {integer} a number
         * @description Return the number of replies corresponding to the given choice.
         */
        getNumberOfReplies: function(questionInstance, choice) {
            var i, occurrence = 0;
            for (i = 0; i < questionInstance.get("replies").length; i++) {
                if (questionInstance.get("replies")[i].getChoiceDescriptor().get("id") === choice.get("id")) { //can be buggy
                    occurrence++;
                }
            }
            return occurrence;
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
            var i;
            if (this.gallery) {
                this.gallery.destroy();
            }
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
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "Question folder",
                    classFilter: ["ListDescriptor"]
                }
            },
            showUnanswered: {
                type: "boolean",
                value: true,
                _inputex: {
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
                }
            }
        }
    });
    Y.Wegas.MCQTabView = MCQTabView;

});
