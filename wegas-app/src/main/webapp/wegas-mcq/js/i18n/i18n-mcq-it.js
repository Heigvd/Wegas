
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-mcq-it", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-mcq", "it", {
        mcq: {
            result: "Risultato",
            results: "Risultati",
            noQuestionSelected: "Seleziona un elemento sulla sinistra",
            empty: "Nessuna domanda ancora disponibile",
            submit: "inviare",
            answered : "risposto",
            unanswered : "",    // Customizable per scenario
            notDone: "",        // Customizable per scenario
            noReply: "Si prega di selezionare una risposta",
            notEnoughReply: "Si prega di selezionare almeno {{min}} risposta",
            maximumReached: "No è possibile selezionare piu di {{max}} risposta",
            conflict: "La sua richiesta e stata annullata perche uno dei vostri compagni ha tentato la stessa operazione allo stesso tempo.",
            possibleChoices: 'Scelte a vostra disposizione : #'
        }
    });
});

