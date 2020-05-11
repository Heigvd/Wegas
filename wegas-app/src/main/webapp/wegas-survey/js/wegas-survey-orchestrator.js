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
        Wegas = Y.Wegas,
        SurveyOrchestrator,
        // In increasing order of progress, status received from server-side script wegas-survey-helper:
        ORCHESTRATION_PROGRESS = {
            NOT_STARTED: "NOT_STARTED",
            REQUESTED: "REQUESTED",
            ONGOING: "ONGOING",
            COMPLETED: "COMPLETED",
            CLOSED: "CLOSED"
        },
        MAX_LISTABLE_SURVEYS = 20;


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
            "        <div class=\"search-external-surveys\">" + I18n.t("survey.orchestrator.searchExternalSurveys") + "</div>" +
            "        <div class=\"external-surveys\" style=\"display:none;\"><div class=\"close\"></div>" +
            "           <div class=\"title standard\">" + I18n.t("survey.orchestrator.standardSurveysTitle") + "</div>" +
            "           <div class=\"list standard\"></div>" +
            "           <div class=\"title own\">" + I18n.t("survey.orchestrator.externalSurveysTitle") + "</div>" +
            "           <div class=\"list own\"></div>" +
            "           <div class=\"do-import\"></div>" +
            "        </div>" +
            "        <div class=\"import-monitoring\" style=\"display:none;\">" +
            "           <div class=\"title\"></div><div class=\"close\"></div>" +
            "           <div class=\"list\"></div>" +
            "        </div>" +
            "    </div>" +
            "    <div class=\"internal-surveys\">" +
            "       <div class=\"title\">" + I18n.t("survey.orchestrator.activeSurveysTitle") + "</div>" +
            "    </div>" +
            "</div>",
    
        initializer: function() {
            this.handlers = [];
            this.knownSurveys = null;            
            this._monitoredData = {};
            this.datatables = {};
            this.playedIndividually = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties").get("val.freeForAll");
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
        
        isExistingSurveyName: function(name) {
            for (var i in this.knownSurveys) {
                if (this.knownSurveys[i].isExternal) continue;
                if (this.knownSurveys[i].name === name) {
                    return true;
                }
            }
            return false;
        },
        
        // Adds the given survey descriptor to the list of internal surveys
        internalizeSurvey: function(sd) {
            var descrId = sd.get("id");
            if (!this.knownSurveys[descrId]) {
                this.knownSurveys[descrId].isExternal = false;
                this.knownSurveys[descrId].refreshButton = null;
                this.syncUI();
            }            
        },
        // Removes the given survey descriptor from the list of internal surveys
        deinternalizeSurvey: function(sd) {
            var descrId = sd.get("id");
            if (this.knownSurveys[descrId]) {
                //delete this.knownSurveys[descrId];
                this.knownSurveys[descrId].isExternal = true;
                this.syncUI();
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
            // Prepare area for searching for and importing external surveys:
            this.searchExternalButton = new Y.Button({
                label: "<i class=\"fa fa-search\"></i>",
                visible: true
            }).render(cb.one(".search-external-surveys"));
            this.closeSearchButton = new Y.Button({
                label: "<i class=\"fa fa-times\"></i>",
                visible: true
            }).render(cb.one(".external-surveys .close"));
            this.closeSurveyMixerButton = new Y.Button({
                label: "<i class=\"fa fa-times\"></i>",
                visible: true
            }).render(cb.one(".import-monitoring .close"));
            
            this.get("boundingBox").ancestor().addClass("survey-orchestrator-parent");
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
            
            this.handlers.push(cb.one(".search-external-surveys").on("click", this.onSearchAllSurveys, this));

            cb.delegate("click", this.onRequestNow, ".internal-survey .request-survey", this);
            cb.delegate("click", this.showProgressDetails, ".internal-survey .survey-details", this);
            cb.delegate("click", this.refresh, ".internal-survey .survey-refresh", this);
            //cb.delegate("click", this.importCheckedSurveys, ".survey-mixer .do-import", this);
            cb.delegate("click", this.closeSurveyMixer, ".survey-mixer .close", this);
            
            this.tooltip = new Wegas.Tooltip({
                delegate: cb,
                delegateSelect: ".survey-comments",
                render: true,
                showDelay: 100,
                autoHideDelay: 50000
            });
            this.tooltip.plug(Y.Plugin.Injector);

            this.tooltip.on("triggerEnter", function(e) {
                var survId = +e.node.getData()["varid"],
                    surveyData = this.knownSurveys[survId],
                    details = 'Created on ' + new Date(surveyData.createdDate).toLocaleString('en-GB') + '<br>',
                    comments;
                    if (surveyData.isExternal) {
                        if (surveyData.isSession) {
                            details += 'From session ';
                        } else {
                            details += 'From scenario ';                        
                        }
                        details += '"' + surveyData.sourceGameName + '"';
                    } else {
                        if (!this.playedIndividually) {
                            details += I18n.t(
                                            surveyData.hasPlayerScope ?
                                            "survey.orchestrator.hasPlayerScope" :
                                            "survey.orchestrator.hasTeamScope");
                        }
                    }
                    if (surveyData.comments) {
                        // Preserve line breaks in HTML output:
                        comments = surveyData.comments.replace(/\n/g, '<br>');
                    } else {
                        comments = "<i>No explanations provided by survey creator.</i>";
                    }
                this.tooltip.setTriggerContent('<div class="wegas-orchestrator-tooltip">' + comments + '<hr>' + details + '</div>');
            }, this);

        },
        
        onUpdatedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.registerSurvey(entity);
                // @TODO distinguish between known and internal surveys
                this.internalizeSurvey(entity);
                this.syncUI();
            }
        },

        onAddedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.registerSurvey(entity);
                // @TODO distinguish between known and internal surveys
                this.internalizeSurvey(entity);
                this.syncUI();
                // In case we are inside the editor, try to notify the variable-treeview.
                // @TODO a bug prevents full update in Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("items")
                Y.Wegas.Facade.Variable.fire("rootUpdate");
            }
        },

        onDeletedDescriptor: function(e) {
            var entity = e.entity;
            if (entity.get("@class") === "SurveyDescriptor") {
                this.deregisterSurvey(entity);
                // @TODO distinguish between known and internal surveys
                this.deinternalizeSurvey(entity);
                this.syncUI();
            }
        },

        showProgressDetails: function(e) {
            var survId = e.target.getData("id");
            if (!survId){
                // The id attribute is on the parent button:
                survId = e.target.get("parentNode").getData("id");
            }

            this.showDetailsPanel(this.knownSurveys[survId]);
            this.syncUI(survId);            
        },

        refresh: function(e) {
            var survId = e.target.getData("id");
            if (!survId){
                // The id attribute is on the parent button:
                survId = e.target.get("parentNode").getData("id");
            }
            this.clearDetailsPanel(this.knownSurveys[survId]);
            this.syncUI(survId);
        },

        getFriendlyVarName: function(v) {
            var name = '',
                label = I18n.t(v.get("label"));
            if (v.get("editorTag")) {
                name += v.get("editorTag");
            }
            if (name && label) {
                name += ' - ';
            }
            if (label) {
                name += label;
            }
            if (!name) {
                name = v.get("name");
            }
            return name;
        },
        
        // Imports survey specified by parameter of type { surveyId: number, scope: enum }
        importSurvey: function(surveyData, successCb, failureCb) {
            return new Y.Promise(Y.bind(function(resolve) {
                // Full request: /rest/GameModel/<gameModelId>/VariableDescriptor/CherryPick/<variableDescriptorId>/<newScopeType>
                var gameModelId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id"),
                    variableDescriptorId = surveyData.surveyId,
                    newScopeType = surveyData.scope,
                    config = {
                        request: '/' + gameModelId + "/VariableDescriptor/CherryPick/" + variableDescriptorId + (newScopeType ? '/' + newScopeType : ''),
                        cfg: {
                            updateCache: true,
                            method: "POST"
                        },
                        on: {
                            success: Y.bind(function(e) {
                                successCb && successCb(variableDescriptorId);
                                resolve("OK");
                            }, this),
                            failure: Y.bind(function(e) {
                                failureCb && failureCb(variableDescriptorId);
                                resolve("Not OK");
                            }, this)
                    }
                };
                Y.Wegas.Facade.GameModel.sendRequest(config);
            }, this));
        },
        
        importCheckedSurveys: function() {
            var output = this.get(CONTENTBOX).one(".import-monitoring .list"),
                ctx = this,
                waiting = [];
            this.openImportMonitoring();
            if (this.knownSurveys) {
                for (var s in this.knownSurveys) {
                    var surv = this.knownSurveys[s];
                    if (surv.importToggle.get(CONTENTBOX).hasClass("selected")) {
                        surv.scope =
                            surv.scopeToggle && surv.scopeToggle.get(CONTENTBOX).hasClass("selected") ? "PlayerScope" : "TeamScope";
                        waiting.push(
                            this.importSurvey(
                                this.knownSurveys[s],
                                function(varid) {
                                    output.setHTML(output.getHTML() + '<div class="import-success">' + ctx.knownSurveys[varid].name) + '</div>';
                                },
                                function(varid) {
                                    output.setHTML(output.getHTML() + '<div class="import-failure">' + ctx.knownSurveys[varid].name) + '</div>';
                                }
                            )
                        );
                    }
                }
            }
            Y.Promise.all(waiting).then(function() {
                Y.later(500, this, function() {
                    ctx.get(CONTENTBOX).one(".import-monitoring .title").setHTML(I18n.t("survey.orchestrator.importTerminated") + ':');
                });
            });
        },
        
        // @TODO delete this
        checkImportableSurvey: function(e) {
            var button = e.target.ancestor();
            if (button.hasClass("yui3-button-disabled") === false) {
                button.toggleClass("selected");
                if (this.get(CONTENTBOX).all(".importable-survey .import-toggle.selected").size() > 0) {
                    this.doImportButton.enable();
                } else {
                    this.doImportButton.disable();
                }
            }
        },
        
        hideExternalSurveys: function() {
            var cb = this.get(CONTENTBOX).one(".external-surveys");
            cb.hide();
        },

        closeExternalSurveys: function() {
            var cb = this.get(CONTENTBOX).one(".external-surveys");
            cb.hide();
            cb.all(".list").setHTML('');
            if (this.knownSurveys) {
                for (var s in this.knownSurveys) {
                    var surv = this.knownSurveys[s];
                    surv.importToggle && surv.importToggle.destroy();
                    surv.scopeToggle && surv.scopeToggle.destroy();
                }
            }
            if (this.doImportButton) {
                this.doImportButton.destroy();
            }
        },
        
        closeImportMonitoring: function() {
            var cb = this.get(CONTENTBOX).one(".import-monitoring");
            cb.one(".title").setHTML('');
            cb.one(".list").setHTML('');
            cb.hide();
        },
        
        openImportMonitoring: function() {
            var cb = this.get(CONTENTBOX).one(".import-monitoring");
            this.hideExternalSurveys();
            cb.one(".title").setHTML(I18n.t("survey.orchestrator.importing") + '&nbsp;<i class="fa fa-spinner fa-spin fa-fw"></i>');
            cb.show();
        },
        
        closeSurveyMixer: function() {
            var cb = this.get(CONTENTBOX);
            this.closeExternalSurveys();
            this.closeImportMonitoring();
            cb.one(".search-external-surveys").show();
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
        
        // Returns a list of the given array of variable sets
        // as an object { html: text, knownSurveys: { ... } }
        genVarSet: function(varSets, isWriteable) {
            var //sessionOfScenario = ', ' + I18n.t("survey.orchestrator.sessionOfScenario") + ' "',
                //typeScenario = I18n.t("survey.orchestrator.scenario"),
                nbEntries = 0,
                html = '',
                knownSurveys = {},
                currVarSet, vs, sourceGameModel, sourceGame, variables, v, currVar,
                isSession, createdDate, gameName;
            
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
                    var isTaken = this.isExistingSurveyName(currVar.get("name")),
                        varName = this.getFriendlyVarName(currVar),
                        comments = currVar.get("comments"),
                        varId = currVar.get("id");
                    knownSurveys[varId] =
                        {
                            surveyId: varId,
                            isWriteable: isWriteable,
                            isExternal: currVarSet.isExternal,
                            isSession: isSession,
                            sourceGameModelId: sourceGameModel.get("id"),
                            sourceGameId: sourceGame.get("id"),
                            sourceGameName: gameName,
                            name: varName,
                            label: varName +
                                (isTaken ?
                                    ' &nbsp;(' + I18n.t("survey.orchestrator.nameTaken", {name: currVar.get("name")}) + ')' :
                                ''),
                            disabled: isTaken,
                            comments: comments,
                            createdDate: createdDate,
                            hasPlayerScope: currVar.get("scopeType") === "PlayerScope"
                        };
                    if (currVarSet.isExternal) {
                        nbEntries++;
                        if (nbEntries <= MAX_LISTABLE_SURVEYS) {
                            html += 
                                '<div class="importable-survey" data-varid="' +
                                varId +
                                '"><div class="survey-header"><div class="survey-label">' +
                                varName +
                                '</div>' +
                                (
                                    comments ?
                                    '<i class="fa fa-info-circle survey-comments" data-varid="' + varId + '"></i>' :
                                    ''
                                ) +
                                '</div>' +
                                '<div class="action-buttons">' +
                                (isWriteable ?
                                    '<button class="edit-survey">Edit</button>' :
                                    '<button class="edit-survey">Preview</button>'
                                ) +
                                '</div></div>';
                        } else if (nbEntries === MAX_LISTABLE_SURVEYS) {
                            // @TODO Implement some kind of filtering/pagination for long lists:
                            html += '<b>Listing interrupted after 20 entries</b>';
                        }
                    }
                }
            }
            if (nbEntries === 0) {
                html += '(' + I18n.t("survey.orchestrator.noSurveyFound") + ')';
            }
            return {
                html: html,
                knownSurveys: knownSurveys
            };
        },
        
        // Displays the lists of (1) standard surveys and (2) the trainer's own (writeable) surveys.
        // Initializes this.knownSurveys.
        listExternalSurveys: function(standardSurveys, writeableSurveys) {
            var standardOutput, ownOutput, knownSurveys;
            
            standardOutput = this.genVarSet(standardSurveys, /* writeable= */ false);
            ownOutput = this.genVarSet(writeableSurveys, /* writeable= */ true);
            // Gather the checkboxes for both kinds of surveys:
            knownSurveys = this.knownSurveys = Object.assign(ownOutput.knownSurveys, standardOutput.knownSurveys);
            
            var cb = this.get(CONTENTBOX),
                esCB = cb.one(".external-surveys");
            
            cb.one(".search-external-surveys").hide();
            esCB.one(".list.standard").setHTML(standardOutput.html);
            esCB.one(".list.own").setHTML(ownOutput.html);
            esCB.show();
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
                            this.listExternalSurveys(standardSurveys, writeableSurveys);
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
            if (!this.knownSurveys || Object.keys(this.knownSurveys).length === 0) {
                // First initialize this.knownSurveys:
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
            var cb = this.get(CONTENTBOX);
            for (var survId in this.knownSurveys) {
                if (this.knownSurveys.hasOwnProperty(survId)) {
                    if (survDescrId && survDescrId !== survId) {
                        continue;
                    }
                    var currSurv = this.knownSurveys[survId],
                        survDescr = Y.Wegas.Facade.VariableDescriptor.cache.findById(survId);
                    if (currSurv.isExternal) {
                        continue;
                    }
                    if (!survDescr) {
                        // The survey descriptor has been deleted
                        var cbs = this.get(CONTENTBOX).one('.internal-survey[data-id="' + survId + '"]');
                        cbs.remove(true);
                        // @TODO complete this with other buttons:
                        currSurv.refreshButton && currSurv.refreshButton.destroy();
                        delete this.internalSurveys[survId];
                        delete this.knownSurveys[survId];
                        continue;
                    } else if (!currSurv.refreshButton) {
                        // The survey descriptor has just been created, add the HTML block.
                        var html =
                            "<div class=\"internal-survey\" data-id=\"" + survId + "\">" +
                            "   <div class=\"survey-header\">" +
                            "       <div class=\"survey-label\">" +
                                        currSurv.name +
                            "       </div>" +
                                    ((currSurv.comments || !this.playedIndividually) ?
                                        "<i class=\"fa fa-info-circle survey-comments\" data-varid=\"" + survId + '\"></i>' :
                                        ""
                                    ) +
                            "   </div>" +
                            "   <div class=\"action-buttons\">" +
                            "       <span class=\"status-bloc\">" +
                            "           <span class=\"status-title\">" + I18n.t("survey.orchestrator.currentStatus") + ': </span>' +
                            "           <span class=\"status\"></span>" +
                            "       </span>" +
                            "       <span class=\"survey-details\"></span>" +
                            /*
                            "       <button class=\"request-survey\" data-id=\"" + survId + "\">" + 
                                        I18n.t("survey.orchestrator.requestImmediatelyButton") + 
                            "       </button>" +
                            */
                            "       <span class=\"survey-refresh\"></span>" +
                            "   </div>" +
                            "   <div class=\"monitoring\"></div>" +
                            "</div>";

                        var surveyList = cb.one(".internal-surveys").insert(html),
                            newSurvey = surveyList.one('[data-id="' + survId + '"]');

                        currSurv.detailsButton = new Y.Button({
                            label: "<i class=\"fa fa-1x fa-tachometer icon\"></i>" + I18n.t("survey.orchestrator.progressDetailsButton"),
                            visible: true
                        }).render(newSurvey.one(".survey-details"));
                        currSurv.detailsButton.get(CONTENTBOX).setAttribute("data-id", survId);
                        
                        currSurv.refreshButton = new Y.Button({
                            label: "<i class=\"fa fa-1x fa-refresh\"></i>",
                            visible: true
                        }).render(newSurvey.one(".survey-refresh"));
                        currSurv.refreshButton.get(CONTENTBOX).setAttribute("data-id", survId);

                        //newSurvey.one(".survey-label").setContent(this.getSurveyTitle(survDescr));
                        
                        // Avoid "delegate()" as it happens to be suspect to Chrome's popup-blocker:
                        //this.handlers.push(newSurvey.one(".edit-survey").on("click", this.onEdit, this));
                    
                    } else {
                        // Just update the survey title :
                        var currSurvey = cb.one('.internal-surveys [data-id="' + survId + '"] .survey-label');
                        currSurvey.setContent(this.getSurveyTitle(survDescr));
                    }
                    this._getMonitoredData(survId);
                }
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
        
        syncTable: function(survId) {
            var team,
                teamsTable = [],
                nbTeams = 0,
                survData = this._monitoredData[survId],
                currSurv = this.knownSurveys[survId],
                cb = this.get(CONTENTBOX).one('.internal-survey[data-id="' + survId + '"]'),
                refreshButtonIcon = currSurv.refreshButton.get("contentBox").one("i"),
                prevTeamId = -1;
            
            refreshButtonIcon.addClass("fa-spin");
            
            cb.one(".status").setContent(this.statusToString(survData));
            if (survData.active === true &&
                survData.status === ORCHESTRATION_PROGRESS.NOT_STARTED) {
                //cb.one(".request-survey").show();
                //cb.one(".edit-survey").show();
            } else {
                //cb.one(".request-survey").hide();
                //cb.one(".edit-survey").hide();
            }
            
            if (survData.status !== ORCHESTRATION_PROGRESS.NOT_STARTED) {
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
                    currSurv.detailsButton.enable();
                    teamsTable.push('</tbody></table>');
                    currSurv.monitoringData = teamsTable.join("");
                    this.updateDetailsPanel(currSurv);
                } else {
                    currSurv.detailsButton.disable();
                }
            } else {
                currSurv.detailsButton.disable();
            }
            
            Y.later(500, this, function() {
                refreshButtonIcon.removeClass("fa-spin");
            });
        },

        showDetailsPanel: function(survObj) {
            var title = survObj.name,
                body = survObj.monitoringData,
                panel, panelCB, handler;
            if (!survObj.detailsPanel) {
                panel = new Y.Wegas.Panel({
                    headerContent: '<h2>' + title + '</h2><button class="close fa fa-times"></button>',
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

        clearDetailsPanel: function(survObj) {
            var panel = survObj.detailsPanel;
            if (panel) {
                panel.get(CONTENTBOX).one(".yui3-widget-bd").setHTML('');
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
        
        // Opens a new tab for editing the target survey.
        onEdit: function(e) {
            var surveyId = e.target.getData()["id"],
                surveyData = this.knownSurveys[surveyId],
                url = 'edit-survey.html?surveyId=' + surveyId + '&';
            if (surveyData.isSession) {
                url += 'gameId=' + surveyData.sourceGameId;
            } else {
                url += 'gameModelId=' + surveyData.sourceGameModelId;
            }
            if (!surveyData.isWriteable) {
                url += '&readonly=true';
            }
            window.open(url, '_blank');
        },
        
        // Called when user wants to "request" a survey to start now.
        onRequestNow: function(e) {
            var ctx = this;
            Y.use(["wegas-dashboard-modals"], function(Y) {
                var survId = e.target.getData()["id"],
                    survDescr = Y.Wegas.Facade.Variable.cache.findById(survId),
                    survName = survDescr.get("name"),
                    script = "SurveyHelper.request('" + survName + "')",
                    survScope = survDescr.get("scopeType"),
                    // Hack to impact all teams instead of just one team:
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
                    "showAdvancedImpacts": false,
                    "scopeType": survScope
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
                        if (e && e.response && e.response.results && e.response.results.message && e.response.results.message.indexOf("undefined in SurveyHelper") >= 0) {
                            ctx.showMessage("error", "Please include server script : \"wegas-survey/server/\"");
                        }
                    }
                }
            });
*/
        }
    }, {
        /** @lends Y.Wegas.SurveyOrchestrator */
        EDITORNAME: "Survey Orchestrator",
        ATTRS: {
        }
    });
    Wegas.SurveyOrchestrator = SurveyOrchestrator;
    
});
