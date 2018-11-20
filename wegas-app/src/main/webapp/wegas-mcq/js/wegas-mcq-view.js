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
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-mcq-view', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox',
        Wegas = Y.Wegas,
        WhView,
        MCQView,
        ChoiceView;
    WhView = Y.Base.create("wegas-whview", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        initializer: function() {
            this.handlers = {};
        },
        renderUI: function() {
            var whQuestion = this.get("variable.evaluated"),
                whQuestionInstance = whQuestion.getInstance(),
                i, j, child, name, classes,
                answers,
                inputWidget, label, title;
            this.destroyAll();
            this.readonly = whQuestionInstance.get("validated");
            this.qList = new Y.Wegas.List({
                cssClass: "wegas-whview__mainlist"
            });
            title = I18n.t(whQuestion.get("label"));
            this.qTitle = new Y.Wegas.Text({
                cssClass: "wegas-whview__title",
                content: title
            });
            this.qText = new Y.Wegas.Text({
                cssClass: "wegas-whview__question wegas-light-picture",
                content: I18n.t(whQuestion.get("description"), {inlineEditor: 'html'})
            });
            this.qList.add(this.qTitle);
            this.qList.add(this.qText);
            this.mainList = new Y.Wegas.List({
                cssClass: "wegas-whview__main-list",
                direction: "vertical",
                editable: false,
                "transient": true
            });
            this.hList = new Y.Wegas.List({
                cssClass: "wegas-whview__main",
                direction: "vertical"
            });
            this.mainList.add(this.qList);
            this.add(this.mainList);
            this._locks = {};
            this._values = {};
            this.aList = new Y.Wegas.List({
                cssClass: "wegas-whview__answers"
            });
            answers = whQuestion.get("items");
            for (i in answers) {
                if (answers.hasOwnProperty(i)) {
                    child = answers[i];
                    name = child.get("name");
                    this._values[name] = child.getValue();
                    classes = "wegas-whview__answers__input-answer input-" + name;
                    label = I18n.t(child.get("label"));
                    switch (child.get("@class")) {
                        case "NumberDescriptor":
                            if (Y.Lang.isNumber(child.get("minValue")) && Y.Lang.isNumber(child.get("maxValue"))
                                && (child.get("maxValue") - child.get("minValue") < 15)) {

                                inputWidget = new Y.Wegas.BoxesNumberInput({
                                    label: label,
                                    cssClass: classes,
                                    variable: {name: name},
                                    selfSaving: false,
                                    readonly: {
                                        "content": "return " + this.readonly + ";"
                                    }
                                });
                            } else {
                                inputWidget = new Y.Wegas.NumberInput({
                                    label: label,
                                    cssClass: classes,
                                    variable: {name: name},
                                    selfSaving: false,
                                    readonly: {
                                        "content": "return " + this.readonly + ";"
                                    }});
                            }
                            break;
                        case "StringDescriptor":
                            inputWidget = new Y.Wegas.StringInput({
                                label: label,
                                cssClass: classes,
                                variable: {name: name},
                                displayChoicesWhenReadonly: {
                                    "content": "false"
                                },
                                clickSelect: true,
                                numSelectable: 1,
                                readonly: {
                                    "content": "return " + this.readonly + ";"
                                },
                                allowNull: false,
                                selfSaving: false
                            });
                            break;
                        case "TextDescriptor":
                            // maxChars = undefined;
                            // maxWords = undefined;
                            // countBlank = false;
                            inputWidget = new Y.Wegas.TextInput({
                                label: label,
                                cssClass: classes,
                                variable: {name: name},
                                showSaveButton: false,
                                maxNumberOfCharacters: undefined,
                                maxNumberOfWords: undefined,
                                countBlank: true,
                                readonly: {
                                    "content": "return " + this.readonly + ";"
                                },
                                selfSaving: false,
                                toolbar1: "bold italic underline bullist",
                                toolbar2: "",
                                toolbar3: "",
                                contextmenu: "bold italic underline bullist",
                                disablePaste: true
                            });
                            break;
                    }
                    this.aList.add(inputWidget);
                }
            }

            this.mainList.add(this.aList);
            if (!this.readonly) {
                this._buttonContainer = new Y.Wegas.AbsoluteLayout({
                    cssClass: "wegas-whview--button-container",
                    editable: false
                });
                this._submitButton = new Y.Wegas.Button({
                    cssClass: "wegas-whview--submit-button",
                    "label": Y.Wegas.I18n.t('mcq.submit'),
                    editable: false
                });
                this._submitButton.on("click", this.submit, this);
                this._buttonContainer.add(this._submitButton);
                this.mainList.add(this._buttonContainer);
            }


            if (whQuestionInstance.get("unread")) {
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/QuestionDescriptor/Read/" +
                        Wegas.Facade.Game.get('currentPlayerId') + "/" + whQuestion.get("id"),
                    cfg: {
                        method: "PUT"
                    }
                });
            }
        },
        bindUpdatedInstance: function() {
            if (this.handlers.onInstanceUpdate) {
                this.handlers.onInstanceUpdate.detach();
            }
            var question = this.get('variable.evaluated');
            if (question) {
                this.handlers.onInstanceUpdate = Y.Wegas.Facade.Instance.after(question.getInstance().get("id") + ':updatedInstance', this.renderUI, this);
            }
        },
        bindUI: function() {
            this.bindUpdatedInstance();
            this.after("variableChange", this.bindUpdatedInstance, this);

            this.handlers.onDescriptorUpdate = Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
                var question = this.get("variable.evaluated");
                if (question && question.get("id") === e.entity.get("id")) {
                    this.renderUI();
                }
            }, this);
            this.handlers.change = this.after("questionFolderChange", this.renderUI, this);
            this.handlers.beforeSwitchEntity = this.before("questionFolderChange", this.beforeSwitch, this);
            this.handlers.beforeAnswerSave = this.before("*:save", this.disableSubmit, this);
            this.handlers.afterAnswerSave = this.after("*:saved", this.onSubSave, this);
            this.handlers.editing = this.on("*:editing", this.disableSubmit, this);
            this.handlers.revert = this.on("*:revert", this.onSubSave, this);
        },
        disableSubmit: function(event) {
        },
        onSubSave: function(event) {
            var name = event.descriptor.get("name");
            this._values[name] = event.value;
        },
        isValid: function(event) {
            var container = this.get("contentBox").one(".wegas-whview__answers"),
                name,
                answerDescriptor = event.descriptor, numSelectable,
                aValues, values, value = event.value, node, widget, stats,
                isValid = true;
            name = answerDescriptor.get("name");
            node = container.one(".input-" + name);
            switch (answerDescriptor.get("@class")) {
                /*case "NumberDescriptor":
                 isValid = true; // always
                 break;*/
                case "TextDescriptor":
                    widget = Y.Widget.getByNode(node);
                    stats = widget.getStats();
                    /* falls through */
                case "StringDescriptor":
                    aValues = answerDescriptor.get("allowedValues");
                    if (aValues && aValues.length > 0) {
                        if (!value) {
                            // MCQ CLICK -> MUST SELECT "DUNNO"
                            isValid = false;
                        } else {
                            values = JSON.parse(value);
                            numSelectable = 1;
                            if (values.length < numSelectable && ((Y.Array.find(values, function(item) {  // or dunno not selected
                                return item === "";
                            }, this) === null))) {
                                isValid = false;
                            }
                        }
                    } else {
                        // Text Input
                        if (!value) {
                            isValid = false;
                        }
                    }
                    break;
            }
            node.toggleClass("invalid", !isValid);
            return isValid;
        },
        isAllValid: function() {
            var i, child, isValid,
                whQuestion = this.get("variable.evaluated"),
                value, answers,
                valid = true;
            answers = whQuestion.get("items");
            for (i in answers) {
                if (answers.hasOwnProperty(i)) {
                    child = answers[i];
                    value = Y.Wegas.Facade.Variable.cache.find("name", child.get("name")).getValue();
                    isValid = this.isValid({
                        descriptor: child,
                        value: value
                    });
                    valid = valid && isValid;
                }
            }
            return valid;
        },
        getSaveScript: function() {
            var script = "", answerName;
            for (answerName in this._values) {
                if (this._values.hasOwnProperty(answerName)) {
                    script += "Variable.find(gameModel, \"" + answerName + "\").setValue(self,  " + JSON.stringify(this._values[answerName]) + ");";
                }
            }
            return script;
        },
        save: function() {
            Y.log("SAVE");
            var script = this.getSaveScript();
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/Script/Run/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    updateCache: false,
                    updateEvent: false,
                    data: {
                        "@class": "Script",
                        content: script
                    }
                }
            });
        },
        _submit: function() {
            if (this.isAllValid()) {
                //this.showOverlay();
                var iId = this.get("variable.evaluated").getInstance().get("id");
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/Script/Run/" + Y.Wegas.Facade.Game.get('currentPlayerId'),
                    cfg: {
                        method: "POST",
                        data: {
                            "@class": "Script",
                            content: this.getSaveScript() + "QuestionFacade.validateQuestion(" + iId + ", self);"
                        }
                    },
                    on: {
                        success: Y.bind(function() {
                            //this.hideOverlay();
                            /*if (this.__hackParent) {
                             Y.later(500, this.__hackParent, this.__hackParent.selectNextUnread);
                             }*/
                        }, this),
                        failure: Y.bind(function() {
                            //this.hideOverlay();
                            this.showMessage("error", "Something went wrong");
                        }, this)
                    }
                });
            }
        },
        /**
         * save and sumbit
         * @returns {undefined}
         */
        submit: function() {
            Y.later(100, this, function() {
                this._submit();
            }, this);
        },
        beforeSwitch: function() {
            if (!this.readonly) {
                this.save();
            }
        },
        destructor: function() {
            Y.log("Destroy WH-VIEW");
            var k;
            for (k in this.handlers) {
                if (this.handlers.hasOwnProperty(k)) {
                    this.handlers[k].detach();
                }
            }

            if (!this.readonly) {
                this.beforeSwitch();
            }
        }
    }, {
        EDITORNAME: "Single OpenQuestion",
        ATTRS: {
            variable: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: "variableselect",
                    label: "Question",
                    classFilter: ["WhQuestionDescriptor"]
                }
            }
        }
    });
    Wegas.WhView = WhView;


    ChoiceView = Y.Base.create("wegas-mcqchoice", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        initializer: function() {
            this.handlers = {};
            this.after("disabledChange", this.syncUI, this);
        },
        renderUI: function() {
            this.title = new Y.Wegas.Text({
                cssClass: "mcqchoice__title",
                editable: false
            });
            this.description = new Y.Wegas.Text({
                cssClass: "mcqchoice__description wegas-light-picture",
                editable: false
            });
            this.submit = new Y.Wegas.Text({
                cssClass: "mcqchoice__submit",
                content: "<span tabindex='0' role='button'>" + I18n.t("mcq.submit") + "</span>",
                editable: false

            });
            this.summary = new Y.Wegas.Text({
                cssClass: "mcqchoice__summary",
                editable: false
            });

            this.add(this.title);
            this.add(this.description);
            this.add(this.submit);
            this.add(this.summary);
        },
        bindUpdatedInstance: function() {
            if (this.handlers.onInstanceUpdate) {
                this.handlers.onInstanceUpdate.detach();
            }
            var desc = this.get('choice.evaluated');
            if (desc) {
                this.handlers.onInstanceUpdate = Y.Wegas.Facade.Instance.after(desc.getInstance().get("id") + ':updatedInstance', this.syncUI, this);
            }
        },
        bindUI: function() {
            this.bindUpdatedInstance();
            this.after("choiceChange", this.bindUpdatedInstance, this);
            this.handlers.descriptorListener = Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
                var choice = this.get("choice.evaluated");
                if (choice && choice.get("id") === e.entity.get("id")) {
                    this.syncUI();
                }
            }, this);
        },
        syncUI: function() {
            var bb = this.get("boundingBox"),
                choice = this.get("choice.evaluated"),
                question = this.get("question.evaluated"),
                maxReplies = choice.get("maxReplies"),
                replies = Y.Array.filter(choice.getInstance().get("replies"), function(reply) {
                    return !reply.get("ignored");
                }),
                cbx = question.get("cbx"),
                hasTitle = I18n.t(choice.get("label"), {inlineEditor: 'none', fallback: ""}),
                hasDescription = I18n.t(choice.get("description"), {inlineEditor: 'none', fallback: ""});

            this.title.set("content", I18n.t(choice.get("label"), {inlineEditor: 'string', fallback: ""}));
            this.title.syncUI();
            this.description.set("content", I18n.t(choice.get("description"), {inlineEditor: 'html', fallback: ""}));
            this.description.syncUI();

            this.summary.set("content",
                '<span class="numberOfReplies">' + replies.length + '<span class="symbole">x</span></span>');

            this.summary.syncUI();

            bb.toggleClass("hasReplies", replies.length > 0);
            bb.toggleClass("selectable", cbx || !maxReplies || replies.length < maxReplies);
            bb.toggleClass("noTitle", !hasTitle);
            bb.toggleClass("noDescription", !hasDescription);
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        EDITORNAME: "Choice display",
        ATTRS: {
            question: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                optional: true,
                view: {
                    type: "variableselect",
                    label: "Question",
                    classFilter: ["QuestionDescriptor"]
                }
            },
            choice: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                optional: true,
                view: {
                    type: "variableselect",
                    label: "Choice",
                    classFilter: ["ChoiceDescriptor", "SingleResultChoiceDescriptor"]
                }
            },
            readonly: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "boolean",
                value: false,
                optional: true,
                view: {
                    type: "scriptcondition"
                }
            }
        }
    }
    );
    Wegas.ChoiceView = ChoiceView;


    MCQView = Y.Base.create("wegas-mcqview", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        initializer: function() {

            this.gallery = null;
            this.choices = {};
            this.results = {};
            this.handlers = {};
            this.after("disabledChange", this.syncUI, this);
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
            this.title = new Y.Wegas.Text({
                cssClass: "mcq-view__question-title"
            });
            this.description = new Y.Wegas.Text({
                cssClass: "mcq-view__question-description"
            });
            this.choiceList = new Y.Wegas.FlexList({
                cssClass: "mcq-view__choices"
            });
            this.submitButton = new Y.Wegas.Text({
                cssClass: "mcq-view__submit",
                content: "<span tabindex='0' role='button'>" + I18n.t("mcq.submit") + "</span>"
            });
            this.resultTitle = new Y.Wegas.Text({
                cssClass: "mcq-view__results-title"
            });
            this.resultList = new Y.Wegas.FlexList({
                cssClass: "mcq-view__results"
            });
            this.add(this.title);
            this.add(this.description);
            this.add(this.choiceList);
            this.add(this.submitButton);
            this.add(this.resultTitle);
            this.add(this.resultList);

            this.plugLockable();
        },
        bindUI: function() {
            this.after("variableChange", this.plugLockable, this);

            this.handlers.rmDescriptorListener = Y.Wegas.Facade.Variable.after("delete", function(e) {
                var choice = e.entity;
                if (choice instanceof Y.Wegas.persistence.ChoiceDescriptor) {
                    if (this.choices[choice.get("id")]) {
                        // destroy choice widget
                        this.choices[choice.get("id")].remove();
                        this.choices[choice.get("id")] = undefined;
                    }
                }
            }, this);

            this.handlers.descriptorListener = Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
                var question = this.get("variable.evaluated");
                if (question && question.get("id") === e.entity.get("id")) {
                    this.syncUI();
                }
            }, this);

            this.handlers.instanceListener = Y.Wegas.Facade.Instance.after("*:updatedInstance", function(e) {
                var question = this.get("variable.evaluated"), updatedInstance;

                if (e.entity instanceof Y.Wegas.persistence.ChoiceInstance) {
                    updatedInstance = Y.Wegas.Facade.Variable.cache.findParentDescriptor(e.entity.getDescriptor()).getInstance();
                } else {
                    updatedInstance = e.entity;
                }

                if (updatedInstance instanceof Y.Wegas.persistence.QuestionInstance
                    && question && question.getInstance().get("id") === updatedInstance.get("id")) {
                    this.syncUI();
                }
            }, this);


            this.get("boundingBox").delegate("click", this.selectChoice,
                ".answerable:not(.locked):not(.cbx) .selectable .mcqchoice__submit span, " + // standard selectable choices from still answerable question
                ".answerable.cbx:not(.checkbox):not(.locked) .wegas-mcqchoice:not(.hasReplies) .mcqchoice__submit, " + // not selected radio options
                ".answerable.cbx.checkbox:not(.maximumReached):not(.locked) .mcqchoice__submit, " + // checkboxes when maximum not reached yet
                ".answerable.cbx.checkbox.maximumReached:not(.locked) .hasReplies .mcqchoice__submit"  // unselect checkboxes even if maximum reached
                , this);

            this.get("boundingBox").delegate("click", this.validateQuestion, ".cbx.answerable:not(.locked) .mcq-view__submit span", this);
        },
        beforeRequest: function() {
            this.lockable.lock();
        },
        onSuccess: function() {
            this.lockable.unlock();
        },
        onFailure: function() {
            this.lockable.unlock();
        },
        selectChoice: function(e) {
            if (this.get("disabled")) {
                return;
            }
            var choiceWidget = Y.Widget.getByNode(e.target.ancestor(".wegas-mcqchoice")),
                choice = choiceWidget.get("choice.evaluated"),
                question = choiceWidget.get("question.evaluated");
            if (question.get("cbx")) {
                //select or cancel ?
                var replies = choice.getInstance().get("replies");
                if (replies.length > 0) {
                    for (var i in replies) {
                        this.beforeRequest();
                        Y.Wegas.Facade.Variable.sendRequest({
                            request: "/QuestionDescriptor/CancelReply/" + replies[i].get('id')
                                + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
                            cfg: {
                                method: "GET"
                            },
                            on: {
                                success: Y.bind(this.onSuccess, this),
                                failure: Y.bind(this.onFailure, this)
                            }
                        });
                    }
                } else {
                    this.beforeRequest();
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/QuestionDescriptor/SelectChoice/" + choice.get('id')
                            + "/Player/" + Wegas.Facade.Game.get('currentPlayerId')
                            + "/StartTime/0",
                        cfg: {
                            method: "GET" // initially: POST
                        },
                        on: {
                            success: Y.bind(this.onSuccess, this),
                            failure: Y.bind(this.onFailure, this)
                        }
                    });
                }


            } else {
                this.beforeRequest();
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/QuestionDescriptor/SelectAndValidateChoice/" + choice.get('id') + "/Player/" +
                        Wegas.Facade.Game.get('currentPlayerId'),
                    cfg: {
                        method: "POST"
                    },
                    on: {
                        success: Y.bind(this.onSuccess, this),
                        failure: Y.bind(this.onFailure, this)
                    }
                });
            }
        },
        validateQuestion: function(e) {
            if (this.get("disabled")) {
                return;
            }
            var questionDescriptor = this.get("variable.evaluated"),
                questionInstance = questionDescriptor.getInstance(),
                minQ, maxQ;

            if (questionDescriptor.get("cbx")) { // doublechecl
                // Prevent validation of questions with too few replies
                if (Y.Lang.isNumber(questionDescriptor.get("minReplies"))) {
                    minQ = questionDescriptor.get("minReplies");
                } else {
                    minQ = 1;
                }
                if (questionInstance.get("replies").length < minQ) {
                    this.onFailure();
                    if (minQ === 1) {
                        Wegas.Alerts.showMessage("warn", Y.Wegas.I18n.t('mcq.noReply'));
                    } else {
                        Wegas.Alerts.showMessage("warn", Y.Wegas.I18n.t('mcq.notEnoughReply', {min: minQ}));
                    }
                    return;
                }

                this.beforeRequest();
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/QuestionDescriptor/ValidateQuestion/" + questionInstance.get('id')
                        + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
                    cfg: {
                        method: "POST"
                    },
                    on: {
                        success: Y.bind(this.onSuccess, this),
                        failure: Y.bind(this.onFailure, this)
                    }
                });
            }
        },
        syncUI: function() {
            var cb = this.get(CONTENTBOX),
                questionDescriptor = this.get("variable.evaluated"),
                questionInstance = questionDescriptor.getInstance(),
                replies = questionInstance.get("replies"),
                maxReplies = questionDescriptor.get("maxReplies"),
                minReplies = questionDescriptor.get("minReplies"),
                choices = questionDescriptor.get("items"),
                cbx = questionDescriptor.get("cbx"),
                maximumReached = maxReplies && replies.length >= maxReplies,
                answerable;

            answerable =
                //!this.get("disabled") && // not disable by a lock
                    ((questionDescriptor.get("cbx") && !questionInstance.get("validated")) // not validated
                        || (!questionDescriptor.get("cbx") && !maximumReached && !questionInstance.get("validated"))); // maximum not reached yet

                this.title.set("content", I18n.t(questionDescriptor.get("label"), {inlineEditor: 'string', fallback: ""}));
                this.title.syncUI();
                this.description.set("content", I18n.t(questionDescriptor.get("description"), {inlineEditor: 'html'}));
                this.description.syncUI();

                if (this.gallery) {
                    this.gallery.remove();
                    this.gallery = null;
                    this._gallery.remove();
                    this._gallery = null;
                }

                if (questionDescriptor.get("pictures").length > 0) {
                    this.gallery = new Y.Wegas.AbsoluteLayout({});
                    this.add(this.gallery, 2);
                    new Wegas.util.FileLibraryGallery({
                        selectedHeight: 150,
                        selectedWidth: 235,
                        gallery: Y.clone(questionDescriptor.get("pictures"))
                    }).render(this.gallery.get("contentBox"));
                }

                for (var i in choices) {
                    var choice = choices[i],
                        choiceInstance = choice.getInstance();
                    if (this.choices[choice.get("id")]) {
                        if (!choiceInstance.get("active")) {
                            // deativate choice by removing its widget
                            this.choices[choice.get("id")].remove();
                            this.choices[choice.get("id")] = undefined;
                        }
                    } else {
                        if (choiceInstance.get("active")) {
                            this.choices[choice.get("id")] = new Y.Wegas.ChoiceView({
                                choice: {
                                    "@class": "Script",
                                    "content": "Variable.find(gameModel, \"" + choice.get("name") + "\");"
                                },
                                question: {
                                    "@class": "Script",
                                    "content": "Variable.find(gameModel, \"" + questionDescriptor.get("name") + "\");"
                                }
                            });
                            this.choiceList.add(this.choices[choice.get("id")]);
                        }
                    }
                }


                if (questionInstance.get("unread")) {
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/QuestionDescriptor/Read/" +
                            Wegas.Facade.Game.get('currentPlayerId') + "/" + questionDescriptor.get("id"),
                        cfg: {
                            method: "PUT"
                        }
                    });
                }

                if ((!cbx || questionInstance.get("validated")) && replies.length) {
                    this.resultTitle.set("content", replies.length > 1 ? Y.Wegas.I18n.t('mcq.results').capitalize() : Y.Wegas.I18n.t('mcq.result').capitalize());
                    this.resultTitle.syncUI();
                    if (cbx) {
                        replies = [];
                        // select replies according to order of choices
                        for (i = 0; i < choices.length; i += 1) {
                            var choiceD = choices[i],
                                choiceI = choiceD.getInstance(),
                                cReplies = choiceI.get("replies");

                            // skip inactive choices or choices without replies
                            if (choiceI.get("active") && cReplies && cReplies.length > 0) {
                                replies.push(cReplies[0]);
                            }
                        }
                    }
                    var repliesIds = {};
                    for (var i in replies) {
                        var reply = replies[i];
                        repliesIds[reply.get("id")] = true;
                        if (!this.results[reply.get("id")]) {
                            var choiceD = reply.getChoiceDescriptor(),
                                choiceI = choiceD.getInstance(),
                                toDisplay;
                            // skip inactive checkbox inactive choice
                            if (!cbx || choiceI.get("active")) {
// select the correct text to display
                                if (!reply.get("ignored")) {
                                    toDisplay = I18n.t(reply.get("answer"), {fallback: ''});
                                } else {
                                    // skip empty ignoration
                                    toDisplay = I18n.t(reply.get("ignorationAnswer"), {fallback: ''});
                                    if (!toDisplay || !toDisplay.replace(/(\r\n|\n|\r)/gm, "").trim()) {
                                        continue;
                                    }
                                }

                                this.results[reply.get("id")] = new Y.Wegas.Text({
                                    cssClass: "wegas-mcqview__result",
                                    content: '<div class="mcq-reply-title">' + I18n.t(choiceD.get("label")) + '</div>' +
                                        '<div class="mcq-reply-content">' + toDisplay + '</div>'
                                });
                                // Insert the latest reply at the top of the list, but not for cbx question:
                                this.resultList.add(this.results[reply.get("id")], !cbx ? 0 : undefined);
                            }
                        }
                    }
                    for (var i in this.results) {
                        if (!repliesIds[i]) {
                            // reply no longer exists
                            this.results[i].destroy();
                            delete this.results[i];
                        }
                    }
                } else {
                    // make sure reply list is empty
                    this.resultTitle.set("content", "");
                    this.resultTitle.syncUI();
                    for (var i in this.results) {
                        this.results[i].destroy();
                        delete this.results[i];
                    }
                }

                cb.toggleClass("cbx", cbx);
                cb.toggleClass("horizontal", cbx && questionDescriptor.get("tabular"));
                cb.toggleClass("checkbox", (maxReplies !== 1) || (minReplies !== null && minReplies !== 1));
                cb.toggleClass("showSummary", !maxReplies || maxReplies > 1);
                cb.toggleClass("answerable", answerable);
                cb.toggleClass("maximumReached", maximumReached);
            },
            destructor: function() {
                var k;
                for (k in this.handlers) {
                    this.handlers[k].detach();
                }
            }
        }, {
            /** @lends Y.Wegas.MCQView */
            EDITORNAME: "Single question display",
            ATTRS: {
                variable: {
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
                        type: "scriptcondition"
                    }
                }
            }
        });
    Wegas.MCQView = MCQView;
});
