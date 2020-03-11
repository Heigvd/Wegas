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
        INACTIVE: 0,
        IDLE: 1,
        REQUESTED: 2,
        STARTED: 3,
        VALIDATED: 4,
        CLOSED: 5
    };

    // Function for requesting the start of a survey.
    // Yields the required client-side updates.
    function request(SurveyDescriptorName) {
        var sd = Variable.find(gameModel, SurveyDescriptorName),
            inst = sd.getInstance();
        inst.setRequested(true);
    }
    
/*
    function request(SurveyDescriptorName) {
        var sd = Variable.find(gameModel, SurveyDescriptorName),
            survInsts = Variable.getInstances(sd),
            game = self.getGame(), teams = game.getTeams(),
            t, team, teamId, survInst, aPlayer;

        for (t = 0; t < teams.size(); t += 1) {
            team = teams.get(t);
            teamId = new Long(team.getId());
            survInst = survInsts[team];

            if (team.getPlayers().size() > 0) {
                aPlayer = survInst.getOwner().getAnyLivePlayer();
            } else {
                aPlayer = null;
            }
            if (aPlayer === null) { // || (survInsts.length > 1 && aPlayer.getTeam() instanceof  com.wegas.core.persistence.game.DebugTeam) ) {
                // Skip Debug & empty Teams
                continue;
            }
        
            if (survInst.getActive()) {
                survInst.setRequested(true);
                return SurveyHelper.summarize(SurveyDescriptorName);
            }
        }
    }
*/
    
    function summarize(SurveyDescriptorName) {
        var sd = Variable.find(gameModel, SurveyDescriptorName),
            sdId = sd.getId(),
            game = self.getGame(),
            teams = game.getTeams(),
            nbTeams = teams.size(),
            t, teamId, team,
            aPlayer, survInsts, survInst, data, replied,
            playerStatus = ORCHESTRATION_PROGRESS.INACTIVE,
            globalStatus = ORCHESTRATION_PROGRESS.CLOSED,
            i, j,
            
                    
            monitoring = {
                id: sdId,
                name: SurveyDescriptorName,
                status: ORCHESTRATION_PROGRESS.IDLE,
                nbInputs: 0,
                data: {
                    /*
                    teamId: {
                        name: "team name",
                        status: ORCHESTRATION_PROGRESS.IDLE,
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
            for (j = 0; j < inputList.length; j++) {
                inputDescriptors.push(inputList[j]);
            }
        }

        monitoring.nbInputs = inputDescriptors.length;

        // Empty surveys are to be treated as inactive ones:
        if (inputDescriptors.length === 0) {
            monitoring.status = ORCHESTRATION_PROGRESS.INACTIVE;
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

            if (team.getPlayers().size() > 0) {
                aPlayer = survInst.getOwner().getAnyLivePlayer();
            } else {
                aPlayer = null;
            }
            if (aPlayer === null) {
                // Skip Debug & empty Teams
                continue;
            }

            isDebugTeam = aPlayer.getTeam() instanceof com.wegas.core.persistence.game.DebugTeam;
            if (isDebugTeam && nbTeams > 1) {
                continue;
            }

            if (survInst.getClosed()) {
                playerStatus = ORCHESTRATION_PROGRESS.CLOSED;
            } else if (survInst.getValidated()) {
                playerStatus = ORCHESTRATION_PROGRESS.VALIDATED;
            } else if (survInst.getStarted()) {
                playerStatus = ORCHESTRATION_PROGRESS.STARTED;
            } else if (survInst.getRequested()) {
                playerStatus = ORCHESTRATION_PROGRESS.REQUESTED;
            } else if (survInst.getActive()) {
                playerStatus = ORCHESTRATION_PROGRESS.IDLE;
            } else {
                playerStatus = ORCHESTRATION_PROGRESS.INACTIVE;
            }

            // Global status is the least advanced of all individual statuses:
            if (globalStatus > playerStatus) {
                globalStatus = playerStatus;
            }
            
            // Count number of replied inputDescriptors for this team/player
            if (playerStatus >= ORCHESTRATION_PROGRESS.STARTED) {
                replied = 0;
                for (var id in teamsInputs) {
                    var currInput = teamsInputs[id][team];
                    if (currInput.getIsReplied()) {
                        replied++;
                    }
                }
            } else {
                replied = 0;
            }
            
            data = {
                name: team.getName(),
                status: playerStatus,
                replied: replied
            };
            
            monitoring.data[teamId] = data;
            
        }

        monitoring.status = globalStatus;
        
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