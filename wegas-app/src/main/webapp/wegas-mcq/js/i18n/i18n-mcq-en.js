
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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
            empty: "No questions available yet",
            submit: "submit",
            answered : "answered",
            unanswered : "",    // Customizable per scenario
            notDone: "",        // Customizable per scenario
            noReply: "Please select an answer first.",
            conflict: "Your request has been cancelled because one of your team mate has operate the same request at the same time."
        }
    });
});

