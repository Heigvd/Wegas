/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020  School of Management and Engineering Vaud, Comem, MEI
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
        SERVER_SCRIPT_PATH = "wegas-app/js/server",
        SURVEY_CONTAINER_GAMEMODEL_NAME = "Survey container",
        SURVEY_CONTAINER_ICON = "ICON_dark-orangine_bar-chart_fa",
        GAMEMODEL_SCENARIO = "SCENARIO",
        GAMEMODEL_SESSION = "PLAY",
        SURVEY_CONTAINER_PROPERTIES = {
            scriptUri: SERVER_SCRIPT_PATH,
            iconUri: SURVEY_CONTAINER_ICON,
            freeForAll: true
        },
        EMPTY_GAMEMODEL_ID = 1,
        WEGAS_MAX_NAME_LENGTH = 255,
        SURVEY_NAME_DATE = "_CrDat_",
        SURVEY_NAME_DATE_REGEXP = /(_CrDat_[0-9]+)$/i,  // Survey name (script alias) must end with this expression.
        PUBLISHED = true,
        UNPUBLISHED = !PUBLISHED,
        TEAMSCOPE = "TeamScope",
        PLAYERSCOPE = "PlayerScope",
        VARSET_IS_WRITEABLE = true,
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

    // Displays a nice alert.
    // @param msg string message
    // @param modal optional boolean, defaults to false
    function orchestratorAlert(msg, modal) {
        var panel = new Y.Wegas.Panel({
            content: "<div class='icon icon-warn'>" + msg + "</div>",
            modal: modal === true,
            width: 400,
            buttons: {
                footer: [{
                        label: I18n.t('global.ok') || 'OK',
                        action: function() {
                            panel.exit();
                        }
                    }]
            }
        }).render();
        var cb = panel.get(CONTENTBOX);
        cb.addClass("wegas-orchestrator-alert");
        adjustPanelHeight(panel);

        // Sometimes the popup may hide the cause of the alert:
        panel.plug(Y.Plugin.DraggablePanel, {});
    }

    // Displays a nice success notification
    // @param msg string message
    // @param modal optional boolean, defaults to false
    function orchestratorSuccess(msg, modal) {
        var panel = new Y.Wegas.Panel({
            content: "<div class='icon icon-success'>" + msg + "</div>",
            modal: modal === true,
            width: 400,
            buttons: {
                footer: [{
                        label: I18n.t('global.ok') || 'OK',
                        action: function() {
                            panel.exit();
                        }
                    }]
            }
        }).render();
        var cb = panel.get(CONTENTBOX);
        cb.addClass("wegas-orchestrator-success");
        adjustPanelHeight(panel);
        panel.plug(Y.Plugin.DraggablePanel, {});
    }
    
    // Adjusts panel height to max 80% of screen size.
    function adjustPanelHeight(panel) {
        var boxHeight = Number.parseInt(panel.get(CONTENTBOX).getComputedStyle("height")),
            bodyHeight = Number.parseInt(Y.one("body").getComputedStyle("height"));
        panel.get(BOUNDINGBOX).setStyle("max-height", "80%");
        if (boxHeight >= 0.8*bodyHeight) {
            panel.get(BOUNDINGBOX).setStyle("height", (0.8*bodyHeight) + "px");
        } else {
            panel.get(BOUNDINGBOX).setStyle("height", boxHeight + "px");
        }
    }
    
    // Syntactical validation of an email address.
    // Returns null if not valid.
    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

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
            "           <div class=\"section-title standard\">" + I18n.t("survey.orchestrator.standardSurveysTitle") + "</div>" +
            "           <div class=\"list standard\"></div>" +
            "           <div class=\"section-title own\">" + I18n.t("survey.orchestrator.externalSurveysTitle") + "</div>" +
            "           <div class=\"list own\"></div>" +
            "        </div>" +
            "    </div>" +
            "    <div class=\"running-surveys\">" +
            "       <div class=\"section-title\">" + I18n.t("survey.orchestrator.activeSurveysTitle") + "</div>" +
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
            this.currentGameId =  Y.Wegas.Facade.Game.cache.getCurrentGame().get("id");
            var gm = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel();
            this.currentGameModelId =  gm.get("id");
            this.playedIndividually = gm.get("properties").get("val.freeForAll");
            this.currentPlayerId = Y.Wegas.Facade.Game.cache.getCurrentPlayer().get("id");
            this.participants = this.getNbTeamsPlayers();
            this.playerEmails = [];
            this.getEmails();
            this.participantsCallbacks = [];
            this.checkXapiPath();
        },
        
        // Persists the given gameModel "as is".
        persistGameModel: function(gameModel, successCb, failureCb) {
            Y.Wegas.Facade.GameModel.cache.put(
                gameModel.toObject(), 
                {
                    on: {
                        success: successCb,
                        failure: failureCb
                    }
                }
            );
        },
        
        // Persists the given game "as is".
        persistGame: function(game, successCb, failureCb) {
            Y.Wegas.Facade.Game.cache.put(
                game.toObject(), 
                {
                    on: {
                        success: successCb,
                        failure: failureCb
                    }
                }
            );
        },

        // Persists the given SurveyDescriptor "as is".
        // No recursive saving of child sections or inputs.
        persistSurvey: function(surveyDescr, successCb, failureCb) {
            Y.Wegas.Facade.Variable.cache.put(
                surveyDescr.toObject(),
                {
                    on: {
                        success: successCb,
                        failure: failureCb
                    }
                }
            );
        },

        // Removes the given language from the given gameModel.
        // @TODO finish implementation of server-side code.
        /*
        removeLanguage: function(gameModelId, langCode, successCb, failureCb) {
            // Full request: /rest/GameModel/<gameModelId>/I18n/Lang/<code>
            var config = {
                    request: '/' + gameModelId + "/I18n/Lang/" + langCode,
                    cfg: {
                        updateCache: true,
                        method: "DELETE"
                    },
                    on: {
                        success: Y.bind(function(e) {
                            successCb && successCb(e);
                        }, this),
                        failure: Y.bind(function(e) {
                            failureCb && failureCb(e);
                        }, this)
                }
            };
            Y.Wegas.Facade.GameModel.sendRequest(config);
        },
        */
       
        // Instantiates a new game (or "session") from the given gameModel
        createGame: function(sourceGameModelId, gameName, successCb, failureCb) {
            // Full request: /rest/GameModel/<gameModelId>/Game
            var gameAttrs = {
                    "@class": "Game",
                    "access": "OPEN",   // "CLOSE" generates access right issues on debug team at this stage
                    "gameModelId": sourceGameModelId,
                    "name": gameName,
                    "properties": SURVEY_CONTAINER_PROPERTIES
                },
                config = {
                    request: '/' + sourceGameModelId + "/Game",
                    cfg: {
                        updateCache: true,
                        method: "POST",
                        data: gameAttrs
                    },
                    on: {
                        success: Y.bind(function(e) {
                            var newGame = e.response.entity;
                            successCb && successCb(newGame);                            
                        }, this),
                        failure: Y.bind(function(e) {
                            failureCb && failureCb(e);
                        }, this)
                }
            };
            Y.Wegas.Facade.GameModel.sendRequest(config);
        },
        
        /*
         * Creates an empty gameModel with the given name.
         * @Param gameName string
         * @Param languages array of languages from the source gameModel
         * @Param type string, either "PLAY" or "SCENARIO"
         * @Param successCb callback
         * @Param failureCb callback
        */
        createEmptyGameModel: function(gameName, languages, type, successCb, failureCb) {
            var data = {
                    "@class": "GameModel",
                    "name": gameName,
                    "languages": languages, // [{"@class":"GameModelLanguage","code":"FR","lang":"français","active":true}],
                    "status": "LIVE",
                    "type": type,
                    "comments": SURVEY_CONTAINER_GAMEMODEL_NAME,
                    "properties":{
                        "freeForAll": true,
                        "guestAllowed": false,
                        "pagesUri": "",
                        "cssUri": "",
                        "websocket": "",
                        "logID": "",
                        "scriptUri": SERVER_SCRIPT_PATH,
                        "clientScriptUri": "",
                        "iconUri": SURVEY_CONTAINER_ICON,
                        "@class": "GameModelProperties"
                    },
                    "uiversion": 1
                    //"createdByName": "Moi"
                },
                callbacks = {
                    success: Y.bind(function(e) {
                            successCb && successCb(e.response.entity);
                        }, this),
                    failure: Y.bind(function(e) {
                            failureCb && failureCb(e);
                        }, this)
                };
            Y.Wegas.Facade.GameModel.cache.post(data, null, callbacks);
            return;
            
            // Full request: /rest/GameModel/<gameModelId>
            var gameModelId = EMPTY_GAMEMODEL_ID,
                gameAttrs = {
                    "@class": "GameModel",
                    "name": gameName,
                    // This attribute seems to be ignored: server-side bug?
                    "properties": SURVEY_CONTAINER_PROPERTIES
                },
                config = {
                    request: '/' + gameModelId,
                    cfg: {
                        updateCache: true,
                        method: "POST",
                        data: gameAttrs
                    },
                    on: {
                        success: Y.bind(function(e) {
                            successCb && successCb(e.response.entity);
                        }, this),
                        failure: Y.bind(function(e) {
                            failureCb && failureCb(e);
                        }, this)
                }
            };
            Y.Wegas.Facade.GameModel.sendRequest(config);
        },

        // Invites into the current game all LIVE players, either anonymously or linked to accounts.
        sendInviteToLive: function(surveyIds, btn, emails, linkedToAccount, successCb, failureCb) {
            // Full request linked: /rest/GameModel/<gameModelId>/Game/InvitePlayersToSurvey/<surveyIds>*
            // Full request anon: /rest/GameModel/<gameModelId>/Game/InvitePlayersToSurveyAnonymously/<surveyIds>*
            // Request returns: InvitationResult object { invitedEmails: array of strings }
            var request = linkedToAccount ? 'InvitePlayersToSurvey' : 'InvitePlayersToSurveyAnonymously',
                config = {
                    request: '/' + this.currentGameModelId + '/Game/' + request + '/' + surveyIds,
                    cfg: {
                        updateCache: true,
                        method: "POST",
                        data: emails
                    },
                    on: {
                        success: Y.bind(function(e) {
                            var entities = e.serverResponse.get("updatedEntities"),
                                res = entities.find(
                                    function(obj) {
                                        return obj.get("@class") && obj.get("@class").indexOf("InvitationResult");
                                    });
                            res = res && res.get("val");
                            var invitedEmails = (res && res.invitedEmails) || [];
                            orchestratorSuccess(I18n.t("survey.orchestrator.invitePanel.surveyInvitedFromLive", { number: invitedEmails.length }));
                            successCb && successCb(invitedEmails);
                            btn && btn.stopSpinning();
                        }, this),
                        failure: Y.bind(function(e) {
                            try {
                                var wegasErrorMessage = e.serverResponse.get("events")[0].get("val.exceptions")[0].get("val");
                                if (wegasErrorMessage.messageId === "WEGAS-INVITE-SURVEY-NO-EMAIL") {
                                    orchestratorAlert(I18n.t("survey.orchestrator.errors.inviteNoEmails"));
                                } else {
                                    orchestratorAlert(wegasErrorMessage.message);
                                }
                            } catch(ex) {
                                orchestratorAlert("Internal error: could not send invitations");
                            }
                            failureCb && failureCb(e);
                            btn && btn.stopSpinning();
                        }, this)
                }
            };
            Y.Wegas.Facade.GameModel.sendRequest(config);
        },

        // Invites into the current game the given email owners.
        sendInviteToList: function(surveyIds, btn, emails, successCb, failureCb) {
            // Full request: /rest/GameModel/<gameModelId>/Game/inviteEmailsToSurveyAnonymously/<surveyIds>*
            // Request returns: InvitationResult object { invitedEmails: array of strings }
            var config = {
                    request: '/' + this.currentGameModelId + '/Game/inviteEmailsToSurveyAnonymously/' + surveyIds,
                    cfg: {
                        updateCache: true,
                        method: "POST",
                        data: emails
                    },
                    on: {
                        success: Y.bind(function(e) {
                            var entities = e.serverResponse.get("updatedEntities"),
                                res = entities.find(
                                    function(obj) {
                                        return obj.get("@class") && obj.get("@class").indexOf("InvitationResult");
                                    });
                            res = res && res.get("val");
                            var invitedEmails = (res && res.invitedEmails) || [];
                            orchestratorSuccess(I18n.t("survey.orchestrator.invitePanel.surveyInvitedFromList", { number: invitedEmails.length }));
                            successCb && successCb(invitedEmails);
                            btn && btn.stopSpinning();
                        }, this),
                        failure: Y.bind(function(e) {
                            try {
                                var wegasErrorMessage = e.serverResponse.get("events")[0].get("val.exceptions")[0].get("val");
                                if (wegasErrorMessage.messageId === "WEGAS-INVITE-SURVEY-NO-EMAIL") {
                                    orchestratorAlert(I18n.t("survey.orchestrator.errors.inviteNoEmails"));
                                } else {
                                    orchestratorAlert(wegasErrorMessage.message);
                                }
                            } catch(ex) {
                                orchestratorAlert("Internal error: could not send invitations");
                            }
                            failureCb && failureCb(e);
                            btn && btn.stopSpinning();
                        }, this)
                }
            };
            Y.Wegas.Facade.GameModel.sendRequest(config);
        },

        // Returns the promise of an array of emails as strings
        // @Param team optional
        getEmails: function(team) {
            var ctx = this;
            return new Y.Promise(function(resolve, reject) {
                var gameId = Y.Wegas.Facade.Game.cache.getCurrentGame().get("id"),
                    requestURL;
                if (team) {
                    requestURL = Y.Wegas.app.get("base") + "rest/Extended/User/Emails/" + gameId + "/" + team.get("id");
                } else {
                    requestURL = Y.Wegas.app.get("base") + "rest/Extended/User/Emails/" + gameId;
                }

                Y.io(requestURL, {
                    cfg: {
                        method: "GET",
                        headers: {
                            "Managed-Mode": true
                        }
                    },
                    on: {
                        success: Y.bind(function(rId, xmlHttpRequest) {
                            var emails = JSON.parse(xmlHttpRequest.response),
                                guestPos;
                            // Suppress all occurrences of "Guest"
                            while ((guestPos = emails.indexOf("Guest")) !== -1) {
                                emails.splice(guestPos, 1);
                            }
                            ctx.playerEmails = emails;
                            resolve(emails);
                        }, this),
                        failure: Y.bind(function(rId, xmlHttpRequest) {
                            resolve("PERMISSION-ERROR");
                        }, this)
                    }
                });
            });
        },

        // Returns the most up-to-date number of live/waiting non-empty teams and players in the current game.
        // Also counts anonymous "SURVEY" teams and players.
        // Result: { teams: #, players: #, surveyTeams: #, surveyPlayers: # }
        // Updates global this.playerEmails when required.
        getNbTeamsPlayers: function() {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                teams = game.get("teams"),
                nbTeams = 0,
                nbSurveyTeams = 0,
                nbPlayers = 0,
                nbSurveyPlayers = 0,
                players, t, p, currTeam, tStatus, pStatus, empty;
            for (t in teams) {
                currTeam = teams[t];
                if (currTeam.get("@class") === "DebugTeam") { continue; }
                tStatus = currTeam.get("status");
                if (tStatus === "LIVE" || tStatus === "SURVEY" || tStatus === "WAITING") {
                    empty = true;
                    players = currTeam.get("players");
                    for (p in players) {
                        pStatus = players[p].get("status");
                        if (pStatus === "LIVE" || pStatus === "WAITING") {
                            nbPlayers++;
                            empty = false;
                        } else if (pStatus === "SURVEY") {
                            nbSurveyPlayers++;
                            empty = false;                            
                        }
                    }
                    if (!empty) {
                        if (tStatus === "LIVE") {
                            nbTeams++;
                        } else {
                            nbSurveyTeams++;
                        }
                    }
                }
            }
            return {
                teams: nbTeams,
                players: nbPlayers,
                surveyTeams: nbSurveyTeams,
                surveyPlayers: nbSurveyPlayers
            };
        },

        // Checks that server script paths enable xAPI logging and updates server script paths if needed.
        // Does nothing if the gameModel has no internal surveys.
        checkXapiPath: function(){
            if (Y.Wegas.Facade.Variable.cache.find("@class", "SurveyDescriptor")) {
                var gm = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                    props = gm.get("properties"),
                    serverScripts = props.get("val.scriptUri").trim();
                if (serverScripts.indexOf(SERVER_SCRIPT_PATH) < 0) {
                    if (serverScripts.length > 0 && serverScripts[serverScripts.length-1] !== ';') {
                        serverScripts += ';';
                    }
                    serverScripts += SERVER_SCRIPT_PATH;
                    props.set("val.scriptUri", serverScripts);
                    this.persistGameModel(gm);
                }
            } else {
                // Remove script path from gameModel properties ?
            }
        },
        
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                logId = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("properties").get("val").logID;
            if (!logId) {
                var msg = I18n.t("survey.orchestrator.errors.noLogId");
                this.get("contentBox").one(".warning").setContent(msg);
            } else {
                Y.log("Log ID = " + logId);
            }

            this.searchExternalButton = new SpinButton({
                label: '<i class="fa fa-search icon"></i>',
                onClick: Y.bind(this.onSearchAllSurveys, this),
                autoSpin: true
            }).render(cb.one(".search-runnable-surveys"));
            this.searchExternalButton.startSpinning();
            
            this.closeSearchButton = new SpinButton({
                label: '<i class="fa fa-times"></i>',
                onClick: Y.bind(this.closeSurveyMixer, this)
            }).render(cb.one(".runnable-surveys .close"));
            
            this.get(BOUNDINGBOX).ancestor().addClass("survey-orchestrator-parent");
        },
        
        // Gets information from server about players who actually entered the given survey.
        getSurveyPlayers: function(surveyId, successCB, failureCB) {
            var survDescr = Y.Wegas.Facade.Variable.cache.findById(surveyId),
                refreshButton = this.knownSurveys[surveyId].buttons.refreshButton;
            if (survDescr){
                successCB || refreshButton.startSpinning();
                var survName = survDescr.get("name");
                Y.Wegas.Facade.Variable.sendRequest({
                    request: "/Script/Run/" + this.currentPlayerId,
                    cfg: {
                        method: "POST",
                        headers: {"Managed-Mode": false},
                        data: {
                            "@class": "Script",
                            content: "SurveyHelper.summarize('" + survName + "');"
                        }
                    },
                    on: {
                        success: Y.bind(function(e) {
                            var currSurv = this.knownSurveys[surveyId],
                                survData = this._monitoredData[surveyId] = e.response.results;
                            currSurv.isRunning = (survData.active === true && (survData.status !== ORCHESTRATION_PROGRESS.NOT_STARTED || currSurv.isInviting));
                            currSurv.runStatus = survData.status;
                            successCB && successCB(survData);
                            this.syncTable(surveyId);
                        }, this),
                        failure: Y.bind(function(e) {
                            refreshButton.stopSpinning();
                            if (e && e.response && e.response.results && e.response.results.message && e.response.results.message.indexOf("undefined in SurveyHelper") >= 0) {
                                this.showMessage("error", "Please include server script : \"wegas-app/js/server/\"");
                            }
                            failureCB && failureCB();
                        }, this)
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
            this.handlers.push(Y.Wegas.Facade.Game.after("update", this.onUpdatedGame, this));

            this.tooltip = new Wegas.Tooltip({
                delegate: cb,
                delegateSelect: ".survey-comments",
                render: true,
                showDelay: 100,
                autoHideDelay: 50000
            });
            this.tooltip.plug(Y.Plugin.Injector);
            this.tooltip.on("triggerEnter", this.onInfoTooltip, this);
            // Raise the tooltip above any pop-up Panel:
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
        
        // Adds the given survey descriptor to the list of known surveys.
        registerInternalSurvey: function(sd) {
            if (sd.get("parentId") !== this.currentGameModelId) {
                return;
            }
            var descrId = sd.get("id"),
                varSet = {},
                varList;
            if (!this.knownSurveys[descrId]) {
                varSet.gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel();
                varSet.game = Y.Wegas.Facade.Game.cache.getCurrentGame();
                varSet.isExternal = false;
                varSet.variables = [sd];
                varList = this.processVarSet([varSet], VARSET_IS_WRITEABLE);
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

        // Registers a callback of type function({ players, teams }) to be invoked
        // every time a new player or team joins the game.
        // Returns an ID for later callback unsubscription.
        subscribeToParticipantUpdates: function(callback) {
            this.participantsCallbacks.push(callback);
            return this.participantsCallbacks.length-1;
        },
        
        // Deregister a callback
        detachParticipantUpdates: function(callbackID) {
            this.participantsCallbacks.splice(callbackID, 1);
        },

        // Listens to updates to the current game, especially the number of participants and their emails.
        // Updates global variables this.participants and this.playerEmails.
        onUpdatedGame: function(e) {
            var entity = e.currentTarget.data[0];
            if (entity.get("id") === this.currentGameId) {
                var latestCount = this.getNbTeamsPlayers();
                if (latestCount.players !== this.participants.players ||
                    latestCount.teams !== this.participants.teams) {
                    this.participants = latestCount;
                    Y.all(".wegas-survey-orchestrator-updated-nb-players").setContent(latestCount.players);
                    Y.all(".wegas-survey-orchestrator-updated-nb-teams").setContent(latestCount.teams);
                    // Update the list of emails only when needed:
                    if (Y.one(".wegas-survey-invite")) {
                        this.getEmails().then(Y.bind(
                            function(emails) {
                                for (var cb in this.participantsCallbacks) {
                                    this.participantsCallbacks[cb](latestCount);
                                }
                            }, this));
                    } else {
                        for (var cb in this.participantsCallbacks) {
                            this.participantsCallbacks[cb](latestCount);
                        }
                    }
                }
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
        
        // Imports given survey into the given gameModel
        importSurvey: function(surveyId, targetGameModelId, scope, setPublished, successCb, failureCb) {
            return new Y.Promise(Y.bind(function(resolve) {
                // Full request: /rest/GameModel/<targetGameModelId>/VariableDescriptor/CherryPickSurvey/<variableDescriptorId>/<newName>/<newScopeType>
                var varName = this.newSurveyName(surveyId),
                    config = {
                        request: '/' + targetGameModelId + "/VariableDescriptor/CherryPickSurvey/" + surveyId + '/' + varName + (scope ? '/' + scope : ''),
                        cfg: {
                            updateCache: true,
                            method: "POST",
                            data: {
                                published: setPublished
                            }
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
        changeScope: function(surveyId, scope, successCb, failureCb) {
            return new Y.Promise(Y.bind(function(resolve) {
                // Full request: /rest/GameModel/<gameModelId>/VariableDescriptor/<variableDescriptorId>/changeScope/<newScopeType>
                var gameModelId = this.currentGameModelId,
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
            var currGameId = this.currentGameId,
                currGameModelId = this.currentGameModelId,
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
        
        // Returns the core properties of the given array of languages
        getLanguages: function(languages) {
            var res = [],
                currLang,
                newLang;
            for (var i in languages){
                currLang = languages[i];
                newLang = {
                    "@class" : currLang.get("@class"),
                    "code": currLang.get("code"),
                    "lang": currLang.get("lang"),
                    "active": currLang.get("active")
                };
                res.push(newLang);
            }
            return res;
        },
        
        // Processes the given array of variable sets to return a 'knownSurveys' compatible list
        processVarSet: function(varSets, varSetsAreWriteable) {
            var surveyList = {},
                currVarSet, vs, sourceGameModel, sourceGame, gmLanguages, variables, v, currVar,
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
                gmLanguages = this.getLanguages(sourceGameModel.get("languages"));
                for (v in variables) {
                    currVar = variables[v];
                    var name = currVar.get("name"),
                        label = this.getFriendlyVarLabel(currVar),
                        isPublished = currVar.get("isPublished"),
                        comments = currVar.get("comments"),
                        surveyId = currVar.get("id"),
                        runnableHTML =  
                            '<div class="runnable-survey' +
                                    (isPublished ? '' : ' wegas-advanced-feature') +
                                    '" data-surveyId="' + surveyId + "\">" +
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
                        // Survey is internal, it might be running, but start as hidden entry until it's to be considered as visible
                        runningHTML =
                            "<div class=\"running-survey\" data-surveyId=\"" + surveyId + "\" hidden=\"hidden\" style=\"display:none;\">" +
                                "<div class=\"survey-header\"><div class=\"survey-label\">" +
                                    label +
                                "</div>" +
                                "<i class=\"fa fa-info-circle survey-comments\" data-surveyId=\"" + surveyId + '\"></i>' +
                                "</div>" +
                                "<div class=\"action-buttons\">" +
                                    "<span class=\"survey-cancel\"></span>" +
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
                            isWriteable: varSetsAreWriteable,
                            isExternal: currVarSet.isExternal,
                            isPublished: isPublished,
                            isRunning: currVar.get("hasTokens"), // additional conditions must still be fetched from the server
                            isInviting: currVar.get("hasTokens"),
                            isSession: isSession,
                            sourceGameModelId: sourceGameModel.get("id"),
                            sourceGameId: sourceGame.get("id"),
                            sourceGameName: gameName,
                            createdDate: createdDate,
                            hasPlayerScope: currVar.get("scopeType") === PLAYERSCOPE,
                            runnableHTML: runnableHTML,
                            runningHTML: runningHTML,
                            languages: gmLanguages,
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
                        autoSpin: false,
                        onClick: Y.bind(this.showInvitePanel, this),
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

            standardList = this.processVarSet(standardSurveys, !VARSET_IS_WRITEABLE);
            ownList = this.processVarSet(writeableSurveys, VARSET_IS_WRITEABLE);
            knownSurveys = this.knownSurveys = Object.assign({}, ownList, standardList);

            this.get(CONTENTBOX).one(".search-runnable-surveys").hide();
            this.searchExternalButton.stopSpinning();
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

                    currSurv.buttons.cancelButton = new SpinButton({
                        label: "<i class=\"fa fa-1x fa-times icon\"></i>",
                        autoSpin: true,
                        onClick: Y.bind(this.onCancelRunningSurvey, this),
                        surveyId: surveyId
                    }).render(newSurvey.one(".survey-cancel"));

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
                this.getSurveyPlayers(surveyId);
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
                        return survey.isInviting ? 
                            I18n.t("survey.orchestrator.inviting") :
                            I18n.t("survey.orchestrator.notStarted");
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
            
            // Hide inactive, empty and unstarted, uninviting surveys from the list of running surveys:
            if (!currSurv.isRunning) {
                survCB.hide();
                currSurv.runningDetailsPanel && currSurv.deleteRunningDetailsPanel();
                this.checkIfEmptyRunningSurveys();
            } else {
                survCB.show();
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
                for (team in survData.teamdata) {
                    var teamData = survData.teamdata[team];
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
                panel, cb, handler;
            if (!survObj.runningDetailsPanel) {
                survObj.runningDetailsPanel = panel = new Y.Wegas.Panel({
                    headerContent: '<h2>' + title + '</h2><button class="yui3-widget yui3-button yui3-button-content close fa fa-times"></button>',
                    content: body,
                    modal: false,
                    width: 600
                }).render();
                cb = panel.get(CONTENTBOX);
                cb.addClass("wegas-orchestrator-panel wegas-survey-details");
                adjustPanelHeight(panel);
                panel.plug(Y.Plugin.DraggablePanel, {});
                
                survObj.deleteRunningDetailsPanel = Y.bind(function() {
                    if (survObj.runningDetailsPanel) {
                        survObj.runningDetailsPanel = null;
                        handler.detach();
                        panel.destroy();
                    }
                }, this);
                    
                handler = cb.one(".close").on("click", survObj.deleteRunningDetailsPanel, this);
            } else {
                this.updateDetailsPanel(survObj);
                adjustPanelHeight(panel);
            }
        },

        updateDetailsPanel: function(survObj) {
            var panel = survObj.runningDetailsPanel;
            if (panel) {
                panel.get(CONTENTBOX).one(".yui3-widget-bd").setHTML(survObj.monitoringData);
            }
        },

        overlayDetailsPanel: function(survObj) {
            var panel = survObj.runningDetailsPanel;
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
                body, panel, settingsPanel,
                buttons = {},
                handlers = [];
            body =
                '<div class="settings-line"><div class="survey-delete"></div><div class="survey-rename"></div><div class="survey-share"></div></div>' +
                '<div class="settings-line" style="margin-top: 30px;"><div class="settings-text">' + I18n.t("survey.orchestrator.scopeTitle") + 
                '</div><div class="survey-scope-player"></div><div class="survey-scope-team"></div></div>';
            if (!survObj.runnableSettingsPanel) {
                survObj.runnableSettingsPanel = panel = new Y.Wegas.Panel({
                    headerContent: '<h2>' + title + '</h2><button class="yui3-widget yui3-button yui3-button-content close fa fa-times"></button>',
                    content: body,
                    modal: false,
                    width: 600
                }).render();
                settingsPanel = panel.get(CONTENTBOX);
                settingsPanel.addClass("wegas-orchestrator-panel wegas-survey-settings");
                
                buttons.deleteButton = new SpinButton({
                    label: "<i class=\"fa fa-trash icon\"></i>" + I18n.t("survey.orchestrator.deleteButton"),
                    onClick: Y.bind(this.onDelete, this),
                    autoSpin: true,
                    surveyId: surveyId
                }).render(settingsPanel.one(".survey-delete"));

                buttons.renameButton = new SpinButton({
                    label: "<i class=\"fa fa-magic icon\"></i>" + I18n.t("survey.orchestrator.renameButton"),
                    onClick: Y.bind(this.onEdit, this),
                    surveyId: surveyId
                }).render(settingsPanel.one(".survey-rename"));

                buttons.shareButton = new SpinButton({
                    label: "<i class=\"fa fa-share-alt-square icon\"></i>" + I18n.t("survey.orchestrator.shareButton"),
                    onClick: Y.bind(this.onShare, this),
                    autoSpin: true,
                    surveyId: surveyId
                }).render(settingsPanel.one(".survey-share"));

                buttons.playerScopeButton = new SpinButton({
                    label: "<i class=\"fa fa-user icon\"></i>" + I18n.t("survey.orchestrator.playerScopeButton"),
                    onClick: Y.bind(this.onPlayerScope, this),
                    autoSpin: true,
                    surveyId: surveyId
                }).render(settingsPanel.one(".survey-scope-player"));

                buttons.teamScopeButton = new SpinButton({
                    label: "<i class=\"fa fa-users icon\"></i>" + I18n.t("survey.orchestrator.teamScopeButton"),
                    onClick: Y.bind(this.onTeamScope, this),
                    autoSpin: true,
                    surveyId: surveyId
                }).render(settingsPanel.one(".survey-scope-team"));
                
                adjustPanelHeight(panel);
                panel.plug(Y.Plugin.DraggablePanel, {});
                survObj.deleteRunnableSettingsPanel = Y.bind(function() {
                    if (survObj.runnableSettingsPanel) {
                        for (var h in handlers) {
                            handlers[h].detach();
                        }
                        for (var b in buttons) {
                            buttons[b].destroy();
                        }
                        survObj.runnableSettingsPanel = null;
                        panel.destroy();
                    }
                }, this);
                
                handlers.push(settingsPanel.one(".close").on("click", survObj.deleteRunnableSettingsPanel, this));
            }
        },

        // Opens a new tab for editing the target survey.
        onEdit: function(surveyId) {
            var currSurv = this.knownSurveys[surveyId],
                url = currSurv.isWriteable ? 'edit-survey.html' : 'preview-survey.html';
            if (currSurv.isRunning) {
                orchestratorAlert(I18n.t("survey.orchestrator.modifyRunning"));
                return;
            }
            url += '?surveyId=' + surveyId + '&';
            if (currSurv.isSession) {
                url += 'gameId=' + currSurv.sourceGameId;
            } else {
                url += 'gameModelId=' + currSurv.sourceGameModelId;
            }
            window.open(url, '_blank');
            if (currSurv.runnableSettingsPanel) {
                currSurv.deleteRunnableSettingsPanel();
            }
        },
        
        // Called to set a survey to PlayerScope
        onPlayerScope: function(surveyId, btn) {
            var currSurv = this.knownSurveys[surveyId];
            if (currSurv.isRunning) {
                orchestratorAlert(I18n.t("survey.orchestrator.modifyRunning"));
                btn.stopSpinning();
                return;
            }
            this.changeScope(surveyId,
                PLAYERSCOPE,
                function() {
                    btn.stopSpinning();
                },
                Y.bind(function() {
                    orchestratorAlert("Could not change scope");
                    btn.stopSpinning();
                }, this));
        },

        // Called to set a survey to TeamScope
        onTeamScope: function(surveyId, btn) {
            var currSurv = this.knownSurveys[surveyId];
            if (currSurv.isRunning) {
                orchestratorAlert(I18n.t("survey.orchestrator.modifyRunning"));
                btn.stopSpinning();
                return;
            }
            this.changeScope(surveyId,
                TEAMSCOPE,
                function() {
                    btn.stopSpinning();
                },
                Y.bind(function() {
                    orchestratorAlert("Could not change scope");
                    btn.stopSpinning();
                }, this));
        },
        
        // Called when user wants to duplicate a survey.
        // Imports the survey if it's external (i.e. outside this gameModel).
        // Otherwise it duplicates it.
        onCopy: function(surveyId, btn) {
            // Importing with CherryPick will also duplicate when needed:
            this.importSurvey(
                surveyId,
                this.currentGameModelId,
                // Set TeamScope in case it's going to be used in-game.
                // It will be converted back to PlayerScope if launched via the dashboard.
                TEAMSCOPE,
                PUBLISHED,
                function() {
                    btn.stopSpinning();
                },
                Y.bind(function() {
                    orchestratorAlert("Internal error: Could not import survey");
                    btn.stopSpinning();
                }, this));
        },
        
        importAsUnpublishedIfExternal_Then_SetPlayerScope: function(surveyId, btn, successCb) {
            var ctx = this,
                currSurv = this.knownSurveys[surveyId];
            if (currSurv.isRunning) {
                orchestratorAlert(I18n.t("survey.orchestrator.alreadyLaunched"));
                btn && btn.stopSpinning();
                return;
            }
            if (currSurv.isExternal) {
                this.importSurvey(
                    surveyId,
                    this.currentGameModelId,
                    PLAYERSCOPE,   // Convert to PlayerScope when launched through dashboard
                    UNPUBLISHED,
                    function(newDescr) {
                        ctx.importAsUnpublishedIfExternal_Then_SetPlayerScope(newDescr.get("id"), btn, successCb);
                    },
                    function() {
                        orchestratorAlert("Internal error: Could not import survey");
                        btn && btn.stopSpinning();
                    }
                );
            } else {
                if (!currSurv.hasPlayerScope) { // The survey is internal but with wrong scope (we could also check recursively)
                    this.changeScope(
                        surveyId,
                        PLAYERSCOPE,  // Convert to PlayerScope when launched through dashboard
                        function(descr) {
                            currSurv.hasPlayerScope = true;
                            ctx.importAsUnpublishedIfExternal_Then_SetPlayerScope(descr.get("id"), btn, successCb);
                        },
                        function() {
                            orchestratorAlert("Internal error: Could not change scope of survey");
                            btn && btn.stopSpinning();
                        }
                    );
                } else {
                    successCb && successCb(surveyId);
                }
            }
        },
        
        // Called when user wants to "request" a survey to start now.
        // Imports the survey as unpublished if it's external.
        onRequestNow: function(surveyId, btn) {
            this.importAsUnpublishedIfExternal_Then_SetPlayerScope(
                surveyId,
                btn, 
                Y.bind(function(newSurveyId) {
                    // Set default instance to "REQUESTED", idem for any pre-existing instances:
                    var survDescr = Y.Wegas.Facade.Variable.cache.findById(newSurveyId),
                        script = "SurveyHelper.request('" + survDescr.get("name") + "')";
                    survDescr.get("defaultInstance").set("status", ORCHESTRATION_PROGRESS.REQUESTED);
                    this.persistSurvey(survDescr,
                        Y.bind(function() {
                            this.impactSurveyInstances(script, survDescr, true, I18n.t("survey.orchestrator.surveyLaunched"));
                            btn && btn.stopSpinning();
                        }, this),
                        Y.bind(function() {
                            orchestratorAlert("Internal error: Could not update survey descriptor. Please try again.");
                            btn && btn.stopSpinning();
                        }, this)
                    );
                }, this)
            );
        },
        
        // Opens a dialog for selecting the e-mail message and its recipients.
        showInvitePanel: function(surveyId) {
            var survObj = this.knownSurveys[surveyId],
                title = I18n.t("survey.orchestrator.invitePanel.invitePanelTitle") + ' "' + survObj.label + '"',
                participants = this.participants,
                buttons = {},
                panelBody, mailBody, panel, cb, closeHandler, updateHandler,
                radioInputs = {},
                globalChoice, liveChoice = 'LINKED';
            


            if (!survObj.runningInvitePanel) {
                mailBody =
                    I18n.t("survey.orchestrator.invitePanel.defaultMailBody", {game: Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("name")})
                    // Transform into plain textarea-compatible content:
                    .replace(/<br\s*\/?>/g, '\n\n');
                panelBody =
                    '<div class="invitation-selection">' +
                    '   <div class="section-title">' + I18n.t("survey.orchestrator.invitePanel.currentPlayers") + ': <span class="wegas-survey-orchestrator-updated-nb-players">' + participants.players + '</span></div>' +
                    '   <div class="action-buttons"><div class="inline-title">' + I18n.t("survey.orchestrator.invitePanel.inviteTitle") + '</div>' +
                    '   <div class="survey-invite-live global-choice choiceA"></div><div class="survey-invite-list global-choice choiceB"></div><div class="survey-invite-live-and-list global-choice choiceC"></div></div>' +
                    '   <div class="action-buttons live-choice" style="display:none"><div class="inline-title">' + I18n.t("survey.orchestrator.invitePanel.inviteLiveTitle") + '</div>' +
                    '   <div class="survey-invite-live-linked live-subchoice"></div><div class="survey-invite-live-anon live-subchoice"></div><div class="survey-invite-live-dummy live-subchoice" style="visibility:hidden;"></div></div>' +
                    '   <div class="action-buttons invite-send"><div class="survey-invite-send"></div></div>' +
                    '</div>' +
                    '<div class="survey-invite-email-form recipients-sections">' +
                    '  <div class="live-recipients-section">' +
                    '   <div class="section-title live-recipients-email-title"><span class="option-name" style="display:none">A)&nbsp;&nbsp;</span>' + I18n.t("survey.orchestrator.invitePanel.liveRecipients") +
                    '     <span style="font-weight:normal;margin-left:4px;font-style: italic;">' + I18n.t("survey.orchestrator.invitePanel.liveRecipientsAutomatic") + '</span></div>' +
                    '   <div class="editable-email-list live-recipients-email" autocomplete="no" spellcheck="false">' + '</div>' +
                    '   <div class="email-count">' + I18n.t("survey.orchestrator.invitePanel.countEmails") + '<span class="live-recipients-email-count">0</span></div>' +
                    '  </div>' +
                    '  <div class="list-recipients-section" style="display:none">' +
                    '   <div class="section-title list-recipients-email-title"><span class="option-name" style="display:none">B)&nbsp;&nbsp;</span>' + I18n.t("survey.orchestrator.invitePanel.listRecipients") + '</div>' +
                    '   <div contenteditable class="editable-email-list list-recipients-email" autocomplete="no" spellcheck="false"></div>' +
                    '   <div class="email-count">' + I18n.t("survey.orchestrator.invitePanel.countEmails") + '<span class="list-recipients-email-count">0</span></div>' +
                    '   <div class="action-buttons recipients-cleanup"><div class="survey-invite-cleanup"></div></div>' +
                    '  </div>' +
                    '</div>' +
                    '<div class="survey-invite-email-form">' +
                    '   <div class="section-title email-sender-title">' + I18n.t("survey.orchestrator.invitePanel.senderName") + '</div>' +
                    '   <input type="text" class="email-sender" value="' + Y.Wegas.Facade.User.get("currentUser").get("name") + '"/>' +
                    '   <div class="section-title email-subject-title">' + I18n.t("survey.orchestrator.invitePanel.subject") + '</div>' +
                    '   <input type="text" class="email-subject" value="' + I18n.t("survey.orchestrator.invitePanel.defaultMailSubject") + '"/>' +
                    '   <div class="section-title email-body-title">' + I18n.t("survey.orchestrator.invitePanel.body") + '</div>' +
                    '   <textarea class="email-body" rows="10" autocomplete="no" spellcheck="false">' + mailBody + '</textarea>' +
                    '</div>';
                survObj.runningInvitePanel = panel = new Y.Wegas.Panel({
                    headerContent: '<h2>' + title + '</h2><button class="yui3-widget yui3-button yui3-button-content close fa fa-times"></button>',
                    content: panelBody,
                    modal: false,
                    width: 600
                }).render();
                cb = panel.get(CONTENTBOX);
                cb.addClass("wegas-orchestrator-panel wegas-survey-invite");
                panel.plug(Y.Plugin.DraggablePanel, {});
                
                radioInputs.onlyLive = cb.one(".survey-invite-live").setHTML('<label for="choiceA">' + I18n.t("survey.orchestrator.invitePanel.inviteLiveChoice") + '</label><input id="choiceA" name="globalChoice" value="A" type="radio"/>');
                function selectA() {
                    globalChoice = 'A';
                    cb.one(".live-choice").show();
                    cb.one(".live-recipients-section").show();
                    cb.one(".list-recipients-section").hide();
                    cb.all(".option-name").hide();
                    buttons.inviteLiveAnon.set("disabled", liveChoice === undefined);                    
                }
                radioInputs.onlyLive.one("input").on("change", selectA, this);
                radioInputs.onlyLive.on("click", function(e) {
                    var r = e.currentTarget.one("input");
                    r.set("checked", true);
                    selectA();
                });
                
                radioInputs.onlyList = cb.one(".survey-invite-list").setHTML('<label for="choiceB">' + I18n.t("survey.orchestrator.invitePanel.inviteListChoice") + '</label><input id="choiceB" name="globalChoice" value="B" type="radio"/>');
                function selectB() {
                    globalChoice = 'B';
                    cb.one(".live-choice").hide();
                    cb.one(".live-recipients-section").hide();
                    cb.one(".list-recipients-section").show();
                    cb.one(".recipients-cleanup").hide();
                    cb.all(".option-name").hide();
                    buttons.inviteLiveAnon.set("disabled", false);
                }
                radioInputs.onlyList.one("input").on("change", selectB, this);
                radioInputs.onlyList.on("click", function(e) {
                    var r = e.currentTarget.one("input");
                    r.set("checked", true);
                    selectB();
                });

                radioInputs.liveAndList = cb.one(".survey-invite-live-and-list").setHTML('<label for="choiceC">' + I18n.t("survey.orchestrator.invitePanel.inviteLiveAndListChoice") + '</label><input id="choiceC" name="globalChoice" value="C" type="radio"/>');
                function selectC() {
                    globalChoice = 'C';
                    cb.one(".live-choice").hide();
                    cb.one(".live-recipients-section").show();
                    cb.one(".list-recipients-section").show();
                    cb.one(".recipients-cleanup").show();
                    cb.all(".option-name").show();
                    buttons.inviteLiveAnon.set("disabled", false);
                }
                radioInputs.liveAndList.one("input").on("change", selectC, this);
                radioInputs.liveAndList.on("click", function(e) {
                    var r = e.currentTarget.one("input");
                    r.set("checked", true);
                    selectC();
                });

                radioInputs.liveLinked = cb.one(".survey-invite-live-linked").setHTML('<label for="choiceA1">' + I18n.t("survey.orchestrator.invitePanel.inviteLiveLinkedChoice") + '</label><input id="choiceA1" name="liveChoice" value="LINKED" type="radio" checked="checked"/>');
                function selectLiveLinked() {
                    liveChoice = 'LINKED';
                    buttons.inviteLiveAnon.set("disabled", false);                    
                }
                radioInputs.liveLinked.one("input").on("change", selectLiveLinked, this);
                radioInputs.liveLinked.on("click", function(e) {
                    var r = e.currentTarget.one("input");
                    r.set("checked", true);
                    selectLiveLinked();
                });

                radioInputs.liveAnon = cb.one(".survey-invite-live-anon").setHTML('<label for="choiceA2">' + I18n.t("survey.orchestrator.invitePanel.inviteLiveAnonChoice") + '</label><input id="choiceA2" name="liveChoice" value="LINKED" type="radio"/>');
                function selectLiveAnon() {
                    liveChoice = 'ANON';
                    buttons.inviteLiveAnon.set("disabled", false);
                }
                radioInputs.liveAnon.one("input").on("change", selectLiveAnon, this);
                radioInputs.liveAnon.on("click", function(e) {
                    var r = e.currentTarget.one("input");
                    r.set("checked", true);
                    selectLiveAnon();
                });

                buttons.cleanupEmails = new SpinButton({
                    label: "<i class=\"fa fa-compress icon\"></i>" + I18n.t("survey.orchestrator.invitePanel.cleanupButton"),
                    onClick: Y.bind(
                        function(surveyId, btn) {
                            this.cleanupListEmails(cb);
                            btn.stopSpinning();
                        }, this),
                    autoSpin: true,
                    surveyId: surveyId,
                    disabled: false
                }).render(cb.one(".survey-invite-cleanup"));

                buttons.inviteLiveAnon = new SpinButton({
                    label: "<i class=\"fa fa-envelope icon\"></i>" + I18n.t("survey.orchestrator.invitePanel.sendButton"),
                    onClick: Y.bind(
                        function(surveyId, btn) {
                            try {
                                var email = {
                                    recipients: [], // To be set below depending on the combination selected by the trainer
                                    sender: this.getSender(cb),
                                    subject: this.getSubject(cb),
                                    body: this.getBody(cb)
                                };
                            } catch(e) {
                                orchestratorAlert(e);
                                btn.stopSpinning();
                            }
                            switch (globalChoice) {
                                case 'A': 
                                    if (this.getLiveRecipients(cb).length !== 0) {
                                        this.onInviteLive(surveyId, btn, email, /* linkedToAccount: */ liveChoice === 'LINKED',
                                            Y.bind(function(invitedEmails) {
                                                this.setLiveRecipients(cb, invitedEmails);
                                            }, this)
                                        );
                                    } else {
                                        orchestratorError(I18n.t("survey.orchestrator.errors.noValidPlayers"));                                    
                                    }
                                    break;
                                case 'B':
                                    email.recipients = this.getListRecipients(cb);
                                    if (email.recipients.length !== 0) {
                                        this.onInviteList(surveyId, btn, email,
                                            function(invitedEmails) {
                                                //setInvitedEmails(cb, invitedEmails);
                                            }
                                        );
                                    } else {
                                        orchestratorError(I18n.t("survey.orchestrator.errors.noValidEmails"));
                                    }
                                    btn.stopSpinning();
                                    break;
                                case 'C':
                                    if (this.getLiveRecipients(cb).length === 0) {
                                        orchestratorError(I18n.t("survey.orchestrator.errors.noValidPlayers"));
                                    } else {
                                        email.recipients = this.cleanupListEmails(cb);
                                        if (email.recipients.length !== 0) {
                                            this.onInviteLiveAndList(surveyId, btn, email, cb,
                                                function(invitedLive, invitedList) {
                                                }
                                            );
                                        } else {
                                            orchestratorError(I18n.t("survey.orchestrator.errors.noValidEmails"));
                                        }
                                    }
                                    btn.stopSpinning();
                                    break;
                                default:
                                    alert('internal error');
                            }
                        }, this),
                    autoSpin: true,
                    surveyId: surveyId,
                    disabled: true
                }).render(cb.one(".survey-invite-send"));

                // Rendering is over, adjust the height of the new panel:
                adjustPanelHeight(panel);
                
                var mailListOnBlurHandler = cb.one(".list-recipients-email").on("blur", Y.bind(
                    function(){
                        var list = this.getListRecipients(cb);
                        orchestratorSuccess(I18n.t("survey.orchestrator.invitePanel.validationMessage", { number: list.length }));
                    }, this));

                survObj.deleteRunningInvitePanel = Y.bind(function() {
                    if (survObj.runningInvitePanel) {
                        survObj.runningInvitePanel = null;
                        for (var b in buttons) {
                            buttons[b].destroy();
                        }
                        this.detachParticipantUpdates(updateHandler);
                        closeHandler.detach();
                        mailListOnBlurHandler.detach();
                        panel.destroy();
                    }
                }, this);
                
                updateHandler = this.subscribeToParticipantUpdates(Y.bind(
                    function(participants) {
                        if (participants.players > 0) {
                            // this.playerEmails has also been updated automatically:
                            this.setLiveRecipients(cb, this.playerEmails);
                            
                            // @TODO also update listRecipients if globalChoice === 'C'
                            
                        }
                    }, this));
                    
                closeHandler = cb.one(".close").on("click", survObj.deleteRunningInvitePanel, this);
                
                // Just for initializing when creating the panel:
                this.getEmails().then(Y.bind(
                    function(emails) {
                        this.setLiveRecipients(cb, emails);
                    }, this)
                );
            }
        },

        // Returns the cleaned up email list of the form.
        // Also updates the display.
        getListRecipients: function(invitePanel) {
            var text = invitePanel.one(".list-recipients-email"),
                list = text.getHTML(),
                // Extract emails, even in the form: "realname" <name@corp.com>
                emailArray = list.split(/[\n,;<>\(\)\s]+|&lt|&gt/),
                validEmails = [],
                cleanList = "",
                mail;

            for (var i in emailArray) {
                mail = emailArray[i];
                if (mail) {
                    mail = mail.trim();
                    if (mail && validateEmail(mail)) {
                        cleanList += mail + "<br>";
                        // Prevent any duplication:
                        if (validEmails.indexOf(mail) === -1) {
                            validEmails.push(mail);
                        }
                    }
                }
            }
            // Update displayed list:
            text.setHTML(cleanList);
            invitePanel.one(".list-recipients-email-count").setHTML(validEmails.length);
            return validEmails;
        },

        setListRecipients: function(invitePanel, emails) {
            var text = invitePanel.one(".list-recipients-email"),
                list = '';
            for (var i in emails) {
                list += emails[i] + "<br>";
            }
            text.setHTML(list);
            invitePanel.one(".list-recipients-email-count").setHTML(emails.length);
        },

        getLiveRecipients: function(invitePanel) {
            var text = invitePanel.one(".live-recipients-email").getHTML(),
                // Extract emails, even in the form: "realname" <name@corp.com>
                emailArray = text.split(/[\n,;<>\(\)\s]+|&lt|&gt/),
                validEmails = [],
                mail;

            for (var i in emailArray) {
                mail = emailArray[i];
                if (mail) {
                    mail = mail.trim();
                    if (mail && validateEmail(mail)) {
                        validEmails.push(mail);
                    }
                }
            }
            return validEmails;
        },

        setLiveRecipients: function(invitePanel, emails) {
            var text = invitePanel.one(".live-recipients-email"),
                list = '';
            for (var i in emails) {
                list += emails[i] + "<br>";
            }
            text.setHTML(list);
            invitePanel.one(".live-recipients-email-count").setHTML(emails.length);
        },

        // Removes duplicates between LIVE and LIST emails.
        // Returns the new LIST.
        cleanupListEmails: function(invitePanel) {
            var list = this.getListRecipients(invitePanel),
                live = this.getLiveRecipients(invitePanel),
                duplicates = [],
                pos;
            for (var i in live) {
                pos = list.indexOf(live[i]);
                if (pos !== -1) {
                    list.splice(pos, 1);
                    duplicates.push(live[i]);
                }
            }
            this.setListRecipients(invitePanel, list);
            if (duplicates.length !== 0) {
                orchestratorSuccess("Removed " + duplicates.length + " duplicates from your list:<br>" +
                    duplicates.join('<br>'));
            }
            return list;
        },

        // Returns the self-assigned name of the trainer.
        // Throws an error if empty.
        getSender: function(invitePanel) {
            var text = invitePanel.one(".email-sender").get("value");
            if (!text) {
                throw I18n.t("survey.orchestrator.errors.noValidSender");
            }
            return text;
        },

        // Returns the subject of the mail.
        // Throws an error if empty.
        getSubject: function(invitePanel) {
            var text = invitePanel.one(".email-subject").get("value");
            if (!text) {
                throw I18n.t("survey.orchestrator.errors.noValidSubject");
            }
            return text;
        },

        // Returns the body of the mail.
        // Throws an error if empty or does not contain variables {{link}} or {{player}}.
        getBody: function(invitePanel) {
            var body = invitePanel.one(".email-body").get("value");
            if (!body) {
                throw I18n.t("survey.orchestrator.errors.noValidBody");
            }
            if (body.indexOf("{{link}}") === -1) {
                throw I18n.t("survey.orchestrator.errors.noLinkInBody");
            }
            if (body.indexOf('{{player}}') === -1) {
                throw I18n.t("survey.orchestrator.errors.noPlayerInBody");
            }
            // HTMLize the body:
            return body.replace(/\n\n/g, "<br>&nbsp;<br>").replace(/[\n]/g, "<br>");
        },
        
        // Called when user wants to invite LIVE players to a survey (by email).
        // Imports the survey as unpublished if it's external.
        onInviteLive: function(surveyId, btn, email, linkedToAccount, successCb) {
            this.importAsUnpublishedIfExternal_Then_SetPlayerScope(
                surveyId, 
                btn, 
                Y.bind(function(newSurveyId) {
                    this.sendInviteToLive(newSurveyId, btn, email, linkedToAccount,
                        function(invitedEmails) {
                            successCb && successCb(invitedEmails);
                        });
                }, this)
            );
        },
        
        // Called when user provides an email list to invite people to a survey.
        // Imports the survey as unpublished if it's external.
        onInviteList: function(surveyId, btn, email, successCb) {
            this.importAsUnpublishedIfExternal_Then_SetPlayerScope(
                surveyId, 
                btn, 
                Y.bind(function(newSurveyId) {
                    this.sendInviteToList(newSurveyId, btn, email,
                        function(invitedEmails) {
                            successCb && successCb(invitedEmails);
                        });
                }, this)
            );
        },

        // Called when user provides an email list to invite people to a survey,
        // IN ADDITION to those who are LIVE.
        // Imports the survey as unpublished if it's external.
        onInviteLiveAndList: function(surveyId, btn, email, invitePanel, successCb) {
            var live = this.getLiveRecipients(invitePanel);
            this.importAsUnpublishedIfExternal_Then_SetPlayerScope(
                surveyId, 
                btn, 
                Y.bind(function(newSurveyId) {
                    this.sendInviteToLive(newSurveyId, btn, email, /*linkedToAccount:*/ true,
                    // First launch LIVE in order to reduce risk of new LIVE players joining during the process:
                        Y.bind(function(invitedEmailsFromLive) {
                            if (live.length !== invitedEmailsFromLive.length) {
                                Y.log("*** Incoherent number of LIVE players...");
                                this.getEmails().then(Y.bind(
                                    function(emails) {
                                        this.setLiveRecipients(invitePanel, emails);
                                        var newList = this.cleanupListEmails(invitePanel);
                                        email.recipients = newList;
                                        this.sendInviteToList(newSurveyId, btn, email,
                                            Y.bind(function(invitedEmailsFromList) {
                                                successCb && successCb(invitedEmailsFromLive, invitedEmailsFromList);
                                            }, this)
                                        );
                                    }, this)
                                );
                            } else {
                                this.sendInviteToList(newSurveyId, btn, email,
                                    Y.bind(function(invitedEmailsFromList) {
                                        successCb && successCb(invitedEmailsFromList);
                                    }, this)
                                );
                            }
                        }, this)
                    );
                }, this)
            );
        },

        // Exports a survey for sharing with other trainers or scenarists.
        onShare: function(surveyId, btn) {
            var gameName = this.knownSurveys[surveyId].label,
                isScenarist = !!Y.Wegas.Facade.User.cache.get("currentUser").get("roles").find(function(role) {
                    return role.get("name") === "Scenarist";
                });
            if (isScenarist) {
                this.createEmptyGameModel(
                    gameName,
                    this.knownSurveys[surveyId].languages,
                    GAMEMODEL_SCENARIO,
                    Y.bind(function(newGameModel) {
                        this.importSurvey(
                            surveyId,
                            newGameModel.get("id"),
                            TEAMSCOPE,
                            PUBLISHED,
                            Y.bind(function() {
                                orchestratorSuccess(I18n.t("survey.orchestrator.scenarioCreated", { name: gameName } ));
                                btn.stopSpinning();
                            }, this),
                            Y.bind(function() {
                                orchestratorAlert("Could not create game scenario");
                                btn.stopSpinning();
                            }, this)
                        );
                    }, this)
                );
            } else { // User has only Trainer rights:
                this.createEmptyGameModel(
                    gameName,
                    this.knownSurveys[surveyId].languages,
                    GAMEMODEL_SESSION,
                    Y.bind(function(newGameModel) {
                        this.createGame(
                            newGameModel.get("id"),
                            gameName,
                            Y.bind(function(newGame) {
                                this.importSurvey(
                                    surveyId,
                                    newGame.get("parentId"),
                                    TEAMSCOPE,
                                    PUBLISHED,
                                    Y.bind(function() {
                                        orchestratorSuccess(I18n.t("survey.orchestrator.sessionCreated", { name: gameName } ));
                                        btn.stopSpinning();
                                        // Adjust session properties:
                                        newGame.set("access", "CLOSE");
                                        this.persistGame(newGame);
                                    }, this),
                                    Y.bind(function(e) {
                                        orchestratorAlert("Could not create game");
                                        btn.stopSpinning();
                                    }, this)
                                );
                            }, this)
                        );
                    }, this)
                )
            }
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
                        if (survObj.runnableSettingsPanel) {
                            survObj.deleteRunnableSettingsPanel();
                        }
                    }, this),
                    failure: Y.bind(function() {
                        orchestratorAlert("Could not delete this survey");
                    }, this)
                }
            });
        },
        
        /**
         * Cancels the given running survey, the status of which is REQUESTED ... CLOSED.
         * If no players have joined the session yet, deletes the SurveyDescriptor
         * or resets the defaultInstance to NOT_STARTED.
         * Otherwise:
         *   Display a warning and :
         *   If survey.isPublished == false, delete the hidden surveyDescriptor.
         *   If survey.isPublished == true:
         *     sets all instances, including defaultInstance,
         *     to status CLOSED (a real reset would require survey Widgets to 
         *     handle status going "backwards" and 
         *     would make xAPI logs hardly understandable).
         * 
         * @param {number} surveyId
         * @param {SpinButton} btn
         * @returns {undefined}
         */
        onCancelRunningSurvey: function(surveyId, btn) {
            var survDescr = Y.Wegas.Facade.Variable.cache.findById(surveyId);
            this.getSurveyPlayers(
                surveyId,
                Y.bind(function(data) {
                    // This data has just been updated:
                    var survData = this.knownSurveys[surveyId];
                    // If no player has joined the session, we may simply delete the survey or reset it to NOT_STARTED:
                    if (Object.keys(data.teamdata).length === 0) {
                        if (survData.isPublished) {
                            survDescr.get("defaultInstance").set("status", ORCHESTRATION_PROGRESS.NOT_STARTED);
                            this.persistSurvey(survDescr,
                                Y.bind(function() {
                                    btn && btn.stopSpinning();
                                }, this),
                                Y.bind(function() {
                                    orchestratorAlert("Internal error: Could not update survey descriptor. Please try again.");
                                    btn && btn.stopSpinning();
                                }, this)
                            );
                        } else {
                            this.deleteSurvey(surveyId);
                            btn && btn.stopSpinning();
                        }
                    } else if (survData.runStatus !== ORCHESTRATION_PROGRESS.CLOSED) {
                        var panel = Y.Wegas.Panel.confirm(
                            I18n.t("survey.orchestrator.deleteRunning"),
                            Y.bind(function() {
                                if (survData.isPublished) {
                                    var script = "SurveyHelper.close('" + survDescr.get("name") + "')";
                                    survDescr.get("defaultInstance").set("status", ORCHESTRATION_PROGRESS.CLOSED);
                                    this.persistSurvey(survDescr,
                                        Y.bind(function() {
                                            this.impactSurveyInstances(script, survDescr, false, I18n.t("survey.orchestrator.surveyCancelled"));
                                            btn && btn.stopSpinning();
                                        }, this),
                                        Y.bind(function() {
                                            orchestratorAlert("Internal error: Could not update survey descriptor. Please try again.");
                                            btn && btn.stopSpinning();
                                        }, this)
                                    );
                                } else {
                                    this.deleteSurvey(surveyId);
                                    btn && btn.stopSpinning();
                                }
                            }, this),
                            Y.bind(function() {
                                btn && btn.stopSpinning();
                            }, this)
                        );
                        panel.get(CONTENTBOX).addClass("wegas-orchestrator-alert");
                    } else {
                        btn && btn.stopSpinning();
                    }
                }, this),
                Y.bind(function() {
                    orchestratorAlert("Internal error: Could not get updates from server. Please try again.");
                }, this));
        },

        onInfoTooltip: function(e) {
            var surveyId = +e.node.getData("surveyid"),
                surveyData = this.knownSurveys[surveyId],
                details = '',
                comments;
                details += 'Created on ' + new Date(surveyData.createdDate).toLocaleDateString('en-GB');
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
                        details +=
                            '<br>' +
                            I18n.t(
                                surveyData.hasPlayerScope ?
                                "survey.orchestrator.hasPlayerScope" :
                                "survey.orchestrator.hasTeamScope") +
                            '<br>';
                    }
                }
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
        
        
        impactSurveyInstances: function(script, survDescr, onlyLivePlayers, successMessage) {
            var game = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                scopeType = survDescr.get("scopeType");

            // Return one live player for each team which has such a (live) player
            // (in Team mode, we assume impacted variables are shared among team members)
            function getOnePlayerPerTeam(game, onlyLivePlayers) {
                var teams = game.get("teams"),
                    gamePlayers = [],
                    i, t, p;
                for (i in teams) {
                    t = teams[i];
                    if (t.get("players").length === 0 ||
                        t.get("@class") === "DebugTeam" ||
                        (onlyLivePlayers && t.get("status") === "SURVEY"))
                    {
                        continue;
                    }
                    p = t.getLivePlayer();
                    if (p !== null) {
                        if (!(onlyLivePlayers && p.get("status") === "SURVEY")) {
                            gamePlayers.push(p);
                        }
                    }
                }
                return gamePlayers;
            }
            
            function getAllPlayers(game, onlyLivePlayers) {
                var teams = game.get("teams"),
                    gamePlayers = [], 
                    i, j, t, p,
                    players;
                for (i in teams) {
                    t = teams[i];
                    if (t.get("@class") === "DebugTeam" ||
                        (onlyLivePlayers && t.get("status") === "SURVEY"))
                    {
                        continue;
                    }
                    players = t.get("players");
                    for (j in players) {
                        p = players[j];
                        if (!(onlyLivePlayers && p.get("status") === "SURVEY")) {
                            gamePlayers.push(p);
                        }
                    }
                }
                return gamePlayers;                
            }

            this.runRemoteScript(
                script,
                (scopeType === TEAMSCOPE ?
                    getOnePlayerPerTeam(game, onlyLivePlayers) :
                    getAllPlayers(game, onlyLivePlayers)),
                successMessage
            );
        },
        
        runRemoteScript: function(script, player, successMessage) {
            if (!script) {
                orchestratorAlert("runRemoteScript: script is empty or undefined");
                return;
            }
            // The script is run sequentially on each player of the "player" argument (single object or array).
            var players = (player.constructor === Array ? player : [player]),
                len = players.length,
                count = 0,
                succeeded = 0,
                failed = 0,
                erroredPlayers = [],
                player, config;

            for (var i = 0; i < len; i++) {
                player = players[i];
                config = {
                    on: {
                        success: Y.bind(function(e) {
                            count++;
                            succeeded++;
                            if (count >= len) { // End of last iteration:
                                if (failed > 0) {
                                    orchestratorAlert("Errors happened for " + failed + "/" + count + " participants:<br>" +
                                        erroredPlayers.join('<br>'));
                                } else {
                                    orchestratorSuccess(successMessage);
                                    this.syncUI();
                                }
                            }
                        }, this),
                        failure: Y.bind(function(e) {
                            count++;
                            failed++;
                            erroredPlayers.push(player.get("name"));
                            Y.log("*** Error executing script");
                            if (count >= len) { // End of last iteration:
                                orchestratorAlert("Errors happened for " + failed + "/" + count + " participants:<br>" +
                                    erroredPlayers.join('<br>'));
                            }
                        }, this)
                    }
                };

                Y.Wegas.Facade.Variable.script.run(script, config, player);
            }
        }        

        
    }, {
        EDITORNAME: "Survey Orchestrator",
        ATTRS: {
        }
    });
    Wegas.SurveyOrchestrator = SurveyOrchestrator;
    
});
