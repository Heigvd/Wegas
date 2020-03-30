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

    var SurveyListener, Plugin = Y.Plugin;

    SurveyListener = Y.Base.create("wegas-surveylistener", Plugin.Base, [], {
        initializer: function() {
            this.handlers = [];
            // Mapping of survey descr id -> survey inst update handler.
            this.knownSurveysHandlers = {};
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
                for (var id in this.knownSurveys) {
                    var inst = Y.Wegas.Facade.Variable.cache.findById(id).getInstance();
                    if (inst.get("active") &&
                        inst.get("requested") &&
                        inst.get("validated") === false) {
                        this.showSurvey(inst);
                        return;
                    }
                }
            }
        },
        
        // Register a survey descriptor in order to monitor updates to its instance
        registerSurvey: function(sd) {
            var descrId = sd.get("id"),
                instId = sd.getInstance().get("id");
            if (this.knownSurveys[descrId]) {
                // Updates for an already known descriptor:
                this.knownSurveys[descrId].detach();
            }
            this.knownSurveys[descrId] = 
                Y.Wegas.Facade.Instance.after(instId + ":updatedInstance", this.onUpdatedInstance, this);
        },

        deregisterSurvey: function(sd) {
            var descrId = sd.get("id"),
                instId = sd.getInstance().get("id");
            if (this.currentSurvey && this.currentSurvey.get("id") === instId) {
                this.retireSurvey();
            }
            if (this.knownSurveys[descrId]) {
                this.knownSurveys[descrId].detach();
                delete this.knownSurveys[descrId];
            }
        },

        onUpdatedInstance: function(e) {
            var entity = e.entity;
            if (entity.get("closed")) {
                if (this.currentSurvey && this.currentSurvey.get("id") === entity.get("id")) {
                    this.retireSurvey();
                    this.checkSurveys();
                }
            } else if (entity.get("validated")) {
                // do nothing
            } else if (entity.get("started")) {
                // do nothing
            } else if (entity.get("requested")) {
                this.showSurvey(entity);
            }
        },
        
        destructor: function() {
            var id;
            for (id in this.handlers) {
                this.handlers[id].detach();
            }
            for (id in this.knownSurveys){
                this.knownSurveys[id].detach();
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
            var ctx = this;
            Y.use(["wegas-survey-widgets", "wegas-popuplistener"], function(Y) {
                if (ctx.currentSurvey) {
                    // Ignore this survey, since there's already another one being displayed.
                    Y.log("Survey request ignored, another one is already active");
                    return;
                }
                if (inst.get("active") && inst.get("validated") === false) {
                    ctx.currentSurvey = inst;
                    var cfg, container, wrapper;
                    container = Y.one(".wegas-playerview .wegas-pageloader-content").addClass("wegas-survey-ontop");
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
