/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-mcq-view', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
        Wegas = Y.Wegas,
        MCQView;

    /**
     * @name Y.Wegas.MCQView
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class Class to reply to question's choices.
     * @constructor
     * @description  Display and allow to reply at question's choices sent
     *  to the current player
     */
    MCQView = Y.Base.create("wegas-mcqview", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Wegas.MCQView# */
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
            /**
             * Wegas gallery
             */
            this.gallery = null;
            /**
             * Reference to each used Event handlers
             */
            this.handlers = [];
        },
        /**
         * @function
         * @private
         * @description Render the TabView widget in the content box.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.addClass("wegas-mcqtabview"); //@TODO : it's own stylesheet. Remove this and correct Loader
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
            this.handlers.push(this.dataSource.on("updatedInstance", function(e) {
                var question = this.get("variable.evaluated");
                if (question && question.getInstance().get("id") === e.entity.get("id")) {
                    this.syncUI();
                }
            }, this));
            this.get(CONTENTBOX).delegate("click", function(e) {

                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    this.showOverlay();
                    this.dataSource.sendRequest({
                        request: "/QuestionDescriptor/SelectAndValidateChoice/" + e.target.get('id') + "/Player/" +
                            Wegas.Facade.Game.get('currentPlayerId'),
                        cfg: {
                            method: "POST"
                        },
                        on: {
                            success: Y.bind(this.hideOverlay, this),
                            failure: Y.bind(this.hideOverlay, this)
                        }
                    });
                }, this));
            }, "button.yui3-button", this);
            this.after("variableChange", this.syncUI);
        // this.handlers.response = this.dataSource.after("update", this.syncUI, this);
        },
        /**
         * @function
         * @private
         * @description Clear and re-fill the TabView with active
         * choice/questions and relatives reply.
         * Display a message if there is no message.
         */
        syncUI: function() {
            var question = this.get("variable.evaluated");
            if (!question || !(question instanceof Wegas.persistence.QuestionDescriptor)) {
                this.get(CONTENTBOX).setHTML("<em>" + Y.Wegas.I18n.t("mcq.empty") + "</em>");
                return;
            }
            if (this.gallery) {
                this.gallery.destroy();
                this.gallery = null;
            }

            this.genQuestion(question);

            if (this.gallery) {
                this.gallery.syncUI();
            }
        // this.hideOverlay();
        },
        /**
         * @function
         * @param question question
         * @private
         * @description fetch question and displays it
         */
        genQuestion: function(question) {
            this.dataSource.cache.getWithView(question, "Extended", { // Retrieve the question/choice description from the server
                on: {
                    success: Y.bind(function(e) {
                        var question = e.response.entity;

                        this.genMarkup(question);

                        if (question.get("pictures").length > 0) {
                            this.gallery = new Wegas.util.FileLibraryGallery({
                                selectedHeight: 150,
                                selectedWidth: 235,
                                gallery: Y.clone(question.get("pictures"))
                            }).render(this.get(CONTENTBOX).one(".description"));
                        }
                    }, this)
                }
            });
        },
        genMarkup: function(question) {
            var i, ret,
                allowMultiple = question.get("allowMultipleReplies"),
                cachedQuestion = this.dataSource.cache.find("id",
                    question.get("id")),
                choices = cachedQuestion.get("items"), choiceD, choiceI,
                questionInstance = cachedQuestion.getInstance(),
                numberOfReplies = questionInstance.get("replies").length,
                answerable = allowMultiple || numberOfReplies === 0,
                reply;

            ret = ['<div class="mcq-question">',
                '<div class="mcq-question-details">',
                '<div class="mcq-question-title">',
                question.get("title") || question.get("label") || "undefined",
                '</div>',
                '<div class="mcq-question-description">',
                question.get("description"),
                '</div>',
                '</div>'];

            // Display choices
            ret.push('<div class="mcq-choices">');
            for (i = 0; i < choices.length; i += 1) {
                choiceD = choices[i];
                choiceI = choiceD.getInstance();
                if (choiceI.get("active")) {
                    if (answerable ||
                        questionInstance.get("replies")[0].getChoiceDescriptor().get("id") === choiceD.get("id")) {
                        ret.push('<div class="mcq-choice">');
                    } else {
                        ret.push('<div class="mcq-choice spurned">');
                    }
                    ret.push('<div class="mcq-choice-name">', choiceD.get("title"), '</div>');
                    ret.push('<div class="mcq-choice-description">',
                        question.get("items")[i].get("description"),
                        '</div>');

                    if (allowMultiple) {
                        ret.push('<span class="numberOfReplies">',
                            "" + this.getNumberOfReplies(questionInstance, choiceD),
                            '<span class="symbole">x</span></span>');
                    }

                    if (answerable) {
                        ret.push('<button class="yui3-button" id="', choiceD.get("id"), '">', Y.Wegas.I18n.t('mcq.submit'), '</button>');
                    } else {
                        ret.push('<button class="yui3-button" disabled id="',
                            choiceD.get("id"),
                            '">', Y.Wegas.I18n.t('mcq.submit'),
                            '</button>');
                    }

                    ret.push('<div style="clear:both"></div>');
                    ret.push('</div>'); // end mcq-choice
                }
            }
            ret.push('</div>'); // end mcq-choices

            if (numberOfReplies > 0) {
                ret.push('<div class="mcq-replies-title">', (numberOfReplies > 1 ? Y.Wegas.I18n.t('mcq.result').pluralize().capitalize() : Y.Wegas.I18n.t('mcq.result').capitalize()), '</div>');
                ret.push('<div class="mcq-replies">');
                for (i = numberOfReplies - 1; i >= 0; i -= 1) {
                    reply = questionInstance.get("replies")[i];
                    choiceD = reply.getChoiceDescriptor();
                    ret.push('<div class="mcq-reply">');
                    ret.push('<div class="mcq-reply-title">', choiceD.get("title"), '</div>');
                    ret.push('<div class="mcq-reply-content">', reply.get("result").get("answer"), '</div>');
                    ret.push('</div>'); // end mcq-reply
                }
                ret.push('</div>'); // end mcq-replies
            }
            ret.push('</div>'); // end mcq-question

            this.get(CONTENTBOX).setHTML(ret.join(""));

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
            var i,
                occurrence = 0;
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
                return "Question: " + variable.getEditorLabel();
            }
            return "Question: none";
        },
        /**
         * @function
         * @private
         * @description Destroy TabView and detach all functions created
         *  by this widget
         */
        destructor: function() {
            var i,
                length = this.handlers.length;
            if (this.gallery) {
                this.gallery.destroy();
            }
            for (i = 0; i < length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        /** @lends Y.Wegas.MCQView */
        EDITORNAME: "Single question display",
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
                optional: true,
                _inputex: {
                    _type: "variableselect",
                    label: "Question",
                    classFilter: ["QuestionDescriptor"]
                }
            }
        }
    });
    Wegas.MCQView = MCQView;
});
