/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 *                ,*************************************.
 *                |     PM-GAME: EXPORT USER STORY      |
 *                '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
 *
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */

/*global Variable, gameModel, self */
var PMGExport = (function() {
    "use strict";

    function findQuestionAndResult(message) {
        var i, j, k,
            question, choice, result, textAnswer,
            candidates;

        candidates = Variable.findByTitle(gameModel, message.getSubject());

        /* Msg Body is like :
         
         <b>Question Title</b> QUESTION DESCRIPTION....
         Result(s)
         <div class="replyDiv"><p>BlahBlah1</p></div>
         <div class="replyDiv"></p>BlahBlah2</p></div>
         
         We're looking for blahblah1 only !
         */
        textAnswer = message.getBody().match(/<div class="replyDiv"><p>((?:.(?!<\/p><\/div><div class="replyDiv"))*)<\/p><\/div>/)[1];

        for (i = 0; i < candidates.size(); i += 1) { // Question Iterator
            question = candidates.get(i);
            for (j = 0; j < question.getItems().size(); j += 1) { // Choice iterator
                choice = question.getItems().get(j);
                for (k = 0; k < choice.getResults().size(); k += 1) {
                    result = choice.getResults().get(k);
                    if (result.getAnswer().match(textAnswer)) {
                        // MATCH FOUND
                        return {"question": question.getName(), "result": k, "date": message.getDate()};
                    }
                }
            }
        }
    }

    function processTeam(team) {
        var i, path = [], messages, msg;

        messages = Variable.find(gameModel, "history").getInstance(team.getPlayers().get(0)).getMessages();
        for (i = 0; i < messages.size(); i += 1) {
            msg = messages.get(i);
            path.push(findQuestionAndResult(msg));
        }

        return path;
    }


    function getActiveTeams() {
        var i,
            games = gameModel.getGames(),
            allTeams, team, teams = [];

        if (games.size() > 0) {
            allTeams = games.get(0).getTeams();
            // extract teams
            if (allTeams.size() === 1) {
                teams.push(allTeams.get(0)); // GameModels only contains a debug teams           
            } else { // Real Game case : do NOT consider DebugGames nor empty ones
                for (i = 0; i < allTeams.size(); i += 1) {
                    team = allTeams.get(i);
                    if (team.getClass().getSimpleName() == "Team"
                        && team.getPlayers().size() > 0) {
                        teams.push(team);
                    }
                }
            }
        }

        return teams;
    }

    function generateHistory() {
        var i, teams = getActiveTeams(), team, result = {};

        for (i = 0; i < teams.length; i += 1) {
            team = teams[i];
            result[team.getName()] = processTeam(team);
        }

        return result;
    }

    return {
        generateHistory: function() {
            return generateHistory();
        }
    };
}());
