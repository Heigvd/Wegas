/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Jarle Hulaas <jarle.hulaas at heig-vd.ch>
 */
YUI.add('wegas-mcq-dialogview', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox',
        Wegas = Y.Wegas,
        MCQDialogView;


    MCQDialogView = Y.Base.create("wegas-mcq-dialogview", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        // *** Lifecycle Methods *** //
        CONTENT_TEMPLATE: null,

        initializer: function() {
            this.dataSource = Wegas.Facade.Variable;
            this.handlers = [];
            this.after("disabledChange", this.syncUI, this);
            this.plugLockable();
            this.showDescription = this.get('showDescription');
            this.generatedBySelector = this.get('generatedBySelector');
            this.validateChoiceFromSelector = this.get('validateChoiceFromSelector');
            // Tooltips are normally managed by the parent mcq-selector widget
            this.tooltip = null;
        },
        plugLockable: function() {
            var theVar = this.get("variable.evaluated"), token;
            if (theVar) {
                token = "MCQ-" + this.get("variable.evaluated").getInstance().get("id");
                if (this.lockable) {
                    this.lockable.set("token", token);
                } else {
                    this.plug(Y.Plugin.Lockable, {token: token});
                }
            }
        },
        renderUI: function() {
            if (!this.generatedBySelector) {
                if (!this.tooltip) {
                    this.tooltip = new Y.Wegas.Tooltip({
                        delegate: this.get(CONTENTBOX),
                        delegateSelect: ".wegas-mcq-selector-descr",
                        render: true,
                        showDelay: 100,
                        autoHideDelay: 5000
                    });
                    this.tooltip.plug(Y.Plugin.Injector);
                }
            }
        },
        beforeRequest: function() {
            this.showOverlay();

            this.catchConflict = Y.Wegas.Facade.Variable.on("WegasConflictException", function(e) {
                Wegas.Alerts.showMessage("warn", Y.Wegas.I18n.t('mcq.conflict'));
                e.halt();
            });
        },
        onSuccess: function() {
            this.catchConflict && this.catchConflict.detach();
            this.hideOverlay();
        },
        onFailure: function() {
            this.onSuccess();
        },
        // Validates a choice.
        doValidate: function(targetId) {
            Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                var minQ, maxQ;
                this.beforeRequest();

                this.dataSource.sendRequest({
                    request: "/QuestionDescriptor/SelectAndValidateChoice/" + targetId + "/Player/" +
                    Wegas.Facade.Game.get('currentPlayerId'),
                    cfg: {
                        method: "POST"
                    },
                    on: {
                        success: Y.bind(this.onSuccess, this),
                        failure: Y.bind(this.onFailure, this)
                    }
                });

            }, this));
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When submit button is clicked, send the selected choice
         * When datasource is updated, do syncUI;
         */
        bindUI: function() {
            this.after("variableChange", this.plugLockable, this);

            this.handlers.push(Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
                var question = this.get("variable.evaluated");
                if (question && question.get("id") === e.entity.get("id")) {
                    this.syncUI();
                }
            }, this));
            this.handlers.push(Y.Wegas.Facade.Instance.after("*:updatedInstance", function(e) {
                var question = this.get("variable.evaluated"), updatedInstance;

                if (e.entity instanceof Y.Wegas.persistence.ChoiceInstance) {
                    updatedInstance = Y.Wegas.Facade.Variable.cache.findParentDescriptor(e.entity.getDescriptor()).getInstance();
                } else {
                    updatedInstance = e.entity;
                }

                if (updatedInstance instanceof Y.Wegas.persistence.QuestionInstance && question && question.getInstance().get("id") === updatedInstance.get("id")) {
                    this.syncUI();
                }
            }, this));

            this.get(CONTENTBOX).delegate("click", function (e) {
                this.tooltip && this.tooltip.hide();
                this.doValidate(e.target.get("id"));
            }, ".mcq-selector .responseElements li", this);

            this.after("variableChange", this.syncUI);

            // Display tooltip with description of proposed question or choice.
            if (!this.generatedBySelector) {
                this.tooltip.on("triggerEnter", function (e) {
                    var targetId = e.node.getData("id"),
                        choiceD = Y.Wegas.Facade.Variable.cache.find("id", targetId),
                        descr = choiceD && I18n.t(choiceD.get("description"));
                    if (descr && descr.length !== 0) {
                        this.tooltip.setTriggerContent(descr);
                    } else {
                        this.tooltip.setTriggerContent(null);
                    }
                }, this);
            }
        },
        /**
         * @function
         * @private
         * @description Clear and re-fill the view with active
         * choice/questions and relatives reply.
         * Display a message if there is no message.
         */
        syncUI: function() {
            var question = this.get("variable.evaluated");
            if (!question || !(question instanceof Wegas.persistence.QuestionDescriptor)) {
                this.get(CONTENTBOX).setHTML("<em>" + Y.Wegas.I18n.t("mcq.empty") + "</em>");
                return;
            }
            if (question.get("cbx")) {
                this.get(CONTENTBOX).setHTML("<em>MCQ-DialogView: checkbox-type questions are not supported</em>");
            }
            this.genQuestion(question);
        },
        /**
         * @function
         * @param question question
         * @private
         * @description fetch question and displays it
         */
        genQuestion: function(question) {
            if (this.get("destroyed"))
                return;
            this.genMarkup(question);
        },

        genMarkup: function(question) {
            var i, ret,
                readonly = this.get("readonly.evaluated"),
                maxQ = question.get("maxReplies"),
                maxC,
                description,
                cQuestion = this.dataSource.cache.find("id", question.get("id")),
                choices = cQuestion.get("items"), choiceD, choiceI, choiceID,
                questionInstance = cQuestion.getInstance(),
                allReplies = questionInstance.get("replies"),
                choiceReplies,
                qLabel, qName, showChoice,
                totalNumberOfReplies = allReplies.length,
                maximumReached = maxQ && totalNumberOfReplies >= maxQ,
                qAnswerable = !maximumReached,
                cAnswerable,
                reply, currDescr, isChosenReply;
            Y.log("RENDER TAB");

            if (this.get("disabled")) {
                qAnswerable = false;
            }

            qName = question.get("name");
            qLabel = I18n.t(question.get("label")).trim();
            description = this.showDescription ? I18n.t(question.get("description")).trim() : "";
            ret = ['<div class="mcq-selector">'];
            if (qAnswerable && qLabel.length !== 0) {
                showChoice = true;
                ret.push(
                    '<div class="talk">' +
                    (description.length === 0 ? qLabel :
                        '<div class="wegas-mcq-selector-descr" data-name="' + qName + '" data-id="' +
                        question.get("id") + '">' + qLabel + '</div>'),
                    '</div>');
            } else {
                // The question has no label, hence it's the choice that was selected (and automatically validated)
                // from the selector menu, therefore we must only display the response.
                // Or the question cannot be answered anymore, therefore we only display the response.
                showChoice = !this.validateChoiceFromSelector;
            }


            if (showChoice) {
                ret.push('<div class="response"><ul class="responseElements">');
            }

            for (i = 0; i < choices.length; i += 1) {
                choiceD = choices[i];
                choiceI = choiceD.getInstance();
                choiceID = choiceD.get("id");
                currDescr = I18n.t(question.get("items")[i].get("description"));

                maxC = choiceD.get("maxReplies");
                choiceReplies = choiceI.get("replies");
                cAnswerable = qAnswerable && (!maxC || maxC > choiceReplies.length);

                isChosenReply = choiceReplies.length > 0;
                if (choiceI.get("active")) {
                    var rawTitle = I18n.t(choiceD.get("label")).trim();
                    var noDescr = (currDescr.trim() == '');

                    if (showChoice) {
                        if (!noDescr && !this.showDescription) {
                            noDescr = true;
                        }
                        // Attributes data-id and data-name are required for the tooltip managed in wegas-mcq-selector
                        ret.push('<li', (noDescr ? '' : ' class="wegas-mcq-selector-descr"'), ' id="', choiceID,
                            '" data-id="', choiceID, '" data-name="', qName, '">', I18n.t(choiceD.get("label")), '</li>');
                    }
                }
            }
            if (showChoice) {
                ret.push('</ul></div>'); // end responseElements and response
            }

            /*
             * Display results section:
             */
            if (totalNumberOfReplies > 0) {
                reply = allReplies[totalNumberOfReplies - 1]; // Display only the last reply
                ret.push('<div class="talk">', I18n.t(reply.get("answer")), '</div>');
            }

            ret.push('</div>'); // end mcq-selector

            if (!this.get("destroyed")) {
                this.get(CONTENTBOX).setHTML(ret.join(""));
            }
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
                occurrence = 0,
                allReplies = questionInstance.get("replies");
            for (i = 0; i < allReplies.length; i++) {
                if (!allReplies[i].get("ignored") && allReplies[i].getChoiceDescriptor().get("id") === choice.get("id")) { //can be buggy
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
            Y.log("Destroy MCQ-DIALOGVIEW");
            var i,
                length = this.handlers.length;
            for (i = 0; i < length; i += 1) {
                this.handlers[i].detach();
            }
            if (!this.generatedBySelector && this.tooltip) {
                this.tooltip.destroy();
            }
        }
    }, {
        /** @lends Y.Wegas.MCQView */
        EDITORNAME: "Dialog-type question display",
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
                optional: true,
                view: {
                    type: "variableselect",
                    label: "Question",
                    classFilter: ["QuestionDescriptor"]
                }
            },
            readonly: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "boolean",
                value: false,
                optional: true,
                view: {
                    label: "Readonly (currently ignored)",
                    type: "scriptcondition"
                }
            },
            showDescription: {
                type: 'boolean',
                value: false,
                view: {
                    label: "Show question/choice descriptions as tooltips",
                    className: 'wegas-advanced-feature'
                }
            },
            generatedBySelector: {
                type: 'boolean',
                value: false,
                view: {
                    label: "Set to TRUE if generated by selector widget, FALSE if used standalone",
                    className: 'wegas-advanced-feature'
                }
            },
            validateChoiceFromSelector: {
                type: 'boolean',
                value: false,
                view: {
                    label: "Automatically validate choices made in selector widget",
                    className: 'wegas-advanced-feature'
                }
            }
        }
    });
    Wegas.MCQDialogView = MCQDialogView;
});
