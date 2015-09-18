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
    Y.Wegas.I18n.register("fr", {
        global: {
            and: "et",
            description: "description",
            details: "détails",
            delete: "supprimer",
            variableNotFound: "Impossible de trouver la variable \"{{name}}\"",
            logout: "déconnexion"
        },
        inbox :{
            deleteEmailConfirmation: "Êtes-vous sûr de vouloir supprimer le message {{subject}} de manière définitive ?",
            noMessages: "Nous n'avez pas de messages",
            noMessageSelected: "Sélectionnez un message sur la gauche"
        }
    });
});
