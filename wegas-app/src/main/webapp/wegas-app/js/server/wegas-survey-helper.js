/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


/**
 * SurveyHelper
 *
 * @fileoverview
 *
 * @author Jarle Hulaas
 */
/*global self, Variable, gameModel, Java, javax, com, Infinity, StatisticHelper*/
var SurveyHelper = (function() {
    "use strict";
    var Long = Java.type("java.lang.Long");

    // Increasing order of progress:
    var ORCHESTRATION_PROGRESS = {
        NOT_STARTED:
            { 
                id: 0,
                name: "NOT_STARTED"
            },
        REQUESTED: 
            {
                id: 1,
                name: "REQUESTED"
            },
        ONGOING:
            {
                id: 2,
                name: "ONGOING"
            },
        COMPLETED:
            {
                id: 3,
                name: "COMPLETED"
            },
        CLOSED:
            {
                id: 4,
                name: "CLOSED"
            }
    };

    // Function for requesting the start of a survey.
    // Yields the required client-side updates.
    function request(SurveyDescriptorName) {
        var sd = Variable.find(gameModel, SurveyDescriptorName),
            inst = sd.getInstance();
        inst.setStatusFromString(ORCHESTRATION_PROGRESS.REQUESTED.name);
    }

    // Function for requesting the end of a survey.
    // Yields the required client-side updates.
    function close(SurveyDescriptorName) {
        var sd = Variable.find(gameModel, SurveyDescriptorName),
            inst = sd.getInstance();
        inst.setStatusFromString(ORCHESTRATION_PROGRESS.CLOSED.name);
    }

    // Param getDebugTeam should be true only when invoked from editor.
    function summarize(SurveyDescriptorName, getDebugTeam) {
        var sd = Variable.find(gameModel, SurveyDescriptorName),
            sdId = sd.getId(),
            game = self.getGame(),
            teams = game.getTeams(),
            nbTeams = teams.size(),
            isPlayerScopeSurvey = (sd.getScopeType().toString() === "PlayerScope" ),
            hasTokens = sd.getHasTokens(),
            t, teamId, team, teamName,
            players, nbPlayers, playerId, p, nbIterations,
            aPlayer, playerName, survInsts, survInst, teamdata, replied, optionalReplied,
            activeInputs, activeOptionalInputs,
            survActive,
            survStatus = ORCHESTRATION_PROGRESS.NOT_STARTED.name,
            playerStatus = ORCHESTRATION_PROGRESS[survStatus].id,
            globalSurvActive = false,
            globalSurvStatus = ORCHESTRATION_PROGRESS.CLOSED.name,
            globalStatus = ORCHESTRATION_PROGRESS[globalSurvStatus].id,
            hasOngoing = false,
            i, j;
                                
            var monitoring = {
                id: sdId,
                name: SurveyDescriptorName,
                active: false,
                empty: false,
                status: globalSurvStatus,
                isInviting: sd.getHasTokens(),
                nbInputs: 0,
                teamdata: {
                    /*
                    teamId: {
                        name: "team name",
                        active: false,
                        status: ORCHESTRATION_PROGRESS.NOT_STARTED.name,
                        replied: 0
                    }
                    */
                }
            };

        var sections = Java.from(sd.getItems()),
            inputDescriptors = [],
            teamsInputs = {},
            isDebugTeam = false;

        // Collect all input descriptors in order to get their instances
        for (i = 0; i < sections.length; i++) {
            var currSct = sections[i],
                inputList = Java.from(currSct.getItems()),
                sctInsts = Variable.getInstances(currSct),
                sctInst;
            // Check for each team/user if each section instance is currently active
            // @TODO this needs to be revised to make a different count for each team/user !
            for (t = 0; t < 1 /* nbTeams */; t += 1) {
                team = teams.get(t);
                teamId = new Long(team.getId());
                // This yields null when isPlayerScopeSurvey && isTeamGame are true:
                if (isPlayerScopeSurvey) {
                    var players = team.getPlayers(),
                        nbPlayers = players.size(),
                        player, playerId, p;
                    for (p = 0; p < 1 /* nbPlayers */; p += 1) {
                        player = players.get(p);
                        playerId = new Long(player.getId());
                        sctInst = sctInsts[player];
                        if (sctInst && sctInst.getActive()) {
                            for (j = 0; j < inputList.length; j++) {
                                inputDescriptors.push(inputList[j]);
                            }
                        }
                    }
                } else {
                    sctInst = sctInsts[team];
                    if (sctInst && sctInst.getActive()) {
                        for (j = 0; j < inputList.length; j++) {
                            inputDescriptors.push(inputList[j]);
                        }
                    }
                }
            }
        }

        monitoring.nbInputs = inputDescriptors.length;

        // Empty surveys are treated as inactive ones:
        if (inputDescriptors.length === 0) {
            monitoring.active = false;
            monitoring.empty = true;
            return JSON.stringify(monitoring);
        }

        // Get all input instances for all teams/players:
        for (i = 0; i < inputDescriptors.length; i++) {
            var currInput = inputDescriptors[i],
                currInputId = new Long(currInput.getId()),
                currInsts = Variable.getInstances(currInput);
            teamsInputs[currInputId] = currInsts;
        }

        survInsts = Variable.getInstances(sd);
        
        for (t = 0; t < nbTeams; t += 1) {
            team = teams.get(t);
            teamId = new Long(team.getId());
            if (team.getStatus().toString() === "SURVEY") {
                teamName = "Survey team";
                // Case where an anonymous survey player was created for another survey in the same game. 
                // Ignore this player, since his status will never evolve:
                if (!hasTokens) {
                    continue;
                }
            } else {
                teamName = team.getName();
            }
            players = team.getPlayers();
            nbPlayers = players.size();
           
            if (!isPlayerScopeSurvey) {
                survInst = survInsts[team];
                nbIterations = 1;
                if (nbPlayers > 0) {
                    aPlayer = survInst.getOwner().getAnyLivePlayer();
                } else {
                    aPlayer = null;
                }
                if (aPlayer === null) {
                    // Skip empty Teams
                    continue;
                }
            } else {
                nbIterations = nbPlayers;
            }
            
            for (p = 0; p < nbIterations; p += 1) {
                if (isPlayerScopeSurvey) {
                    aPlayer = players.get(p);
                    playerId = new Long(aPlayer.getId());
                    survInst = survInsts[aPlayer];
                }

                isDebugTeam = (aPlayer.getTeam() instanceof com.wegas.core.persistence.game.DebugTeam);
                if (isDebugTeam && (nbTeams > 1 || !getDebugTeam)) {
                    continue;
                }

                if (aPlayer.getStatus().toString() === "SURVEY") {
                    playerName = "Survey guest";
                } else {
                    playerName = aPlayer.getName();
                }
                
                survStatus = survInst.getStatus().toString();
                survActive = survInst.getActive();
                playerStatus = ORCHESTRATION_PROGRESS[survStatus].id;
                if (playerStatus >= ORCHESTRATION_PROGRESS.ONGOING.id) {
                    hasOngoing = true;
                }
                // Global status is in principle the least advanced of all individual statuses (unless inactive, not started):
                if (survActive && globalStatus > playerStatus) {
                    globalStatus = playerStatus;
                    globalSurvStatus = survStatus;
                }
                if (survActive) {
                    globalSurvActive = true;
                }

                // Count number of replied and active inputs for this team/player
                replied = 0;
                optionalReplied = 0;
                activeInputs = 0;
                activeOptionalInputs = 0;
                if (playerStatus >= ORCHESTRATION_PROGRESS.ONGOING.id) {
                    for (var id in teamsInputs) {
                        var currInput = isPlayerScopeSurvey ? teamsInputs[id][aPlayer] : teamsInputs[id][team],
                            descr = currInput.getDescriptor(),
                            compulsory = descr.getIsCompulsory();

                        if (currInput.getIsReplied()) {
                            if (compulsory) {
                                replied++;
                            } else {
                                optionalReplied++;
                            }
                        }
                        if (currInput.getActive()) {
                            if (compulsory) {
                                activeInputs++;
                            } else {
                                activeOptionalInputs++;
                            }
                        }
                    }
                }

                teamdata = {
                    name: teamName,
                    teamId: teamId,
                    teamSize: nbPlayers,
                    playerName: playerName,
                    playerId: playerId,
                    active: survActive,
                    status: survStatus,
                    replied: replied,
                    activeInputs: activeInputs,
                    optionalReplied: optionalReplied,
                    activeOptionalInputs: activeOptionalInputs
                };

                if (isPlayerScopeSurvey) {
                    monitoring.teamdata[playerId] = teamdata;
                } else {
                    monitoring.teamdata[teamId] = teamdata;
                }
            }
        }
        
        // Special case when no player has joined yet:
        if (Object.keys(monitoring.teamdata).length === 0) {
            var defInst = sd.getDefaultInstance();
            globalSurvStatus = defInst.getStatus().toString();
            globalSurvActive = defInst.getActive();
        } else if (globalStatus < ORCHESTRATION_PROGRESS.ONGOING.id && hasOngoing) {
            // Return global status ONGOING in some hybrid situations:
            globalSurvStatus = ORCHESTRATION_PROGRESS.ONGOING.name;
        }
        monitoring.active = globalSurvActive;
        monitoring.status = globalSurvStatus;
        monitoring.isPlayerScope = isPlayerScopeSurvey;
        
        return JSON.stringify(monitoring);
    }


    return {
        summarize: function(surveyDescriptorName) {
            return summarize(surveyDescriptorName);
        },
        request: function(surveyDescriptorName) {
            return request(surveyDescriptorName);
        },
        close: function(surveyDescriptorName) {
            return close(surveyDescriptorName);
        }
    };

}());