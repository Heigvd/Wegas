/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Jarle Hulaas
 */
YUI.add('wegas-surveylistener', function(Y) {
    "use strict";

    var SurveyListener, Plugin = Y.Plugin,
        // In increasing order of progress, status of a given survey:
        ORCHESTRATION_PROGRESS = {
            NOT_STARTED: "NOT_STARTED",
            REQUESTED: "REQUESTED",
            ONGOING: "ONGOING",
            COMPLETED: "COMPLETED",
            CLOSED: "CLOSED"
        };
        

    SurveyListener = Y.Base.create("wegas-surveylistener", Plugin.Base, [], {
        initializer: function() {
            this.handlers = [];
            // Mapping of survey descr id -> survey inst update handler.
            this.knownSurveyHandlers = {};
            this.currentSurvey = null;
            // Get updates about any surveys included dynamically in the game:
            this.handlers.push(Y.Wegas.Facade.Variable.after("updatedDescriptor", this.onUpdatedDescriptor, this));
            this.handlers.push(Y.Wegas.Facade.Variable.after("added", this.onUpdatedDescriptor, this));
            this.handlers.push(Y.Wegas.Facade.Variable.after("delete", this.onDeletedDescriptor, this));
            // Get updates about all existing surveys:
            Y.Array.each(Y.Wegas.Facade.Variable.cache.findAll("@class", "SurveyDescriptor"),
                this.registerSurvey, this);
            // Once host app is rendered, check if we should display a survey:
            this.afterHostEvent("render", this.checkSurveys);
            // This is for the Preview pane:
            Y.SurveyListenerSingleton = this;
        },
        onUpdatedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.registerSurvey(entity);
            }
        },
        onDeletedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.deregisterSurvey(entity);
            }
        },
        
        // Check if we should display one of the known surveys:
        checkSurveys: function() {
            if (!this.currentSurvey) {
                for (var id in this.knownSurveyHandlers) {
                    var inst = Y.Wegas.Facade.Variable.cache.findById(id).getInstance(),
                        status = inst.get("status");
                    if (inst.get("active") &&
                        status === ORCHESTRATION_PROGRESS.REQUESTED ||
                        status === ORCHESTRATION_PROGRESS.ONGOING ||
                        status === ORCHESTRATION_PROGRESS.COMPLETED) {
                        this.showSurvey(inst);
                        return;
                    }
                }
            }
        },
        
        // Register a survey descriptor in order to monitor updates to its instance
        registerSurvey: function(sd) {
            var descrId = sd.get("id"),
                inst = sd.getInstance();
            if (this.knownSurveyHandlers[descrId]) {
                // Updates for an already known descriptor:
                this.knownSurveyHandlers[descrId].detach();
            }
            if (inst) {
                this.knownSurveyHandlers[descrId] = 
                    Y.Wegas.Facade.Instance.after(inst.get("id") + ":updatedInstance", this.onUpdatedInstance, this);
            }
        },

        deregisterSurvey: function(sd) {
            var descrId = sd.get("id");
            if (this.currentSurvey && this.currentSurvey.get("parentId") === descrId) {
                this.retireSurvey();
                this.checkSurveys();
            }
            if (this.knownSurveyHandlers[descrId]) {
                this.knownSurveyHandlers[descrId].detach();
                delete this.knownSurveyHandlers[descrId];
            }
        },

        // Sets a survey as the exclusive one (for the survey editor)
        // by deregistering all other surveys and preventing new registrations.
        discardOtherSurveys: function(sd) {
            var descrId = sd.get("id");
            // Make sure the given survey is registered:
            if (!this.knownSurveyHandlers[descrId]) {
                this.registerSurvey(sd);
            }
            // Prevent registration of any new surveys:
            this.onUpdatedDescriptor = function(){};
            // Deregister all other surveys:
            for (var id in this.knownSurveyHandlers){
                if (+id !== descrId) {
                    var descr = Y.Wegas.Facade.Variable.cache.findById(id);
                    this.deregisterSurvey(descr);
                }
            }
            this.checkSurveys();
        },
        
        onUpdatedInstance: function(e) {
            var entity = e.entity,
                status = entity.get("status");
            if (status === ORCHESTRATION_PROGRESS.CLOSED) {
                if (this.currentSurvey && this.currentSurvey.get("id") === entity.get("id")) {
                    this.retireSurvey();
                    this.checkSurveys();
                }
            } else if (status === ORCHESTRATION_PROGRESS.REQUESTED) {
                this.showSurvey(entity);
            } else {
                // do nothing
            }
        },
        
        destructor: function() {
            var id;
            for (id in this.handlers) {
                this.handlers[id].detach();
            }
            for (id in this.knownSurveyHandlers){
                this.knownSurveyHandlers[id].detach();
            }
            this.retireSurvey();
        },
        
        // Removes the current survey from the screen.
        retireSurvey: function() {
            if (this.currentSurvey) {
                var container = Y.one(".wegas-playerview .wegas-pageloader-content").removeClass("wegas-survey-ontop");
                container.one(".wegas-survey-overlay").remove(true);
                this.currentSurvey = null;
                if (this.currentWidget && !this.currentWidget.get("destroyed")) {
                    this.currentWidget.destroy();
                }
                this.currentWidget = null;
            }
        },
        
        // Displays the given survey which has been "requested"
        showSurvey: function(inst) {
            var ctx = this,
                container = Y.one(".wegas-playerview .wegas-pageloader-content");
            if (!container) {
                // We are not in a playerview:
                return;
            }
            Y.use(["wegas-survey-widgets", "wegas-popuplistener"], function(Y) {
                if (ctx.currentSurvey) {
                    if (ctx.currentSurvey.get("id") === inst.get("id")) {
                        // The survey has been reset, restart the widget:
                        ctx.retireSurvey();
                    } else {
                        Y.log("Survey request ignored, another one is already active");
                        return;
                    }
                }
                var status = inst.get("status");
                if (inst.get("active") &&
                    status !== ORCHESTRATION_PROGRESS.NOT_STARTED &&
                    status !== ORCHESTRATION_PROGRESS.CLOSED) {
                    ctx.currentSurvey = inst;
                    var cfg, wrapper;
                    container.addClass("wegas-survey-ontop");
                    container.insert('<div class="wegas-survey-overlay wegas-survey-page"></div>', 0);
                    wrapper = container.one(".wegas-survey-overlay");
                    cfg = {
                        survey: {
                                "@class": "Script",
                                "content": "Variable.find(gameModel, \"" + ctx.currentSurvey.getDescriptor().get("name") + "\");"
                        },
                        displayCloseButton: true,
                        oneQuestionPerPage: true
                    };
                    ctx.currentWidget = new Y.Wegas.SurveyWidget(cfg).render(wrapper);
                    // For displaying error messages in the survey:
                    ctx.currentWidget.plug(Plugin.PopupListener);
                }
            });
        }
    }, {
        NS: "surveylistener",
        ATTRS: {
        }

    });
    Plugin.SurveyListener = SurveyListener;

});
