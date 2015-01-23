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

    function findQuestionAndResult(message, key, name) {
        var i, j, k,
            question, choice, result, match, textAnswer, parent, type,
            candidates, selected = [];

        candidates = Variable.findByTitle(gameModel, message.getSubject());


        /* Msg Body is like :
         
         <b>Question Title</b> QUESTION DESCRIPTION....
         Result(s)
         <div class="replyDiv"><p>BlahBlah1</p></div>
         <div class="replyDiv"></p>BlahBlah2</p></div>
         
         We're looking for blahblah1 only !
         */

        //match = message.getBody().match(/<div class="replyDiv">(<p>(?:[\s\S](?!<\/div><div class="replyDiv"))*<\/p>)<\/div>/);
        match = message.getBody().match(/<div class="replyDiv">(<p(?: class="[a-zA-Z0-9_]*")*>(?:[\s\S](?!<\/div><div class="replyDiv"))*<\/p>)<\/div>/);
        if (!match) {
            // REGEX FAILS 
            printMessage("BODY : " + message.getBody());
        } else {
            textAnswer = match[1];

            printMessage ("SEARCH ->" + textAnswer + "<-");
                        
            for (i = 0; i < candidates.size(); i += 1) { // Question Iterator
                question = parent = candidates.get(i);
                /* while (parent.getClass().getSimpleName() != "GameModel") {
                    type = parent.getTitle();
                    parent = Variable.findParentList(parent);
                }*/

                for (j = 0; j < question.getItems().size(); j += 1) { // Choice iterator
                    choice = question.getItems().get(j);
                    for (k = 0; k < choice.getResults().size(); k += 1) {
                        result = choice.getResults().get(k);
                        //if (result.getAnswer().indexOf(textAnswer) !== -1) {
                        printMessage ("ANSWER ->" + result.getAnswer() + "<-");
                        if (result.getAnswer() == textAnswer) { // DO NOT USE === !!!
                            // MATCH FOUND
                            selected.push({
                                "key": key,
                                "location": "",
                                "name": name,
                                "starttime": message.getTime(),
                                "question": question.getName(),
                                //"nbChoice": question.getItems().size(),
                                "choice": choice.getName(),
                                "result": k
                            });
                        }
                    }
                }
            }
            if (selected.length === 1) {
                return selected[0];
            } else if (selected.length === 0) {
                return null;
            } else {
                return Y.Array.reduce(selected, selected[0], function(current, item) {
                    if (current.question !== item.question) {
                        // Different questions -> could not guess anything
                        current.question = null;
                        current.choice = null;
                        current.result = null;
                    } else if (current.choice !== item.choice) {
                        // Different choices -> only question is correct
                        current.choice = null;
                        current.result = null;
                    } else {
                        // same question & same choice -> only result is ambigous
                        current.result = null;
                    }
                    return current;
                });
            }
        }
    }

    function processTeam(team) {
        var i, path = [], messages, msg, key, player;

        player = team.getPlayers().get(0);


        key = player.getId() + "&" + team.getId() + "&" + team.getGame().getId();


        messages = Variable.find(gameModel, "history").getInstance(player).getMessages();
        for (i = 0; i < messages.size(); i += 1) {
            msg = messages.get(i);
            path.push(findQuestionAndResult(msg, key, player.getName()));
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
        var i, teams = getActiveTeams(), team, result = [];

        for (i = 0; i < teams.length; i += 1) {
            team = teams[i];
            result = result.concat(processTeam(team));
        }

        return { "history" : result};
    }

    return {
        generateHistory: function() {
            return generateHistory();
        }
    };
}());
