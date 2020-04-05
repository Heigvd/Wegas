/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020  School of Business and Engineering Vaud, Comem, MEI
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
        NOT_STARTED: 0,
        REQUESTED: 1,
        ONGOING: 2,
        COMPLETED: 3,
        CLOSED: 4
    };

    // Function for requesting the start of a survey.
    // Yields the required client-side updates.
    function request(SurveyDescriptorName) {
        var sd = Variable.find(gameModel, SurveyDescriptorName),
            inst = sd.getInstance();
        inst.setStatusFromString("REQUESTED");
    }
    
    
    function summarize(SurveyDescriptorName) {
        var sd = Variable.find(gameModel, SurveyDescriptorName),
            sdId = sd.getId(),
            game = self.getGame(),
            teams = game.getTeams(),
            nbTeams = teams.size(),
            t, teamId, team,
            aPlayer, survInsts, survInst, data, replied, optionalReplied,
            activeInputs, activeOptionalInputs,
            survActive,
            survStatus = "NOT_STARTED",
            playerStatus = ORCHESTRATION_PROGRESS[survStatus],
            globalSurvActive = false,
            globalSurvStatus = "CLOSED",
            globalStatus = ORCHESTRATION_PROGRESS[globalSurvStatus],
            i, j,
            
                    
            monitoring = {
                id: sdId,
                name: SurveyDescriptorName,
                active: false,
                status: globalSurvStatus,
                nbInputs: 0,
                data: {
                    /*
                    teamId: {
                        name: "team name",
                        active: false,
                        status: ORCHESTRATION_PROGRESS.NOT_STARTED,
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
                inputList = Java.from(currSct.getItems());
            // @TODO check if each section instance is currently active !
            for (j = 0; j < inputList.length; j++) {
                inputDescriptors.push(inputList[j]);
            }
        }

        monitoring.nbInputs = inputDescriptors.length;

        // Empty surveys are to be treated as inactive ones:
        if (inputDescriptors.length === 0) {
            monitoring.active = false;
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
            survInst = survInsts[team];

            survStatus = survInst.getStatus().toString();
            survActive = survInst.getActive();

            if (team.getPlayers().size() > 0) {
                aPlayer = survInst.getOwner().getAnyLivePlayer();
            } else {
                aPlayer = null;
            }
            if (aPlayer === null) {
                // Skip empty Teams
                continue;
            }

            isDebugTeam = aPlayer.getTeam() instanceof com.wegas.core.persistence.game.DebugTeam;
            if (isDebugTeam && nbTeams > 1) {
                continue;
            }
            
            playerStatus = ORCHESTRATION_PROGRESS[survStatus];
           
            // Global status is the least advanced of all individual statuses (unless inactive):
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
            if (playerStatus >= ORCHESTRATION_PROGRESS.ONGOING) {
                for (var id in teamsInputs) {
                    var currInput = teamsInputs[id][team],
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
            
            data = {
                name: team.getName(),
                active: survActive,
                status: survStatus,
                replied: replied,
                activeInputs: activeInputs,
                optionalReplied: optionalReplied,
                activeOptionalInputs: activeOptionalInputs
            };
            
            monitoring.data[teamId] = data;
            
        }

        monitoring.active = globalSurvActive;
        monitoring.status = globalSurvStatus;
        
        return JSON.stringify(monitoring);
    }


    return {
        summarize: function(surveyDescriptorName) {
            return summarize(surveyDescriptorName);
        },
        request: function(surveyDescriptorName) {
            return request(surveyDescriptorName);
        }
    };

}());