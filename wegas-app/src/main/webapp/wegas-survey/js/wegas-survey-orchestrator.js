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
        SURVEY_NAME_DATE = "_CreationDate_",
        SURVEY_NAME_DATE_REGEXP = /(_CreationDate_[0-9]+)$/i,  // Survey name (script alias) must end with this expression.
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
        
        // Persist the current gameModel "as is".
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

            this.searchExternalButton = new Y.Button({
                label: "<i class=\"fa fa-search\"></i>",
                visible: true
            }).render(cb.one(".search-runnable-surveys"));
            this.closeSearchButton = new Y.Button({
                label: "<i class=\"fa fa-times\"></i>",
                visible: true
            }).render(cb.one(".runnable-surveys .close"));
            
            this.get(BOUNDINGBOX).ancestor().addClass("survey-orchestrator-parent");
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
            
            this.handlers.push(cb.one(".search-runnable-surveys").on("click", this.onSearchAllSurveys, this));
            cb.delegate("click", this.closeSurveyMixer, ".survey-mixer .close", this);

            cb.delegate("click", this.onCopy, ".runnable-survey .survey-copy", this);
            cb.delegate("click", this.onRequestNow, ".runnable-survey .survey-request", this);
            cb.delegate("click", this.onInvite, ".runnable-survey .survey-invite", this);
            
            cb.delegate("click", this.showProgressDetails, ".running-survey .survey-details", this);
            cb.delegate("click", this.refresh, ".running-survey .survey-refresh", this);
            
            this.tooltip = new Wegas.Tooltip({
                delegate: cb,
                delegateSelect: ".survey-comments",
                render: true,
                showDelay: 100,
                autoHideDelay: 50000
            });
            this.tooltip.plug(Y.Plugin.Injector);
            // Raise the tooltip above any DetailsPanel:
            this.tooltip.get(BOUNDINGBOX).setStyle('z-index', 100002);

            this.tooltip.on("triggerEnter", function(e) {
                var survId = +e.node.getData()["varid"],
                    surveyData = this.knownSurveys[survId],
                    details = '',
                    comments;
                    if (e.node.ancestor(function(node) { return node.hasClass("runnable-survey"); })) {
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
                    } else {
                        if (!this.playedIndividually) {
                            details += I18n.t(
                                            surveyData.hasPlayerScope ?
                                            "survey.orchestrator.hasPlayerScope" :
                                            "survey.orchestrator.hasTeamScope");
                        }
                    }
                    details += '.<br>Created on ' + new Date(surveyData.createdDate).toLocaleString('en-GB');
                    if (surveyData.comments) {
                        // Preserve line breaks in HTML output:
                        comments = '<b>' + surveyData.comments.replace(/\n/g, '<br>') + '</b>';
                    } else {
                        comments = "<i>No explanations provided by survey creator.</i>";
                    }
                this.tooltip.setTriggerContent('<div class="wegas-orchestrator-tooltip">' + comments + '<hr>' + details + '</div>');
            }, this);

        },
        
        // Returns an object containing all "own" surveys of the given list.
        getOwnSurveys: function(surveyList) {
            var own = {};
            for (var survId in surveyList) {
                var currSurv = surveyList[survId];
                if (currSurv.isWriteable) {
                    own[survId] = currSurv;
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
                    // @TODO also detach related event handlers when not covered by delegate
                }
                delete this.knownSurveys[descrId];
            }            
            var runnable = this.get(CONTENTBOX).one('.runnable-survey[data-varid="' + descrId + '"]');
            runnable && runnable.remove(true);
            if (wasInternal) {
                var running = this.get(CONTENTBOX).one('.running-survey[data-varid="' + descrId + '"]');
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
                var survId = entity.get("id");
                this.deregisterSurvey(survId);
            }
        },

        // Opens up the detailed teams/players progress window.
        showProgressDetails: function(e) {
            var survId = e.target.getData("varid");
            if (!survId){
                // The id attribute is on the parent button:
                survId = e.target.get("parentNode").getData("varid");
            }
            this.showDetailsPanel(this.knownSurveys[survId]);
            this.syncUI(survId);            
        },

        // Refreshes data for the given "internal" survey.
        refresh: function(e) {
            var survId = e.target.getData("varid");
            if (!survId){
                // The id attribute is on the parent button:
                survId = e.target.get("parentNode").getData("varid");
            }
            this.overlayDetailsPanel(this.knownSurveys[survId]);
            Y.later(500, this, function() {
                this.syncUI(survId);
            });
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
        newSurveyName: function(survId) {
            var descr = this.knownSurveys[survId],
                name = descr.name,
                newSuffix = SURVEY_NAME_DATE + Date.now(),
                newName = name.replace(SURVEY_NAME_DATE_REGEXP, newSuffix);
            if (newName !== name) {
                return newName;
            } else {
                return name.substr(0, 255-newSuffix.length) + newSuffix;
            }
        },
        
        // Imports given survey into the current gameModel
        importSurvey: function(survId, scope, successCb, failureCb) {
            return new Y.Promise(Y.bind(function(resolve) {
                // Full request: /rest/GameModel/<gameModelId>/VariableDescriptor/CherryPick/<variableDescriptorId>/<newName>/<newScopeType>
                var gameModelId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id"),
                    varName = this.newSurveyName(survId),
                    config = {
                        request: '/' + gameModelId + "/VariableDescriptor/CherryPick/" + survId + '/' + varName + (scope ? '/' + scope : ''),
                        cfg: {
                            updateCache: true,
                            method: "POST"
                        },
                        on: {
                            success: Y.bind(function(e) {
                                var newDescr = e.response.entity;
                                this.registerInternalSurvey(newDescr);
                                successCb && successCb(newDescr);
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

        // Recursively sets the scope of the given variable
        changeScope: function(survId, scope, successCb, failureCb) {
            return new Y.Promise(Y.bind(function(resolve) {
                // Full request: /rest/GameModel/<gameModelId>/VariableDescriptor/<variableDescriptorId>/CherryPick/<newScopeType>
                var gameModelId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("id"),
                    config = {
                        request: '/' + gameModelId + "/VariableDescriptor/" + survId + "/changeScope/" + scope,
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
                for (var survId in this.knownSurveys) {
                    this.deregisterSurvey(survId);
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
            for (var survId in surveyList) {
                if (surveyList[survId].isExternal) {
                    externals.push(survId);
                } else {
                    internals.push(survId);
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
                        comments = currVar.get("comments"),
                        varId = currVar.get("id"),
                        runnableHTML =  
                            '<div class="runnable-survey" data-varid="' + varId + "\">" +   // runnable-survey 
                                '<div class="survey-header"><div class="survey-label">' +
                                    label +
                                '</div>' +
                                '<i class="fa fa-info-circle survey-comments" data-varid="' + varId + '"></i>' +
                                '</div>' +
                                '<div class="action-buttons">' +
                                '<span class="survey-settings"></span>' +
                                '<span class="survey-edit"></span>' +
                                '<span class="survey-copy"></span>' +
                                '<span class="survey-request"></span>' +
                                '<span class="survey-invite"></span>' +
                            '</div></div>';
                    if (!currVarSet.isExternal) {
                        // Survey is internal, it might be running:
                        runningHTML =
                            "<div class=\"running-survey\" data-varid=\"" + varId + "\">" +
                                "<div class=\"survey-header\"><div class=\"survey-label\">" +
                                    label +
                                "</div>" +
                                "<i class=\"fa fa-info-circle survey-comments\" data-varid=\"" + varId + '\"></i>' +
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
                    
                    surveyList[varId] =
                        {
                            surveyId: varId,
                            name: name,
                            label: label,
                            isWriteable: isWriteable,
                            isExternal: currVarSet.isExternal,
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
                survId, currSurv, surveyList, newSurvey;
            targetNode.setHTML('');
            for (var i in order) {
                nbEntries++;
                if (nbEntries <= MAX_LISTABLE_SURVEYS) {
                    survId = order[i];
                    currSurv = this.knownSurveys[survId];
                    surveyList = targetNode.insert(this.knownSurveys[survId].runnableHTML);
                    newSurvey = surveyList.one('[data-varid="' + survId + '"]');
                    // Settings button:
                    currSurv.buttons.settingsButton = new Y.Button({
                        label: "<i class=\"fa fa-cog icon\"></i>",
                        visible: true
                    }).render(newSurvey.one(".survey-settings"));
                    if (currSurv.isWriteable) {
                        currSurv.buttons.settingsButton.get(CONTENTBOX).setAttribute("data-varid", survId);
                    } else {
                        currSurv.buttons.settingsButton.get(CONTENTBOX).setStyle("visibility", "hidden");
                    }
                    // Edit/Preview button:
                    currSurv.buttons.editButton = new Y.Button({
                        label:
                            currSurv.isWriteable ?
                                "<i class=\"fa fa-magic icon\"></i>" + I18n.t("survey.orchestrator.editButton") :
                                "<i class=\"fa fa-eye icon\"></i>" + I18n.t("survey.orchestrator.previewButton"),
                        visible: true
                    }).render(newSurvey.one(".survey-edit"));
                    currSurv.buttons.editButton.get(CONTENTBOX).setAttribute("data-varid", survId);
                    // Copy button:
                    currSurv.buttons.copyButton = new Y.Button({
                        label: "<i class=\"fa fa-files-o icon\"></i>" + I18n.t("survey.orchestrator.copyButton"),
                        visible: true
                    }).render(newSurvey.one(".survey-copy"));
                    currSurv.buttons.copyButton.get(CONTENTBOX).setAttribute("data-varid", survId);
                    // Launch/Request button:
                    currSurv.buttons.requestButton = new Y.Button({
                        label: "<i class=\"fa fa-play icon\"></i>" + I18n.t("survey.orchestrator.requestButton"),
                        visible: true
                    }).render(newSurvey.one(".survey-request"));
                    currSurv.buttons.requestButton.get(CONTENTBOX).setAttribute("data-varid", survId);
                    // Invite button:
                    currSurv.buttons.inviteButton = new Y.Button({
                        label: "<i class=\"fa fa-envelope icon\"></i>" + I18n.t("survey.orchestrator.inviteButton"),
                        visible: true
                    }).render(newSurvey.one(".survey-invite"));
                    currSurv.buttons.inviteButton.get(CONTENTBOX).setAttribute("data-varid", survId);

                    // Avoid "delegate()" as it happens to be suspect to Chrome's popup-blocker:
                    this.handlers.push(newSurvey.one(".survey-edit").on("click", this.onEdit, this));
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
                for (var survId in this.knownSurveys) {
                    this.deregisterSurvey(survId);
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
            this.get(CONTENTBOX).one(".runnable-surveys .list").setHTML('<i class=\"fa fa-2x fa-refresh fa-spin\"></i>');
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
                survId, currSurv, survDescr;
            if (typeof survDescrId === "string") {
                survDescrId = +survDescrId;
            }
            for (survId in this.knownSurveys) {
                if (survDescrId && survDescrId !== +survId) {
                    continue;
                }
                currSurv = this.knownSurveys[survId];
                if (currSurv.isExternal) {
                    continue;
                }
                survDescr = Y.Wegas.Facade.VariableDescriptor.cache.findById(survId);
                if (!survDescr) {
                    // The survey descriptor has been deleted
                    this.deregisterSurvey(survId);
                    continue;
                } else if (!listCB.one('.running-survey[data-varid="' + survId + '"]')) {
                    // The survey descriptor is new, display the HTML and add the buttons.
                    var surveyList = listCB.insert(currSurv.runningHTML),
                        newSurvey = surveyList.one('[data-varid="' + survId + '"]');

                    currSurv.buttons.detailsButton = new Y.Button({
                        label: "<i class=\"fa fa-1x fa-tachometer icon\"></i>" + I18n.t("survey.orchestrator.progressDetailsButton"),
                        visible: true
                    }).render(newSurvey.one(".survey-details"));
                    currSurv.buttons.detailsButton.get(CONTENTBOX).setAttribute("data-varid", survId);

                    currSurv.buttons.refreshButton = new Y.Button({
                        label: "<i class=\"fa fa-1x fa-refresh\"></i>",
                        visible: true
                    }).render(newSurvey.one(".survey-refresh"));
                    currSurv.buttons.refreshButton.get(CONTENTBOX).setAttribute("data-varid", survId);

                } else {
                    // Just update the survey title :
                    var currSurvey = listCB.one('.running-survey[data-varid="' + survId + '"] .survey-label');
                    currSurvey.setContent(this.getSurveyTitle(survDescr));
                }
                this._getMonitoredData(survId);
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
                cb = this.get(CONTENTBOX).one('.running-surveys'),
                listCB = cb.one('.list'),
                survCB = listCB.one('.running-survey[data-varid="' + survId + '"]'),
                refreshButtonIcon = currSurv.buttons.refreshButton.get("contentBox").one("i"),
                prevTeamId = -1;
            
            refreshButtonIcon.addClass("fa-spin");
            
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
            
            Y.later(500, this, function() {
                refreshButtonIcon.removeClass("fa-spin");
            });
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
        
        // Opens a new tab for editing the target survey.
        onEdit: function(e) {
            var survId = e.target.getData()["varid"];
            if (!survId){
                // The id attribute is on the parent button:
                survId = e.target.get("parentNode").getData("varid");
            }
            var surveyData = this.knownSurveys[survId],
                url = 'edit-survey.html?surveyId=' + survId + '&';
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
        
        // Called when user wants to duplicate a survey.
        // Imports the survey if it's external (i.e. outside this gameModel).
        // Otherwise it duplicates it.
        onCopy: function(e) {
            var survId = e.target.getData()["varid"];
            if (!survId){
                // The id attribute is on the parent button:
                survId = e.target.get("parentNode").getData("varid");
            }
            // Importing with CherryPick will also duplicate when needed:
            this.importSurvey(
                survId,
                // Set TeamScope in case it's going to be used in-game.
                // It will be converted back to PlayerScope if launched via the dashboard.
                "TeamScope",
                function(descr) {
                    // success, nothing to do.
                },
                function(e) {
                    Y.Wegas.Panel.alert("Could not import survey<br>" + e);
                }
            );
        },
        
        
        // Called when user wants to "request" a survey to start now.
        // First imports the survey if it's external.
        // Parameter e may be a survey id (number) or an event object.
        onRequestNow: function(e) {
            var ctx = this,
                survId, currSurv, survDescr;
            if (typeof e === 'number') {
                survId = e;
            } else {
                survId = e.target.getData()["varid"];
                if (!survId){
                    // The id attribute is on the parent button:
                    survId = e.target.get("parentNode").getData("varid");
                }
            }
            currSurv = this.knownSurveys[survId];
            if (currSurv.isRunning) {
                Y.Wegas.Panel.alert(I18n.t("survey.orchestrator.alreadyLaunched"));
                return;
            }
            if (currSurv.isExternal) {
                this.importSurvey(
                    survId,
                    "PlayerScope",   // Convert to PlayerScope when launched through dashboard
                    function(descr) {
                        ctx.onRequestNow(descr.get("id"));
                    },
                    function(e) {
                        Y.Wegas.Panel.alert("Could not import survey<br>" + e);
                    }
                );
            } else {
                if (!currSurv.hasPlayerScope) { // The survey is internal but with wrong scope (we could also check recursively)
                    this.changeScope(
                        survId,
                        "PlayerScope",  // Convert to PlayerScope when launched through dashboard
                        function(descr) {
                            currSurv.hasPlayerScope = true;
                            ctx.onRequestNow(descr.get("id"));
                        },
                        function(e) {
                            Y.Wegas.Panel.alert("Could not change scope of survey<br>" + e);
                        }
                    );
                    return;
                }
                survDescr = Y.Wegas.Facade.Variable.cache.findById(survId);
                Y.use(["wegas-dashboard-modals"], function(Y) {
                    var survName = survDescr.get("name"),
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
            }
        },
        
        // Opens a dialog for selecting the e-mail message and its recipients.
        onInvite: function(e) {
            var survId = e.target.getData()["varid"];
            if (!survId){
                // The id attribute is on the parent button:
                survId = e.target.get("parentNode").getData("varid");
            }
            var surveyData = this.knownSurveys[survId];
            
            Y.Wegas.Panel.alert("Sorry, not yet implemented.");
        }

    }, {
        /** @lends Y.Wegas.SurveyOrchestrator */
        EDITORNAME: "Survey Orchestrator",
        ATTRS: {
        }
    });
    Wegas.SurveyOrchestrator = SurveyOrchestrator;
    
});
