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

YUI.add("wegas-i18n-global-fr", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-global", "fr", {
        wegas: {
            player: "joueur",
            players: "joueurs",
            team: "équipe",
            teams: "équipes"
        },
        global: {
            and: "et",
            description: "description",
            details: "détails",
            delete: "supprimer",
            dunno: "Je ne sais pas",
            variableNotFound: "Impossible de trouver la variable \"{{name}}\"",
            logout: "déconnexion",
            statistics: "Statistiques",
            peerReview: "Eval. croisées",
            backToMenu: "retour au menu",
            mcqBackToMenu: "retour à la liste de questions",
            ok: "OK",
            cancel: "Annuler",
            yes: "oui",
            no: "non",
            submit: "valider"
        },
        i18n:{
            manager: {
                title: "Gestionnaire de langue"
            },
            languages: "Langues",
            availables: "Langues à disposition des joueurs"
        },
        errors: {
            conflict: "Votre requête ne peut pas être traitée car un conflit s'est produit durant son éxecution. Cela signifie probablement que vous avez tentez de modifier un élément en même temps qu'un autre utilisateur.",
            greaterThan: "{{value}} est plus grand que {{max}}",
            lessThan: "{{value}} est plus petit que {{min}}",
            limitReached: "Vous ne pouvez pas sélectionner plus de {{num}} réponses",
            nan: "\"{{value}}\" n'est pas un nombre",
            notAPositiveInteger: "\"{{value}}\" n'est pas un entier positif",
            outOfBounds: "{{value}} n'est pas compris dans [{{min}},{{max}}]",
            prohibited: "\"{{value}}\" n'est pas permise. Elle doit être choisie parmi : {{values}}"
        },
        inbox: {
            deleteEmailConfirmation: "Êtes-vous sûr de vouloir supprimer le message {{subject}} de manière définitive ?",
            noMessages: "Vous n'avez pas de messages",
            noMessageSelected: "Sélectionnez un message sur la gauche"
        }
    }, {base: {
            prefix: "",
            suffix: "",
            decimalPlaces: "",
            thousandsSeparator: " ",
            decimalSeparator: ","
        },
        extra: {
            chf: {
                suffix: " CHF",
                decimalPlaces: 2
            },
            euro:{
                suffix: " €",
                decimalPlaces: 2
            },
            pounds:{
                suffix: ' £',
                decimalPlaces: 2
            },
            int: {
                decimalPlaces: 0
            },
            fixed2: {
                decimalPlaces: 2
            }
        }
    });


    Y.Wegas.I18n.register("wegas-i18n-global", "fr-CH", {
    }, {
        base: {
            prefix: '',
            suffix: '',
            decimalPlaces: "",
            thousandsSeparator: "'",
            decimalSeparator: "."
        },
        extra: {
        }
    });
});
