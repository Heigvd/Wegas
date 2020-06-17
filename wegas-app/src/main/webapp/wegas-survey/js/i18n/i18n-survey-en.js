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

YUI.add("wegas-i18n-survey-en", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-survey", "en", {
        survey: {
            global: {
                next: "Next",
                back: "Back",
                validate: "Submit",
                close: "Close this survey",
                confirmation: "Once submitted,<br>your replies will be final!<br> Do you really want to submit them ?",
                save: "Save",
                unavailableValue: "(Anonymous reply)",
                statusSaving: "Saving...",
                statusSaved: "Saved",
                replyCompulsory: "(compulsory reply)",
                replyOptional: "(optional reply)"
            },
            errors: {
                incomplete: "Some questions have not been replied yet.<br>Please resume from question<br>{{question}}",
                returnToQuestion: "Return to this question",
                empty: "This survey contains no questions.",
                outOfBounds: "This question expects a number between {{min}} and {{max}}.",
                notGreaterThanMin: "This question expects a number greater than or equal to {{min}}.",
                notLessThanMax: "This question expects a number less than or equal to {{max}}."
            },
            orchestrator: {
                globalTitle: "Survey orchestration",
                searchExternalSurveys: "Find all surveys",
                standardSurveysTitle: "Standard Surveys",
                externalSurveysTitle: "Your own surveys",
                activeSurveysTitle: "Active surveys",
                noSurveyFound: "No surveys found",
                lastModifiedOn: "last modified on",
                sessionOfScenario: "session of scenario",
                scenario: "scenario",
                nameTaken: "a variable in this game already has the same internal name \"{{name}}\"",
                doImport: "Import selected surveys",
                importing: "Importing surveys",
                importTerminated: "Overview of imported surveys",
                hasPlayerScope: "This survey is to be answered individually by each player",
                hasTeamScope: "This survey is to be answered teamwise",
                currentStatus: "Status",
                inactive: "Empty or inactive",
                notStarted: "Not yet started",
                requested: "Start requested",
                ongoing: "Ongoing",
                completed: "Completed",
                closed: "Closed",
                editButton: "Edit",
                previewButton: "Preview",
                copyButton: "Copy",
                requestButton: "Launch",
                inviteButton: "Invite",
                deleteButton: "Delete",
                renameButton: "Rename (via edit)",
                shareButton: "Share",
                scopeTitle: "Change how players answer:",
                playerScopeButton: "Individually",
                teamScopeButton: "Teamwise",
                inviteTitle: "Shall the replies be anonymous or linked to the players' accounts?",
                inviteAnonButton: "Anonymous",
                inviteLinkedButton: "Linked to account",
                progressDetailsButton: "Details",
                teamOrPlayer: "Team/Player",
                team: "Team",
                player: "Player",
                teamStatus: "Status",
                teamRepliesCompulsory: "Compulsory Replies",
                teamRepliesOptional: "Optional Replies",
                noLogId: "No \"Log ID\" has been set for this session.<br>Replies to the survey will not be saved!<br>Please contact the platform administrator (AlbaSim).",
                alreadyLaunched: "This survey is already launched",
                deleteRunning: "This survey is already running.<br>Really delete it?",
                modifyRunning: "This survey is running and cannot be modified now.",
                surveyCancelled: "The survey is cancelled.",
                surveyLaunched: "The survey has been started successfully.",
                scenarioCreated: "This survey is now available for sharing in game scenario<br>\"{{name}}\".<br>Please refresh the browser tab containing your current scenarios.",
                sessionCreated: "This survey is now available for sharing in game session<br>\"{{name}}\".<br>Please refresh the browser tab containing your current sessions."
            }
        }
    });
});

