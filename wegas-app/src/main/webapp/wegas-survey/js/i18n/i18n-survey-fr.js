/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Jarle Hulaas
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-survey-fr", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-survey", "fr", {
        survey: {
            global: {
                next: "Suivant",
                back: "Retour",
                validate: "Valider",
                close: "Fermer ce questionnaire",
                confirmation: "Une fois validées,<br>vous ne pourrez plus modifier vos réponses.<br>Êtes-vous sûr de vouloir continuer ?",
                save: "Sauver",
                unavailableValue: "(Réponse anonyme)",
                statusSaving: "Sauvegarde...",
                statusSaved: "Enregistré",
                defaultInitialWords: "Merci de prendre le temps de répondre à ce questionnaire.<br>Cliquer sur \"Suivant\" pour commencer.",
                defaultFinalWords: "Ce questionnaire est terminé.<br>Merci de votre participation.",
                defaultSectionIntro: "Vous commencez une nouvelle partie du questionnaire.<br>Cliquer sur \"Suivant\" pour continuer.",
            },
            errors: {
                inactive: "Ce questionnaire est actuellement vide ou inactif.",
                incomplete: "Certaines questions n'ont pas encore reçu de réponse.<br>Merci de reprendre à la question<br>{{question}}",
                empty: "Ce questionnaire ne contient aucune question.",
                outOfBounds: "Cette question attend un nombre entre {{min}} et {{max}}.",
                notGreaterThanMin: "Cette question attend un nombre supérieur ou égal à {{min}}.",
                notLessThanMax: "Cette question attend un nombre inférieur ou égal à {{max}}."
            },
            orchestrator: {
                globalTitle: "Orchestration des questionnaires",
                surveyTitle: "Tableau de bord du questionnaire \"{{surveyName}}\"",
                currentStatus: "Statut actuel: ",
                notStarted: "Pas encore démarré",
                requested: "Démarrage demandé",
                started: "En cours",
                validated: "Validé",
                closed: "Fermé",
                requestButton: "Lancer le questionnaire",
                teamOrPlayer: "Équipe/Joueur",
                teamStatus: "Statut",
                teamReplies: "Réponses",
                noLogId: "Aucun \"Log ID\" n'a été fixé pour cette partie.<br>Les réponses au questionnaire ne seront pas sauvegardées !<br>Veuillez contacter l'administrateur de la plateforme (AlbaSim).",
            }

        }
    });
});
