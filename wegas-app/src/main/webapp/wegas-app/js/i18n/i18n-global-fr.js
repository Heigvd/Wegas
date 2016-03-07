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

YUI.add("wegas-i18n-global-fr", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-global", "fr", {
        global: {
            and: "et",
            description: "description",
            details: "détails",
            delete: "supprimer",
            dunno: "Je ne sais pas",
            variableNotFound: "Impossible de trouver la variable \"{{name}}\"",
            logout: "déconnexion"
        },
        errors: {
            notAPositiveInteger : "\"{{value}}\" n'est pas un entier positif",
            nan: "\"{{value}}\" n'est pas un nombre",
            outOfBounds: "{{value}} n'est pas compris dans [{{min}},{{max}}]",
            lessThan: "{{value}} est plus petit que {{min}}",
            greaterThan: "{{value}} est plus grand que {{max}}",
			prohibited: "\"{{value}}\" n'est pas permise. Elle doit être choisie parmis : {{values}}",
			limitReached: "Vous ne pouvez pas sélectionner plus de {{num}} réponses"
        },
        inbox :{
            deleteEmailConfirmation: "Êtes-vous sûr de vouloir supprimer le message {{subject}} de manière définitive ?",
            noMessages: "Nous n'avez pas de messages",
            noMessageSelected: "Sélectionnez un message sur la gauche"
        }
    });
});
