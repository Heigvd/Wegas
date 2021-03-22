/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-mcq-tabview', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox',
        Wegas = Y.Wegas,
        MCQTabView;

    MCQTabView = Y.Base.create("wegas-mcqtabview", Y.Wegas.ResponsiveTabView, [], {
        /** @lends Y.Wegas.MCQTabView# */
        // *** Lifecycle Methods *** //
        //CONTENT_TEMPLATE: null,
        getTabLabel: function(question) {
            if (question instanceof Wegas.persistence.QuestionDescriptor) {
                return this.getMcqTabLabel(question);
            } else if (question instanceof Wegas.persistence.WhQuestionDescriptor) {
                return  this.getWhTabLabel(question);
            }
        },
        getWhTabLabel: function(question) {
            var questionInstance = question.getInstance(),
                label = (questionInstance.get("validated") ? "" : (question.get("maxReplies") === 1) ? Y.Wegas.I18n.t('mcq.unanswered') : Y.Wegas.I18n.t('mcq.notDone'));

            var unreadLabel = "";

            return  '<div class="index-mcq '
                + (questionInstance.get("unread") ? "unread " : "")
                + (!questionInstance.get("validated") ? "answerable " : "")
                + (this.get("highlightUnanswered") && !questionInstance.get("validated") ? "unanswered " : "") + '">'
                + '<div class="index-unread">' + unreadLabel + '</div>'
                + '<div class="index-label">'
                + (I18n.t(question.get("label"))) + "</div>"
                + '<div class="index-status">' + label + "</div>"
                + '</div>';

        },
        getMcqTabLabel: function(question) {
            var questionInstance = question.getInstance(),
                choiceDescriptor,
                label = null, cbxType = question.get("cbx"),
                validatedCbx = (cbxType ? questionInstance.get('validated') : false),
                nbReplies = questionInstance.getValidatedReplies().length,
                highlightUnanswered = (this.get("highlightUnanswered") && (cbxType ? !validatedCbx : (nbReplies === 0)));

            /*
             * The followinbg seciton may replace  the next one
             */
            if (false) {
                if (nbReplies > 0 || validatedCbx) {
                    label = ""; // make sure the label is no null
                    if (question.get("allowMultipleReplies")) {
                        if (cbxType) {
                            label = I18n.tCap('mcq.answered');
                        } else {
                            label = questionInstance.get("replies").length + "x";
                        }
                    } else { // Find the last selected replies
                        choiceDescriptor = questionInstance.get("replies")[questionInstance.get("replies").length - 1 ].getChoiceDescriptor();
                        label = I18n.t(choiceDescriptor.get("label"));
                        //label = (label.length >= 15) ? label.substr(0, 15) + "..." : label;
                    }
                }
            }

            if (cbxType) {
                if (validatedCbx)
                    label = ""; // Dummy status string
            } else if (nbReplies > 0) {
                if (question.get("maxReplies") === 1) {
                    // Find the last selected replies
                    choiceDescriptor = questionInstance.get("replies")[questionInstance.get("replies").length - 1 ].getChoiceDescriptor();
                    label = I18n.t(choiceDescriptor.get("label"));
                    //label = (label.length >= 15) ? label.substr(0, 15) + "..." : label;
                } else {
                    label = questionInstance.get("replies").length + "x";
                }
            }

            if (Y.Lang.isNull(label)) {
                label = (question.get("maxReplies") === 1) ? Y.Wegas.I18n.t('mcq.unanswered') : Y.Wegas.I18n.t('mcq.notDone');
            }

            var unreadLabel = "";

            return  '<div class="index-mcq '
                + (question.isAnyChoiceAnswerable() ? "answerable " : "")
                + (questionInstance.get("unread") ? "unread " : "")
                + (highlightUnanswered ? "unanswered " : "") + '">'
                + '<div class="index-unread">' + unreadLabel + '</div>'
                + '<div class="index-label">' + I18n.t(question.get("label")) + "</div>"
                + '<div class="index-status">' + label + "</div>"
                + '</div>';
        },
        getEntities: function() {
            var questions, question, questionInstance, queue,
                entities = [];
            questions = this.get("variable.evaluated");


            if (!Y.Lang.isArray(questions)) {
                queue = [questions];
            } else {
                queue = questions;
            }

            while (question = queue.shift()) {
                if (question instanceof Wegas.persistence.QuestionDescriptor
                    || question instanceof Wegas.persistence.WhQuestionDescriptor) {
                    questionInstance = question.getInstance();

                    if (questionInstance.get("active")) {
                        entities.push(question);
                    }
                } else if (question instanceof Wegas.persistence.ListDescriptor) {
                    queue = queue.concat(question.get("items"));
                }
            }
            return entities;
        },
        getWidget: function(entity) {
            if (entity instanceof Wegas.persistence.QuestionDescriptor) {
                return new Y.Wegas.MCQView({
                    variable: {
                        "name": entity.get("name")
                    },
                    submitVar: this.get("submitVar"),
                    displayResult: this.get("displayResult")
                });
            } else if (entity instanceof Wegas.persistence.WhQuestionDescriptor) {
                return new Y.Wegas.WhView({
                    variable: {
                        "name": entity.get("name")
                    },
                    selfSaving: true,
                    submitVar: this.get("submitVar")
                });
            }
        },
        getBackToMenuLabel: function() {
            return I18n.t('global.mcqBackToMenu');
        },
        getNoContentMessage: function() {
            return Y.Wegas.I18n.t('mcq.empty');
        },
        getNothingSelectedInvite: function() {
            return Y.Wegas.I18n.t('mcq.noQuestionSelected');
        },
        getEditorLabel: function() {
            var variable = this.get("variable.evaluated");
            if (variable && variable.getEditorLabel) {
                return variable.getEditorLabel();
            }
            return Wegas.MCQTabView.EDITORNAME;
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
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                view: {
                    type: "variableselect",
                    label: "Question folder",
                    classFilter: ["ListDescriptor"]
                }
            },
            highlightUnanswered: {
                type: "boolean",
                value: true,
                view: {
                    label: "Higlight Unanswered",
                    className: "wegas-advanced-feature"
                }
            },
            displayResult: {
                value: 'bottom',
                type: 'string',
                view: {
                    type: 'select',
                    choices: [
                        {
                            value: 'bottom'
                        }, {
                            value: 'inline'
                        }, {
                            value: 'dialogue'
                        }, {
                            value: 'no'
                        }
                    ],
                    className: 'wegas-advanced-feature',
                    label: "Template"
                }

            },
            submitVar: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Submit button text',
                    className: 'wegas-advanced-feature',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
                }
            }
        }
    });
    Wegas.MCQTabView = MCQTabView;
});
