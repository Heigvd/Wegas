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
YUI.add("wegas-survey-orchestrator", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox",
        BOUNDINGBOX = "boundingBox",
        SERVER_SCRIPT_PATH = "wegas-app/js/server/",
        WEGAS_MAX_NAME_LENGTH = 255,
        SURVEY_NAME_DATE = "_CrDat_",
        SURVEY_NAME_DATE_REGEXP = /(_CrDat_[0-9]+)$/i,  // Survey name (script alias) must end with this expression.
        PUBLISHED = true,
        UNPUBLISHED = !PUBLISHED,
        Wegas = Y.Wegas,
        SurveyOrchestrator,
        SpinButton,
        // In increasing order of progress, status received from server-side script wegas-survey-helper:
        ORCHESTRATION_PROGRESS = {
            NOT_STARTED: "NOT_STARTED",
            REQUESTED: "REQUESTED",
            ONGOING: "ONGOING",
            COMPLETED: "COMPLETED",
            CLOSED: "CLOSED"
        },
        MAX_LISTABLE_SURVEYS = 20;

    /**
     * @name SpinButton
     * @extends Y.Button
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @description Subclass of Y.Button with icon spinning and integrated onClick handling.
     */
    SpinButton = Y.Base.create('spin-button', Y.Button,
            [Y.WidgetChild, Wegas.Widget], {
                
        initializer: function() {
            this.autoSpin = this.get("autoSpin");
            this.onClickHandler = this.get("onClick");
            this.surveyId = this.get("surveyId");
            if (this.onClickHandler && !this.surveyId) {
                Y.log("Missing surveyId in new SpinButton");
            }
            this.startTime = Date.now();
        },
        
        bindUI: function() {
            if (this.autoSpin || this.onClickHandler) {
                this.handler =
                    this.on("click", function() {
                        this.autoSpin && this.startSpinning();
                        if (this.onClickHandler) {
                            // The callback will need the survey ID and sometimes
                            // a reference to this button to turn off spinning
                            this.onClickHandler(this.surveyId, this);
                        };
                    }, this);
            }
        },

        startSpinning: function() {
            this.startTime = Date.now();
            this.get(BOUNDINGBOX).addClass("spinner-icon");
        },
        
        stopSpinning: function() {
            var delta = Date.now() - this.startTime;
            if (delta < 2000) {
                Y.later(2000-delta, this, function() {
                    if (!this.get("destroyed")) {
                        this.get(BOUNDINGBOX).removeClass("spinner-icon");
                    }
                });
            } else {
                if (!this.get("destroyed")) {
                    this.get(BOUNDINGBOX).removeClass("spinner-icon");
                }
            }
        },
        
        destructor: function() {
            this.handler && this.handler.detach();
        }
        
    }, {
        ATTRS: {
            surveyId: {
                type: 'number',
                value: 0
            },
            autoSpin: {
                type: 'boolean',
                value: false
            },
            onClick: {
                type: 'function',
                value: null
            }
        }
    }),
    
    /**
     * @name Y.Wegas.SurveyOrchestrator
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
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
            "        <div class=\"search-runnable-surveys\">" + I18n.t("survey.orchestrator.searchExternalSurveys") + "</div>" +
            "        <div class=\"runnable-surveys\" style=\"display:none;\"><div class=\"close\"></div>" +
            "           <div class=\"title standard\">" + I18n.t("survey.orchestrator.standardSurveysTitle") + "</div>" +
            "           <div class=\"list standard\"></div>" +
            "           <div class=\"title own\">" + I18n.t("survey.orchestrator.externalSurveysTitle") + "</div>" +
            "           <div class=\"list own\"></div>" +
            "        </div>" +
            "    </div>" +
            "    <div class=\"running-surveys\">" +
            "       <div class=\"title\">" + I18n.t("survey.orchestrator.activeSurveysTitle") + "</div>" +
            "       <div class=\"list\"></div>" +
            "       <div class=\"empty-message\">(" +
                        I18n.t("survey.orchestrator.noSurveyFound") +
                    ')</div>' +
            "    </div>" +
            "</div>",
    
        initializer: function() {
            this.handlers = [];
            this.knownSurveys = null;            
            this._monitoredData = {};
            this.datatables = {};
            this.playedIndividually = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties").get("val.freeForAll");
            this.checkXapiPath();            
        },
        
        // Persists the current gameModel "as is".
        persistCurrentGameModel: function(successCb, failureCb) {
            var gm = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                gameModelId = gm.get("id"),
                config = {
                    request: '/' + gameModelId,
                    cfg: {
                        updateCache: true,
                        method: "PUT",
                        data: gm
                    },
                    on: {
                        success: Y.bind(function(e) {
                            successCb && successCb(gameModelId);
                        }, this),
                        failure: Y.bind(function(e) {
                            failureCb && failureCb(gameModelId);
                        }, this)
                }
            };
            Y.Wegas.Facade.GameModel.sendRequest(config);
        },

        // Persists the given SurveyDescriptor "as is".
        // No recursive saving of child sections or inputs.
        persistSurvey: function(surveyDescr, successCb, failureCb) {
            // Full request: /rest/GameModel/<gameModelId>/VariableDescriptor/<variableDescriptorId>
            var gameModelId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id"),
                surveyId = surveyDescr.get("id"),
                config = {
                    request: '/' + gameModelId + "/VariableDescriptor/" + surveyId,
                    cfg: {
                        updateCache: true,
                        method: "PUT",
                        data: surveyDescr
                    },
                    on: {
                        success: Y.bind(function(e) {
                            successCb && successCb(surveyId);
                        }, this),
                        failure: Y.bind(function(e) {
                            failureCb && failureCb(surveyId);
                        }, this)
                }
            };
            Y.Wegas.Facade.GameModel.sendRequest(config);
        },

        // Checks that server script paths enable xAPI logging and updates server script paths if needed.
        // Does nothing if the gameModel has no internal surveys.
        checkXapiPath: function(){
            if (Y.Wegas.Facade.Variable.cache.find("@class", "SurveyDescriptor")) {
                var gm = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                    props = gm.get("properties"),
                    serverScripts = props.get("val.scriptUri");
                if (serverScripts.indexOf(SERVER_SCRIPT_PATH) < 0) {
                    serverScripts += (serverScripts ? ';' : '') + SERVER_SCRIPT_PATH;
                    props.set("val.scriptUri", serverScripts);
                    this.persistCurrentGameModel();
                }
            } else {
                // Remove script path from gameModel properties ?
            }
        },
        
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                logId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties").get("val").logID;
            if (!logId) {
                var msg = I18n.t("survey.orchestrator.noLogId");
                this.get("contentBox").one(".warning").setContent(msg);
            } else {
                Y.log("Log ID = " + logId);
            }

            this.searchExternalButton = new SpinButton({
                label: '<i class="fa fa-search icon"></i>',
                onClick: Y.bind(this.onSearchAllSurveys, this),
                autoSpin: true
            }).render(cb.one(".search-runnable-surveys"));
            this.closeSearchButton = new SpinButton({
                label: '<i class="fa fa-times"></i>',
                onClick: Y.bind(this.closeSurveyMixer, this)
            }).render(cb.one(".runnable-surveys .close"));
            
            this.get(BOUNDINGBOX).ancestor().addClass("survey-orchestrator-parent");
        },
        
        _getMonitoredData: function(surveyId) {
            var survDescr = Y.Wegas.Facade.Variable.cache.findById(surveyId),
                refreshButton = this.knownSurveys[surveyId].buttons.refreshButton;
            if (survDescr){
                refreshButton.startSpinning();
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
                            ctx._monitoredData[surveyId] = e.response.results;
                            ctx.syncTable(surveyId);
                        },
                        failure: function(e) {
                            refreshButton.stopSpinning();
                            if (e && e.response && e.response.results && e.response.results.message && e.response.results.message.indexOf("undefined in SurveyHelper") >= 0) {
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
            var cb = this.get(CONTENTBOX);
            this.handlers.push(Y.Wegas.Facade.Variable.after("updatedDescriptor", this.onUpdatedDescriptor, this));
            this.handlers.push(Y.Wegas.Facade.Variable.after("added", this.onAddedDescriptor, this));
            this.handlers.push(Y.Wegas.Facade.Variable.after("delete", this.onDeletedDescriptor, this));
                        
            this.tooltip = new Wegas.Tooltip({
                delegate: cb,
                delegateSelect: ".survey-comments",
                render: true,
                showDelay: 100,
                autoHideDelay: 50000
            });
            this.tooltip.plug(Y.Plugin.Injector);
            this.tooltip.on("triggerEnter", this.onInfoTooltip, this);
            // Raise the tooltip above any DetailsPanel:
            this.tooltip.get(BOUNDINGBOX).setStyle('z-index', 100002);
        },
        
        // Returns an object containing all "own" surveys of the given list.
        getOwnSurveys: function(surveyList) {
            var own = {};
            for (var surveyId in surveyList) {
                var currSurv = surveyList[surveyId];
                if (currSurv.isWriteable) {
                    own[surveyId] = currSurv;
                }
            }
            return own;
        },

        syncOwnSurveys: function() {
            var ownList = this.getOwnSurveys(this.knownSurveys);
            this.displayOrderedList(ownList, this.get(CONTENTBOX).one(".runnable-surveys .list.own"));
        },
        
        // Adds the given survey descriptor to the list of known surveys
        // and updates display.
        registerInternalSurvey: function(sd) {
            var descrId = sd.get("id"),
                varSet = {},
                varList;
            if (!this.knownSurveys[descrId]) {
                varSet.gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel();
                varSet.game = Y.Wegas.Facade.Game.cache.getCurrentGame();
                varSet.isExternal = false;
                varSet.variables = [sd];
                varList = this.processVarSet([varSet], /* writeable= */ true);
                this.knownSurveys[descrId] = varList[descrId];
                this.syncOwnSurveys();
                this.syncUI(descrId);
            }
        },
        
        // Removes the given "own" survey descriptor from the list of known surveys
        // and updates the display.
        // Parameter sd is either a survey descriptor or a survey id.
        deregisterSurvey: function(sd) {
            var descrId = (typeof sd === 'number' || typeof sd === 'string' ? +sd : sd.get("id")),
                currSurv = this.knownSurveys[descrId],
                wasInternal;
            if (currSurv) {
                wasInternal = !currSurv.isExternal;
                for (var b in currSurv.buttons) {
                    currSurv.buttons[b].destroy();
                    // @TODO also detach related event handlers when not covered by delegate()
                }
                delete this.knownSurveys[descrId];
            }            
            var runnable = this.get(CONTENTBOX).one('.runnable-survey[data-surveyId="' + descrId + '"]');
            runnable && runnable.remove(true);
            if (wasInternal) {
                var running = this.get(CONTENTBOX).one('.running-survey[data-surveyId="' + descrId + '"]');
                running && running.remove(true);
                this.checkIfEmptyRunningSurveys();
            }
        },
        
        // Checks if an 'empty list' message is to be displayed
        checkIfEmptyRunningSurveys: function() {
            var cb = this.get(CONTENTBOX).one('.running-surveys');
            if (cb.all('.running-survey:not([hidden="hidden"])').size() === 0) {
                cb.one('.empty-message').show();
            } else {
                cb.one('.empty-message').hide();
            }
        },
        
        isExistingSurveyName: function(name) {
            for (var i in this.knownSurveys) {
                if (this.knownSurveys[i].isExternal) continue;  // @TODO review this
                if (this.knownSurveys[i].name === name) {
                    return true;
                }
            }
            return false;
        },
        
        // Called when a survey descriptor has been modified.
        onUpdatedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.deregisterSurvey(entity);
                this.registerInternalSurvey(entity);
            }
        },

        // Called when a survey has just been imported into the current game.
        onAddedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.registerInternalSurvey(entity);
                // In case we are inside the editor, try to notify the variable-treeview.
                // @TODO a bug prevents full update in Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("items")
                Y.Wegas.Facade.Variable.fire("rootUpdate");
            }
        },

        // Callback for editor mode
        onDeletedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                var surveyId = entity.get("id");
                this.deregisterSurvey(surveyId);
            }
        },

        // Opens up the detailed teams/players progress window.
        showProgressDetails: function(surveyId, btn) {
            this.showDetailsPanel(this.knownSurveys[surveyId]);
            this.syncUI(surveyId);    
            btn.stopSpinning();
        },

        // Refreshes data for the given "internal" survey.
        refresh: function(surveyId, btn) {
            this.overlayDetailsPanel(this.knownSurveys[surveyId]);
            this.syncUI(surveyId);
        },

        getFriendlyVarLabel: function(v) {
            var res = '',
                label = I18n.t(v.get("label"));
            if (v.get("editorTag")) {
                res += v.get("editorTag");
            }
            if (res && label) {
                res += ' - ';
            }
            if (label) {
                res += label;
            }
            if (!res) {
                res = v.get("name");
            }
            return res;
        },
        
        // Returns a unique name (script alias) for a new survey descriptor,
        // based on the current timestamp.
        newSurveyName: function(surveyId) {
            var descr = this.knownSurveys[surveyId],
                name = descr.name,
                newSuffix = SURVEY_NAME_DATE + Date.now(),
                newName = name.replace(SURVEY_NAME_DATE_REGEXP, newSuffix);
            if (newName !== name) {
                // Replacement was successful:
                return newName;
            } else {
                return name.substr(0, WEGAS_MAX_NAME_LENGTH-newSuffix.length) + newSuffix;
            }
        },
        
        // Imports given survey into the current gameModel
        importSurvey: function(surveyId, scope, setPublished, successCb, failureCb) {
            return new Y.Promise(Y.bind(function(resolve) {
                // Full request: /rest/GameModel/<gameModelId>/VariableDescriptor/CherryPick/<variableDescriptorId>/<newName>/<newScopeType>
                var gameModelId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id"),
                    varName = this.newSurveyName(surveyId),
                    config = {
                        request: '/' + gameModelId + "/VariableDescriptor/CherryPick/" + surveyId + '/' + varName + (scope ? '/' + scope : ''),
                        cfg: {
                            updateCache: true,
                            method: "POST"
                        },
                        on: {
                            success: Y.bind(function(e) {
                                var newDescr = e.response.entity;
                                if (!setPublished) {
                                    newDescr.set("isPublished", false);
                                    this.persistSurvey(newDescr,
                                        Y.bind(function() {
                                            this.registerInternalSurvey(newDescr);
                                            successCb && successCb(newDescr);
                                            resolve("OK");                                            
                                        }, this),
                                        Y.bind(function() {
                                            // Register the new survey even if we did not manage to update it
                                            this.registerInternalSurvey(newDescr);
                                            failureCb && failureCb(e);
                                            resolve("Not OK");
                                        }, this)
                                    );
                                } else {
                                    this.registerInternalSurvey(newDescr);
                                    successCb && successCb(newDescr);
                                    resolve("OK");                                                                                
                                }
                            }, this),
                            failure: Y.bind(function(e) {
                                failureCb && failureCb(e);
                                resolve("Not OK");
                            }, this)
                        }
                    };
                Y.Wegas.Facade.GameModel.sendRequest(config);
            }, this));
        },

        // Recursively sets the scope of the given variable
        changeScope: function(surveyId, scope, successCb, failureCb) {
            return new Y.Promise(Y.bind(function(resolve) {
                // Full request: /rest/GameModel/<gameModelId>/VariableDescriptor/<variableDescriptorId>/CherryPick/<newScopeType>
                var gameModelId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id"),
                    config = {
                        request: '/' + gameModelId + "/VariableDescriptor/" + surveyId + "/changeScope/" + scope,
                        cfg: {
                            updateCache: true,
                            method: "PUT"
                        },
                        on: {
                            success: Y.bind(function(e) {
                                var descr = e.response.entity;
                                successCb && successCb(descr);
                                resolve("OK");
                            }, this),
                            failure: Y.bind(function(e) {
                                failureCb && failureCb(e);
                                resolve("Not OK");
                            }, this)
                        }
                    };
                Y.Wegas.Facade.GameModel.sendRequest(config);
            }, this));
        },

        closeRunnableSurveys: function() {
            var cb = this.get(CONTENTBOX).one(".runnable-surveys");
            cb.hide();
            /*
            if (this.knownSurveys) {
                for (var surveyId in this.knownSurveys) {
                    this.deregisterSurvey(surveyId);
                }
            }
            */
            cb.all(".list").setHTML('');
        },
        
        closeSurveyMixer: function() {
            var cb = this.get(CONTENTBOX);
            this.closeRunnableSurveys();
            cb.one(".search-runnable-surveys").show();
        },
        
        // Filters out non-live games and gamemodels from the given array.
        // Returns a new array.
        filterExternalSurveys: function(varSets) {
            var currGameId = Y.Wegas.Facade.Game.cache.getCurrentGame().get("id"),
                currGameModelId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id"),
                res = [],
                vs, currVarSet, currGameModel, currGame, isSession;
            for (vs in varSets){
                currVarSet = varSets[vs].get("val");
                currGameModel = currVarSet.gameModel;
                isSession = currGameModel.get("type") === "PLAY";
                if (isSession) {
                    currGame = currVarSet.game;
                    if (currGame.get("status") === "LIVE") {
                        currVarSet.isExternal = currGame.get("id") !== currGameId;
                        res.push(currVarSet);
                    }
                } else {
                    if (currGameModel.get("status") === "LIVE") {
                        currVarSet.isExternal = currGameModel.get("id") !== currGameModelId;
                        res.push(currVarSet);
                    }
                }
            }
            return res;
        },
        
        // Returns an array of surveyIds ordered by creation date (approximated by descriptor ID),
        // putting internal surveys first.
        getSortedSurveys: function(surveyList) {
            var internals = [],
                externals = [];
            for (var surveyId in surveyList) {
                if (surveyList[surveyId].isExternal) {
                    externals.push(surveyId);
                } else {
                    internals.push(surveyId);
                }
            }
            internals.sort(
                    function(a,b){
                        return b - a;
                    }
                );
            externals.sort(
                    function(a,b){
                        return b - a;
                    }
                );
            return internals.concat(externals);
        },
        
        // Processes the given array of variable sets to return a 'knownSurveys' compatible list
        processVarSet: function(varSets, isWriteable) {
            var surveyList = {},
                currVarSet, vs, sourceGameModel, sourceGame, variables, v, currVar,
                isSession, createdDate, gameName, runnableHTML, runningHTML = null;
            
            for (vs in varSets) {
                currVarSet = varSets[vs];
                sourceGameModel = currVarSet.gameModel;
                sourceGame = currVarSet.game;
                variables = currVarSet.variables;
                isSession = sourceGameModel.get("type") === "PLAY";
                if (isSession) {
                    createdDate = sourceGame.get("createdTime");
                    gameName = sourceGame.get("name");
                } else {
                    createdDate = sourceGameModel.get("createdTime");
                    gameName = sourceGameModel.get("name");
                }
                for (v in variables) {
                    currVar = variables[v];
                    var name = currVar.get("name"),
                        isTaken = this.isExistingSurveyName(name),
                        label = this.getFriendlyVarLabel(currVar),
                        isPublished = currVar.get("isPublished"),
                        comments = currVar.get("comments"),
                        surveyId = currVar.get("id"),
                        runnableHTML =  
                            '<div class="runnable-survey' +
                                    (isPublished ? '' : ' wegas-advanced-feature') +
                                    '" data-surveyId="' + surveyId + "\">" +   // runnable-survey 
                                '<div class="survey-header"><div class="survey-label">' +
                                    label +
                                '</div>' +
                                '<i class="fa fa-info-circle survey-comments" data-surveyId="' + surveyId + '"></i>' +
                                '</div>' +
                                '<div class="action-buttons">' +
                                '<span class="survey-settings"></span>' +
                                '<span class="survey-edit"></span>' +
                                '<span class="survey-copy"></span>' +
                                '<span class="survey-request"></span>' +
                                '<span class="survey-invite"></span>' +
                            '</div></div>';
                    if (currVarSet.isExternal && !isPublished) {
                        // This situation should not happen
                        continue;
                    }
                    if (!currVarSet.isExternal) {
                        // Survey is internal, it might be running:
                        runningHTML =
                            "<div class=\"running-survey\" data-surveyId=\"" + surveyId + "\">" +
                                "<div class=\"survey-header\"><div class=\"survey-label\">" +
                                    label +
                                "</div>" +
                                "<i class=\"fa fa-info-circle survey-comments\" data-surveyId=\"" + surveyId + '\"></i>' +
                                "</div>" +
                                "<div class=\"action-buttons\">" +
                                    "<span class=\"status-bloc\">" +
                                        "<span class=\"status-title\">" + I18n.t("survey.orchestrator.currentStatus") + ': </span>' +
                                        "<span class=\"status\"></span>" +
                                    "</span>" +
                                    "<span class=\"survey-details\"></span>" +
                                    "<span class=\"survey-refresh\"></span>" +
                                "</div>" +
                            "</div>";
                    }
                    
                    surveyList[surveyId] =
                        {
                            surveyId: surveyId,
                            name: name,
                            label: label,
                            isWriteable: isWriteable,
                            isExternal: currVarSet.isExternal,
                            isPublished: isPublished,
                            isRunning: false,
                            isSession: isSession,
                            sourceGameModelId: sourceGameModel.get("id"),
                            sourceGameId: sourceGame.get("id"),
                            sourceGameName: gameName,
                            disabled: isTaken,
                            createdDate: createdDate,
                            hasPlayerScope: currVar.get("scopeType") === "PlayerScope",
                            runnableHTML: runnableHTML,
                            runningHTML: runningHTML,
                            comments: comments,
                            buttons: {}
                        };
                }
            }
            return surveyList;
        },
        
        displayOrderedList: function(surveyList, targetNode) {
            var order = this.getSortedSurveys(surveyList),
                nbEntries = 0,
                surveyId, currSurv, surveyList, newSurvey;
            targetNode.setHTML('');
            for (var i in order) {
                nbEntries++;
                if (nbEntries <= MAX_LISTABLE_SURVEYS) {
                    surveyId = order[i];
                    currSurv = this.knownSurveys[surveyId];
                    surveyList = targetNode.insert(this.knownSurveys[surveyId].runnableHTML);
                    newSurvey = surveyList.one('[data-surveyId="' + surveyId + '"]');

                    if (currSurv.isWriteable) {
                        currSurv.buttons.settingsButton = new SpinButton({
                            label: "<i class=\"fa fa-cog icon\"></i>",
                            onClick: Y.bind(this.onSettingsTool, this),
                            surveyId: surveyId
                        }).render(newSurvey.one(".survey-settings"));
                    } else {
                        newSurvey.one(".survey-settings").setHTML('<div class="no-button"></div>');
                    }

                    currSurv.buttons.editButton = new SpinButton({
                        label:
                            currSurv.isWriteable ?
                                "<i class=\"fa fa-magic icon\"></i>" + I18n.t("survey.orchestrator.editButton") :
                                "<i class=\"fa fa-eye icon\"></i>" + I18n.t("survey.orchestrator.previewButton"),
                        onClick: Y.bind(this.onEdit, this),
                        surveyId: surveyId
                    }).render(newSurvey.one(".survey-edit"));
                    
                    currSurv.buttons.copyButton = new SpinButton({
                        label: "<i class=\"fa fa-files-o icon\"></i>" + I18n.t("survey.orchestrator.copyButton"),
                        autoSpin: true,
                        onClick: Y.bind(this.onCopy, this),
                        surveyId: surveyId
                    }).render(newSurvey.one(".survey-copy"));

                    currSurv.buttons.requestButton = new SpinButton({
                        label: "<i class=\"fa fa-play icon\"></i>" + I18n.t("survey.orchestrator.requestButton"),
                        autoSpin: true,
                        onClick: Y.bind(this.onRequestNow, this),
                        surveyId: surveyId
                    }).render(newSurvey.one(".survey-request"));

                    currSurv.buttons.inviteButton = new SpinButton({
                        label: "<i class=\"fa fa-envelope icon\"></i>" + I18n.t("survey.orchestrator.inviteButton"),
                        autoSpin: true,
                        onClick: Y.bind(this.onInvite, this),
                        surveyId: surveyId
                    }).render(newSurvey.one(".survey-invite"));
                    currSurv.buttons.inviteButton.get(CONTENTBOX).setAttribute("data-surveyid", surveyId);

                } else if (nbEntries === MAX_LISTABLE_SURVEYS) {
                    // @TODO Implement some kind of filtering/pagination for long lists:
                    targetNode.insert('<b>Listing interrupted after 20 entries</b>');
                    break;
                }
            }
            if (nbEntries === 0) {
                targetNode.insert('(' + I18n.t("survey.orchestrator.noSurveyFound") + ')');
            }
        },
        
        // Displays the lists of (1) standard surveys and (2) the trainer's own (writeable) surveys.
        // Initializes this.knownSurveys.
        listRunnableSurveys: function(standardSurveys, writeableSurveys) {
            var esCB = this.get(CONTENTBOX).one(".runnable-surveys"),
                standardList, ownList, knownSurveys;
            
            // Properly delete any pre-existing surveys:
            if (this.knownSurveys) {
                for (var surveyId in this.knownSurveys) {
                    this.deregisterSurvey(surveyId);
                }
            }

            standardList = this.processVarSet(standardSurveys, /* writeable= */ false);
            ownList = this.processVarSet(writeableSurveys, /* writeable= */ true);
            knownSurveys = this.knownSurveys = Object.assign({}, ownList, standardList);

            this.get(CONTENTBOX).one(".search-runnable-surveys").hide();
            this.displayOrderedList(standardList, esCB.one(".list.standard"));
            this.displayOrderedList(ownList, esCB.one(".list.own"));
            esCB.show();
            // Update the list of running surveys:
            this.syncUI();
        },
        
        // Returns true if the given surveyList contains the given game.
        containsGame: function(game, surveyList) {
            var gId = game.get("id");
            for (var s in surveyList) {
                if (surveyList[s].game.get("id") === gId) {
                    return true;
                }
            }
            return false;
        },

        // Returns true if the given surveyList contains the given gameModel.
        containsGameModel: function(gameModel, surveyList) {
            var gmId = gameModel.get("id");
            for (var s in surveyList) {
                if (surveyList[s].gameModel.get("id") === gmId) {
                    return true;
                }
            }
            return false;
        },

        // Returns the list of standard (read-only) surveys as a difference between 
        // parameters allSurveys and writeableSurveys.
        extractStandardSurveys: function(allSurveys, writeableSurveys) {
            var diff = [],
                currVarSet, isSession;
            for (var s in allSurveys) {
                currVarSet = allSurveys[s];
                isSession = currVarSet.gameModel.get("type") === "PLAY";
                if (isSession) {
                    if (!this.containsGame(currVarSet.game, writeableSurveys)) {
                        diff.push(currVarSet);
                    }
                } else {
                    if (!this.containsGameModel(currVarSet.gameModel, writeableSurveys)) {
                        diff.push(currVarSet);
                    }
                }
            }
            return diff;
        },
        
        // Fetches all readable and writeable external surveys from the server.
        // Returns a promise.
        onSearchAllSurveys: function() {
            return new Y.Promise(Y.bind(function(resolve) {
                // /rest/Public/GameModel/VariableDescriptor/FetchAllPickable/<variableClassName>
                var config = {
                        request: "/VariableDescriptor/FetchAllPickable/com.wegas.survey.persistence.SurveyDescriptor",
                        cfg: {
                            updateCache: true,
                            method: "GET"
                        },
                        on: {
                            success: Y.bind(function(e) {
                                var entities = e.response && e.response.entities,
                                    allSurveys = this.filterExternalSurveys(entities);
                                this.searchWriteable(allSurveys, resolve);
                            }, this),
                            failure: Y.bind(function(e) {
                                this.showMessage("error", "Something went wrong: FetchAllPickable");
                                resolve("Unable to get external readable surveys");
                            }, this)
                    }
                };

                Y.Wegas.Facade.GameModel.sendRequest(config);
            }, this));
        },
        
        searchWriteable: function(allSurveys, resolve) {
            // /rest/Public/GameModel/VariableDescriptor/FetchWriteablePickable/<variableClassName>
            var config = {
                    request: "/VariableDescriptor/FetchWriteablePickable/com.wegas.survey.persistence.SurveyDescriptor",
                    cfg: {
                        updateCache: true,
                        method: "GET"
                    },
                    on: {
                        success: Y.bind(function(e) {
                            var entities = e.response && e.response.entities,
                                writeableSurveys = this.filterExternalSurveys(entities),
                                standardSurveys = this.extractStandardSurveys(allSurveys, writeableSurveys);
                            this.listRunnableSurveys(standardSurveys, writeableSurveys);
                            resolve("Got writeable surveys");
                        }, this),
                        failure: Y.bind(function(e) {
                            this.showMessage("error", "Something went wrong: FetchWriteablePickable");
                            resolve("Unable to get writeable surveys");
                        }, this)
                }
            };
            Y.Wegas.Facade.GameModel.sendRequest(config);
        },
        
        getSurveyTitle: function(survDescr) {
            return I18n.t(survDescr.get("label"));
        },

        syncUI: function(survDescrId) {
            if (!this.knownSurveys) {
                // First initialization of this.knownSurveys:
                if (!this.fetchingSurveys) {
                    this.fetchingSurveys = true;
                    this.onSearchAllSurveys().then(Y.bind(
                        function() {
                            this.fetchingSurveys = false;
                            this.syncUI(survDescrId);
                        }, this));
                }
                return;
            }
            var listCB = this.get(CONTENTBOX).one(".running-surveys .list"),
                surveyId, currSurv, survDescr;
            if (typeof survDescrId === "string") {
                survDescrId = +survDescrId;
            }
            for (surveyId in this.knownSurveys) {
                if (survDescrId && survDescrId !== +surveyId) {
                    continue;
                }
                currSurv = this.knownSurveys[surveyId];
                if (currSurv.isExternal) {
                    continue;
                }
                survDescr = Y.Wegas.Facade.VariableDescriptor.cache.findById(surveyId);
                if (!survDescr) {
                    // The survey descriptor has been deleted
                    this.deregisterSurvey(surveyId);
                    continue;
                } else if (!listCB.one('.running-survey[data-surveyId="' + surveyId + '"]')) {
                    // The survey descriptor is new, display the HTML and add the buttons.
                    var surveyList = listCB.insert(currSurv.runningHTML),
                        newSurvey = surveyList.one('[data-surveyId="' + surveyId + '"]');

                    currSurv.buttons.detailsButton = new SpinButton({
                        label: "<i class=\"fa fa-1x fa-tachometer icon\"></i>" + I18n.t("survey.orchestrator.progressDetailsButton"),
                        autoSpin: false,
                        onClick: Y.bind(this.showProgressDetails, this),
                        surveyId: surveyId
                    }).render(newSurvey.one(".survey-details"));

                    currSurv.buttons.refreshButton = new SpinButton({
                        label: "<i class=\"fa fa-1x fa-refresh icon same-icon\"></i>",
                        autoSpin: true,
                        onClick: Y.bind(this.refresh, this),
                        surveyId: surveyId
                    }).render(newSurvey.one(".survey-refresh"));

                } else {
                    // Just update the survey title :
                    var currSurvey = listCB.one('.running-survey[data-surveyId="' + surveyId + '"] .survey-label');
                    currSurvey.setContent(this.getSurveyTitle(survDescr));
                }
                this._getMonitoredData(surveyId);
            }
        },
        
        statusToString: function(survey) {
            if (survey.error) {
                return "Internal error: " + survey.error;
            }
            if (!survey.active) {
                return I18n.t("survey.orchestrator.inactive");
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
        
        syncTable: function(surveyId) {
            var team,
                teamsTable = [],
                nbTeams = 0,
                survData = this._monitoredData[surveyId],
                currSurv = this.knownSurveys[surveyId],
                cb = this.get(CONTENTBOX).one('.running-surveys'),
                listCB = cb.one('.list'),
                survCB = listCB.one('.running-survey[data-surveyId="' + surveyId + '"]'),
                refreshButton = currSurv.buttons.refreshButton,
                prevTeamId = -1;
            
            refreshButton.startSpinning();
            
            // Hide inactive, empty and unstarted surveys from the list of running surveys:
            if (survData.active === false ||
                survData.status === ORCHESTRATION_PROGRESS.NOT_STARTED) {
                survCB.hide();
                currSurv.isRunning = false;
                this.checkIfEmptyRunningSurveys();
            } else {
                survCB.show();
                currSurv.isRunning = true;
                cb.one('.empty-message').hide();
            }
                        
            survCB.one(".status").setContent(this.statusToString(survData));
            
            if (currSurv.isRunning) {
                teamsTable.push(
                    '<table class="teams-table"><thead><tr><td>' +
                    (survData.isPlayerScope ?
                        I18n.t("survey.orchestrator.team") +
                        '</td><td>' +
                        I18n.t("survey.orchestrator.player") :
                        I18n.t("survey.orchestrator.teamOrPlayer")
                    ) +
                    '</td><td>' +
                    I18n.t("survey.orchestrator.teamStatus") +
                    '</td><td>' +
                    I18n.t("survey.orchestrator.teamRepliesCompulsory") +
                    '</td><td>' +
                    I18n.t("survey.orchestrator.teamRepliesOptional") +
                    '</td></tr></thead><tbody>');
                for (team in survData.data) {
                    var teamData = survData.data[team];
                    nbTeams++;
                    if (survData.isPlayerScope) {
                        // All members of a same team are expected to come sequentially:
                        if (teamData.teamId !== prevTeamId) {
                            teamsTable.push(
                                '<tr class="newteam"><td class="teamname" rowspan="' + teamData.teamSize + '">' +
                                teamData.name +
                                '</td>'
                            );
                        } else {
                            teamsTable.push('<tr>');
                        }
                        teamsTable.push(
                            '<td class="playername">' +
                            teamData.playerName
                        );
                        prevTeamId = teamData.teamId;
                    } else {
                        teamsTable.push(
                            '<tr><td class="teamname">' +
                            teamData.name
                        );
                    }
                    teamsTable.push(
                        '</td><td class="status">' +
                        this.statusToString(teamData) +
                        '</td><td class="replied">' +
                        teamData.replied + ' / ' + teamData.activeInputs +
                        '</td><td class="repliedOptional">' +
                        teamData.optionalReplied + ' / ' + teamData.activeOptionalInputs +
                        '</td></tr>');
                }
                if (nbTeams) {
                    currSurv.buttons.detailsButton.enable();
                    teamsTable.push('</tbody></table>');
                    currSurv.monitoringData = teamsTable.join("");
                    this.updateDetailsPanel(currSurv);
                } else {
                    currSurv.buttons.detailsButton.disable();
                }
            } else {
                currSurv.buttons.detailsButton.disable();
            }
            
            refreshButton.stopSpinning();
        },

        showDetailsPanel: function(survObj) {
            var title = survObj.label,
                body = survObj.monitoringData,
                panel, panelCB, handler;
            if (!survObj.detailsPanel) {
                panel = new Y.Wegas.Panel({
                    headerContent: '<h2>' + title + '</h2><button class="yui3-widget yui3-button yui3-button-content close fa fa-times"></button>',
                    content: body,
                    modal: false,
                    width: 600
                }).render();
                panelCB = panel.get(CONTENTBOX);
                panelCB.addClass("wegas-survey-details");
                panel.plug(Y.Plugin.DraggablePanel, {});
                handler = panelCB.one(".close").on("click", function() {
                    handler.detach();
                    survObj.detailsPanel = null;
                    panel.destroy();
                }, this);
                survObj.detailsPanel = panel;
            } else {
                this.updateDetailsPanel(survObj);
            }
        },

        updateDetailsPanel: function(survObj) {
            var panel = survObj.detailsPanel;
            if (panel) {
                panel.get(CONTENTBOX).one(".yui3-widget-bd").setHTML(survObj.monitoringData);
            }
        },

        overlayDetailsPanel: function(survObj) {
            var panel = survObj.detailsPanel;
            if (panel) {
                panel.get(CONTENTBOX).one(".yui3-widget-bd").insert('<div class=\"survey-details-spinner\"><i class=\"fa fa-2x fa-refresh fa-spin\"></i></div>');
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

        // Opens up the detailed teams/players progress window.
        onSettingsTool: function(surveyId) {
            var survObj = this.knownSurveys[surveyId],
                title = survObj.label,
                body, panel, panelCB,
                buttons = {},
                handlers = [];
            body =
                '<div class="settings-line"><div class="survey-delete"></div><div class="survey-rename"></div><div class="survey-share"></div></div>' +
                '<div class="settings-line" style="margin-top: 30px;"><div class="settings-text">' + I18n.t("survey.orchestrator.scopeTitle") + 
                '</div><div class="survey-scope-player"></div><div class="survey-scope-team"></div></div>';
            if (!survObj.settingsPanel) {
                survObj.settingsPanel = panel = new Y.Wegas.Panel({
                    headerContent: '<h2>' + title + '</h2><button class="yui3-widget yui3-button yui3-button-content close fa fa-times"></button>',
                    content: body,
                    modal: false,
                    width: 600
                }).render();
                panelCB = panel.get(CONTENTBOX);
                panelCB.addClass("wegas-survey-settings");
                
                buttons.deleteButton = new SpinButton({
                    label: "<i class=\"fa fa-trash icon\"></i>" + I18n.t("survey.orchestrator.deleteButton"),
                    autoSpin: true,
                    onClick: Y.bind(this.onDelete, this),
                    surveyId: surveyId
                }).render(panelCB.one(".survey-delete"));

                buttons.renameButton = new SpinButton({
                    label: "<i class=\"fa fa-magic icon\"></i>" + I18n.t("survey.orchestrator.renameButton"),
                    onClick: Y.bind(this.onEdit, this),
                    surveyId: surveyId
                }).render(panelCB.one(".survey-rename"));

                buttons.shareButton = new SpinButton({
                    label: "<i class=\"fa fa-share-alt-square icon\"></i>" + I18n.t("survey.orchestrator.shareButton"),
                    autoSpin: false,
                    onClick: Y.bind(this.onShare, this),
                    surveyId: surveyId
                }).render(panelCB.one(".survey-share"));

                buttons.playerScopeButton = new SpinButton({
                    label: "<i class=\"fa fa-user icon\"></i>" + I18n.t("survey.orchestrator.playerScopeButton"),
                    autoSpin: true,
                    onClick: Y.bind(this.onPlayerScope, this),
                    surveyId: surveyId
                }).render(panelCB.one(".survey-scope-player"));

                buttons.teamScopeButton = new SpinButton({
                    label: "<i class=\"fa fa-users icon\"></i>" + I18n.t("survey.orchestrator.teamScopeButton"),
                    autoSpin: true,
                    onClick: Y.bind(this.onTeamScope, this),
                    surveyId: surveyId
                }).render(panelCB.one(".survey-scope-team"));
                                
                panel.plug(Y.Plugin.DraggablePanel, {});
                survObj.deleteSettingsPanel = Y.bind(function() {
                    if (survObj.settingsPanel) {
                        for (var h in handlers) {
                            handlers[h].detach();
                        }
                        for (var b in buttons) {
                            buttons[b].destroy();
                        }
                        survObj.settingsPanel = null;
                        panel.destroy();
                    }
                }, this);
                
                handlers.push(panelCB.one(".close").on("click", survObj.deleteSettingsPanel, this));
            }
        },

        // Opens a new tab for editing the target survey.
        onEdit: function(surveyId) {
            var currSurv = this.knownSurveys[surveyId],
                url = 'edit-survey.html?surveyId=' + surveyId + '&';
            if (currSurv.isRunning) {
                this.alert(I18n.t("survey.orchestrator.modifyRunning"));
                return;
            }
            if (currSurv.isSession) {
                url += 'gameId=' + currSurv.sourceGameId;
            } else {
                url += 'gameModelId=' + currSurv.sourceGameModelId;
            }
            if (!currSurv.isWriteable) {
                url += '&readonly=true';
            }
            window.open(url, '_blank');
            if (currSurv.settingsPanel) {
                currSurv.deleteSettingsPanel();
            }
        },
        
        // Called to set a survey to PlayerScope
        onPlayerScope: function(surveyId, btn) {
            var currSurv = this.knownSurveys[surveyId];
            if (currSurv.isRunning) {
                this.alert(I18n.t("survey.orchestrator.modifyRunning"));
                btn.stopSpinning();
                return;
            }
            this.changeScope(surveyId,
                "PlayerScope",
                function() {
                    btn.stopSpinning();
                },
                function() {
                    Y.Wegas.Panel.alert("Could not change scope");
                    btn.stopSpinning();
                });
        },

        // Called to set a survey to TeamScope
        onTeamScope: function(surveyId, btn) {
            var currSurv = this.knownSurveys[surveyId];
            if (currSurv.isRunning) {
                this.alert(I18n.t("survey.orchestrator.modifyRunning"));
                btn.stopSpinning();
                return;
            }
            this.changeScope(surveyId,
                "TeamScope",
                function() {
                    btn.stopSpinning();
                },
                function() {
                    Y.Wegas.Panel.alert("Could not change scope");
                    btn.stopSpinning();
                });
        },
        
        // Called when user wants to duplicate a survey.
        // Imports the survey if it's external (i.e. outside this gameModel).
        // Otherwise it duplicates it.
        onCopy: function(surveyId, btn) {
            // Importing with CherryPick will also duplicate when needed:
            this.importSurvey(
                surveyId,
                // Set TeamScope in case it's going to be used in-game.
                // It will be converted back to PlayerScope if launched via the dashboard.
                "TeamScope",
                PUBLISHED,
                function() {
                    btn.stopSpinning();
                },
                function(e) {
                    Y.Wegas.Panel.alert("Could not import survey<br>" + e);
                    btn.stopSpinning();
                }
            );
        },
        
        
        // Called when user wants to "request" a survey to start now.
        // First imports the survey as unpublished if it's external.
        onRequestNow: function(surveyId, btn) {
            var ctx = this,
                currSurv = this.knownSurveys[surveyId],
                survDescr;
            if (currSurv.isRunning) {
                this.alert(I18n.t("survey.orchestrator.alreadyLaunched"));
                return;
            }
            if (currSurv.isExternal) {
                this.importSurvey(
                    surveyId,
                    "PlayerScope",   // Convert to PlayerScope when launched through dashboard
                    UNPUBLISHED,
                    function(newDescr) {
                        ctx.onRequestNow(newDescr.get("id"), btn);
                    },
                    function(e) {
                        Y.Wegas.Panel.alert("Could not import survey<br>" + e);
                        btn && btn.stopSpinning();
                    }
                );
            } else {
                if (!currSurv.hasPlayerScope) { // The survey is internal but with wrong scope (we could also check recursively)
                    this.changeScope(
                        surveyId,
                        "PlayerScope",  // Convert to PlayerScope when launched through dashboard
                        function(descr) {
                            currSurv.hasPlayerScope = true;
                            ctx.onRequestNow(descr.get("id"), btn);
                        },
                        function(e) {
                            Y.Wegas.Panel.alert("Could not change scope of survey<br>" + e);
                            btn && btn.stopSpinning();
                        }
                    );
                    return;
                }
                btn && btn.stopSpinning(); // The button should anyway be hidden
                
                survDescr = Y.Wegas.Facade.Variable.cache.findById(surveyId);
                var survName = survDescr.get("name"),
                    script = "SurveyHelper.request('" + survName + "')",
                    survScope = survDescr.get("scopeType"),
                    // Hack to impact all teams instead of just one team:
                    team = Y.Wegas.Facade.Game.cache.getCurrentGame();
                if (!team.get("players")) {
                    // Hack in scenarist mode:
                    team.set("players", [Y.Wegas.Facade.Game.cache.getCurrentPlayer()]);
                }
                
                
                survDescr.get("defaultInstance").set("status", ORCHESTRATION_PROGRESS.REQUESTED);
                this.persistSurvey(survDescr,
                    Y.bind(function() {
                        
                        // @TODO: comment transmettre la liste des joueurs ou teams ??
                        
                        this.prepareRemoteScript(team, script, survScope);
                    }, this),
                    Y.bind(function() {
                        this.alert("Internal error: Could not update survey descriptor. Please try again.");
                    }, this)
                );
            }
        },
        
        // Opens a dialog for selecting the e-mail message and its recipients.
        onInvite: function(surveyId, btn) {
            this.alert("Sorry, not yet implemented.");
            btn.stopSpinning();
        },
        
        // Opens a dialog for sharing a survey with another trainer.
        onShare: function(surveyId, btn) {
            this.alert("Sorry, not yet implemented.");
            btn.stopSpinning();
        },

        // Deletes given survey if it's not running.
        onDelete: function(surveyId) {
            var surveyData = this.knownSurveys[surveyId];
            if (surveyData.isRunning) {
                var ctx = this,
                    panel = Y.Wegas.Panel.confirm(
                    I18n.t("survey.orchestrator.deleteRunning"),
                    function() {
                        ctx.deleteSurvey(surveyId);
                    }
                    );
                panel.get(CONTENTBOX).addClass("wegas-orchestrator-alert");
            } else {
                this.deleteSurvey(surveyId);
            }
        },
        
        // Deletes the given survey
        deleteSurvey: function(surveyId) {
            var survObj = this.knownSurveys[surveyId];
            Y.Wegas.Facade.Variable.sendRequest({
                request: "/" + surveyId,
                cfg: {
                    method: "DELETE"
                },
                on: {
                    success: Y.bind(function(e) {
                        if (survObj.settingsPanel) {
                            survObj.deleteSettingsPanel();
                        }
                    }, this),
                    failure: Y.bind(function() {
                        this.alert("Could not delete this survey");
                    }, this)
                }
            });
        },
        

        onInfoTooltip: function(e) {
            var surveyId = +e.node.getData("surveyid"),
                surveyData = this.knownSurveys[surveyId],
                details = '',
                comments;
                if (e.node.ancestor(function(node) { return node.hasClass("runnable-survey"); })) {
                    details += '<div class="wegas-advanced-feature">';
                    if (surveyData.isSession) {
                        if (surveyData.isExternal) {
                            details += 'In session "' + surveyData.sourceGameName + '"';
                        } else {
                            details += 'In this session';
                        }
                    } else {
                        if (surveyData.isExternal) {
                            details += 'In scenario "' + surveyData.sourceGameName + '"';                        
                        } else {
                            details += 'In this scenario';
                        }
                    }
                    details += '</div>'; // End of wegas-advanced-feature
                } else {
                    if (!this.playedIndividually) {
                        details += I18n.t(
                                        surveyData.hasPlayerScope ?
                                        "survey.orchestrator.hasPlayerScope" :
                                        "survey.orchestrator.hasTeamScope") + '<br>';
                    }
                }
                details += 'Created on ' + new Date(surveyData.createdDate).toLocaleString('en-GB');
                details +=
                    '<div class="wegas-advanced-feature">' +
                        (surveyData.isPublished ? 'Is published' : 'Is NOT published') +
                        '<br>Survey variable Id ' + surveyId +
                    '</div>';

                if (surveyData.comments) {
                    // Preserve line breaks in HTML output:
                    comments = '<b>' + surveyData.comments.replace(/\n/g, '<br>') + '</b>';
                } else {
                    comments = "<i>No explanations provided by survey creator.</i>";
                }
            this.tooltip.setTriggerContent('<div class="wegas-orchestrator-tooltip">' + comments + '<hr>' + details + '</div>');
        },
        
        // This code is adapted from wegas-dashboard-modals.
        prepareRemoteScript: function(team, script, scopeType) {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame();

            // Return one live player for each team which has such a live player
            // (in Team mode, we assume impacted variables are shared among team members)
            function getOnePlayerPerTeam(game) {
                var gamePlayers = [], player,
                    i, t, teams = game.get("teams"),
                    nbTeams = teams.length;
                for (i = 0; i < nbTeams; i++) {
                    t = teams[i];
                    if (t.get("@class") !== "DebugTeam" && t.get("players").length) {
                        player = t.getLivePlayer();
                        if (player !== null) {
                            gamePlayers.push(player);
                        }
                    }
                }
                return gamePlayers;
            }
            
            function getAllPlayers(game) {
                var gamePlayers = [], player,
                    i, t, teams = game.get("teams"),
                    nbTeams = teams.length,
                    players, nbPlayers, j;
                for (i = 0; i < nbTeams; i++) {
                    t = teams[i];
                    players = t.get("players");
                    nbPlayers = players.length;
                    if (t.get("@class") !== "DebugTeam" && nbPlayers) {
                        for (j = 0; j < nbPlayers; j++) {
                            player = players[j];
                            if (player !== null) {
                                gamePlayers.push(player);
                            }
                        }
                    }
                }
                return gamePlayers;                
            }

            //this.set("title", "Global impact on game \"" + game.get("name") + "\"");
            this.runRemoteScript(
                script,
                (scopeType === "TeamScope" ?
                    getOnePlayerPerTeam(game) :
                    getAllPlayers(game))
            );
        },
        
        // Code adapted from wegas-console-custom.run()
        runRemoteScript: function(script, player) {
            if (!script) {
                this.alert("runRemoteScript: script is empty or undefined");
                return;
            }
            // The script is run sequentially on each player of the "player" argument (single object or array).
            var players = (player.constructor === Array ? player : [player]),
                len = players.length;

            if (len === 0) {
                alert("No teams or players have joined this game!");
                return;
            }

            //this.get(CONTENTBOX).one(".wegas-status-bar").removeClass("wegas-status-bar-hidden");
            //this.get(CONTENTBOX).one(".status").addClass("status--running");

            var count = 0,
                succeeded = 0,
                failed = 0,
                teamOrPlayer = Y.Wegas.Facade.Game.cache.getCurrentGame().get("properties.freeForAll") ? 'Player ' : 'Team ',
                contentBox = this.get(CONTENTBOX),
                resDiv, player, config;

            for (var i = 0; i < len; i++) {
                player = players[i];
                config = {
                    on: {
                        success: Y.bind(function(event) {
                            count++;
                            succeeded++;
                            if (false && len > 1 && failed === 0) {
                                if (!resDiv) {
                                    resDiv = contentBox.one(".results");
                                    resDiv.removeClass("wegas-advanced-feature");
                                }
                                resDiv.setHTML('<div class="result">' + teamOrPlayer + count + '&thinsp;/&thinsp;' + len + '</div>');
                            }
                            if (count >= len) { // End of last iteration:
                                if (failed > 0) {
                                    this.alert("Errors happened for " + failed + "/" + count + " participants");
                                } else {
                                    this.alert("Survey started successfully");
                                    this.syncUI();
                                }
                            }
                        }, this),
                        failure: Y.bind(function(e) {
                            count++;
                            failed++;
                            //contentBox.one(".status").removeClass("status--running").addClass("status--error");
                            Y.log("*** Error executing script");
                            if (count >= len) { // End of last iteration:
                                this.alert("Errors happened for " + failed + "/" + count + " participants");
                            }
                        }, this)
                    }
                };

                Y.Wegas.Facade.Variable.script.run(script, config, player);
            }
        },
        
        alert: function(msg) {
            Y.Wegas.Panel.alert(msg)
                .get(CONTENTBOX).addClass("wegas-orchestrator-alert");
        }

    }, {
        EDITORNAME: "Survey Orchestrator",
        ATTRS: {
        }
    });
    Wegas.SurveyOrchestrator = SurveyOrchestrator;
    
});
