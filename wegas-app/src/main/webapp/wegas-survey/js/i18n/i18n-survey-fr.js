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
                activeSurveysTitle: "Questionnaires actifs",
                noSurveyFound: "Aucun questionnaire trouvé",
                lastModifiedOn: "dernière modification le",
                sessionOfScenario: "partie issue du scénario",
                scenario: "scénario",
                doImport: "Importer les questionnaires sélectionnés",
                importing: "Importation en cours",
                importTerminated: "Sommaire des questionnaires importés",
                hasPlayerScope: "Ce questionnaire est répondu individuellement par chaque joueur",
                hasTeamScope: "Les réponses à ce questionnaire se font par équipes",
                currentStatus: "Statut",
                inactive: "Vide ou inactif",
                inviting: "Invitations envoyées",
                notStarted: "Pas encore démarré",
                requested: "Démarrage demandé",
                ongoing: "En cours",
                completed: "Terminé",
                closed: "Fermé",
                editButton: "Editer",
                previewButton: "Aperçu",
                copyButton: "Copier",
                requestButton: "Lancer",
                inviteButton: "Inviter",
                deleteButton: "Supprimer",
                renameButton: "Renommer (éditer)",
                shareButton: "Partager",
                scopeTitle: "Définir comment les joueurs répondent:",
                playerScopeButton: "Individuellement",
                teamScopeButton: "Par équipe",
                inviteTitle: "Les réponses doivent-elles être anonymes ou liées aux comptes utilisateurs ?",
                inviteAnonButton: "Anonymes",
                inviteLinkedButton: "Liées aux comptes",
                progressDetailsButton: "Détails",
                teamOrPlayer: "Équipe/Joueur",
                team: "Équipe",
                player: "Joueur",
                teamStatus: "Statut",
                teamRepliesCompulsory: "Réponses obligatoires",
                teamRepliesOptional: "Réponses facultatives",
                alreadyLaunched: "Ce questionnaire est déjà lancé",
                deleteRunning: "Ce questionnaire est en cours d'exécution.<br>Faut-il vraiment le supprimer ?",
                modifyRunning: "Ce questionnaire est en cours d'exécution et ne peut pas être modifié maintenant.",
                surveyCancelled: "Le questionnaire a été annulé.",
                surveyLaunched: "Le questionnaire a été lancé avec succès.",
                surveyInvited: "Des invitations ont été envoyés à {{number}} personnes.",
                scenarioCreated: "Ce questionnaire est à présent disponible dans le scénario<br>\"{{name}}\".<br>Veuillez rafraichir l'onglet du browser contenant vos scenarios actuels.",
                sessionCreated: "Ce questionnaire est à présent disponible dans la partie<br>\"{{name}}\".<br>Veuillez rafraichir l'onglet du browser contenant vos parties actuelles.",
                errors: {
                    inviteNoEmails: "Aucun joueur n'a rejoint le jeu actuellement<br>(ou alors ils n'ont pas enregistré d'adresse e-mail)",
                    nameTaken: "une variable dans ce jeu a déjà le même nom interne \"{{name}}\"",
                    noLogId: "Aucun \"Log ID\" n'a été fixé pour cette partie.<br>Les réponses au questionnaire ne seront pas sauvegardées !<br>Veuillez contacter l'administrateur de la plateforme (AlbaSim)."
                }
            }

        }
    });
});
