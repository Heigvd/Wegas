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
                replyCompulsory: "(réponse obligatoire)",
                replyOptional: "(réponse facultative)"
            },
            errors: {
                inactive: "Ce questionnaire est actuellement vide ou inactif.",
                incomplete: "Certaines questions n'ont pas encore reçu de réponse.<br>Merci de reprendre à la question<br>{{question}}",
                returnToQuestion: "Retourner à cette question",
                empty: "Ce questionnaire ne contient aucune question.",
                outOfBounds: "Cette question attend un nombre entre {{min}} et {{max}}.",
                notGreaterThanMin: "Cette question attend un nombre supérieur ou égal à {{min}}.",
                notLessThanMax: "Cette question attend un nombre inférieur ou égal à {{max}}."
            },
            orchestrator: {
                globalTitle: "Orchestration des questionnaires",
                searchExternalSurveys: "Chercher tous les questionnaires",
                standardSurveysTitle: "Questionnaires standard",
                externalSurveysTitle: "Vos questionnaires",
                noSurveyFound: "Aucun questionnaire trouvé",
                lastModifiedOn: "dernière modification le",
                sessionOfScenario: "partie issue du scénario",
                scenario: "scénario",
                nameTaken: "une variable dans ce jeu a déjà le même nom interne \"{{name}}\"",
                doImport: "Importer les questionnaires sélectionnés",
                importing: "Importation en cours",
                importTerminated: "Sommaire des questionnaires importés",
                playedIndividually: "à répondre individuellement par chaque joueur",
                currentStatus: "Statut actuel: ",
                notStarted: "Pas encore démarré",
                requested: "Démarrage demandé",
                ongoing: "En cours",
                completed: "Terminé",
                closed: "Fermé",
                editButton: "Editer",
                requestImmediatelyButton: "Lancer immédiatement",
                teamOrPlayer: "Équipe/Joueur",
                team: "Équipe",
                player: "Joueur",
                teamStatus: "Statut",
                teamRepliesCompulsory: "Réponses obligatoires",
                teamRepliesOptional: "Réponses facultatives",
                noLogId: "Aucun \"Log ID\" n'a été fixé pour cette partie.<br>Les réponses au questionnaire ne seront pas sauvegardées !<br>Veuillez contacter l'administrateur de la plateforme (AlbaSim)."
            }

        }
    });
});
