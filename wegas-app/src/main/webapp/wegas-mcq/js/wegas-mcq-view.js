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
                    "label": this.getAttrValueOrDefault("submitVar", I18n.t("mcq.submit")),
                    editable: false
                });
                this._submitButton.on("click", this.submit, this);
                this._buttonContainer.add(this._submitButton);
                this.mainList.add(this._buttonContainer);
            }


            if (whQuestionInstance.get("unread")) {
                whQuestionInstance.set("unread", false); // avoid sync hell
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/QuestionDescriptor/Read/" +
                        Wegas.Facade.Game.get('currentPlayerId') + "/" + whQuestion.get("id"),
                    cfg: {
                        method: "PUT"
                    }
                });
            }
        },
        getAttrValueOrDefault: function(attrName, defaultValue) {
            if (this.get(attrName)) {
                var desc = this.get(attrName + ".evaluated");
                if (desc instanceof Y.Wegas.persistence.ListDescriptor) {
                    return I18n.t(desc.get("label"));
                } else {
                    return Y.Wegas.Helper.stripHtml(desc.getInstance().get("value"));
                }
            }
            return defaultValue;
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
        afterChange: function(e) {
            this.bindUpdatedInstance();
            this.syncUI();
        },
        bindUI: function() {
            this.bindUpdatedInstance();
            this.after("variableChange", this.afterChange, this);

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
    Wegas.WhView = WhView;


    ChoiceView = Y.Base.create("wegas-mcqchoice", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        initializer: function() {
            this.results = {};
            this.handlers = {};
            this.after("disabledChange", this.syncUI, this);
        },
        getAttrValueOrDefault: function(attrName, defaultValue) {
            if (this.get(attrName)) {
                var desc = this.get(attrName + ".evaluated");
                if (desc instanceof Y.Wegas.persistence.ListDescriptor) {
                    return I18n.t(desc.get("label"));
                } else {
                    return Y.Wegas.Helper.stripHtml(desc.getInstance().get("value"));
                }
            }
            return defaultValue;
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
                content: "<span tabindex='0' role='button'>"
                    + this.getAttrValueOrDefault("submitVar", I18n.t("mcq.submit"))
                    + "</span>",
                editable: false

            });
            this.summary = new Y.Wegas.Text({
                cssClass: "mcqchoice__summary",
                editable: false
            });

            this.rLayout = new Y.Wegas.FlexList({
                cssClass: "mcq-choice-result-layout"
            });

            this.resultTitle = new Y.Wegas.Text({
                cssClass: "mcq-view__results-title"
            });

            this.resultList = new Y.Wegas.FlexList({
                cssClass: "mcq-view__results"
            });

            this.rLayout.add(this.resultTitle);
            this.rLayout.add(this.resultList);

            this.add(this.title);
            this.add(this.description);
            this.add(this.submit);
            this.add(this.summary);

            this.add(this.rLayout);
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
        isTextEmpty: function(text) {
            return !text || text === "<p></p>";
        },
        syncUI: function() {
            var bb = this.get("boundingBox"),
                choice = this.get("choice.evaluated"),
                choiceInstance = choice.getInstance(),
                question = this.get("question.evaluated"),
                maxReplies = choice.get("maxReplies"),
                _replies = choiceInstance.get("replies"),
                pendingReplies = [],
                validatedReplies = [],
                notIgnoredReplies = [],
                cbx = question.get("cbx"),
                hasTitle = !this.isTextEmpty(I18n.t(choice.get("label"), {inlineEditor: 'none', fallback: ""})),
                hasDescription = !this.isTextEmpty(I18n.t(choice.get("description"), {inlineEditor: 'none', fallback: ""}));

            for (var i in _replies) {
                var reply = _replies[i];
                if (!reply.get("ignored")) {
                    notIgnoredReplies.push(reply);
                }
                if (reply.get("validated")) {
                    validatedReplies.push(reply);
                } else {
                    pendingReplies.push(reply);
                }
            }

            this.title.set("content", I18n.t(choice.get("label"), {inlineEditor: this.get("translationInlineEditor") ? 'string' : null, fallback: ""}));
            this.title.syncUI();
            this.description.set("content", I18n.t(choice.get("description"), {inlineEditor: this.get("translationInlineEditor") ? 'html' : null, fallback: ""}));
            this.description.syncUI();

            this.summary.set("content",
                '<span class="numberOfReplies">' + notIgnoredReplies.length + '<span class="symbole">x</span></span>');

            this.summary.syncUI();


            var repliesToDisplay;
            if (cbx) {
                repliesToDisplay = _replies; // Show all replies
            } else {
                repliesToDisplay = validatedReplies;
            }

            var noFeedbacks = true;
            if (repliesToDisplay.length &&
                (!cbx || question.getInstance().get("validated"))
                && !(cbx && question.get("tabular")) && this.get("displayResult") === "inline") {
                this.resultTitle.set("content", repliesToDisplay.length > 1 ? Y.Wegas.I18n.t('mcq.results').capitalize() : Y.Wegas.I18n.t('mcq.result').capitalize());
                this.resultTitle.syncUI();
                var repliesIds = {};
                for (var i in repliesToDisplay) {
                    var reply = repliesToDisplay[i];
                    repliesIds[reply.get("id")] = true;
                    if (this.results[reply.get("id")]) {
                        noFeedbacks = false;
                    } else {
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
                            if (toDisplay) {
                                noFeedbacks = false;
                                this.results[reply.get("id")] = new Y.Wegas.Text({
                                    cssClass: "wegas-mcqview__result",
                                    content: '<div class="mcq-reply-content">' + toDisplay + '</div>'
                                });
                                // Insert the latest reply at the top of the list, but not for cbx question:
                                this.resultList.add(this.results[reply.get("id")], !cbx ? 0 : undefined);
                            }
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
            }


            if (choiceInstance.get("unread")) {
                choiceInstance.set("unread", false); // avoid sync hell
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/QuestionDescriptor/Read/" +
                        Y.Wegas.Facade.Game.get('currentPlayerId') + "/" + choice.get("id"),
                    cfg: {
                        method: "PUT"
                    }
                });
            }

            if (noFeedbacks) {
                // make sure reply list is empty
                this.resultTitle.set("content", "");
                this.resultTitle.syncUI();
                for (var i in this.results) {
                    this.results[i].destroy();
                    delete this.results[i];
                }
            }

            bb.toggleClass("unread", choiceInstance.get("unread"));
            bb.toggleClass("noFeedbacks", noFeedbacks);
            bb.toggleClass("hasReplies", notIgnoredReplies.length > 0);
            bb.toggleClass("hasPendingReplies", pendingReplies.length > 0);
            bb.toggleClass("selectable", cbx || !maxReplies || validatedReplies.length < maxReplies);
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
            },
            translationInlineEditor: {
                value: true,
                type: 'boolean',
                view: {
                    label: "Translation inline editor"
                }
            },
            displayResult: {
                value: 'bottom',
                type: 'string',
                view: {
                    type: 'select',
                    choices: [
                        {
                            value: 'inline'
                        }, {
                            value: 'no'
                        }
                    ],
                    className: 'wegas-advanced-feature',
                    label: "Display Result"
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
            this.resync = false;
            this.after("disabledChange", this.syncUI, this);
        },
        plugLockable: function() {
            var theVar = this.get("variable.evaluated"), token;
            if (theVar) {
                token = "MCQ-" + this.get("variable.evaluated").getInstance().get("id");
                if (this.lockable) {
                    this.lockable.set("token", token);
                } else {
                    this.plug(Y.Plugin.Lockable, {
                        token: token,
                        editable: false
                    });
                }
            }
        },

        getAttrValueOrDefault: function(attrName, defaultValue) {
            if (this.get(attrName)) {
                var desc = this.get(attrName + ".evaluated");
                if (desc instanceof Y.Wegas.persistence.ListDescriptor) {
                    return I18n.t(desc.get("label"));
                } else {
                    return Y.Wegas.Helper.stripHtml(desc.getInstance().get("value"));
                }
            }
            return defaultValue;
        },
        updateAvailableInvite: function(num) {
            if (this.availableChoices) {
                var invite = this.getAttrValueOrDefault("availableChoicesInvite", I18n.t("mcq.possibleChoices"));
                this.availableChoices.set("content", "<span tabindex='0' role='button'>" + invite + num + "</span>");
                this.availableChoices.syncUI();
            }
        },
        toObject: function() {
            // do not use toObject from Wegas-parent as we do NOT want to serialise children
            return Y.Wegas.Editable.prototype.toObject.apply(this, arguments);
        },
        renderUI: function() {
            this.destroyAll();

            this.title = new Y.Wegas.Text({
                cssClass: "mcq-view__question-title",
                editable: false,
                "transient": true
            });
            this.description = new Y.Wegas.Text({
                cssClass: "mcq-view__question-description",
                editable: false
            });
            this.choiceList = new Y.Wegas.FlexList({
                cssClass: "mcq-view__choices",
                editable: false
            });
            this.submitButton = new Y.Wegas.Text({
                cssClass: "mcq-view__submit",
                content: "<span tabindex='0' role='button'>"
                    + this.getAttrValueOrDefault("submitVar", I18n.t("mcq.submit"))
                    + "</span>",
                editable: false
            });
            this.resultTitle = new Y.Wegas.Text({
                cssClass: "mcq-view__results-title",
                editable: false
            });
            this.resultList = new Y.Wegas.FlexList({
                cssClass: "mcq-view__results",
                editable: false
            });

            this.add(this.title);
            if (this.get("displayResult") === "dialogue") {

                this.history = new Y.Wegas.FlexList({
                    cssClass: "mcq-view__history",
                    editable: false
                });

                this.history.add(this.description);
                this.history.add(this.resultTitle);
                this.history.add(this.resultList);
                this.add(this.history);

                this.choiceHeader = new Y.Wegas.FlexList({
                    cssClass: "mcq-view__choice_header",
                    direction: "horizontal",
                    editable: false
                });

                this.availableChoices = new Y.Wegas.Text({
                    cssClass: "mcq-view__invite",
                    content: "",
                    editable: false
                });

                this.choicesExpander = new Y.Wegas.Text({
                    cssClass: "mcq-view__choice_expander",
                    content: "<span tabindex='1' role='button'></span>",
                    editable: false
                });
                this.choiceHeader.add(this.availableChoices);
                this.choiceHeader.add(this.choicesExpander);

                this.add(this.choiceHeader);
                this.add(this.choiceList);

                this.pendings = new Y.Wegas.FlexList({
                    cssClass: "mcq-view__pendings",
                    editable: false
                });

                this.add(this.pendings);

                this.add(this.submitButton);
            } else {
                this.add(this.description);
                this.add(this.choiceList);
                this.add(this.submitButton);
                this.add(this.resultTitle);
                this.add(this.resultList);
            }

            this.plugLockable();
        },
        afterVariableChange: function(e) {
            this.plugLockable();
            this.syncUI();
        },
        bindUI: function() {
            this.after("variableChange", this.afterVariableChange, this);

            this.handlers.expandChoices = this.get("contentBox").delegate("click", function(e) {
                this.get("contentBox").toggleClass("show_choices");
            }, ".mcq-view__choice_header", this);

            this.handlers.rmDescriptorListener = Y.Wegas.Facade.Variable.after("delete", function(e) {
                var choice = e.entity;
                if (choice instanceof Y.Wegas.persistence.ChoiceDescriptor) {
                    if (this.choices[choice.get("id")]) {
                        // destroy choice widget
                        this.choices[choice.get("id")].destroy();
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
                ".answerable[data-displayResult='dialogue']:not(.locked):not(.cbx) .selectable .wegas-mcqchoice-content, " + // standard selectable choices from still answerable question displayed as dialogue
                ".answerable:not(.locked):not(.cbx) .selectable .mcqchoice__submit span, " + // standard selectable choices from still answerable question
                ".answerable.cbx:not(.checkbox):not(.locked) .wegas-mcqchoice:not(.hasReplies) .mcqchoice__submit, " + // not selected radio options
                ".answerable.cbx.checkbox:not(.maximumReached):not(.locked) .mcqchoice__submit, " + // checkboxes when maximum not reached yet
                ".answerable.cbx.checkbox.maximumReached:not(.locked) .hasReplies .mcqchoice__submit"  // unselect checkboxes even if maximum reached
                , this);

            this.get("boundingBox").delegate("click", this.validateQuestion, ".answerable:not(.locked) .mcq-view__submit span", this);
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
            } else if (this.getEffectiveDisplayMode() === "dialogue") {
                //select or cancel ?
                var replies = choice.getInstance().get("replies"),
                    pendingReplies = [],
                    validatedReplies = [];

                for (var i in replies) {
                    if (replies[i].get("validated")) {
                        validatedReplies.push(replies[i]);
                    } else {
                        pendingReplies.push(replies[i]);
                    }
                }

                if (pendingReplies.length) {
                    for (var i in pendingReplies) {
                        this.beforeRequest();
                        Y.Wegas.Facade.Variable.sendRequest({
                            request: "/QuestionDescriptor/CancelReply/" + pendingReplies[i].get('id')
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
                        request: "/QuestionDescriptor/DeselectOthersAndSelectChoice/" + choice.get('id')
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

            if (questionDescriptor.get("cbx")) { // doublecheck
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
            } else if (this.getEffectiveDisplayMode() === "dialogue") {
                // validate all pendings replies (usually only one...)
                var replies = Y.Array.filter(questionInstance.get("replies"), function(reply) {
                    return !reply.get("validated");
                }, this);

                for (var i in replies) {
                    var reply = replies[i];
                    this.beforeRequest();
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/QuestionDescriptor/ValidateReply/" + reply.get("id")
                            + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
                        cfg: {
                            method: "GET" // initially: POST
                        },
                        on: {
                            success: Y.bind(this.onSuccess, this),
                            failure: Y.bind(this.onFailure, this)
                        }
                    });
                }
            }
        },
        isCbx: function() {
            return this.get("variable.evaluated").get("cbx");
        },
        getEffectiveDisplayMode: function() {
            var effectiveDisplayResult = this.get("displayResult");
            if (this.isCbx() && effectiveDisplayResult === "dialogue") {
                effectiveDisplayResult = "bottom";
            }
            return effectiveDisplayResult;
        },
        syncUI: function() {
            var cb = this.get(CONTENTBOX),
                questionDescriptor,
                questionInstance,
                replies,
                maxReplies,
                minReplies, choices, cbx,
                maximumReached,
                answerable,
                validatedReplies,
                pendingReplies;


            questionDescriptor = this.get("variable.evaluated");
            if (questionDescriptor) {
                questionInstance = questionDescriptor.getInstance();
                replies = questionInstance.get("replies");
                maxReplies = questionDescriptor.get("maxReplies");
                minReplies = questionDescriptor.get("minReplies");
                choices = questionDescriptor.get("items");
                cbx = questionDescriptor.get("cbx");
                maximumReached = maxReplies && replies.length >= maxReplies;
                validatedReplies = [];
                pendingReplies = [];
                for (var i in replies) {
                    if (replies[i].get("validated")) {
                        validatedReplies.push(replies[i]);
                    } else {
                        pendingReplies.push(replies[i]);
                    }
                }

                var effectiveDisplayResult = this.get("displayResult");
                if (cbx && effectiveDisplayResult === "dialogue") {
                    effectiveDisplayResult = "bottom";
                }

                //!this.get("disabled") && // not disable by a lock
                answerable = ((cbx && !questionInstance.get("validated")) // not validated
                    || (!cbx && !maximumReached && !questionInstance.get("validated"))); // maximum not reached yet

                this.title.set("content", I18n.t(questionDescriptor.get("label"), {inlineEditor: 'string', fallback: ""}));
                this.title.syncUI();
                this.description.set("content", I18n.t(questionDescriptor.get("description"), {inlineEditor: 'html'}));
                this.description.syncUI();

                if (this.gallery) {
                    this.gallery.remove();
                    this.gallery = null;
                    //this._gallery.remove();
                    //this._gallery = null;
                }

                if (questionDescriptor.get("pictures").length > 0) {
                    this.gallery = new Y.Wegas.Text({
                    });
                    this.add(this.gallery, 2);
                    this._gallery = new Wegas.util.FileLibraryGallery({
                        selectedHeight: 150,
                        selectedWidth: 235,
                        gallery: Y.clone(questionDescriptor.get("pictures"))
                    }).render(this.gallery.get("contentBox"));
                }

                var toProcess = Y.mix({}, this.choices);

                for (var i in choices) {
                    var choice = choices[i],
                        choiceInstance = choice.getInstance(),
                        cId = choice.get("id");

                    if (this.choices[cId]) {
                        if (choiceInstance.get("active")) {
                            delete toProcess[cId];
                        }
                    } else {
                        if (choiceInstance.get("active")) {
                            this.choices[cId] = new Y.Wegas.ChoiceView({
                                choice: {
                                    "@class": "Script",
                                    "content": "Variable.find(gameModel, \"" + choice.get("name") + "\");"
                                },
                                question: {
                                    "@class": "Script",
                                    "content": "Variable.find(gameModel, \"" + questionDescriptor.get("name") + "\");"
                                },
                                translationInlineEditor: effectiveDisplayResult === "dialogue" ? false : true,
                                displayResult: effectiveDisplayResult === "inline" ? "inline" : "no",
                                submitVar: this.get("submitVar")
                            });
                            this.choiceList.add(this.choices[choice.get("id")]);
                        }
                    }
                }

                for (var id in toProcess) {
                    this.choices[id].remove();
                    delete this.choices[id];
                }

                if (questionInstance.get("unread")) {
                    questionInstance.set("unread", false); // avoid sync hell
                    Y.Wegas.Facade.Variable.sendRequest({
                        request: "/QuestionDescriptor/Read/" +
                            Wegas.Facade.Game.get('currentPlayerId') + "/" + questionDescriptor.get("id"),
                        cfg: {
                            method: "PUT"
                        }
                    });
                }

                var noFeedbacks = true;

                if (validatedReplies.length && (
                    (effectiveDisplayResult === "bottom"
                        || effectiveDisplayResult === "newBottom"
                        || effectiveDisplayResult === "dialogue")
                    && (!cbx || questionInstance.get("validated")))
                    || (cbx && questionInstance.get("validated") && questionDescriptor.get("tabular"))) {
                    this.resultTitle.set("content", validatedReplies.length > 1 ? Y.Wegas.I18n.t('mcq.results').capitalize() : Y.Wegas.I18n.t('mcq.result').capitalize());
                    this.resultTitle.syncUI();
                    if (cbx) {
                        validatedReplies = [];
                        // select replies according to order of choices
                        for (i = 0; i < choices.length; i += 1) {
                            var choiceD = choices[i],
                                choiceI = choiceD.getInstance(),
                                cReplies = choiceI.get("replies");

                            // skip inactive choices or choices without replies
                            if (choiceI.get("active") && cReplies && cReplies.length > 0 && cReplies[0].get("validated")) {
                                validatedReplies.push(cReplies[0]);
                            }
                        }
                    }
                    var repliesIds = {};
                    for (var i in validatedReplies) {
                        var reply = validatedReplies[i];
                        repliesIds[reply.get("id")] = true;
                        if (this.results[reply.get("id")]) {
                            noFeedbacks = false;
                        } else {
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
                                var title = I18n.t(choiceD.get("label"));
                                if (toDisplay || title) {
                                    noFeedbacks = false;

                                    var hasTitle = !this.isTextEmpty(I18n.t(choice.get("description"), {inlineEditor: 'none', fallback: ""}));
                                    var hasDescription = !this.isTextEmpty(I18n.t(choice.get("description"), {inlineEditor: 'none', fallback: ""}));

                                    this.results[reply.get("id")] = new Y.Wegas.Text({
                                        cssClass: "wegas-mcqview__result " + (this.resync ? "typing" : ""),
                                        content: '<div class="mcq-reply-choice'
                                            + (hasDescription ? " hasDescription": " noDescription")
                                            + (hasTitle ? " hasTitle": " noTitle")
                                            +'">' +
                                            '<div class="mcq-reply-title">' + I18n.t(choiceD.get("label")) + '</div>' +
                                            (effectiveDisplayResult === "dialogue" ?
                                                '<div class="mcq-reply-description">' + I18n.t(choiceD.get("description")) + '</div>' : "") +
                                            '</div>' +
                                            '<div class="mcq-reply-feedback">' +
                                            '<img class="mcq-reply-typing" src="./wegas-mcq/images/typing.gif"></img>' +
                                            '<div class="mcq-reply-content">' + toDisplay + '</div>' +
                                            '</div>'
                                    });
                                    Y.later(1500, this.results[reply.get("id")], function() {
                                        this.get("boundingBox").removeClass("typing");
                                    });
                                    // Insert the latest reply at the top of the list, but not for cbx question nor dialogue :
                                    this.resultList.add(this.results[reply.get("id")], !cbx && effectiveDisplayResult !== 'dialogue' ? 0 : undefined);
                                }
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
                }


                if (effectiveDisplayResult === "dialogue") {


                    if (!this.resync) {
                        // if there is no validated replies or pendings, show possible choices
                        this.get("contentBox").toggleClass("show_choices", this.resultList.isEmpty() || pendingReplies.length);
                    }

                    this.pendings.destroyAll();

                    for (var i in pendingReplies) {
                        var reply = pendingReplies[i];
                        var label = I18n.t(reply.getChoiceDescriptor().get("label"));
                        var description = I18n.t(reply.getChoiceDescriptor().get("description"));
                        this.pendings.add(new Y.Wegas.Text({
                            content: "<div class='pending-label'>" + label + "</div>" +
                                "<div class='pending-description'>" + description + "</div>"
                        }));
                    }
                }

                if (noFeedbacks) {
                    // make sure reply list is empty
                    this.resultTitle.set("content", "");
                    this.resultTitle.syncUI();
                    for (var i in this.results) {
                        this.results[i].destroy();
                        delete this.results[i];
                    }
                }

                cb.setAttribute("data-displayResult", effectiveDisplayResult);

                var nbSelectableChoice = this.choiceList.get("boundingBox").all(".selectable").size();

                this.updateAvailableInvite(nbSelectableChoice);

                cb.setAttribute("data-nbChoices", this.choiceList.size());
                cb.setAttribute("data-nbSelectableChoices", nbSelectableChoice);
                cb.toggleClass("hasPendingReplies", pendingReplies.length);
                cb.toggleClass("noFeedbacks", noFeedbacks);
                cb.toggleClass("cbx", cbx);
                cb.toggleClass("horizontal", cbx && questionDescriptor.get("tabular"));
                cb.toggleClass("checkbox", (maxReplies !== 1) || (minReplies !== null && minReplies !== 1));
                cb.toggleClass("showSummary", !maxReplies || maxReplies > 1);
                cb.toggleClass("answerable", answerable);
                cb.toggleClass("maximumReached", maximumReached);

                if (effectiveDisplayResult === "dialogue") {
                    // last feedback
                    var histDom = this.history.get("boundingBox").getDOMNode();
                    histDom.scrollTop = histDom.scrollHeight - histDom.clientHeight;
                }
            } else {
                // clear !
                this.title.set("content", "");
                this.description.set("content", "");
                this.gallery && this.gallery.remove();
                for (var i in this.choices) {
                    this.choices[i].destroy();
                }
                this.choices = {};
                this.resultTitle.set("content", "");

                for (var i in this.results) {
                    this.results[i].destroy();
                }
            }

            this.resync = true;
        },
        isTextEmpty: function(text) {
            return !text || text === "<p></p>";
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
                    label: "Read-Only",
                    type: "scriptcondition"
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
                    label: "Display result"
                }

            },
            availableChoicesInvite: {
                type: "object",
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                visible: function(val, formVal) {
                    return formVal.displayResult === "dialogue";
                },
                view: {
                    type: 'variableselect',
                    label: 'Available chocices invite',
                    classFilter: [
                        "TextDescriptor", "StringDescriptor", // use the value
                        "ListDescriptor" // use the label
                    ]
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
    Wegas.MCQView = MCQView;
});
