/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-mcq-de", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-mcq", "de", {
        mcq: {
            result: "Ergebnis",
            results: "Ergebnissen",
            noQuestionSelected: "Wähle eine Frage auf der linken Seite aus.",
            empty: "Zur Zeit sind keine Fragen verfügbar",
            submit: "einreichen",
            answered : "beantwortet",
            unanswered : "",    // Customizable per scenario
            notDone: "",        // Customizable per scenario
            noReply: "Bitte wähle eine Antwort aus!",
            notEnoughReply: "Bitte wähle mindestens {{min}} Antworten aus!",
            maximumReached: "Du kannst nicht mehr als {{max}}} Antworten auswählen",
            conflict: "Deine Anfrage wurde nicht berücksichtigt, weil einer deiner Teamkollegen die gleiche Operation zur gleichen Zeit versucht hat.<br />",
            possibleChoices: 'Wahlen zu Verfügung: #'
        }
    });
});
