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

YUI.add("wegas-i18n-mcq-fr", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-mcq", "fr", {
        mcq: {
            result: "Résultat",
            results: "Résultats",
            noQuestionSelected: "Sélectionnez une question sur la gauche",
            empty: "Aucune question disponible actuellement",
            submit: "valider",
            answered : "répondue",
            unanswered : "",    // Customizable per scenario
            notDone: "",        // Customizable per scenario
            noReply: "Merci de sélectionner une réponse&thinsp;!",
            notEnoughReply: "Merci de sélectionner au moins {{min}} réponses&thinsp;!",
            maximumReached: "Vous ne pouvez pas sélectionner plus de {{max}} réponses",
            conflict: "Votre requête n'a pas été prise en compte car un de vos coéquipiers a tenté la même opération en même temps.<br />",
            possibleChoices: 'Choix à disposition : #'
        }
    });
});
