
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-mcq-en", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-mcq", "en", {
        mcq: {
            result: "Result",
            results: "Results",
            noQuestionSelected: "Select an item on the left",
            empty: "No questions available at this time",
            submit: "submit",
            answered : "answered",
            unanswered : "",    // Customizable per scenario
            notDone: "",        // Customizable per scenario
            noReply: "Please select an answer first.",
            notEnoughReply: "Please select at least {{min}} answers",
            maximumReached: "You can't select more than {{max}} answers",
            conflict: "Your request has been cancelled because one of your team mates made the same request at the same time.",
            possibleChoices: 'Choices at your disposal: #'
        }
    });
});

