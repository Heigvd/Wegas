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

YUI.add("wegas-i18n-mcq-fr", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-mcq", "fr", {
        mcq: {
            result: "Résultat",
            empty: "Aucune question disponible actuellement",
            submit: "valider",
            answered : "répondue",
            unanswered : "",    // Customizable per scenario
            notDone: "",        // Customizable per scenario
            noReply: "Merci de d'abord sélectionner une réponse&thinsp;!",
            conflict: "Votre requête n'a pas été prise en compte car un de vos coéquipiers a tenté la même opération en même temps.<br />"
        }
    });
});
