
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
                inactive: "This survey is currently empty or inactive.",
                incomplete: "Some questions have not been replied yet.<br>Please resume from question<br>{{question}}",
                returnToQuestion: "Return to this question",
                empty: "This survey contains no questions.",
                outOfBounds: "This question expects a number between {{min}} and {{max}}.",
                notGreaterThanMin: "This question expects a number greater than or equal to {{min}}.",
                notLessThanMax: "This question expects a number less than or equal to {{max}}."
            },
            orchestrator: {
                globalTitle: "Survey orchestration",
                searchExternalSurveys: "Search for importable surveys",
                standardSurveysTitle: "Standard Surveys",
                externalSurveysTitle: "Your own surveys",
                noSurveyFound: "No surveys found",
                lastModifiedOn: "last modified on",
                sessionOfScenario: "session of scenario",
                scenario: "scenario",
                nameTaken: "a variable in this game already has the same internal name \"{{name}}\"",
                doImport: "Import selected surveys",
                importing: "Importing surveys",
                importTerminated: "Overview of imported surveys",
                currentStatus: "Current status: ",
                notStarted: "Not yet started",
                requested: "Start requested",
                ongoing: "Ongoing",
                completed: "Completed",
                closed: "Closed",
                requestButton: "Start survey",
                teamOrPlayer: "Team/Player",
                teamStatus: "Status",
                teamRepliesCompulsory: "Compulsory Replies",
                teamRepliesOptional: "Optional Replies",
                noLogId: "No \"Log ID\" has been set for this session.<br>Replies to the survey will not be saved!<br>Please contact the platform administrator (AlbaSim).",
            }
        }
    });
});

