/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Jarle Hulaas
 */
YUI.add("wegas-survey-widgets", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", WIDGET = "widget", PAGEID = "pageId",
        Wegas = Y.Wegas,
        BUTTON = "wegas-survey-button",
        SurveyWidget, SurveyOrchestrator,
        SurveyNumberInput, SurveyTextInput, SurveyChoicesInput,
        SLIDER_MAX = 100,
        SLIDER_DEFAULT_POS = SLIDER_MAX/2,
        NUMERIC_SCALE_WIDTH = "200px",
        SURVEY_STATUS = {
            EMPTY: 0,       // An empty survey is not displayable
            INACTIVE: 1,    // Blocked by the scenario
            ONGOING: 2,     // The survey widget is instantiated (and displayed)
            ALL_REPLIED: 3, // The survey has been fully replied, but not yet validated
            COMPLETED: 4    // The survey has been fully replied and validated
        },
        SURVEY_DISPLAY = {
            SURVEY_HEAD: 0, // Display initial description
            SECTION_HEAD: 1,// In one section/page mode, also includes all inputs of the section
            INPUT: 2,       // Display one input (in one input/page mode)
            COMPLETED: 3    // Survey validated, display final text (acknowledgements)
        },
        // In increasing order of progress, status received from server-side script wegas-survey-helper:
        ORCHESTRATION_PROGRESS = {
            NOT_STARTED: "NOT_STARTED",
            REQUESTED: "REQUESTED",
            ONGOING: "ONGOING",
            COMPLETED: "COMPLETED",
            CLOSED: "CLOSED"
        };


    // Code for testing logging to xAPI server:
    var xAPI = (function() {
        function testXapi() {
            var script = 'surveyXapi.testLib();';
            Y.Wegas.Facade.Variable.script.remoteEval(
                script,
                {
                    on: {
                        success: function(e) {
                            Y.log("xAPI library is visible");
                        },
                        failure: function(e) {
                            Y.Wegas.Panel.alert("For logging with xAPI,<br>please include server script in game settings: \"wegas-app/js/server/\"");
                        }
                    }
                }
            );
        }
        return {
            testXapi: testXapi
        };
    })();


    function displayInputLabel(desc, labelField, text) {
        labelField.setContent(text);
        if (desc.get("isCompulsory")) {
            labelField.addClass("wegas-compulsory-input");
            labelField.setAttribute('data-optionalornot', I18n.t('survey.global.replyCompulsory'));
        } else {
            labelField.addClass("wegas-optional-input");
            labelField.setAttribute('data-optionalornot', I18n.t('survey.global.replyOptional'));
        }
    }

    /**
     * @name Y.Wegas.SurveyWidget
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class
     * @constructor
     * @description Is used to display a specific survey.
     */
    SurveyWidget = Y.Base.create("wegas-survey-widget", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>"
            + "  <div class=\"title\"></div>"
            + "  <div class=\"description\"></div>"
            + "  <div class=\"section\">"
            + "    <div class=\"section-useful-contents\">"
            + "      <div class=\"progress-bar-background\"><div class=\"progress-bar\"></div><span class=\"progress-value\">0%</span></div>"
            + "      <div class=\"section-header\">"
            + "        <div class=\"section-title-bar\"><span class=\"section-title\"></span><span class=\"section-progress\"></span><span class=\"save-status\"></span></div>"
            + "        <div class=\"section-description\"></div>"
            + "      </div>"
            + "      <div class=\"content wegas-template-content\"></div>"
            + "    </div>"
            + "    <div class=\"navigation-buttons\">"
            + "      <div class=\"back\"></div><div class=\"next\"></div><div class=\"validate\"></div><div class=\"close\"></div>"
            + "    </div>"
            + "  </div>"
            + "</div>",
        initializer: function() {
            this.handlers = {};
            this.childWidgets = [];
            xAPI.testXapi();
        },
        /**
         * Scans the given survey and builds these global structures:
         * - this.activeSections[i].activeInputs[j]
         * - this.inputCache[i]
         * 
         * Updates these attributes:
         * - this.surveyStatus: started/validated/etc.
         * - this.surveyDisplay: survey-head/section-head/input/etc.
         * - this.currentInputId: points to the first unreplied input
         * 
         * @returns {undefined}
         */
        initStructure: function() {
            this.survey = this.get("survey.evaluated");
            if (!this.survey) {
                this.surveyStatus = SURVEY_STATUS.EMPTY;
                return;
            }
            this.title = I18n.t(this.survey.get("label"));
            this.surveyInstance = this.survey.getInstance();
            if (!this.surveyInstance.get("active")) {
                this.surveyStatus = SURVEY_STATUS.INACTIVE;
                return;
            }
            
            this.oneQuestionPerPage = this.get("oneQuestionPerPage");
            this.currentInputId = null;
            this.monolithicLayout = false;
            this.inputCache = {};

            var surveyStatus = this.surveyInstance.get("status");
            if (surveyStatus === ORCHESTRATION_PROGRESS.COMPLETED ||
                surveyStatus === ORCHESTRATION_PROGRESS.CLOSED) {
                this.surveyStatus = SURVEY_STATUS.COMPLETED;
                this.surveyDisplay = SURVEY_DISPLAY.COMPLETED;
                return;
            } else {
                this.surveyStatus = SURVEY_STATUS.ONGOING;
                // This is the normal case, in case of page reload, it may be adjusted below:
                this.surveyDisplay = SURVEY_DISPLAY.SURVEY_HEAD;
            }

            var activeSections = this.survey.get("items"),
                nbReplied = 0,
                nbUnreplied = 0,
                input, inputId, inputNumber,
                prevSection = null;
            for (var s in activeSections) {
                var currSection = activeSections[s],
                    sectionInputs = currSection.get("items");
                if (currSection.getInstance().get("active") === false ||
                    sectionInputs.length === 0) {
                    activeSections[s] = null;
                    continue;
                }
                // Skip display of section header if it has no title/label nor description:
                var label = I18n.t(currSection.get("label")),
                    desc = I18n.t(currSection.get("description"));
                currSection.silent = !label && !desc;

                // Merge numbering of consecutive silent sections:
                if (!(prevSection && prevSection.silent && currSection.silent)) {
                    inputNumber = 0;
                }
                
                var previousId = null,
                    previousInput = null,
                    firstSectionInputId = null,
                    // Local copy of all inputs including the replies:
                    oldInputs = currSection.activeInputs,
                    activeInputs = {};

                for (var i in sectionInputs) {
                    input = sectionInputs[i];
                    inputId = input.get("id");
                    var inst = input.getInstance(),
                        isActive = inst.get("active"),
                        isReplied = inst.get("isReplied");
                    if (!isActive) {
                        continue;
                    }
                    activeInputs[inputId] = {
                        number: ++inputNumber,
                        // Keep any old values if we are in the editor, otherwise null (which should be different from any normal value):
                        value: (oldInputs && oldInputs[inputId]) ? oldInputs[inputId].value : null,
                        backId: previousId,
                        nextId: null
                    };
                    previousId = inputId;
                    if (previousInput) {
                        previousInput.nextId = inputId;
                    }
                    previousInput = activeInputs[inputId];
                    this.inputCache[inputId] = activeInputs[inputId];
                    if (isReplied === false) {
                        nbUnreplied++;
                        if (!this.currentInputId) {
                            this.currentInputId = inputId;
                        }
                    } else {
                        nbReplied++;
                    }
                    if (!this.firstSurveyInput) {
                        this.firstSurveyInput = input;
                        this.firstSection = currSection;
                    }
                    if (!firstSectionInputId) {
                        firstSectionInputId = inputId;
                    }
                    this.lastInputId = inputId;
                    this.lastSection = currSection;
                }
                if (inputNumber === 0) {
                    // No active inputs inside this section:
                    activeSections[s] = null;
                    continue;
                } else {
                    currSection.activeInputs = activeInputs;
                    currSection.firstInputId = firstSectionInputId;
                    currSection.lastInputId = this.lastInputId;
                }
                prevSection = currSection;
            }

            this.activeSections = activeSections.filter(function (el) {
                return el !== null;
            });
            if (!this.activeSections || this.activeSections.length === 0) {
                this.surveyStatus = SURVEY_STATUS.EMPTY;
                return;
            } else {
                if (! this.oneQuestionPerPage) {
                    var allSilent = true;
                    for (var sct in this.activeSections) {
                        if (this.activeSections[sct].silent !== true) {
                            allSilent = false;
                            break;
                        }
                    }
                    if (this.activeSections.length === 1 || allSilent === true) {
                        // Enforce monolithic layout if only one section is active and one section/page mode:
                        this.monolithicLayout = true;
                    }
                }
            }
            if (nbReplied > 0) {
                this.surveyDisplay = SURVEY_DISPLAY.SECTION_HEAD;
            }
            if (nbUnreplied === 0) {
                this.surveyStatus = SURVEY_STATUS.ALL_REPLIED;
                this.validateButton.get(CONTENTBOX).addClass("ready");
            }
            this.nbUnreplied = nbUnreplied;
        },
        
        setValueOfInput: function(inputId, value) {
            this.inputCache[inputId].value = value;
        },
        
        getValueOfInput: function(inputId) {
            return this.inputCache[inputId].value;
        },

        setCustomItemOfInput: function(inputId, custom) {
            this.inputCache[inputId].custom = custom;
        },
        
        getCustomItemOfInput: function(inputId) {
            return this.inputCache[inputId].custom;
        },

        getSectionOfInputObj: function(q) {
            return q && q.getParent();
        },
        
        onUpdatedDescriptor: function(e) {
            var entity = e.entity,
                clazz = entity.get("@class");
                
            switch (clazz) {
                case "SurveySectionDescriptor":
                    var survey = this.get("survey.evaluated");
                    if (survey) {
                        var sections = survey.get("items"),
                            entityId = entity.get("id");
                        for (var s in sections) {
                            if (sections[s].get("id") === entityId) {
                                sections[s] = entity;
                                break;
                            }
                            var currIdx = this.currentInputId;
                            this.initStructure();
                            if (this.inputCache[currIdx]) {
                               this.currentInputId = currIdx;
                            }
                            this.syncUI();
                            return;
                        }
                    }
                    break;
                    
                case "SurveyDescriptor":
                    var survey = this.get("survey.evaluated");
                    if (survey && survey.get("id") === entity.get("id")) {
                        var currIdx = this.currentInputId;
                        this.initStructure();
                        if (this.inputCache && this.inputCache[currIdx]) {
                           this.currentInputId = currIdx;
                        }
                        this.syncUI();
                    }
                    break;
            }
        },
        
        onUpdatedInstance: function(e) {
            var entity = e.entity,
                clazz = entity.get("@class");
                
            switch (clazz) {
                case "SurveyInputInstance":
                    // Update the isReplied status of all displayed inputs:
                    try {
                        this.syncUI();
                    } catch(e) {
                        // This happens when reinitializing the game
                    }
                    break;
                case "SurveyInstance":
                    // Update the "validated" status of the survey:
                    if (entity.get("status") === ORCHESTRATION_PROGRESS.COMPLETED) {
                        this.surveyStatus = SURVEY_STATUS.COMPLETED;
                        this.surveyDisplay = SURVEY_DISPLAY.COMPLETED;
                    }
                    try {
                        this.syncUI();
                    } catch(e) {
                        // This happens when reinitializing the game
                    }
                    break;
                default:
            }
        },
       
        /**
         *
         * @param {type} descr input descriptor
         * @param {type} container (HTML)
         * @param {type} mode hidden, read or write, others means hidden
         * @returns {undefined}
         */
        addInput: function(descr, container, mode) {
            var klass = descr.get("@class"),
                widget,
                readonly = mode === "read",
                number = this.inputCache[descr.get("id")].number,
                cfg = {
                    input: descr,
                    surveyWidget: this, // The widget!
                    readonly: readonly,
                    number: number,
                    showStatus: false
                };

            if (mode === "write" || mode === "read") {
                switch (klass) {
                    case "SurveyNumberDescriptor":
                        widget = new Wegas.SurveyNumberInput(cfg).render(container);
                        break;
                    case "SurveyTextDescriptor":
                        cfg.readonly = {
                            "content": "return " + readonly + ";"
                        };
                        widget = new Wegas.SurveyTextInput(cfg).render(container);
                        break;
                    case "SurveyChoicesDescriptor":
                        widget = new Wegas.SurveyChoicesInput(cfg).render(container);
                        break;
                }

                this.add(widget);
                widget.get("boundingBox").addClass("wegas-survey-input");

                this.childWidgets.push(widget);
            }
            return widget;
        },
        
        renderUI: function() {
            // Send initialization event to xAPI:
            Y.Wegas.Facade.Variable.script.remoteFnEval(
                function(survname) {
                    surveyXapi.post(surveyXapi.surveyInitialized(survname));
                },
                this.get("survey.evaluated").get("name")
            );
        
            var survStatus =
                    this.get("survey.evaluated") && 
                    this.get("survey.evaluated").getInstance().get("status");
            // Set the survey's status to "ongoing" now that it's being displayed:
            if (survStatus === ORCHESTRATION_PROGRESS.NOT_STARTED ||
                survStatus === ORCHESTRATION_PROGRESS.REQUESTED) {
                this.sendSurveyStatusChange(ORCHESTRATION_PROGRESS.ONGOING);
            }
            
            var cb = this.get(CONTENTBOX);

            // Don't recreate these when updating inside the scenarist editor:
            if (!this.validateButton) {
                this.validateButton = new Y.Button({
                    label: I18n.t("survey.global.validate"),
                    visible: true
                }).render(cb.one('.validate'));

                this.nextButton = new Y.Button({
                    label: I18n.t("survey.global.next"),
                    visible: true
                }).render(cb.one('.next'));

                this.backButton = new Y.Button({
                    label: I18n.t("survey.global.back"),
                    visible: true
                }).render(cb.one('.back'));
                
                this.closeButton = new Y.Button({
                    label: I18n.t("survey.global.close"),
                    visible: true
                }).render(cb.one('.close')).hide();
            } else {
                this.validateButton.get(CONTENTBOX).removeClass("ready");
            }

            this.initStructure();

            if (this.surveyStatus === SURVEY_STATUS.EMPTY) {
                return;
            }
            
            this.progressBarBackground = cb.one(".progress-bar-background");
            this.progressBarMax = Object.keys(this.inputCache).length;
            this.progressBarValue = cb.one(".progress-value");
            this.progressBar = cb.one(".progress-bar");
        },
        
        // Displays a paginated view of the survey at or around "this.currentInputId".
        syncUI: function() {
            var cb = this.get("contentBox"),
                container = cb.one(".content");

            cb.one(".title").setContent(this.title);
            this.removeChildren();
            
            if (this.surveyStatus === SURVEY_STATUS.EMPTY ||
                this.surveyStatus === SURVEY_STATUS.COMPLETED ||
                this.surveyStatus === SURVEY_STATUS.INACTIVE) {
                var descrField = cb.one(".description").show();
                switch (this.surveyStatus) {
                    case SURVEY_STATUS.EMPTY:
                        descrField.setContent(
                            I18n.t("survey.errors.empty"));
                        break;
                    case SURVEY_STATUS.INACTIVE:
                        descrField.setContent(
                            I18n.t("survey.errors.inactive"));
                        break;
                    case SURVEY_STATUS.COMPLETED:
                        var descriptionEnd = I18n.t(this.survey.get("descriptionEnd"));
                        descrField.setContent(descriptionEnd);
                        if (this.get("displayCloseButton")) {
                            this.closeButton.show();
                        }
                        break;                        
                }
                cb.one(".section-useful-contents").hide();
                this.validateButton.hide();
                this.nextButton.hide();
                this.backButton.hide();
                return;
            }
            
            if (this.oneQuestionPerPage) {
                container.removeClass("one-section-per-page");
                container.addClass("one-question-per-page");
            } else {
                container.addClass("one-section-per-page");
                container.removeClass("one-question-per-page");
            }
            
            if (!this.currentInputId && this.surveyStatus === SURVEY_STATUS.ALL_REPLIED) {
                // All inputs are answered, but the survey is not yet validated:
                // display the last input with a validation button.
                if (this.oneQuestionPerPage) {
                    this.currentInputId = this.lastInputId;
                    this.surveyDisplay = SURVEY_DISPLAY.INPUT;
                } else {
                    this.currentInputId = this.lastInputId;
                    this.surveyDisplay = SURVEY_DISPLAY.SECTION_HEAD;
                    this.backToPreviousSectionByPage();
                }
            }
            
            var currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId),
                currentSection = this.getSectionOfInputObj(currentInput),
                currentSectionId = currentSection.get("id"),
                sectionInputs = currentSection.activeInputs,
                sectionBox = cb.one(".section");
        
            if (this.monolithicLayout) {
                this.progressBarBackground.hide();
            } else {
                this.progressBarBackground.show();
            }
            
            if (this.monolithicLayout ||
                this.surveyDisplay === SURVEY_DISPLAY.SURVEY_HEAD) {
                var description = I18n.t(this.survey.get("description"));
                cb.one(".description").show().setContent(description);
            } else {
                cb.one(".description").hide();
            }

            if (!currentSection.silent) {
                sectionBox.one(".section-header").show();
                if (this.monolithicLayout ||
                    this.surveyDisplay === SURVEY_DISPLAY.SECTION_HEAD ||
                    this.surveyDisplay === SURVEY_DISPLAY.INPUT) {
                    sectionBox.one(".section-title").setContent(I18n.t(currentSection.get("label")));
                }

                if (this.monolithicLayout ||
                    this.surveyDisplay === SURVEY_DISPLAY.SECTION_HEAD) {
                    var sectionIntro = I18n.t(currentSection.get("description"));
                    sectionBox.one(".section-description").show().setContent(sectionIntro);
                } else {
                    sectionBox.one(".section-description").hide();
                }
            } else {
                sectionBox.one(".section-header").hide();
            }
            
            // Always display questions/inputs in monolithicLayout mode.
            // Don't display questions/inputs if we are showing the initial survey instructions
            // or the initial section description in one input/page mode:
            var doDisplayInputs =
                    this.monolithicLayout ||
                    !(
                        this.surveyDisplay === SURVEY_DISPLAY.SURVEY_HEAD ||
                        (this.oneQuestionPerPage && this.surveyDisplay === SURVEY_DISPLAY.SECTION_HEAD)
                    );
                    
            if (doDisplayInputs) {

                // Display input(s):
                if (this.oneQuestionPerPage) {
                    this.addInput(currentInput, container, "write");
                } else {
                    // One section/page mode: display from first input of section
                    var input = currentSection.firstInputId;
                    while (input !== null) {
                        currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(input);
                        this.addInput(currentInput, container, "write");
                        input = sectionInputs[input].nextId;
                        // Shall we merge two silent sections ?
                        if (input === null && currentSection.silent) {
                            // Find next section:
                            var sectionIndex = this._findById(this.activeSections, currentSectionId),
                                nextSection = this.activeSections[sectionIndex+1];
                            if (nextSection && nextSection.silent) {
                                currentSection = nextSection;
                                currentSectionId = currentSection.get("id");
                                input = currentSection.firstInputId;
                                sectionInputs = currentSection.activeInputs;
                            }
                        }
                    }
                }
            }
            
            // Display navigation/validation buttons:
            // Show validate/validate button if this is the last input.
            if (this.surveyDisplay === SURVEY_DISPLAY.SURVEY_HEAD && !this.monolithicLayout) {
                sectionBox.one(".section-useful-contents").hide();
                this.validateButton.hide();
                this.nextButton.show();                
            } else if (this.surveyDisplay === SURVEY_DISPLAY.SECTION_HEAD && this.oneQuestionPerPage) {
                sectionBox.one(".section-useful-contents").show();
                this.validateButton.hide();
                this.nextButton.show(); 
            } else {
                sectionBox.one(".section-useful-contents").show();
                if (currentSectionId === this.lastSection.get("id") &&
                    (this.oneQuestionPerPage === false ||
                     currentInput.get("id") === currentSection.lastInputId)) {
                    this.validateButton.show();
                    this.nextButton.hide();
                } else {
                    this.validateButton.hide();
                    this.nextButton.show();
                }
            }

            if (this.surveyDisplay === SURVEY_DISPLAY.SURVEY_HEAD) {
                this.backButton.hide();
            } else {
                this.backButton.show();
            }
            
            this.updateProgressBar();
        },
        
        // Updates this.currentInputId to make it point to the first input of the next section.
        advanceToNextSection: function() {
            // Find first input of next section:
            var currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId),
                currentSectionId = this.getSectionOfInputObj(currentInput).get("id");
            if (currentSectionId !== this.lastSection.get("id")) {
                // Find next section:
                var sectionIndex = this._findById(this.activeSections, currentSectionId),
                    nextSection = this.activeSections[sectionIndex+1];
                this.currentInputId = nextSection.firstInputId;
            } else {
                alert("internal error in advanceToNextSection(), we are already at the end");
            }
        },
        
        // Advances to the next question or section by updating "this.currentInputId"
        nextClicked: function() {
            this.saveCurrentInputs();
            
            var currentInputElem = this.inputCache[this.currentInputId],
                currentInput, currentSection;
            if (this.oneQuestionPerPage) {
                switch (this.surveyDisplay) {
                    case SURVEY_DISPLAY.SURVEY_HEAD:
                        currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId);
                        currentSection = this.getSectionOfInputObj(currentInput);
                        if (currentSection.silent) {
                            this.surveyDisplay = SURVEY_DISPLAY.INPUT;
                        } else {
                            this.surveyDisplay = SURVEY_DISPLAY.SECTION_HEAD;
                        }
                        break;
                    case SURVEY_DISPLAY.SECTION_HEAD:
                        this.surveyDisplay = SURVEY_DISPLAY.INPUT;
                        break;
                    case SURVEY_DISPLAY.INPUT:
                        if (currentInputElem.nextId) {
                            this.currentInputId = currentInputElem.nextId;
                        } else {
                            this.advanceToNextSection();
                            currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId);
                            currentSection = this.getSectionOfInputObj(currentInput);
                            if (currentSection.silent) {
                                this.surveyDisplay = SURVEY_DISPLAY.INPUT;
                            } else {
                                this.surveyDisplay = SURVEY_DISPLAY.SECTION_HEAD;
                            }
                        }
                        break;
                    case SURVEY_DISPLAY.COMPLETED:
                        alert("internal error in nextClicked()");
                        break;
                }
            } else { // One section/page mode:
                switch (this.surveyDisplay) {
                    case SURVEY_DISPLAY.SURVEY_HEAD:
                        this.surveyDisplay = SURVEY_DISPLAY.SECTION_HEAD;
                        break;
                    case SURVEY_DISPLAY.SECTION_HEAD:
                        currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId);
                        currentSection = this.getSectionOfInputObj(currentInput);
                        if (currentSection.silent) {
                            // Jump over concatenated silent sections:
                            do {
                                this.advanceToNextSection();
                                currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId);
                                currentSection = this.getSectionOfInputObj(currentInput);
                            } while (currentSection && currentSection.silent);
                        } else {
                            this.advanceToNextSection();
                        }
                        break;
                    case SURVEY_DISPLAY.INPUT:
                    case SURVEY_DISPLAY.COMPLETED:
                        alert("internal error in nextClicked()");
                        break;
                }
            }
            this.syncUI();
        },
        
        // Goes back to the previous question or section by updating "this.currentInputId"
        backClicked: function() {
            this.saveCurrentInputs();

            var currentInputElem = this.inputCache[this.currentInputId],
                currentInput, currentSection, currentSectionId;
            if (this.oneQuestionPerPage) {
                switch (this.surveyDisplay) {
                    case SURVEY_DISPLAY.SURVEY_HEAD:
                        alert("internal error in backClicked()");
                        break;
                    case SURVEY_DISPLAY.SECTION_HEAD:
                        // Find last input of previous section:
                        currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId);
                        currentSectionId = this.getSectionOfInputObj(currentInput).get("id");
                        if (currentSectionId !== this.firstSection.get("id")) {
                            this.surveyDisplay = SURVEY_DISPLAY.INPUT;
                            // Find previous section:
                            var sectionIndex = this._findById(this.activeSections, currentSectionId),
                                prevSection = this.activeSections[sectionIndex-1];
                            this.currentInputId = prevSection.lastInputId;
                        } else {
                            this.surveyDisplay = SURVEY_DISPLAY.SURVEY_HEAD;
                        }
                        break;
                    case SURVEY_DISPLAY.INPUT:
                        if (currentInputElem.backId) {
                            this.currentInputId = currentInputElem.backId;
                        } else {
                            currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId);
                            currentSection = this.getSectionOfInputObj(currentInput);
                            currentSectionId = currentSection.get("id");
                            if (currentSection.silent) {
                                if (currentSectionId !== this.firstSection.get("id")) {
                                    this.surveyDisplay = SURVEY_DISPLAY.INPUT;
                                    // Find previous section:
                                    var sectionIndex = this._findById(this.activeSections, currentSectionId),
                                        prevSection = this.activeSections[sectionIndex-1];
                                    this.currentInputId = prevSection.lastInputId;
                                } else {
                                    this.surveyDisplay = SURVEY_DISPLAY.SURVEY_HEAD;
                                }
                            } else {
                                this.surveyDisplay = SURVEY_DISPLAY.SECTION_HEAD;
                            }
                        }
                        break;
                    case SURVEY_DISPLAY.COMPLETED:
                        alert("internal error in backClicked()");
                        break;
                }
            } else { // One section/page mode:
                switch (this.surveyDisplay) {
                    case SURVEY_DISPLAY.SECTION_HEAD:
                        this.backToPreviousSectionByPage();
                        break;
                    case SURVEY_DISPLAY.SURVEY_HEAD:
                    case SURVEY_DISPLAY.INPUT:
                    case SURVEY_DISPLAY.COMPLETED:
                        alert("internal error in backClicked()");
                        break;
                }
            }
            this.syncUI();
        },
        // Sets this.currentInputId to the top of the previous section 
        // (or even further back if silent sections are concatenated).
        backToPreviousSectionByPage: function() {
            var currentInput = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.currentInputId),
            currentSection = this.getSectionOfInputObj(currentInput),
            currentSectionId = currentSection.get("id");
            if (currentSectionId === this.firstSection.get("id")) {
                // If we are at the first section, just show survey header/introduction
                this.surveyDisplay = SURVEY_DISPLAY.SURVEY_HEAD;
            } else {
                // We are not at the start: go back to the previous section, skipping concatenated ones:
                var sectionIndex = this._findById(this.activeSections, currentSectionId),
                    prevSection = this.activeSections[sectionIndex-1],
                    prevSectionInputId;
                if (prevSection.silent) {
                    do {
                        prevSectionInputId = currentSection.firstInputId;
                        sectionIndex = this._findById(this.activeSections, currentSection.get("id"));
                        prevSection = this.activeSections[sectionIndex-1];
                        currentSection = prevSection;
                    } while(currentSection && currentSection.silent);
                    this.currentInputId = prevSectionInputId;
                } else {
                    this.currentInputId = prevSection.firstInputId;
                }
            }

        },
        // Returns the index of the array element having the given id, or -1 if not found.
        _findById: function(arr, id) {
            for (var i in arr) {
                if (arr[i].get("id") === id) {
                    // Return a number:
                    return +i;
                }
            }
            return -1;
        },
        
        closeClicked: function() {
            // The survey listener will be notified of the "closed" status:
            this.sendSurveyStatusChange(ORCHESTRATION_PROGRESS.CLOSED, Y.bind(function(e) {
                this.destroy();
            }, this));
        },
        
        bindUI: function() {
            if (this.validateButton) {
                this.validateButton.on("click", this.validate, this);
            }
            /*if (this.saveButton) {
             this.saveButton.on("click", this.save, this);
             }*/

            if (this.nextButton) {
                this.nextButton.on("click", this.nextClicked, this);
            }
            if (this.backButton) {
                this.backButton.on("click", this.backClicked, this);
            }
            if (this.closeButton) {
                this.closeButton.on("click", this.closeClicked, this);
            }

            this.handlers.afterAnswerSave = this.after("*:saved", this.onSaved, this);
            this.handlers.updateInst = Y.Wegas.Facade.Instance.after("*:updatedInstance", this.onUpdatedInstance, this);
            this.handlers.updateDesc = Y.Wegas.Facade.Variable.after("updatedDescriptor", this.onUpdatedDescriptor, this);
            this.handlers.addChild = this.on("addChild", function(e) {
                // Don't propagate to the editor:
                e.stopPropagation();
            }, this);
            this.handlers.removeChild = this.on("removeChild", function(e) {
                // Don't propagate to the editor:
                e.stopPropagation();
            }, this);

        },
        onSaved: function(e) {
            var inst = Y.Wegas.Facade.VariableDescriptor.cache.findById(e.id).getInstance(),
                wasReplied = inst.get("isReplied");
            inst.set("isReplied", true);
            this.updateProgressBar();
            
            // Only save once the fact that this input has been replied:
            if (wasReplied === false){
                this.save(e.id);
                this.nbUnreplied--;
                if (this.nbUnreplied <= 0) {
                    this.validateButton.get(CONTENTBOX).addClass("ready");
                }
            }          
        },
        updateProgressBar: function() {
            var sum = 0;
            for (var i in this.inputCache) {
                if (Y.Wegas.Facade.VariableDescriptor.cache.findById(i).getInstance().get("isReplied") === true) {
                    sum++;
                }
            }
            var ratio = sum/this.progressBarMax,
                pct = Math.min(100, Math.ceil(100*ratio)),
                width = pct + "%",
                maxPixels = Number.parseInt(this.progressBarBackground.getComputedStyle("width")),
                relativePixels = maxPixels * ratio;
            this.progressBar.setStyle("width", width);
            // Is the progress bar wide enough to contain the text (25px) ?
            if (relativePixels > 25) {
                this.progressBar.setContent(width);
                this.progressBarValue.setContent('');             
            } else {
                this.progressBarValue.setContent(width);
                this.progressBar.setContent('');
            }
        },
        removeChildren: function() {
            for (var c in this.childWidgets) {
                this.childWidgets[c].destroy();
            }
            this.childWidgets = [];
        },
        
        destructor: function() {
            this.set("predestroyed", true);

            var id;
            for (id in this.handlers) {
                if (this.handlers.hasOwnProperty(id)) {
                    this.handlers[id].detach();
                }
            }

            this.removeChildren();

            if (this.validateButton) {
                this.validateButton.destroy();
                this.nextButton.destroy();
                this.backButton.destroy();
                this.closeButton.destroy();
            }
        },
        sendReplyRequest: function(inputId, cb) {
            if (inputId === undefined) {
                // @TODO: this happens when destroying the widget
                return;
            }

            if (!this.get("destroyed") && !this.get("predestroyed")) {
            }
            
            var desc = Y.Wegas.Facade.VariableDescriptor.cache.findById(inputId),
                inst = desc.getInstance();

            var config = {
                request: "/" + inputId + "/VariableInstance/" + inst.get("id"),
                cfg: {
                    updateCache: true,
                    method: "put",
                    data: inst
                },
                on: {
                    success: Y.bind(function(e) {
                        cb && cb.call(this, e);
                    }, this),
                    failure: Y.bind(function(e) {
                        cb && cb.call(this, e);
                        this.showMessage("error", "Something went wrong: sendReplyRequest");
                    }, this)
                }
            };
            Y.Wegas.Facade.Variable.sendRequest(config);
        },
        
        // Sends an update to the survey instance.
        sendSurveyStatusChange: function(surveyStatus, cb) {
            var desc = this.get("survey.evaluated"),
                inst = desc.getInstance();
            inst.set("status", surveyStatus);

            var config = {
                request: "/" + desc.get("id") + "/VariableInstance/" + inst.get("id"),
                cfg: {
                    updateCache: true,
                    method: "put",
                    data: inst
                },
                on: {
                    success: Y.bind(function(e) {
                        cb && cb.call(this, e);
                    }, this),
                    failure: Y.bind(function(e) {
                        cb && cb.call(this, e);
                        this.showMessage("error", "Something went wrong in sendSurveyStatusChange");
                    }, this)
                }
            };
            Y.Wegas.Facade.Variable.sendRequest(config);
        },
        // Intermediate save of survey question/input, with status on the Section ribbon:
        save: function(inputId) {
            if (!this._validated) {
                this.sendReplyRequest(inputId, function(e) {
                    if (!this.get("destroyed")) {
                    }
                });
            }
        },
        // Saves all currently displayed inputs. To be called when navigating or validating
        saveCurrentInputs: function() {
            for (var cw in this.childWidgets) {
                var curr = this.childWidgets[cw];
                try {
                    curr.logValue();
                } catch(e) {
                    Y.log("SurveyWidget: logValue failed.");
                }
            }
        },
        // Returns, if applicable, a reference to the first unreplied, active and compulsory input.
        // Returns { input: input, msg: error message }
        getFirstUnrepliedInput: function() {
            for (var s in this.activeSections) {
                var currSection = this.activeSections[s],
                    sectionInputs = currSection.get("items");
                for (var i in sectionInputs) {
                    var input = sectionInputs[i],
                        inst = input.getInstance();
                    if (inst.get("active") === false) {
                        continue;
                    }
                    if (inst.get("isReplied") === false && input.get("isCompulsory") === true) {
                        var inputNumber = currSection.activeInputs[input.get("id")].number,
                            msg = inputNumber + ". " + I18n.t(input.get("label"));
                        if (this.activeSections.length > 1 && I18n.t(currSection.get("label"))) {
                            msg += "<br>(" + I18n.t(currSection.get("label")) + ")";
                        }
                        return { input: input, msg: msg };
                    }
                }
            }
            return null;
        },
        // Final validation of the survey by the player.
        // Checks that it has not already been validated and that all inputs have been replied.
        validate: function() {
            this.saveCurrentInputs();
            
            var desc = this.get("survey.evaluated"),
                inst = desc.getInstance();
            if (inst.get("status") !== ORCHESTRATION_PROGRESS.COMPLETED) {
                var unreplied = this.getFirstUnrepliedInput();
                if (!unreplied) {
                    Wegas.Panel.confirm(I18n.tCap("survey.global.confirmation"), Y.bind(function() {
                        Wegas.Panel.confirmPlayerAction(Y.bind(function(e) {
                                this._validated = true;
                                this.sendSurveyStatusChange(ORCHESTRATION_PROGRESS.COMPLETED, Y.bind(function(e) {
                                    if (!e.error) {
                                        this.surveyStatus = SURVEY_STATUS.COMPLETED;
                                        this.surveyDisplay = SURVEY_DISPLAY.COMPLETED;
                                        this.syncUI();
                                    }
                                }, this));
                                // Send completion event to xAPI:
                                Y.Wegas.Facade.Variable.script.remoteFnEval(
                                    function(survname) {
                                        surveyXapi.post(surveyXapi.surveyCompleted(survname));
                                    },
                                    this.get("survey.evaluated").get("name")
                                );
                        }, this));
                    }, this));
                } else {
                    var ctx = this;
                    this.alert(
                        I18n.t("survey.errors.incomplete", {question: "<i><b>" + unreplied.msg + "</b></i>"}),
                        function(){
                            ctx.currentInputId = unreplied.input.get("id");
                            ctx.syncUI();
                        },
                        I18n.t("survey.errors.returnToQuestion")
                    );
                }
            }
        },
        // Overload Wegas.Panel.alert in order to add a custom cssClass.
        alert: function(msg, okCb, okLabel, additionalClass, modal) {
            modal = modal === undefined || modal;
            var classes = "wegas-survey-panel " + (additionalClass ? additionalClass : "");

            var panel = new Y.Wegas.Panel({
                content: msg,
                modal: modal,
                width: 450,
                buttons: {
                    footer: [{
                            label: okLabel || I18n.t('global.ok') || 'OK',
                            action: function() {
                                panel.exit();
                                okCb && okCb();
                            }
                        }]
                }
            }).render();

            panel.get("contentBox").addClass(classes);
            panel.plug(Y.Plugin.DraggablePanel, {});
            return panel;
        }
    }, {
        EDITORNAME: 'Survey',
        ATTRS: {
            survey: {
                type: 'object',
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                required: true,
                view: {
                    type: "variableselect",
                    label: "Survey to display",
                    classFilter: ["SurveyDescriptor"]
                }
            },
            displayCloseButton: {
                type: "boolean",
                value: true,
                view: {
                    label: "Display close button after validation"
                }                
            },
            oneQuestionPerPage: {
                type: "boolean",
                value: true,
                view: {
                    label: "One question per page"
                }
            }
        }
    });
    Wegas.SurveyWidget = SurveyWidget;





    SurveyNumberInput = Y.Base.create("wegas-survey-numberinput", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class=\"wegas-survey-input\">" +
            "  <div class=\"wegas-survey-input-label\"></div>" +
            "  <div class=\"wegas-survey-input-desc\"></div>" +
            "  <div class=\"wegas-survey-input-content\">" +
            "    <div class=\"wegas-survey-number-instance-slider\"></div>" +
            "    <div class=\"wegas-survey-number-instance-input-container\">" +
            "      <input class=\"wegas-survey-number-instance-input\" />" +
            "      <span class=\"wegas-survey-number-unit\"></span>" +
            "    </div>" +
            "  </div>" +
            "  <div class=\"wegas-survey-input-status\"></div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this.xSlider = null;
            this.inputId = this.get("input").get("id");
            this.surveyName = this.get("input").getParent().getParent().get("name");
            this._initialValue = this.getCachedValue();
            if (this.get("input").getInstance().get("isReplied") === false ||
                this._initialValue === null) {
                // Initialize with more appropriate value
                this.setCachedValue(NaN);
                this._initialValue = NaN;
            }
            this.publish("save", {
                emitFacade: true
            });
            this.publish("saved", {
                emitFacade: true
            });
        },
        setCachedValue: function(value) {
            this.get("surveyWidget").setValueOfInput(this.inputId, value);
        },
        getCachedValue: function() {
            return this.get("surveyWidget").getValueOfInput(this.inputId);
        },
        renderUI: function() {
            var desc = this.get("input"),
                CB = this.get("contentBox"),
                label = I18n.t(desc.get("label")),
                labelField = CB.one(".wegas-survey-input-label"),
                number = this.get("number") !== '' && label ? this.get("number") + ". " : "",
                unit = desc.get("unit"),
                min, max, isScale, value;
            value = this.getCachedValue();
            
            displayInputLabel(desc, labelField, number + label);
            CB.one(".wegas-survey-input-desc").setContent(I18n.t(desc.get("description")));
            if (unit) {
                CB.one(".wegas-survey-number-unit").setContent(I18n.t(unit));
            }

            if (!this.get("readonly")) {
                //this.get(CONTENTBOX).one(".wegas-survey-number-instance-input").set("value", inputInstance.get("value"));
                if (this.xSlider) {
                    // Delete slider when re-rendering the widget:
                    this.xSlider.destroy();
                }
                min = desc.get("minValue");
                max = desc.get("maxValue");
                isScale = desc.get("isScale");
                if (isScale && Y.Lang.isNumber(min) && Y.Lang.isNumber(max)) {
                    this.xSlider = new Y.Slider({
                        min: min,
                        max: max,
                        value: Number.isNaN(value) ? min : +value,
                        length: NUMERIC_SCALE_WIDTH
                    }).render(this.get(CONTENTBOX).one(".wegas-survey-number-instance-slider"));
                    this.get(CONTENTBOX).one(".wegas-survey-number-instance-slider .yui3-slider-rail-cap-left")
                        .setAttribute("data-value", min);
                    this.get(CONTENTBOX).one(".wegas-survey-number-instance-slider .yui3-slider-rail-cap-right")
                        .setAttribute("data-value", max);
                }
            }

        },
        syncUI: function(quiet) {
            var value, hasValue;
            value = this.getCachedValue();
            hasValue = !Number.isNaN(value) && value !== null;

            this._quiet = quiet;

            var cb = this.get(CONTENTBOX),
                status = this.get("boundingBox").one(".wegas-survey-input-status");

            if (!this.get("readonly")) {
                if (this.get("input").getInstance().get("isReplied")) {
                    status.addClass('input-isreplied');
                    if (!hasValue) {
                        status.addClass('input-isreplied-novalue');
                        status.setContent(I18n.t("survey.global.unavailableValue"));
                    }
                } else {
                    status.addClass('input-unreplied');
                }
                cb.one(".wegas-survey-number-instance-input").set("value", hasValue ? value : '' );
                if (this.xSlider && hasValue) {
                    var rail = this.xSlider.get("contentBox").one(".yui3-slider-rail");
                    if (rail) {
                        rail.setAttribute("data-value", Y.Lang.isNumber(value) ? value : "");
                    }
                    this.xSlider.set("value", value);
                }
            } else {
                this.get("boundingBox").one(".wegas-survey-number-instance-input-container").addClass('input-isreplied');
                if (hasValue) {
                    cb.one(".wegas-survey-number-instance-input-container").setContent('<p>' + value + '</p>');
                }
            }
            this._quiet = false;
        },
        getCurrentValue: function() {
            if (this.get("readonly")) {
                return this.get(CONTENTBOX).one(".wegas-survey-number-instance-input-container p").getContent();
            } else {
                return parseInt(this.get(CONTENTBOX).one(".wegas-survey-number-instance-input").get("value"), 10);
            }
        },
        bindUI: function() {
            var input = this.get(CONTENTBOX).one(".wegas-survey-number-instance-input");
            if (this.xSlider) {
                this.handlers.push(this.xSlider.after("valueChange", this.updateInput, this));
            }
            if (input) {
                this.handlers.push(input.on("keyup", this.updateSlider, this));
            }
            
            this.handlers.updateDesc = Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
                var me = this.get("input");
                if (me && me.get("id") === e.entity.get("id")) {
                    this.set("input", e.entity);
                    this.renderUI();
                    // Redo bindings in case we change from input field to slider:
                    this.destructor();
                    this.bindUI();
                    this.syncUI();
                }
            }, this);

        },
        logValue:function() {
            var value = this.getCachedValue(),
                hasValue = !Number.isNaN(value) && value !== this._initialValue;
            if (hasValue) {
                Y.Wegas.Facade.Variable.script.remoteFnEval(
                    function(value, survname, inputname) {
                        surveyXapi.post(surveyXapi.numberInput(value, survname, inputname));
                    },
                    value,
                    this.surveyName,
                    this.get("input").get("name")
                );
                this.fire("saved", {id: this.inputId, value: value});
                this._initialValue = value;
            }
        },
        destructor: function() {
            this.timer && this.timer.cancel();
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        updateValue: function(rawValue) {
            var desc = this.get("input"),
                value = +rawValue;

            if (isNaN(value)) {
                this.showError(I18n.t("errors.nan", {value: rawValue}));
                return false;
            } else {
                var hasMinLimit = desc.get("minValue") !== null,
                    hasMaxLimit = desc.get("maxValue") !== null,
                    min = hasMinLimit ? desc.get("minValue") : -Infinity,
                    max = hasMaxLimit ? desc.get("maxValue") : Infinity;
                if ((value < min) || (value > max)) {
                    if (hasMinLimit && hasMaxLimit) {
                        this.showError(I18n.t("survey.errors.outOfBounds", {min: min, max: max}));
                    } else if (hasMinLimit) {
                        this.showError(I18n.t("survey.errors.notGreaterThanMin", {min: min}));
                    } else if (hasMaxLimit) {
                        this.showError(I18n.t("survey.errors.notLessThanMax", {max: max}));
                    }
                    return false;
                }
            }
            this.showError('');
            this.setCachedValue(value);
            
            this._quiet = false;
            return true;
        },
        updateInput: function(e) {
            var input = this.get(CONTENTBOX).one(".wegas-survey-number-instance-input"),
                value = this.xSlider.get("value");

            if (this.updateValue(value)) {
                var rail = this.xSlider.get("contentBox").one(".yui3-slider-rail");
                if (rail) {
                    rail.setAttribute("data-value", Y.Lang.isNumber(value) ? value : "");
                }
                input.set("value", value);
            }
        },
        updateSlider: function(e) {
            var input = this.get(CONTENTBOX).one(".wegas-survey-number-instance-input"),
                value = input.get("value");

            //this.fire("editing", {"id": this.inputId, "value": value});

            if (this.timer) {
                this.timer.cancel();
            }
            this.timer = Y.later(200, this, function() {
                this.timer = null;
                if (this.updateValue(value)) {
                    if (this.xSlider) {
                        this.xSlider.get("contentBox").one(".yui3-slider-rail")
                            .setAttribute("data-value", Y.Lang.isNumber(value) ? value : "");
                        this.xSlider.set("value", +value);
                    }
                }
            });
        },
        showError: function(msg){
            var errorField = this.get(CONTENTBOX).one(".wegas-survey-input-status");
            if (msg) {
                errorField.setContent(msg);
                errorField.addClass("input-error");
            } else {
                errorField.setContent('');
                errorField.removeClass("input-error");                
            }
            errorField.removeClass("input-isreplied");
            errorField.removeClass("input-isreplied-novalue");
        }
    }, {
        EDITORNAME: "Number input",
        ATTRS: {
            surveyWidget: {
                type: "SurveyWidget"
            },
            input: {
                type: "SurveyNumberDescriptor"
            },
            number: {
                type: "string",
                value: ""
            },
            readonly: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.SurveyNumberInput = SurveyNumberInput;




    SurveyTextInput = Y.Base.create("wegas-survey-textinput", Y.Wegas.TextInput, [], {
        CONTENT_TEMPLATE: "<div class=\"wegas-survey-input\">" +
            "<div class=\"wegas-survey-input-label\"></div>" +
            "<div class=\"wegas-survey-input-desc\"></div>" +
            "<div class=\"wegas-survey-input-content\">" +
            "  <div class=\"wegas-text-input-editor\"></div>" +
            "  <div class=\"wegas-text-input-toolbar\"><div class=\"status\"></div></div>" +
            "</div>" +
            "<div class=\"wegas-survey-input-status\"></div>" +
            "</div>",
        initializer: function() {
            this.inputId = this.get("input").get("id");
            this.surveyName = this.get("input").getParent().getParent().get("name");
            if (this.get("input").getInstance().get("isReplied") === false ||
                this.getCachedValue() === null) {
                // Initialize with more appropriate value
                this.setCachedValue('');
            }
        },
        setCachedValue: function(value) {
            this.get("surveyWidget").setValueOfInput(this.inputId, value);
        },
        getCachedValue: function() {
            return this.get("surveyWidget").getValueOfInput(this.inputId);
        },
        getInitialContent: function() {
            var desc = this.get("input"),
                CB = this.get("contentBox"),
                label = I18n.t(desc.get("label")),
                labelField = CB.one(".wegas-survey-input-label"),
                number = this.get("number") !== '' && label ? this.get("number") + ". " : "";
            
            displayInputLabel(desc, labelField, number + label);
            CB.one(".wegas-survey-input-desc").setContent(I18n.t(desc.get("description")));
            this._initialContent = this.getCachedValue();

            if (this.get("readonly.evaluated") && !this._initialContent) {
                return "<i>" + I18n.t("survey.editor.noValueProvided") + '</i>';
            }

            return this._initialContent;
        },
        getCurrentValue: function() {  // @TODO => getCachedValue ??
            return this.currentValue;
        },
        getPayload: function(value) {
            return {
                id: this.get("input").get("id"),
                value: value
            };
        },
        bindUI: function() {
            // Required for getting updates through this._save() :
            Y.Wegas.SurveyTextInput.superclass.bindUI.apply(this);
            
            this.handlers.updateDesc = Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
                var me = this.get("input");
                if (me && me.get("id") === e.entity.get("id")) {
                    this.set("input", e.entity);
                    this.renderUI();
                    this.syncUI();
                }
            }, this);
        },
        _save: function(e) {
            this.setCachedValue(e.value);
        },
        logValue:function() {
            var value = this.getCachedValue(),
                cleanValue,
                hasValue = value !== this._initialContent;
            if (hasValue) {
                // Reduce saved text inputs to pure text without HTML
                cleanValue = Y.Wegas.Helper.stripHtml(value.replace(/(\r\n|\n\r|\r|\n)/g, " ")).replace(/"/g, "\\\"");
                
                Y.Wegas.Facade.Variable.script.remoteFnEval(
                    function(value, survname, inputname) {
                        surveyXapi.post(surveyXapi.textInput(value, survname, inputname));
                    },
                    cleanValue,
                    this.surveyName,
                    this.get("input").get("name")
                );
                this.fireSaved(cleanValue);
                this._initialContent = value;
            }
        },
        // Method required by Wegas.TextInput :
        fireEditing: function(content) {
            var payload = this.getPayload();
            var input = this.get("input").toObject();
            input.value = content;
            this.fire('editing', payload);
        },
        syncUI: function(quiet) {
            var value = this.getCachedValue();
            this._quiet = quiet;

            if (value !== this._initialContent && this.getCurrentValue() === this._initialContent) {
                // Do setup as soon as the real editor is rendered (i.e. when this.editor is defined)
                if (this.editor) {
                    var content = this.getInitialContent();
                    this.currentValue = content;
                    this.editor.setContent(content);
                    var //cb = this.get(CONTENTBOX),
                        status = this.get("boundingBox").one(".wegas-survey-input-status"),
                        hasValue = (value !== null && value !== '');
                    if (this.get("input").getInstance().get("isReplied")) {
                        status.addClass('input-isreplied');
                        if (!hasValue) {
                            status.addClass('input-isreplied-novalue');
                            status.setContent(I18n.t("survey.global.unavailableValue"));
                        }
                    } else {
                        status.addClass('input-unreplied');
                    }
                } else {
                    Y.later(1000, this, this.syncUI);
                }
            } else {
                if (!this.get("readonly.evaluated") && this.editor) {
                    this.setCachedValue(this.editor.getContent());
                }
            }
            this._quiet = false;
            
        },
        destructor: function() {
            if (this.onEvalUpdate) {
                this.onEvalUpdate.detach();
            }
        }
    }, {
        EDITORNAME: "Text input",
        ATTRS: {
            surveyWidget: {
                type: "SurveyWidget"
            },
            input: {
                type: "SurveyTextDescriptor"
            },
            number: {
                type: "string",
                value: ""
            },
            showSaveButton: {
                type: "boolean",
                value: false
            },
            selfSaving: {
                type: 'boolean',
                value: false
            },
            inlineEditorMode: {
                type: 'string',
                value: "inlite"
            },
            resize: {
                type: 'string',
                value: 'both'
            },
            showToolbar: {
                type: "boolean",
                value: false
            },
            contextmenu: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.SurveyTextInput = SurveyTextInput;


    SurveyChoicesInput = Y.Base.create("wegas-survey-choicesinput-widget", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div class=\"wegas-survey-input\">" +
            "  <div class=\"wegas-survey-input-label\"></div>" +
            "  <div class=\"wegas-survey-input-desc\"></div>" +
            "  <div class=\"wegas-survey-input-content\">" +
            "    <div class=\"wegas-survey-choicesinput-content\"></div>" +
            "  </div>" +
            "  <div class=\"wegas-survey-input-status\"></div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            var desc = this.get("input");
            this.inputId = desc.get("id");
            this.surveyName = this.get("input").getParent().getParent().get("name");
            this._initialValue = this.getCachedValue();
            if (this.get("input").getInstance().get("isReplied") === false ||
                this._initialValue === null) {
                // Initialize with specific value
                this.setCachedValue('');
                this._initialValue = '';
            }
            this.publish("save", {
                emitFacade: true
            });
            this.publish("saved", {
                emitFacade: true
            });
        },
        setCachedValue: function(value) {
            this.get("surveyWidget").setValueOfInput(this.inputId, value);
        },
        getCachedValue: function() {
            return this.get("surveyWidget").getValueOfInput(this.inputId);
        },
        setCustomItem: function(custom) {
            this.get("surveyWidget").setCustomItemOfInput(this.inputId, custom);
        },
        getCustomItem: function() {
            return this.get("surveyWidget").getCustomItemOfInput(this.inputId);
        },
        getMaxWidth: function(elemList) {
            if (elemList.size() > 1) {
                var max = 0,
                    widths = elemList.getComputedStyle("width"),
                    i, w;
                for (i in widths) {
                    w = Number.parseInt(widths[i]);
                    max = Math.max(w, max);
                }
                return max;
            } else {
                return 0;
            }
        },
        equalizeWidths: function(elemList) {
            if (elemList.size() > 1) {
                var max = this.getMaxWidth(elemList);
                if (max > 0) {
                    elemList.setStyle("min-width", max + "px");
                } else {
                    Y.later(500, this,
                        function() {
                            max = this.getMaxWidth(elemList);
                            if (max > 0) {
                                elemList.setStyle("min-width", max + "px");
                            }
                        }
                    );
                }
            }
        },
        renderUI: function() {
            var desc = this.get("input"),
                CB = this.get("contentBox"),
                label = I18n.t(desc.get("label")),
                labelField = CB.one(".wegas-survey-input-label"),
                number = this.get("number") !== '' && label ? this.get("number") + ". " : "",
                choices = desc.get("choices"), 
                frag = [], i, value;
            
            this.isScale = desc.get("isScale");
            this.isSlider = this.isScale && desc.get("isSlider");

            displayInputLabel(desc, labelField, number + label);
            CB.one(".wegas-survey-input-desc").setContent(I18n.t(desc.get("description")));

            if (!this.get("readonly")) {
                if (!this.isScale) {
                    // Prepare clickable HTML boxes:
                    frag.push('<ul class="wegas-string-input-checkboxes">');
                    for (i in choices) {
                        value = choices[i];
                        frag.push('<li role="button" tabindex="0" data-value='
                            + JSON.stringify(value.get("name")) + ' '
                            + (value.get("name") === this.getCachedValue() ? "class='selected'" : '') + '>'
                            + I18n.t(value.get("label")) + '</li>');
                    }
                    frag.push('</ul>');
                } else {
                    var nbChoices = choices.length,
                        minLabel = I18n.t(choices[0].get("label")),
                        maxLabel = I18n.t(choices[nbChoices-1].get("label"));
                    if (this.isSlider) {
                        var sliderPosition = this.getCustomItem();
                        if (sliderPosition === undefined) {
                            sliderPosition = SLIDER_DEFAULT_POS;
                            value = this.getCachedValue();
                            if (value) {
                                // In case of descriptor update, try to compute a better slider position:
                                try {
                                    var name = JSON.parse(value)[0],
                                        index = name && choices.findIndex(function(item){
                                            return item.get("name") === name;
                                    });
                                    if (index >= 0) {
                                        sliderPosition = index*(SLIDER_MAX/(nbChoices-1));
                                    }
                                } catch(e) {
                                    // ignore
                                }
                            }
                        }
                        // Set max value to 100 to ensure that the slider moves without stuttering on intermediate values.
                        frag.push(
                            '<div class="choices-slider-container"><span class="label">',
                            minLabel,
                            '</span><span class="slider-input"><input id="realism-slider" class="choices-slider" type="range" min="0" max="',
                            SLIDER_MAX,
                            '" step="1" value="',
                            sliderPosition,
                            '"></span><span class="label">',
                            maxLabel,
                            '</span></div>');
                    } else {
                        frag.push(
                            '<span class="label">',
                            minLabel,
                            '</span>',
                            '<ul class="wegas-string-input-checkboxes inline">'
                        );
                        for (i in choices) {
                            var value = choices[i];
                            frag.push('<li role="button" tabindex="0" data-value=',
                                JSON.stringify(value.get("name")),
                                ' class="checkbox',
                                (value.get("name") === this.getCachedValue() ? ' selected"' : '"'),
                                '></li>');
                        }
                        frag.push('</ul>');
                        frag.push('<span class="label">' + maxLabel + '</span>');
                    }
                }
                
                CB.one(".wegas-survey-choicesinput-content").setContent(frag.join(""));
                if (!this.isScale) {
                    this.equalizeWidths(CB.all("li"));
                }
                this.equalizeWidths(CB.all(".label"));
            }
        },
        getCurrentValue: function() {
            var option = this.get("contentBox").one(".wegas-survey-choicesinput-content select");
            if (option) {
                return decodeURIComponent(option.get("options").item(option.get("selectedIndex"))
                    .getAttribute("value"));
            } else {
                option = this.get("contentBox").one(".wegas-survey-choicesinput-content");
                if (option) {
                    return option.getContent();
                } else {
                    return undefined;
                }
            }
        },
        syncUI: function(quiet) {
            var desc, CB, value, select, values;
            this._quiet = quiet;
            CB = this.get("contentBox");
            desc = this.get("input");
            value = this.getCachedValue();
            
            var status = this.get("boundingBox").one(".wegas-survey-input-status"),
                hasValue = (value !== null && value !== '');
            if (!quiet) {
                if (desc.getInstance().get("isReplied")) {
                    status.addClass('input-isreplied');
                    if (!hasValue) {
                        status.addClass('input-isreplied-novalue');
                        status.setContent(I18n.t("survey.global.unavailableValue"));
                    }
                } else {
                    status.addClass('input-unreplied');
                }
            }
            if (this.get("readonly")) {
                value = desc.getLabelForName(value);
                if (!value) {
                    value = "<i>" + I18n.t("survey.editor.noValueProvided") + '</i>';
                }
                CB.one(".wegas-survey-choicesinput-content").setContent(value);
            } else if (hasValue) {
                var choices = desc.get("choices");
                if (choices && choices.length > 0) {
                    if (!value) {
                        value = '[]';
                    }
                    // value shall always be an array (even an empty one!)
                    if (value.indexOf("[") !== 0) {
                        values = [value];
                    } else {
                        values = JSON.parse(value);
                    }
                    var numSelectable = desc.get("maxSelectable") || 1,
                        maxReached = values.length >= numSelectable;

                    if (!this.isSlider) {
                        select = CB.one('.wegas-string-input-checkboxes');
                        select.all('.selected').removeClass('selected');
                        select.toggleClass("maximumReached", maxReached && numSelectable !== 1);

                        for (var i in values) {
                            select.all('li[data-value="' + values[i] + '"]').addClass('selected');
                        }
                    }
                }
            }
            this._quiet = false;
        },
        bindUI: function() {
            var CB = this.get("contentBox"),
                select = CB.one('select');
            if (select) {
                this.handlers.push(
                    select.on('change', this.updateFromSelect, this)
                    );
            }
            var ul = CB.one('ul');
            if (ul) {
                this.handlers.push(CB.delegate('key', this.updateFromUl, 'up:13,32', 'li', this));
                this.handlers.push(CB.delegate('click', this.updateFromUl, 'li', this));
            }
            
            if (this.isSlider) {
                var ctx = this;
                this.get("contentBox").one(".choices-slider").getDOMNode().oninput = function() {
                    ctx.updateFromSlider(+this.value);
                };
            }            
            
            this.handlers.updateDesc = Y.Wegas.Facade.Variable.after("updatedDescriptor", function(e) {
                var me = this.get("input");
                if (me && me.get("id") === e.entity.get("id")) {
                    this.parseLocalURLs(e.entity);
                    this.set("input", e.entity);
                    this.renderUI();
                    this.bindUI();
                    try {
                        this.syncUI();
                    } catch(e) {
                        // ignore
                    }
                }
            }, this);
        },
        
        // Transforms any URLs to local "Files" into "data-file" attribute:
        parseLocalURLs: function(entity) {
            var choices = entity.get("choices"),
                edited = false;
            for (var c in choices) {
                var currChoice = choices[c],
                    translations = currChoice.get("label") && currChoice.get("label").get("translations");
                for (var lang in translations) {
                    var currString = translations[lang].get("translation");
                    if (currString.indexOf("src=") > -1 || currString.indexOf("href=") > -1) {
                        // Code borrowed from wegas-inputex-rte.js:
                        currString = currString
                                .replace(
                                    new RegExp("((src|href)=\"[^\"]*/rest/File/GameModelId/[^\"]*/read/([^\"]*)\")", "gi"),
                                    "data-file=\"$3\"") // Replace absolute path with injector style path
                                .replace(
                                    new RegExp("((src|href)=\"[^\"]*/rest/GameModel/[^\"]*/File/read/([^\"]*)\")", "gi"),
                                    "data-file=\"$3\""); // Replace absolute path with injector style path)
                        translations[lang].set("translation", currString);
                        edited = true;
                    }
                }
            }
            if (edited) {
                Y.later(500, this, function() {
                    var config = {
                        request: "/" + entity.get("id"),
                        cfg: {
                            updateCache: false,
                            method: "put",
                            data: entity
                        },
                        on: {
                            success: Y.bind(function(e) {
                                Y.log("ChoiceDescriptor URLs were updated");
                            }, this),
                            failure: Y.bind(function(e) {
                                Y.log("Internal error: Something went wrong in parseLocalURLs");
                            }, this)
                        }
                    };
                    Y.Wegas.Facade.Variable.sendRequest(config);
                });
            }
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        updateFromSlider: function(val) {
            var choices = this.get("input").get("choices"),
                nbChoices = choices.length,
                interval = SLIDER_MAX/(nbChoices-1),
                index = Math.floor(val / interval);
            if (val % interval >= interval/2 && val < SLIDER_MAX) {
                index++;
            }
            var res = choices[index].get("name");
            if (this.updateValue(res)) {
                this.setCustomItem(val);
            };
        },
        updateFromUl: function(e) {
            var value, v;
            if (!this.get('readonly.evaluated')) {
                value = e.target.getData().value || (e.currentTarget && e.currentTarget.getData().value);
                v = JSON.parse('"' + value + '"');
                this.updateValue(v);
            }
        },
        updateFromSelect: function(e) {
            if (!this.get('readonly.evaluated')) {
                this.updateValue(e.target.get('value'));
            }
        },
        updateValue: function(value) {
            var desc = this.get("input"),
                numSelectable, iValue, values,

                allowedValues = desc.get('choices');
            if (allowedValues && allowedValues.length > 0) {
                if (value === '' &&
                    !Y.Array.find(allowedValues, function(item) {
                        return item.get("name") === value;
                    }, this)) {
                    this.showMessage('error', Y.Wegas.I18n.t('errors.prohibited', {
                        value: desc.getLabelForAllowedValue(value),
                        values: Y.Array.map(allowedValues, function(item) {
                            return I18n.t(item.get("label"));
                        })
                    }));
                    return false;
                }
                numSelectable = desc.get("maxSelectable");
                if (numSelectable > 1) {
                    iValue = this.getCachedValue();
                    if (!iValue) {
                        values = [];
                    } else {
                        if (iValue.indexOf("[") !== 0) {
                            values = [iValue];
                        } else {
                            values = JSON.parse(iValue);
                        }
                    }
                    if (values.indexOf(value) >= 0) {
                        values.splice(values.indexOf(value), 1);
                    } else {
                        if (values.length >= numSelectable) {
                            this.showMessage('error', Y.Wegas.I18n.t('errors.limitReached', {
                                num: numSelectable
                            }));
                            return false;
                        } else {
                            values.push(value);
                        }
                    }
                    value = JSON.stringify(values);
                } else {
                    // Only one value -> replace
                    value = JSON.stringify([value]);
                }
            }

            if (!this._quiet) {
                this.setCachedValue(value);
            }
            Y.log("Selected value(s): " + value);
            this.syncUI(true);
            return true;
        },
        logValue:function() {
            var value = this.getCachedValue(),
                cleanValue,
                hasValue = typeof value === 'string' && value !== this._initialValue;
            if (hasValue) {
                cleanValue = Y.Wegas.Helper.stripHtml(value.replace(/"/g, "\\\""));
                Y.Wegas.Facade.Variable.script.remoteFnEval(
                    function(value, survname, inputname) {
                        surveyXapi.post(surveyXapi.choiceInput(value, survname, inputname));
                    },
                    cleanValue,
                    this.surveyName,
                    this.get("input").get("name")
                );
                this.fire("saved", {id: this.inputId, value: cleanValue});
                this._initialValue = value;
            }
        }
    }, {
        EDITORNAME: "Choice input",
        ATTRS: {
            surveyWidget: {
                type: "SurveyWidget"
            },
            input: {
                type: "SurveyChoicesDescriptor"
            },
            number: {
                type: "string",
                value: ""
            },
            readonly: {
                type: "boolean",
                value: false
            }
        }
    });
    Wegas.SurveyChoicesInput = SurveyChoicesInput;
   
   
    
    /**
     * @name Y.Wegas.SurveyOrchestrator
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable
     * @class  class loader of wegas pages
     * @constructor
     * @description
     */
    SurveyOrchestrator = Y.Base.create("wegas-survey-orchestrator", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE:
            "<div>" +
            "    <div class=\"global-header\">" +
            "        <h1>" + I18n.t("survey.orchestrator.globalTitle") + "</h1>" +
            "    </div>" +
            "    <div class=\"warning\"></div>" +
            "    <div class=\"survey-mixer\">" +
            "    </div>" +
            "    <div class=\"selected-survey-list\">" +
            "    </div>" +
            "</div>",
    
        initializer: function() {
            this.handlers = [];
            // List of all known surveys:
            this.knownSurveys = {};
            // List of surveys incorporated in the game:
            this.managedSurveys = {};
            this._monitoredData = {};
            this.datatables = {};
            this._freeForAll = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties.freeForAll");
            xAPI.testXapi();
        },
        // Adds the given survey descriptor to the list of known surveys
        registerSurvey: function(sd) {
            var descrId = sd.get("id");
            if (!this.knownSurveys[descrId]) {
                this.knownSurveys[descrId] = {};
            }
        },
        // Removes the given survey descriptor from the list of known surveys
        deregisterSurvey: function(sd) {
            var descrId = sd.get("id");
            if (this.knownSurveys[descrId]) {
                delete this.knownSurveys[descrId];
                this.syncUI();
            }            
        },
        // Adds the given survey descriptor to the list of managed surveys
        selectSurvey: function(sd) {
            var descrId = sd.get("id");
            if (!this.managedSurveys[descrId]) {
                this.managedSurveys[descrId] = {
                    refreshButton: null
                };
                this.syncUI();
            }            
        },
        // Removes the given survey descriptor from the list of managed surveys
        deselectSurvey: function(sd) {
            var descrId = sd.get("id");
            if (this.managedSurveys[descrId]) {
                delete this.managedSurveys[descrId];
                this.syncUI();
            }            
        },
        renderUI: function() {
            var logId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties").get("val").logID;
            if (!logId) {
                var msg = I18n.t("survey.orchestrator.noLogId");
                this.get("contentBox").one(".warning").setContent(msg);
            } else {
                Y.log("Log ID = " + logId);
            }
            // Get updates about all existing surveys and list them:
            Y.Array.each(Y.Wegas.Facade.Variable.cache.findAll("@class", "SurveyDescriptor"),
                function(sd) {
                    this.registerSurvey(sd);
                    this.selectSurvey(sd);
                }, this);
        },
        _getMonitoredData: function(survId) {
            var survDescr = Y.Wegas.Facade.Variable.cache.findById(survId);
            if (survDescr){
                var survName = survDescr.get("name"),
                    ctx = this;
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/Script/Run/" + Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("id"),
                    cfg: {
                        method: "POST",
                        headers: {"Managed-Mode": false},
                        data: {
                            "@class": "Script",
                            content: "SurveyHelper.summarize('" + survName + "');"
                        }
                    },
                    on: {
                        success: function(e) {
                            ctx._monitoredData[survId] = e.response.results;
                            ctx.syncTable(survId);
                        },
                        failure: function(e) {
                            if (e && e.response && e.response.results && e.response.results.message && e.response.results.message.indexOf("undefined in SurveyHelper")) {
                                ctx.showMessage("error", "Please include server script : \"wegas-app/js/server/\"");
                            }
                        }
                    }
                });
            }
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         */
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.Variable.after("updatedDescriptor", this.onUpdatedDescriptor, this));
            this.handlers.push(Y.Wegas.Facade.Variable.after("added", this.onAddedDescriptor, this));
            this.handlers.push(Y.Wegas.Facade.Variable.after("delete", this.onDeletedDescriptor, this));

            this.get(CONTENTBOX)
                .delegate("click", this.onRequest, ".selected-survey .request-survey", this);

            this.get(CONTENTBOX).delegate("click", this.refresh, ".selected-survey .survey-header .survey-refresh", this);
        },
        
        onUpdatedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.registerSurvey(entity);
                // @TODO distinguish between known and actually managed surveys
                this.selectSurvey(entity);
                this.syncUI();
            }
        },

        onAddedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.registerSurvey(entity);
                // @TODO distinguish between known and actually managed surveys
                this.selectSurvey(entity);
                this.syncUI();
            }
        },

        onDeletedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.deregisterSurvey(entity);
                // @TODO distinguish between known and actually managed surveys
                this.deselectSurvey(entity);
                this.syncUI();
            }
        },

        refresh: function(e) {
            var survId = e.target.getData("id");
            if (!survId){
                // The id attribute is on the parent button:
                survId = e.target.get("parentNode").getData("id");
            }

            this.syncUI(survId);            
        },

        /**
         * @function
         * @private
         */
        syncUI: function(survDescrId) {
            var cb = this.get(CONTENTBOX);
            for (var survId in this.managedSurveys) {
                if (this.managedSurveys.hasOwnProperty(survId)) {
                    if (survDescrId && survDescrId !== survId) {
                        continue;
                    }
                    var currSurv = this.managedSurveys[survId],
                        survDescr = Y.Wegas.Facade.VariableDescriptor.cache.findById(survId);
                    if (!survDescr) {
                        // The survey descriptor has been deleted
                        var cbs = this.get(CONTENTBOX).one('.selected-survey[data-id="' + survId + '"]');
                        cbs.remove(true);
                        currSurv.refreshButton && currSurv.refreshButton.destroy();
                        delete this.managedSurveys[survId];
                        delete this.knownSurveys[survId];
                        continue;
                    } else if (!currSurv.refreshButton) {
                        // The survey descriptor has just been created, add the HTML block:
                        var html =
                            "<div class=\"selected-survey\" data-id=\"" + survId + "\">" +
                            "   <div class=\"survey-header\">" +
                            "       <span class=\"survey-title\"></span>" +
                            "       <span class=\"survey-refresh\"></span>" +
                            "    </div>" +
                            "    <div class=\"control-panel\">" +
                            "        <div class=\"status-line\">" +
                                         I18n.t("survey.orchestrator.currentStatus") +
                            "            <span class=\"status\">status</span>" +
                            "            <button class=\"request-survey\" data-id=\"" + survId + "\">" + 
                                             I18n.t("survey.orchestrator.requestButton") + 
                            "            </button>" +
                            "        </div>" +
                            "    </div>" +
                            "    <div class=\"monitoring\"></div>" +
                            "</div>";

                        var surveyList = cb.one(".selected-survey-list").insert(html),
                            newSurvey = surveyList.one('[data-id="' + survId + '"]');
                        
                        currSurv.refreshButton = new Y.Button({
                            label: "<i class=\"fa fa-3x fa-refresh\"></i>",
                            visible: true
                        }).render(newSurvey.one(".survey-refresh"));
                        currSurv.refreshButton.get(CONTENTBOX).setAttribute("data-id", survId);

                        newSurvey.one(".survey-header .survey-title")
                            .setContent(I18n.t(survDescr.get("label")));
                    
                    } else {
                        // Just update the survey title :
                        var currSurvey = cb.one('.selected-survey-list [data-id="' + survId + '"] .survey-header .survey-title');
                        currSurvey.setContent(I18n.t(survDescr.get("label")));
                    }
                    this._getMonitoredData(survId);
                }
            }
        },
        
        statusToString: function(survey) {
            if (!survey.active) {
                return I18n.t("survey.errors.inactive");
            } else {
                switch (survey.status) {
                    case ORCHESTRATION_PROGRESS.NOT_STARTED:
                        return I18n.t("survey.orchestrator.notStarted");
                    case ORCHESTRATION_PROGRESS.REQUESTED:
                        return I18n.t("survey.orchestrator.requested");
                    case ORCHESTRATION_PROGRESS.ONGOING:
                        return I18n.t("survey.orchestrator.ongoing");
                    case ORCHESTRATION_PROGRESS.COMPLETED:
                        return I18n.t("survey.orchestrator.completed");
                    case ORCHESTRATION_PROGRESS.CLOSED:
                        return I18n.t("survey.orchestrator.closed");
                    default:
                        return "Internal error";
                }
            }
        },
        
        syncTable: function(survId) {
            var team,
                teamsTable = [],
                nbTeams = 0,
                survData = this._monitoredData[survId],
                cb = this.get(CONTENTBOX).one('.selected-survey[data-id="' + survId + '"]'),
                refreshButton = this.managedSurveys[survId].refreshButton.get("contentBox").one("i");
            
            refreshButton.addClass("fa-spin");
            
            cb.one(".status-line .status").setContent(this.statusToString(survData));
            if (survData.active === true &&
                survData.status === ORCHESTRATION_PROGRESS.NOT_STARTED) {
                cb.one(".request-survey").show();
            } else {
                cb.one(".request-survey").hide();
            }
            
            if (survData.status !== ORCHESTRATION_PROGRESS.NOT_STARTED) {
                teamsTable.push(
                    '<table class="teams-table"><thead><tr><td>' +
                    I18n.t("survey.orchestrator.teamOrPlayer") +
                    '</td><td>' +
                    I18n.t("survey.orchestrator.teamStatus") +
                    '</td><td>' +
                    I18n.t("survey.orchestrator.teamRepliesCompulsory") +
                    '</td><td>' +
                    I18n.t("survey.orchestrator.teamRepliesOptional") +
                    '</td></tr></thead><tbody>');
                for (team in survData.data) {
                    var data = survData.data[team];
                    nbTeams++;
                    teamsTable.push(
                        '<tr><td class="name">' +
                        data.name +
                        '</td><td class="status">' +
                        this.statusToString(data) +
                        '</td><td class="replied">' +
                        data.replied + ' / ' + data.activeInputs +
                        '</td><td class="repliedOptional">' +
                        data.optionalReplied + ' / ' + data.activeOptionalInputs +
                        '</td></tr>');
                }
                if (nbTeams) {
                    var monitoring = cb.one(".monitoring"),
                        menu;
                    teamsTable.push('</tbody></table><span class="menu"></span>');
                    monitoring.setContent(teamsTable.join(""));
                    menu = monitoring.one(".menu");
                    this.setTableVisibility(monitoring);
                    menu.on("click", Y.bind(function() {
                        this.setTableVisibility(monitoring, true);
                    },this));
                }
            } else {
                cb.one(".monitoring").setContent('');
            }
            
            Y.later(500, this, function() {
                refreshButton.removeClass("fa-spin");
            });
        },
        
        setTableVisibility: function(monitoringWrapper, toggle){
            var tbody = monitoringWrapper.one("tbody"),
                menu = monitoringWrapper.one(".menu"),
                makeVisible = monitoringWrapper.hasClass("open-menu");
            if (toggle) {
                makeVisible = !makeVisible;
            }
            if (makeVisible) {
                tbody.show();
                menu.setContent('<i class="fa fa-chevron-circle-up"></i>');
                monitoringWrapper.addClass("open-menu");
            } else {
                tbody.hide();
                menu.setContent('<i class="fa fa-chevron-circle-down"></i>');
                monitoringWrapper.removeClass("open-menu");
            }
        },
        
        /**
         * @function
         * @private
         * @description Destroy widget and detach all functions created by this widget
         */
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        
        // @TODO: in team playing mode, ask if we should impact teams or players !
        onRequest: function(e) {
            var ctx = this;
            Y.use(["wegas-dashboard-modals"], function(Y) {
                var survId = e.target.getData()["id"],
                    survName = Y.Wegas.Facade.Variable.cache.findById(survId).get("name"),
                    script = "SurveyHelper.request('" + survName + "')",
                    // Hack to impact all teams:
                    team = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                    player = Y.Wegas.Facade.Game.cache.getCurrentPlayer();
                if (!team.get("players")) {
                    // Hack in scenarist mode:
                    team.set("players", [player]);
                }
                new Y.Wegas.ImpactsTeamModal({
                    "team": team,
                    "customImpacts": [[
                            "Do you really want to launch this survey?",
                            script
                        ]],
                    "showAdvancedImpacts": false
                }).render();
                // Catch refresh signal generated when the modal is closed:
                var handler = Y.on("dashboard:refresh", function() {
                    handler.detach();
                    ctx.syncUI(survId);
                });
            });
            
/* This version does not yield the required client-side updates:
            var ctx = this,
                survId = e.target.getData()["id"],
                survName = Y.Wegas.Facade.Variable.cache.findById(survId).get("name"),
                script = "SurveyHelper.request('" + survName + "')";

            Y.Wegas.Facade.Variable.sendRequest({
                request: "/Script/Run/" + Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("id"),
                cfg: {
                    method: "POST",
                    headers: {"Managed-Mode": false},
                    data: {
                        "@class": "Script",
                        content: script
                    }
                },
                on: {
                    success: function(e) {
                        ctx._monitoredData[survId] = e.response.results;
                        ctx.syncTable(survId);
                    },
                    failure: function(e) {
                        if (e && e.response && e.response.results && e.response.results.message && e.response.results.message.indexOf("undefined in SurveyHelper")) {
                            ctx.showMessage("error", "Please include server script : \"wegas-survey/server/\"");
                        }
                    }
                }
            });
*/
        },
    }, {
        /** @lends Y.Wegas.SurveyOrchestrator */
        EDITORNAME: "Survey Orchestrator",
        ATTRS: {
        }
    });
    Wegas.SurveyOrchestrator = SurveyOrchestrator;
    
});
