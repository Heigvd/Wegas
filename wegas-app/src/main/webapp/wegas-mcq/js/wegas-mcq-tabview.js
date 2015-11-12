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

    var CONTENTBOX = 'contentBox', Wegas = Y.Wegas,
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
             * TabView widget used to display question/choices and corresponding reply
             */
            this.gallery = null;
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

            this.get(CONTENTBOX).delegate("click", function(e) {

                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    this.showOverlay();
                    
                    // Determine if the submit concerns a question or a choice:
                    // If it's a question then call validateQuestion() else call selectAndValidateChoice()
                    var receiver = Wegas.Facade.Variable.cache.findById(e.target.get('id'));
                    if (receiver instanceof Wegas.persistence.QuestionDescriptor){
                        this.dataSource.sendRequest({
                            request: "/QuestionDescriptor/ValidateQuestion/" + receiver.getInstance().get('id')
                                + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
                            cfg: {
                                method: "POST"
                            },
                            on: {
                                success: Y.bind(this.hideOverlay, this),
                                failure: Y.bind(this.hideOverlay, this)
                            }
                        });
                    
                    } else { // The user is validating a choice:

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
                    }
                }, this));
            }, "button.yui3-button", this);

            this.get(CONTENTBOX).delegate("click", function(e) {

                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    this.showOverlay();
                    if (e.target.get('checked')){
                        var question = Wegas.Facade.Variable.cache.find('name',e.target.get('name'));
                        if (!question.get("allowMultipleReplies"))
                            this.cancelAllOtherReplies(question, +e.target.get('id'));
                        this.dataSource.sendRequest({
                            request: "/QuestionDescriptor/SelectChoice/" + e.target.get('id')
                                + "/Player/" + Wegas.Facade.Game.get('currentPlayerId')
                                + "/StartTime/0",
                            cfg: {
                                method: "GET"  // initially: POST
                            },
                            on: {
                                success: Y.bind(this.hideOverlay, this),
                                failure: Y.bind(this.hideOverlay, this)
                            }
                        });
                    } else {
                        var choiceId = +e.target.get('id');
                        // e.target.get('name') = scriptAlias de la question => questionInstance.get("replies") => CancelReply()
                        var question = Wegas.Facade.Variable.cache.find('name',e.target.get('name'));
                        var replies = question.getInstance().get('replies'),
                            numberOfReplies = replies.length, i;
                        for (i = numberOfReplies - 1; i >= 0; i -= 1) {
                            if (replies[i].getChoiceDescriptor().get("id")===choiceId){
                                this.dataSource.sendRequest({
                                    request: "/QuestionDescriptor/CancelReply/" + replies[i].get('id')
                                        + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
                                    cfg: {
                                        method: "GET"
                                    },
                                    on: {
                                        success: Y.bind(this.hideOverlay, this),
                                        failure: Y.bind(this.hideOverlay, this)
                                    }
                                });
                            }
                        }
    }
                }, this));
            }, "input.mcq-checkbox", this);

            this.handlers.response = this.dataSource.after("update", this.syncUI, this);
        },
        /**
         * @function
         * @private
         * @param question the question
         * @param choiceId ID of the newly selected choice
         * @description When a checkbox-type question allows only one answer (mutually exclusive choices),
         * selecting one choice requires cancelling all other choices/replies of the question.
         */
        cancelAllOtherReplies: function(question, choiceId) {
            var replies = question.getInstance().get('replies'),
                numberOfReplies = replies.length, i;
            for (i = numberOfReplies - 1; i >= 0; i -= 1) {
                if (replies[i].getChoiceDescriptor().get("id")!==choiceId){
                    this.dataSource.sendRequest({
                        request: "/QuestionDescriptor/CancelReply/" + replies[i].get('id')
                               + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
                        cfg: {
                            method: "GET"
                        },
                        on: {
                            success: {},
                            failure: {}
                        }
                    });
                }
            }
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
            if (!Y.Lang.isArray(questions)) {
                questions = [questions];
            }

            this.addQuestions(questions);

            if (this.gallery) {
                this.gallery.syncUI();
            }
            this.hideOverlay();

            if (this.tabView.isEmpty()) {
                this.get("contentBox").addClass("empty");
                this.tabView.add(new Y.Tab({
                    label: "",
                    content: "<center><i><br /><br /><br />" +  Y.Wegas.I18n.t('mcq.empty') + "</i></center>"
                }));
                this.tabView.selectChild(0);
            } else {
                this.get("contentBox").removeClass("empty");
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
                if (cQuestion instanceof Wegas.persistence.QuestionDescriptor
                    && cQuestionInstance.get("active")) {                   // If current question is active
                
                    var useCbx = cQuestion.get("cbx"),
                        validatedCbx = (useCbx ? cQuestionInstance.get('validated') : false);
                
                    if ((cQuestionInstance.get("replies").length > 0 && !useCbx) || validatedCbx) {          // Find the last selected replies
                        if (cQuestion.get("allowMultipleReplies") || useCbx) {
                            cReplyLabel = cQuestionInstance.get("replies").length + "x";
                        } else {
                            choiceDescriptor = cQuestionInstance.get("replies")[cQuestionInstance.get("replies").length - 1 ].getChoiceDescriptor();
                            cReplyLabel = choiceDescriptor.get("title") || "";
                            cReplyLabel = (cReplyLabel.length >= 15) ? cReplyLabel.substr(0, 15) + "..." : cReplyLabel;
                        }
                    }
                    if (Y.Lang.isNull(cReplyLabel)) {
                        cReplyLabel = (!cQuestion.get("allowMultipleReplies")) ? Y.Wegas.I18n.t('mcq.unanswered') : Y.Wegas.I18n.t('mcq.notDone');
                    }

                    tab = new Y.Tab({
                        label: '<div class="'
                            + ((this.get("highlightUnanswered") && cQuestionInstance.get("replies").length === 0) ? "unread" : "")
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
            if (e.newVal && e.newVal.cQuestion
                && !this.isRemovingTabs && !e.newVal.loaded) {
                e.newVal.loaded = true;
                Wegas.Facade.Variable.cache.getWithView(e.newVal.cQuestion, "Extended", {// Retrieve the question/choice description from the server
                    on: {
                        success: Y.bind(function(tab, e) {
                            var question = e.response.entity;

                            this.renderTab(tab, question);

                            if (question.get("pictures").length > 0) {
                                this.gallery = new Wegas.util.FileLibraryGallery({
                                    selectedHeight: 150,
                                    selectedWidth: 235,
                                    gallery: Y.clone(question.get("pictures"))
                                }).render(tab.get("panelNode").one(".description"));
                            }
                        }, this, e.newVal)
                    }
                });
            }
        },
        renderTab: function(tab, question) {
            var i, ret, allowMultiple = question.get("allowMultipleReplies"),
                useCbx = question.get("cbx"),
                cQuestion = tab.cQuestion,
                choices = cQuestion.get("items"), choiceD, choiceI,
                questionInstance = cQuestion.getInstance(),
                questionScriptAlias = cQuestion.get("name"),
                numberOfReplies = questionInstance.get("replies").length,
                answerable = (useCbx ? !questionInstance.get('validated') : allowMultiple || numberOfReplies === 0),
                tabularMCQ = question.get("tabular"),
                checked, reply;

            Y.log("RENDER TAB");

            ret = ['<div class="mcq-question">',
                '<div class="mcq-question-details">',
                '<div class="mcq-question-title">', question.get("title") || question.get("label") || "undefined", '</div>',
                '<div class="mcq-question-description">', question.get("description"), '</div>',
                '</div>'];

            // Display choices
            if (useCbx && tabularMCQ){
                // Find how many choices are active and if there is any description field to be displayed:
                var hasDescription = false;
                var nbActiveChoices = 0;
                for (i = 0; i < choices.length; i += 1) {
                    if (choices[i].getInstance().get("active")) {
                        nbActiveChoices++;
                        if (question.get("items")[i].get("description").length !== 0){
                            hasDescription = true;
                        }
                    }        
                }
                ret.push('<div class="mcq-choices-horizontal">');
                ret.push('<div style="display:table; width:100%">');
                ret.push('<div style="display:table-row; width:100%">');
                var cellWidth = (nbActiveChoices !== 0 ? Math.floor(100/nbActiveChoices) : 100);
                for (i = 0; i < choices.length; i += 1) {
                    choiceD = choices[i];
                    choiceI = choiceD.getInstance();
                    if (choiceI.get("active")) {
                        checked = this.getNumberOfReplies(questionInstance, choiceD) > 0;
                        if (answerable){
                            ret.push('<div class="mcq-choice" style="display:table-cell; width:', cellWidth, '%">');
                        } else {
                            ret.push('<div class="mcq-choice spurned" style="text-decoration:none; display:table-cell; width:', cellWidth, '%">'); // Display as spurned (gray, italic) but without ugly strikethrough
                        }
                        ret.push('<div class="mcq-choice-name" style="text-align:center">', choiceD.get("title"), '</div>');
                        var currDescr = '';
                        if (hasDescription){
                            currDescr = question.get("items")[i].get("description");
                            if (currDescr.length === 0) currDescr="&nbsp;";
                        }
                        ret.push('<div class="mcq-choice-description" style="text-align:center">', currDescr, '</div>');
                        ret.push('<input class="mcq-checkbox"', (allowMultiple ? ' type="checkbox"' : ' type="radio"'), (checked ? ' checked' : ''), (answerable ? '' : ' disabled'), ' id="', choiceD.get("id"), '" name="', questionScriptAlias, '">');
                        ret.push('</div>'); // end mcq-choice
                    }
                }
                ret.push('</div>'); // end row of mcq-choices
                ret.push('</div>'); // end table with all mcq-choices
                ret.push('<div style="display:block; width:100%; text-align: right">');
                ret.push('<button class="yui3-button"', (answerable ? '' : ' disabled'),' id="', cQuestion.get("id"), '" style="margin: 40px 30px 10px;">', Y.Wegas.I18n.t('mcq.submit'), '</button>');
                ret.push('</div>'); // end button container
                ret.push('</div>'); // end mcq-choices-horizontal

            } else {
                ret.push('<div class="mcq-choices">');
                for (i = 0; i < choices.length; i += 1) {
                    choiceD = choices[i];
                    choiceI = choiceD.getInstance();
                    if (choiceI.get("active")) {
                        if (useCbx){
                            checked = this.getNumberOfReplies(questionInstance, choiceD) > 0;
                            if (answerable){
                                ret.push('<div class="mcq-choice">');
                            } else {
                                ret.push('<div class="mcq-choice spurned" style="text-decoration:none">'); // Display as spurned (gray, italic) but without ugly strikethrough
                            }
                            ret.push('<div class="mcq-choice-name">', choiceD.get("title"), '</div>');
                            ret.push('<div class="mcq-choice-description">', question.get("items")[i].get("description"), '</div>');
                            ret.push('<input class="mcq-checkbox"', (allowMultiple ? ' type="checkbox"' : ' type="radio"'), (checked ? ' checked' : ''), (answerable ? '' : ' disabled'), ' id="', choiceD.get("id"), '" name="', questionScriptAlias, '">');
                        } else { // This is not a checkbox-type question:
                            if (answerable || questionInstance.get("replies")[0].getChoiceDescriptor().get("id") === choiceD.get("id")) {
                                ret.push('<div class="mcq-choice">');
                            } else {
                                ret.push('<div class="mcq-choice spurned">');
                            }
                            ret.push('<div class="mcq-choice-name">', choiceD.get("title"), '</div>');
                            ret.push('<div class="mcq-choice-description">', question.get("items")[i].get("description"), '</div>');

                            if (allowMultiple) {
                                ret.push('<span class="numberOfReplies">',
                                    "" + this.getNumberOfReplies(questionInstance, choiceD),
                                    '<span class="symbole">x</span></span>');
                            }

                            if (answerable) {
                                ret.push('<button class="yui3-button" id="', choiceD.get("id"), '">', Y.Wegas.I18n.t('mcq.submit'), '</button>');
                            } else {
                                ret.push('<button class="yui3-button" disabled id="', choiceD.get("id"), '">', Y.Wegas.I18n.t('mcq.submit')
                                        //questionInstance.get("replies")[0].getChoiceDescriptor().get("id") === choiceD.get("id") ? "Made" : "Spurned"
                                        , '</button>');
                            }                        
                        }
                        ret.push('<div style="clear:both"></div>');
                        ret.push('</div>'); // end mcq-choice
                    }
                }
                // Global submit button in case of checkbox-type question:
                if (useCbx){
                    ret.push('<button class="yui3-button"', (answerable ? '' : ' disabled'),' id="', cQuestion.get("id"), '" style="float: right; margin: 20px 20px;">', Y.Wegas.I18n.t('mcq.submit'), '</button>');
                    ret.push('<div style="clear:both"></div>');
                }

                ret.push('</div>'); // end mcq-choices
            }
            
            var notValidatedMCQ = useCbx && !questionInstance.get("validated");
            if (numberOfReplies > 0 && !notValidatedMCQ) {
                ret.push('<div class="mcq-replies-title">', (numberOfReplies > 1 ? Y.Wegas.I18n.t('mcq.result').pluralize() : Y.Wegas.I18n.t('mcq.result')), '</div>');
                ret.push('<div class="mcq-replies">');
                for (i = numberOfReplies - 1; i >= 0; i -= 1) {
                    reply = questionInstance.get("replies")[i];
                    choiceD = reply.getChoiceDescriptor();
                    ret.push('<div class="mcq-reply"', useCbx ? ' style="font-style:normal; color:inherit"' : '', '>');
                    ret.push('<div class="mcq-reply-title">', choiceD.get("title"), '</div>');
                    ret.push('<div class="mcq-reply-content">', reply.get("result").get("answer"), '</div>');
                    ret.push('</div>'); // end mcq-reply
                }
                ret.push('</div>'); // end mcq-replies
            }
            ret.push('</div>'); // end mcq-question

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
