/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
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
        WhView,
        MCQView;


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
                container, label, title;

            this.destroyAll();

            this.readonly = whQuestionInstance.get("validated");

            this.qList = new Y.Wegas.List({
                cssClass: "wegas-whview__left"
            });

            title = whQuestion.get("title") || whQuestion.get("label");

            this.qTitle = new Y.Wegas.Text({
                cssClass: "wegas-whview__title",
                content: title
            });
            this.qText = new Y.Wegas.Text({
                cssClass: "wegas-whview__question wegas-light-picture",
                content: whQuestion.get("description")
            });

            this.qList.add(this.qTitle);
            this.qList.add(this.qText);


            this.mainList = new Y.Wegas.List({
                cssClass: "wegas-whview__main-list",
                direction: "vertical",
                editable: false
            });

            this.hList = new Y.Wegas.List({
                cssClass: "wegas-whview__main",
                direction: "vertical"
            });

            this.hList.add(this.qList);

            this.mainList.add(this.hList);
            this.add(this.mainList);

            this._locks = {};
            this._values = {};

            this.aList = new Y.Wegas.List({
                cssClass: "wegas-whview__answers"
            });
            this.answersContainer = {};


            answers = whQuestion.get("items");

            for (i in answers) {
                if (answers.hasOwnProperty(i)) {
                    child = answers[i];
                    name = child.get("name");

                    this._values[name] = child.getValue();

                    classes = "wegas-whview__answers__input-answer input-" + name;

                    container = new Y.Wegas.List({
                        classes: "wegas-whview__answers__input-container container-" + name,
                        direction: "horizontal"
                    });

                    label = child.get("title") || child.get("label");

                    switch (child.get("@class")) {
                        case "NumberDescriptor":
                            if (Y.Lang.isNumber(child.get("minValue")) && Y.Lang.isNumber(child.get("maxValue"))
                                && (child.get("maxValue") - child.get("minValue") < 15)) {

                                container.add(new Y.Wegas.BoxesNumberInput({
                                    label: label,
                                    cssClass: classes,
                                    variable: {name: name},
                                    selfSaving: false,
                                    readonly: {
                                        "content": "return " + this.readonly + ";"
                                    }
                                }));
                            } else {
                                container.add(new Y.Wegas.NumberInput({
                                    label: label,
                                    cssClass: classes,
                                    variable: {name: name},
                                    selfSaving: false,
                                    readonly: {
                                        "content": "return " + this.readonly + ";"
                                    }}));
                            }
                            break;
                        case "StringDescriptor":
                            container.add(new Y.Wegas.StringInput({
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
                            }));
                            break;
                        case "TextDescriptor":
                            // maxChars = undefined;
                            // maxWords = undefined;
                            // countBlank = false;
                            container.add(new Y.Wegas.TextInput({
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
                            }));
                            break;
                    }
                    this.answersContainer[name] = container;
                    this.aList.add(container);
                }
            }

            this.hList.add(this.aList);

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
        },
        bindUI: function() {
            this.handlers.onInstanceUpdate = Y.Wegas.Facade.Instance.after('updatedInstance',
                function(e) {
                    var question = this.get('variable.evaluated');
                    if (question &&
                        question.getInstance().get('id') === e.entity.get('id')) {
                        this.renderUI();
                    }
                }, this);

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
                this.showOverlay();
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
                            this.hideOverlay();
                            /*if (this.__hackParent) {
                             Y.later(500, this.__hackParent, this.__hackParent.selectNextUnread);
                             }*/
                        }, this),
                        failure: Y.bind(function() {
                            this.hideOverlay();
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
            this.after("disabledChange", this.syncUI, this);
            this.plugLockable();
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
        /**
         * @function
         * @private
         * @description Render the TabView widget in the content box.
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            //cb.addClass("wegas-mcqtabview"); //@TODO : it's own stylesheet. Remove this and correct Loader
            cb.append("<div style='clear:both'></div>");
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
            this.handlers.push(Y.Wegas.Facade.Instance.after("updatedInstance", function(e) {
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
            this.get(CONTENTBOX).delegate("click", function(e) {

                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    var minQ, maxQ;
                    this.beforeRequest();
                    // Determine if the submit concerns a question or a choice:
                    // If it's a question then call validateQuestion() else call selectAndValidateChoice()
                    var receiver = Wegas.Facade.Variable.cache.findById(e.target.get('id'));
                    if (receiver instanceof Wegas.persistence.QuestionDescriptor) {
                        var instance = receiver.getInstance();
                        // Prevent validation of questions with too few replies
                        if (receiver.get("cbx")) {
                            if (Y.Lang.isNumber(receiver.get("minReplies"))) {
                                minQ = receiver.get("minReplies");
                            } else {
                                minQ = 1;
                            }
                            if (instance.get("replies").length < minQ) {
                                this.onFailure();
                                if (minQ === 1) {
                                    Wegas.Alerts.showMessage("warn", Y.Wegas.I18n.t('mcq.noReply'));
                                } else {
                                    Wegas.Alerts.showMessage("warn", Y.Wegas.I18n.t('mcq.notEnoughReply', {min: minQ}));
                                }
                                return;
                            }
                        }
                        this.dataSource.sendRequest({
                            request: "/QuestionDescriptor/ValidateQuestion/" + instance.get('id')
                                + "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
                            cfg: {
                                method: "POST"
                            },
                            on: {
                                success: Y.bind(this.onSuccess, this),
                                failure: Y.bind(this.onFailure, this)
                            }
                        });
                    } else { // The user is validating a choice:

                        this.dataSource.sendRequest({
                            request: "/QuestionDescriptor/SelectAndValidateChoice/" + e.target.get('id') + "/Player/" +
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
                }, this));
            }, "button.yui3-button", this);
            this.get(CONTENTBOX).delegate("click", function(e) {

                Wegas.Panel.confirmPlayerAction(Y.bind(function() {
                    this.beforeRequest();
                    if (e.target.get('checked')) {
                        this.dataSource.sendRequest({
                            request: "/QuestionDescriptor/SelectChoice/" + e.target.get('id')
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
                    } else {
                        var choiceID = +e.target.get('id');
                        // e.target.get('name') = scriptAlias of question => questionInstance.get("replies") => CancelReply()
                        var question = Wegas.Facade.Variable.cache.find('name', e.target.get('name'));
                        var replies = question.getInstance().get('replies'),
                            numberOfReplies = replies.length, i;
                        for (i = numberOfReplies - 1; i >= 0; i -= 1) {
                            if (replies[i].getChoiceDescriptor().get("id") === choiceID) {
                                this.dataSource.sendRequest({
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
                        }
                    }
                }, this));
            }, "input.mcq-checkbox", this);
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
            if (this.get("destroyed"))
                return;
            this.genMarkup(question);
            if (question.get("pictures").length > 0) {
                this.gallery = new Wegas.util.FileLibraryGallery({
                    selectedHeight: 150,
                    selectedWidth: 235,
                    gallery: Y.clone(question.get("pictures"))
                }).render(this.get(CONTENTBOX).one(".description"));
            }
            /*
             this.dataSource.cache.getWithView(question, "Extended", {// Retrieve the question/choice description from the server
             on: {
             success: Y.bind(function(e) {
             if (this.get("destroyed"))
             return;
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
             });*/
        },
        genMarkup: function(question) {
            var i, ret,
                readonly = this.get("readonly.evaluated"),
                minQ = question.get("minReplies"),
                maxQ = question.get("maxReplies"),
                maxC,
                description,
                checkbox = (maxQ !== 1) || (minQ !== null && minQ !== 1),
                cbxType = question.get("cbx"),
                cQuestion = this.dataSource.cache.find("id", question.get("id")),
                choices = cQuestion.get("items"), choiceD, choiceI, choiceID,
                questionInstance = cQuestion.getInstance(),
                questionScriptAlias = cQuestion.get("name"),
                allReplies = questionInstance.get("replies"),
                choiceReplies,
                totalNumberOfReplies = allReplies.length,
                maximumReached = maxQ && totalNumberOfReplies >= maxQ,
                qAnswerable = (cbxType ? !questionInstance.get('validated') : !maximumReached),
                cAnswerable,
                tabularMCQ = cbxType && question.get("tabular"),
                checked, reply, title, currDescr, isChosenReply;
            Y.log("RENDER TAB");
            ret = ['<div class="mcq-question">',
                '<div class="mcq-question-details">',
                '<div class="mcq-question-title">', question.get("title") || question.get("label") || "undefined", '</div>',
                '<div class="mcq-question-description">', question.get("description"), '</div>',
                '</div>'];
            // Display choices

            if (this.get("disabled")) {
                qAnswerable = false;
            }

            if (cbxType) {
                // 
                if (tabularMCQ) {
                    // First find how many choices are active and if there is any description field to be displayed:
                    var hasDescription = false;
                    var nbActiveChoices = 0;
                    for (i = 0; i < choices.length; i += 1) {
                        if (choices[i].getInstance().get("active")) {
                            nbActiveChoices++;
                            description = question.get("items")[i].get("description");

                            if (description && description.length !== 0) {
                                hasDescription = true;
                            }
                        }
                    }
                    ret.push('<div class="mcq-choices-horizontal">');
                    ret.push('<div class="mcq-choice-horizontal">');
                    var cellWidth = (nbActiveChoices !== 0 ? Math.floor(100 / nbActiveChoices) : 100);
                    for (i = 0; i < choices.length; i += 1) {
                        choiceD = choices[i];
                        choiceI = choiceD.getInstance();
                        choiceID = choiceD.get("id");
                        if (choiceI.get("active")) {
                            checked = this.getNumberOfReplies(questionInstance, choiceD) > 0;
                            ret.push('<div class="mcq-choice', (qAnswerable || checked ? '' : ' spurned'), '" style="width:', cellWidth, '% !important">');
                            title = (choiceD.get("title").trim() !== '') ? choiceD.get("title") : "&nbsp;";
                            ret.push('<div class="mcq-choice-name" style="text-align:center"><label for="', choiceID, '">', title, '</label></div>');
                            currDescr = '';
                            if (hasDescription) {
                                currDescr = question.get("items")[i].get("description");
                                if (currDescr.length === 0)
                                    currDescr = "&nbsp;";
                            }
                            ret.push('<div class="mcq-choice-description" style="text-align:center"><label for="', choiceID, '">', currDescr, '</label></div>');
                            cAnswerable = qAnswerable && (!checkbox || !maximumReached || checked);

                            ret.push('<input class="mcq-checkbox"', (checkbox ? ' type="checkbox"' : ' type="radio"'),
                                ((checkbox && qAnswerable && maximumReached && !checked) ? ' title="' + I18n.t('mcq.maximumReached', {max: maxQ}) + '"' : ''),
                                (checked ? ' checked' : ''), (cAnswerable ? '' : ' disabled style="cursor:default"'), ' id="', choiceID, '" name="', questionScriptAlias, '">');
                            ret.push('</div>'); // end mcq-choice
                        }
                    }
                    ret.push('</div>'); // end row mcq-choice-horizontal

                    ret.push('<div class="mcq-last-horizontal">');
                    // Generate empty cells since colspan is not available in CSS tables:
                    for (i = 0; i < nbActiveChoices - 1; i += 1) {
                        ret.push('<div class="mcq-choices-horizontal-finalsubmit">&nbsp;</div>');
                    }
                    ret.push('<div class="mcq-choices-horizontal-finalsubmit">');
                    ret.push('<button class="yui3-button"', (qAnswerable && !readonly ? '' : ' disabled'), ' id="', cQuestion.get("id"), '">', Y.Wegas.I18n.t('mcq.submit'), '</button>');
                    ret.push('</div>'); // end mcq-choices-horizontal-finalsubmit
                    ret.push('</div>'); // end mcq-last-horizontal
                    ret.push('</div>'); // end mcq-choices-horizontal

                } else { // Vertical presentation of checkbox choices:

                    ret.push('<div class="mcq-choices-vertical">');
                    for (i = 0; i < choices.length; i += 1) {
                        choiceD = choices[i];
                        choiceI = choiceD.getInstance();
                        choiceID = choiceD.get("id");
                        currDescr = question.get("items")[i].get("description") || '';
                        if (choiceI.get("active")) {
                            ret.push('<div class="mcq-choice-vertical">');
                            checked = this.getNumberOfReplies(questionInstance, choiceD) > 0;
                            ret.push('<div class="mcq-choice', (qAnswerable || checked ? '' : ' spurned'), '">');
                            title = (choiceD.get("title").trim() !== '') ? choiceD.get("title") : "&nbsp;";
                            ret.push('<div class="mcq-choice-name"><label for="', choiceID, '">', title, '</label></div>');
                            if (currDescr !== '') {
                                ret.push('<div class="mcq-choice-description"><label for="', choiceID, '">', currDescr, '</label></div>');
                            }
                            ret.push('</div>'); // end cell mcq-choice
                            ret.push('<div class="mcq-choices-vertical-checkbox', (qAnswerable || checked) ? '' : ' spurned', (currDescr === '' ? ' nodescr' : ''), '">');
                            if (currDescr !== '') {
                                ret.push('<div class="mcq-choice-name" style="padding:0">&nbsp;</div>'); // Finish line with same style
                            }
                            ret.push('<div class="mcq-checkbox-container">');
                            cAnswerable = qAnswerable && (!checkbox || !maximumReached || checked);
                            ret.push('<input class="mcq-checkbox"', (checkbox ? ' type="checkbox"' : ' type="radio"'),
                                ((checkbox && qAnswerable && maximumReached && !checked) ? ' title="' + I18n.t('mcq.maximumReached', {max: maxQ}) + '"' : ''),
                                (checked ? ' checked' : ''), (cAnswerable ? '' : ' disabled style="cursor:default"'),
                                ' id="', choiceID, '" name="', questionScriptAlias, '">');
                            ret.push('</div>'); // end div mcq-checkbox-container
                            ret.push('</div>'); // end cell mcq-choices-vertical-checkbox
                            ret.push('</div>'); // end row mcq-choice-vertical
                        }
                    }
                    // Row with global submit button:
                    ret.push('</div>'); // end mcq-choices-vertical

                    ret.push('<div class="mcq-finalsubmit">');
                    //ret.push('<div class="mcq-last-vertical">');
                    //ret.push('<div class="mcq-choice">&nbsp;</div>');
                    //ret.push('<div class="mcq-choices-vertical-finalsubmit">');
                    ret.push('<button class="yui3-button"', (qAnswerable && !readonly ? '' : ' disabled'), ' id="', cQuestion.get("id"), '" style="font-weight:bold">', Y.Wegas.I18n.t('mcq.submit'), '</button>');
                    //ret.push('</div>'); // end cell with submit button
                    //ret.push('</div>'); // end table-row
                    ret.push('</div>'); // end mcq-finalsubmit
                }
            } else { // Not checkbox-type:

                ret.push('<div class="mcq-choices">');
                for (i = 0; i < choices.length; i += 1) {
                    choiceD = choices[i];
                    choiceI = choiceD.getInstance();
                    choiceID = choiceD.get("id");
                    currDescr = question.get("items")[i].get("description") || "";

                    maxC = choiceD.get("maxReplies");
                    choiceReplies = choiceI.get("replies");
                    cAnswerable = qAnswerable && (!maxC || maxC > choiceReplies.length);

                    isChosenReply = choiceReplies.length > 0;
                    if (choiceI.get("active")) {
                        var noTitle = (choiceD.get("title").trim() == '');
                        var noDescr = (currDescr.trim() == '');

                        ret.push('<div class="mcq-choice-vertical', (noTitle && noDescr ? ' nohover' : ''), '">');
                        ret.push('<div class="mcq-choice', (cAnswerable || isChosenReply) ? (noTitle && noDescr ? ' notitle' : '') : ' spurned', '">');
                        title = noTitle ? "&nbsp;" : choiceD.get("title");
                        ret.push('<div class="mcq-choice-name', (noTitle && noDescr ? ' notitle' : (!noTitle && !noDescr ? ' colspan' : '')), '">', title, '</div>');

                        if (!noDescr) {
                            ret.push('<div class="mcq-choice-description">', currDescr, '</div>');
                        }

                        ret.push('</div>'); // end cell mcq-choice
                        ret.push('<div class="mcq-choices-vertical-submit',
                            (cAnswerable || isChosenReply) ? '' : ' spurned',
                            (noTitle ? ' notitle' : ''),
                            (noDescr ? ' nodescr' : ''),
                            (!noTitle && !noDescr ? ' colspan' : ''), '">');

                        if (!noDescr) {  // Previous width of this div: 115px (if allowMultiple) and else 95px
                            ret.push('<div class="mcq-choice-name" style="padding:0; width:100%">&nbsp;</div>'); // Finish line with same style as below
                        }

                        ret.push('<div class="mcq-checkbox-container">');
                        ret.push('<button class="yui3-button"', (cAnswerable && !readonly ? '' : ' disabled'), ' id="', choiceID, '">', Y.Wegas.I18n.t('mcq.submit'), '</button>');
                        if (!maxQ || maxQ > 1) {
                            ret.push('<span class="numberOfReplies">',
                                this.getNumberOfReplies(questionInstance, choiceD),
                                '<span class="symbole">x</span></span>');
                        }
                        ret.push('</div>'); // end div mcq-checkbox-container
                        ret.push('</div>'); // end cell mcq-choices-vertical-checkbox
                        ret.push('</div>'); // end table-row mcq-choice-vertical
                    }
                }
                ret.push('</div>'); // end mcq-choices
            }
            /*
             * Display results section:
             */
            if (!cbxType) {
                if (totalNumberOfReplies > 0) {
                    ret.push('<div class="mcq-replies-section">');
                    ret.push('<div class="mcq-replies-title">', (totalNumberOfReplies > 1 ? Y.Wegas.I18n.t('mcq.result').pluralize().capitalize() : Y.Wegas.I18n.t('mcq.result').capitalize()), '</div>');
                    ret.push('<div class="mcq-replies">');
                    for (i = totalNumberOfReplies - 1; i >= 0; i -= 1) {
                        reply = allReplies[i];
                        choiceD = reply.getChoiceDescriptor();
                        ret.push('<div class="mcq-reply" data-choice-id="', choiceD.get("id"), '">');
                        ret.push('<div class="mcq-reply-title">', choiceD.get("title"), '</div>');
                        ret.push('<div class="mcq-reply-content">', reply.get("answer"), '</div>');
                        ret.push('</div>'); // end mcq-reply
                    }
                    ret.push('</div>'); // end mcq-replies
                    ret.push('</div>'); // end mcq-replies-section
                }
            } else {
                // It's a CBX-type question:
                if (questionInstance.get("validated")) {

                    /*
                     * Step one -> group all reply to display in repliesToDisplay
                     * Each item contains its choiceDescriptor and the answer to display.
                     * The answer to display is either the normal answer or the ignorationAnswer,
                     * according to the reply "ignored" attribute.
                     *
                     * Does not includes ignored replies with no ignorationAnswet
                     *
                     */
                    var j, repliesToDisplay = [],
                        toDisplay,
                        cReplies;

                    // go throug each choice
                    for (i = 0; i < choices.length; i += 1) {
                        choiceD = choices[i];
                        choiceI = choiceD.getInstance();

                        cReplies = choiceI.get("replies");

                        // skip inactive choices or choices without replie
                        if (choiceI.get("active") && cReplies && cReplies.length > 0) {
                            reply = cReplies[0];

                            // select the correct text to display
                            if (!reply.get("ignored")) {
                                toDisplay = reply.get("answer");
                            } else {
                                toDisplay = reply.get("ignorationAnswer");

                                // skip ignored reply without text
                                if (!toDisplay || !toDisplay.replace(/(\r\n|\n|\r)/gm, "").trim()) {
                                    continue;
                                }
                            }

                            repliesToDisplay.push({
                                choiceDescriptor: choiceD,
                                answerText: toDisplay
                            });
                        }
                    }

                    /**
                     * Step two : build markup
                     */
                    ret.push('<div class="mcq-replies-section">');
                    ret.push('<div class="mcq-replies-title">', (repliesToDisplay.length > 1 ? Y.Wegas.I18n.t('mcq.result').pluralize() : Y.Wegas.I18n.t('mcq.result')), '</div>');
                    ret.push('<div class="mcq-replies">');
                    for (j in repliesToDisplay) {
                        reply = repliesToDisplay[j];
                        choiceD = reply.choiceDescriptor;
                        toDisplay = reply.answerText;

                        ret.push('<div class="mcq-reply" data-choice-id="', choiceD.get("id"), '" style="font-style:normal; color:inherit">');
                        ret.push('<div class="mcq-reply-title">', choiceD.get("title"), '</div>');
                        ret.push('<div class="mcq-reply-content">', toDisplay, '</div>');
                        ret.push('</div>'); // end mcq-reply
                    }

                    ret.push('</div>'); // end mcq-replies
                    ret.push('</div>'); // end mcq-replies-section
                }
            }
            ret.push('</div>'); // end mcq-question

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
            Y.log("Destroy MCQ-VIEW");
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
