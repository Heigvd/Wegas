/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2018  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview add wegas-mcq-selector widget, exposed on Y.Wegas.MCQSelector
 * @author Jarle Hulaas <jarle.hulaas at heig-vd.ch>
 */
/*global YUI*/
YUI.add('wegas-mcq-selector', function(Y) {
    'use strict';
    var CONTENTBOX = "contentBox",
        NO_CORRESPONDENCE = "<i>Aucune question correspondante</i>",   // "<i>No relevant question found</i>",
        INVITE = "<i>Entrer vos mots-clés</i>",   // "<i>Please type in your keywords</i>",
        MESSAGE_FIELD = ".wegas-selector-message",
        MIN_INPUT_LENGTH = 2, // Shorter inputs will be ignored
        WIDGETBOX = ".wegas-selector-widget",
        SELECTORBOX = ".wegas-selector-list",
        DIALOG_CLASS = "DialogueDescriptor",
        QUESTION_CLASS = "QuestionDescriptor",
        DIALOGUE_TRANSITION = "DialogueTransition",
        QUESTION_CHOICE = "SingleResultChoiceDescriptor",
        QUESTION_CHOICE_CONDITIONAL = "ChoiceDescriptor",
        // The widget alternates between the three following states:
        SelectorStates = {
            EDITING : 1,
            PROPOSING : 2,
            SELECTED : 3
        };

    /**
     * @constructor
     * @extends Y.Wegas.Widget
     */
    var MCQSelector = Y.Base.create(
        'wegas-mcq-selector',
        Y.Widget,
        [Y.WidgetChild,
            Y.Wegas.Widget,
            Y.Wegas.Editable],
        {
            CONTENT_TEMPLATE: '<div><div class="wegas-selector-input"><input><button class="yui3-button wegas-selector-submit"></button></div><div class="wegas-selector-message"></div><div class="wegas-selector-block"><ul class="wegas-selector-list"></ul></div><div class="wegas-selector-widget"></div></div>',

            initializer: function () {
                this.handlers = [];
                this.candidates = [];
                this.selectedItem = null;
                this.currentState = SelectorStates.EDITING;
                this.tooltip = null;
                // A sanitized, lowercase copy of the input field:
                this.input = "";
                this.requireValidate = this.get('requireValidate');
                this.showDescription = this.get('showDescription');
                this.attemptsVarName = this.get("numberOfAttempts.evaluated").get("name");
                this.isUpdatingCounter = false;
            },

            // Tells if the given string is only made of letters and numbers
            isAlphanumeric: function(txt)
            {
                var letterNumber = /^[0-9a-zA-Z]+$/;
                return txt.match(letterNumber) != null;
            },

            // Returns 'true' if the given needle (no regex) is found in the given haystack (a string).
            // The needle will then match the beginning of a word (and not start in the middle of it).
            // It will deaccentify the haystack, so that "tete" will match "tête".
            // The needle is expected to be lowercase.
            matches: function (haystack, needle) {
                var index = -1;
                haystack = Y.Wegas.Helper.Diacritics.removeDiacritics(haystack.toLowerCase());
                needle = Y.Wegas.Helper.Diacritics.removeDiacritics(needle);
                for(;;) {
                    index = haystack.indexOf(needle, index + 1);
                    if (index < 0) {
                        return false;
                    }
                    if (index === 0 || (index > 0 && !this.isAlphanumeric(haystack.charAt(index - 1)))) {
                        return true;
                    }
                }
            },

            // Searches for a candidate with the given name and optionalId.
            // Returns null if not found.
            findCandidate: function (name, optionalId) {
                var i, length = this.candidates.length;
                for (i = 0; i < length; i++) {
                    if (this.candidates[i].name === name) {
                        // Allow both strings and numbers as ids:
                        if (optionalId && optionalId != this.candidates[i].this.get("id")) {
                            continue;
                        }
                        return this.candidates[i];
                    }
                }
                return null;
            },

            /*
            ** Scans the dialog/question folder and checks if each item is currently active and answerable
            ** before adding it to the list of candidates.
             */
            scanFolder: function () {
                var items = (this.get("variable.evaluated") ?
                    (this.get("flatten") ?
                        this.get("variable.evaluated").flatten() :
                        this.get("variable.evaluated").get("items")) :
                    []),
                    i,
                    currItem, currType,
                    length = items.length;

                if (length === 0) {
                    this.showMessage("No Dialogs or Questions could not be found inside current folder");
                    return;
                }

                for (i = 0; i < length; i++) {
                    currItem = items[i];
                    currType = currItem.get("@class");

                    if (currType === DIALOG_CLASS) {
                        if (currItem.getInstance().get("enabled")) {
                            var state = currItem.getCurrentState();
                            if (!(state instanceof Y.Wegas.persistence.DialogueState)) {
                                Y.log("State isn't a dialogue state.", 'error', 'MCQSelector');
                                return;
                            }

                            // Call to wegas-statemachine-entities, with async callback invocation.
                            // The standard entitychooser widget might propose dialogs with no fireable transitions.
                            state.getAvailableActions(Y.bind(this.addDialogueTransitions, this));
                        }
                    } else if (currType === QUESTION_CLASS) {
                        if (currItem.getInstance().get("active")) {
                            if (currItem.get("cbx")) {
                                var error = "Unable to handle checkbox-type questions (" +
                                    (currItem.get("editorTag") ? currItem.get("editorTag")+"-" : "") + I18n.t(currItem.get("label")).trim() + ")";
                                Y.log(error, "warn", 'MCQSelector')
                            } else {
                                this.addQuestion(currItem);
                            }
                        }
                    } else {
                        Y.log("Found unknown variable type inside folder : " + currType,
                            'warn', 'MCQSelector');
                        continue;
                    }
                }
            },

            // Perform server-side incrementation of attempts counter
            incrementAttempts: function(){
                if (this.isUpdatingCounter){
                    // Skip too frequent update requests
                    return;
                }
                this.isUpdatingCounter = true;
                Y.Wegas.Facade.Variable.script.remoteEval("Variable.find(gameModel, \"" + this.attemptsVarName + "\").add(self, 1);", {
                    on: {
                        success: Y.bind(function () {
                            this.isUpdatingCounter = false;
                        }, this),
                        failure: Y.bind(function () {
                            this.isUpdatingCounter = false;
                            //throw "Cannot save variable " + nomVariable;
                        }, this)
                    }
                });
            },


            submitKeywords: function() {
                if (this.input.length >= MIN_INPUT_LENGTH) {
                    this.scanFolder();
                    this.get(CONTENTBOX).one(SELECTORBOX).empty();
                    this.updateCandidatesDisplay();
                    this.incrementAttempts();
                }
            },

            syncUI: function () {
                this.candidates = [];
                if (this.input.length < MIN_INPUT_LENGTH) {
                    this.showMessage(INVITE);
                    this.hideCandidates(SelectorStates.EDITING);
                    this.disableSubmitBtn();
                } else {
                    if (this.requireValidate) {
                        this.hideCandidates(SelectorStates.EDITING);
                        this.enableSubmitBtn();
                    } else {
                        // Wait for a typing pause of at least one second before using the search string:
                        if (this.wait) {
                            this.wait.cancel();
                        }
                        this.wait = Y.later(1000, this, function() {
                            this.wait = null;
                            this.submitKeywords();
                        });
                    }
                }
            },

            clearInput: function () {
                this.get(CONTENTBOX).one('input').set("value", "");
                this.input = "";
                if (this.requireValidate) {
                    this.disableSubmitBtn();
                }
            },

            // Incrementally adds candidates to the displayed selection list:
            updateCandidatesDisplay: function () {
                var i, selectorBox,
                    cands = this.candidates;

                selectorBox = this.get(CONTENTBOX).one(SELECTORBOX);

                /**** Display the proposed questions: ****/
                if (cands.length > 0) {
                    for (i = 0; i < cands.length; i++) {
                        var cand = cands[i];
                        if (cand.displayed) {
                            continue;
                        }
                        cand.displayed = true;
                        if (cand.type === QUESTION_CLASS) {
                            selectorBox.append("<li class='wegas-selector-item" +
                                (cand.descr && this.showDescription ? " wegas-mcq-selector-descr" : "") +
                                "' data-name='" + cand.name + "' data-id='" + cand.this.get("id") + "'>" +
                                cand.statement + "</li>");
                        } else if (cand.type === QUESTION_CHOICE || cand.type === QUESTION_CHOICE_CONDITIONAL) {
                            selectorBox.append("<li class='wegas-selector-item" +
                                (cand.descr && this.showDescription ? " wegas-mcq-selector-descr" : "") +
                                "' data-name='" + cand.name +
                                "' data-id='" + cand.this.get("id") + "'>" +
                                cand.statement + "</li>");
                        } else if (cand.type === DIALOG_CLASS) {
                            selectorBox.append("<li class='wegas-selector-item' data-name='" + cand.name + "'>" +
                                cand.statement.replace("<p>", "").replace("</p>", "") + "</li>");
                        } else if (cand.type === DIALOGUE_TRANSITION) {
                            selectorBox.append("<li class='wegas-selector-item' data-name='" + cand.name +
                                "' data-id='" + cand.this.get("id") + "'>" +
                                cand.statement.replace("<p>", "").replace("</p>", "") + "</li>");
                        } else {
                            alert("updateCandidatesDisplay: found unknown cand.type " + cand.type);
                        }
                    }
                    this.showCandidates();
                    this.showMessage("");
                } else {
                    this.showMessage(NO_CORRESPONDENCE);
                    this.hideCandidates(SelectorStates.EDITING);
                }

            },

            // Receives a question that might be answered now.
            // Searches the question and its choices for matching substrings.
            addQuestion: function (question) {
                // This code is extracted from wegas-mcq-view:
                var maxQ = question.get("maxReplies"),
                    cbxType = question.get("cbx"),
                    cQuestion = Y.Wegas.Facade.Variable.cache.find("id", question.get("id")),
                    questionInstance = cQuestion.getInstance(),
                    allReplies = questionInstance.get("replies"),
                    totalNumberOfReplies = allReplies.length,
                    maximumReached = maxQ && totalNumberOfReplies >= maxQ,
                    qAnswerable = (cbxType ? !questionInstance.get('validated') : !maximumReached);
                if (!qAnswerable) {
                    return;
                }

                var label = I18n.t(question.get("label")).trim(),
                    descr = I18n.t(question.get("description")).trim();
                if ((label.length !== 0 && this.matches(label, this.input)) ||
                    (descr.length !== 0 && this.matches(descr, this.input))) {

                    this.candidates.push({
                        displayed: false,
                        question: question,
                        this: question,
                        type: question.get("@class"),
                        name: question.get("name"),
                        statement: label,
                        descr: descr
                    });

                } else if (label.length + descr.length === 0) {
                    // Search for matching choices, which are currently answerable:
                    var choices = cQuestion.get("items"),
                        choiceD, choiceI, choiceID, maxC, choiceReplies, cAnswerable, i;
                    for (i = 0; i < choices.length; i += 1) {
                        choiceD = choices[i];
                        choiceI = choiceD.getInstance();
                        choiceID = choiceD.get("id");
                        if (choiceI.get("active")) {
                            maxC = choiceD.get("maxReplies");
                            choiceReplies = choiceI.get("replies");
                            cAnswerable = qAnswerable && (!maxC || maxC > choiceReplies.length);
                            if (cAnswerable) {
                                label = I18n.t(choiceD.get("label")).trim();
                                descr = I18n.t(choiceD.get("description")).trim();
                                if ((label.length !== 0 && this.matches(label, this.input)) ||
                                    (descr.length !== 0 && this.matches(descr, this.input))) {
                                    this.candidates.push({
                                        displayed: false,
                                        question: question,
                                        this: choiceD,
                                        type: choiceD.get("@class"),
                                        name: question.get("name"),
                                        statement: label,
                                        descr: descr
                                    });
                                }
                            }
                        }
                    }
                } else {
                    return;
                }
            },

            // Callback receiving new dialog transitions that can be triggered now.
            // Searches the current state and its transitions for matching substrings.
            addDialogueTransitions: function (availableActions) {

                function exists(currItem) {
                    return currItem.dialog === this; // 'this' is the dialog we are looking for
                }

                var currAction, dialog, i, state, stateText, actionText;
                if (availableActions.length) {
                    for (i = 0; i < availableActions.length; i++) {
                        currAction = availableActions[i];
                        dialog = Y.Wegas.Facade.Variable.cache.findById(currAction.get("stateMachineId"));
                        state = dialog.getCurrentState();
                        stateText = I18n.t(state.get("text")).trim();

                        if (stateText.length > 0 && this.matches(stateText, this.input)) {
                            if (!this.candidates.find(exists, dialog)) {
                                this.candidates.push({
                                    displayed: false,
                                    dialog: dialog,
                                    this: dialog,
                                    type: dialog.get("@class"),
                                    name: dialog.get("name"),
                                    statement: stateText
                                });
                            }
                        } else if (stateText.length === 0 && this.matches(actionText = I18n.t(currAction.get("actionText")), this.input)) {
                            this.candidates.push({
                                displayed: false,
                                dialog: dialog,
                                this: currAction,
                                type: currAction.get("@class"),
                                name: dialog.get("name"),
                                statement: actionText
                            });
                        }
                    }
                    // Required, since we are asynchronous here:
                    this.updateCandidatesDisplay();
                }
            },

            // This is adapted from wegas-entitychooser :
            genWidget: function(target) {
                var cfg = {},
                    ctx = this;
                if (target.type === QUESTION_CLASS ||
                    target.type === QUESTION_CHOICE ||
                    target.type === QUESTION_CHOICE_CONDITIONAL) {
                    cfg.type = "MCQDialogView";
                    ctx.set("widgetAttr", "variable");
                    cfg.generatedBySelector = true;
                    cfg.validateChoiceFromSelector = true;
                    cfg.showDescription = this.showDescription;
                } else if (target.type === "SimpleDialogue" ||
                    target.type === "DialogueDescriptor" ||
                    target.type === DIALOGUE_TRANSITION) {
                    cfg.type = "SimpleDialogue";
                    ctx.set("widgetAttr", "dialogueVariable");
                } else {
                    alert("genWidget: unknown type " + target.type);
                }
                Y.Wegas.Editable.use(cfg, function (Y) {
                    ctx.widget && ctx.widget.destroy();
                    cfg[ctx.get("widgetAttr")] = {
                        name: target.name
                    };
                    Y.Wegas.use(cfg, Y.bind(function () {
                        this.widget = Y.Wegas.Widget.create(cfg);
                        if (target.type === QUESTION_CHOICE ||
                            target.type === QUESTION_CHOICE_CONDITIONAL) {
                            // Here we submit the choice before rendering the question widget. Is this really safe?
                            this.widget.doValidate(target.this.get("id"));
                        }
                        this.widget.render(this.get(CONTENTBOX).one(WIDGETBOX));
                    }, ctx));
                });
            },

            selectCandidate: function (target) {
                var targetName = target.getData("name"),
                    targetId = target.getData("id");
                if (!targetName) {
                    // We may have to step out of any <p> tags surrounding the question:
                    target = target.get("parentNode");
                    targetName = target.getData("name");
                }
                // Get selectedItem from candidates list before the list gets emptied in hideCandidates() :
                this.selectedItem = this.findCandidate(targetName, targetId);
                var onSelectSuccess = function () {
                        this.hideCandidates(SelectorStates.SELECTED);
                        this.clearInput();
                        this.genWidget(this.selectedItem);
                    },
                    onSelectFailure = function () {
                        alert("Internal error, please try again.");
                        this.hideCandidates(SelectorStates.SELECTED);
                        this.clearInput();
                        this.genWidget(this.selectedItem);
                    };
                if (this.selectedItem.type === DIALOGUE_TRANSITION) {
                    this.selectedItem.dialog.doTransition(this.selectedItem.this, {
                        success: Y.bind(onSelectSuccess, this),
                        failure: Y.bind(onSelectFailure, this)
                    });
                } else {
                    Y.bind(onSelectSuccess, this)();
                }
            },

            showCandidates: function () {
                this.get(CONTENTBOX).one(WIDGETBOX).hide();
                this.get(CONTENTBOX).one(SELECTORBOX).show();
                this.currentState = SelectorStates.PROPOSING;
            },

            hideCandidates: function (nextState) {
                var selectorBox = this.get(CONTENTBOX).one(SELECTORBOX);
                selectorBox.hide();
                selectorBox.empty();
                this.currentState = nextState; // Either EDITING or SELECTED
                if (nextState === SelectorStates.SELECTED) {
                    this.get(CONTENTBOX).one(WIDGETBOX).show();
                }
                this.candidates = [];
            },

            getInput: function () {
                return this.input;
            },

            keyUp: function (e) {
                var input = this.get(CONTENTBOX).one('input'),
                    value = input.get('value'),
                    // Allow dashes (-) compound names:
                    sanitized = value.replace(/[`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi, '');
                if (value !== sanitized) {
                    input.set("value", sanitized);
                }
                // Lowercase and remove accents:
                this.input = sanitized.toLowerCase();
                this.currentState = SelectorStates.EDITING;
                this.get(CONTENTBOX).one(WIDGETBOX).hide();
                this.syncUI();
            },

            enableSubmitBtn: function() {
                var button = this.get(CONTENTBOX).one('button');
                if (this.requireValidate && button) {
                    button.removeAttribute("disabled");
                }
            },

            disableSubmitBtn: function() {
                var button = this.get(CONTENTBOX).one('button');
                if (this.requireValidate && button) {
                    button.setAttribute("disabled", "disabled");
                }
            },

            stripTags: function (str) {
                if ((str === null) || (str === ""))
                    return "";
                else
                    str = str.toString();
                return str.replace(/<[^>]*>/g, "");
            },

            showMessage: function(msg) {
                this.get(CONTENTBOX).one(MESSAGE_FIELD).setHTML(msg);
            },

            testEnter: function(event) {
                if (event.key === "Enter") {
                    this.submitKeywords();
                }
            },

            bindUI: function() {
                var cb = this.get(CONTENTBOX),
                    ctx = this;
                cb.delegate("click", function(e) {
                    this.tooltip && this.tooltip.hide();
                    this.selectCandidate(e.target);
                }, ".wegas-selector-list .wegas-selector-item", this);

                var input = cb.one('input');
                if (input) {
                    this.handlers.push(
                        input.on('valuechange', this.keyUp, this)
                    );
                    // Detect "enter" key as equivalent to a submission of keywords:
                   input.getDOMNode().addEventListener("keyup", Y.bind(this.testEnter, ctx));
                }

                // Optional "submit" button for the input box:
                this.get(CONTENTBOX).delegate("click", function(e) {
                    this.submitKeywords();
                }, ".wegas-selector-input button.yui3-button", this);

                // Display tooltip with description of proposed question or choice.
                // This must work for items in the selection menu and for questions generated by wegas-mcq-dialogview.
                this.tooltip.on("triggerEnter", function(e) {
                    var targetId = e.node.getData("id"),
                        choiceD = Y.Wegas.Facade.Variable.cache.find("id", targetId),
                        descr = choiceD && I18n.t(choiceD.get("description"));
                    if (descr && descr.length !== 0) {
                        this.tooltip.setTriggerContent(descr);
                    } else {
                        this.tooltip.setTriggerContent(null);
                    }
                }, this);

            },

            renderUI: function() {
                if (!this.tooltip) {
                    // This must also work for questions generated by wegas-mcq-dialogview:
                    this.tooltip = new Y.Wegas.Tooltip({
                        delegate: this.get(CONTENTBOX),
                        delegateSelect: ".wegas-mcq-selector-descr",
                        render: true,
                        showDelay: 100,
                        autoHideDelay: 5000
                    });
                    this.tooltip.plug(Y.Plugin.Injector);
                }

                var button = this.get(CONTENTBOX).one('button');
                if (this.requireValidate) {
                    button.insert(Y.Wegas.I18n.t('mcq.submit'));
                } else {
                    button.hide();
                }

            },

            destructor: function() {
                Y.Array.each(this.handlers, function(h) {
                    h.detach();
                });
                var input = this.get(CONTENTBOX).one('input');
                if (input) {
                    input.getDOMNode().removeEventListener("keyup", this.testEnter);
                }
                this.tooltip.destroy();
            },
        },
        {
            EDITORNAME: 'Dialogue Selector',
            ATTRS: {
                widget: {
                    transient: true,
                    valueFn: function() {
                        return {
                            type: 'SimpleDialogue'
                        };
                    }
                },
                numberOfAttempts: {
                    type: 'object',
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: "variableselect",
                        label: "Attempts counter",
                        classFilter: ["NumberDescriptor"]
                    }
                },
                widgetAttr: {
                    value: "dialogueVariable",
                    type: "string",
                    transient: true,
                    view: { label: "Widget Attribute" }
                },
                classFilter: {
                    transient: true,
                    value: ['DialogueDescriptor']
                },
                variable: {
                    type: 'object',
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: "variableselect",
                        label: "Folder",
                        classFilter: ["ListDescriptor"]
                    }
                },
                requireValidate: {
                    type: 'boolean',
                    value: false,
                    view: {
                        label: "Require user to validate her input"
                    }
                },
                showDescription: {
                    type: 'boolean',
                    value: false,
                    view: {
                        label: "Show question/choice descriptions as tooltips"
                    }
                }
            }
        }
    );
    Y.Wegas.MCQSelector = MCQSelector;
});
