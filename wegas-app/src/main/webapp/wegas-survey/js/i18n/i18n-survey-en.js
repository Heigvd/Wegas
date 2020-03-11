
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
                defaultInitialWords: "Thank you for taking the time to answer this survey.<br>Click \"Next\" to start.",
                defaultFinalWords: "This survey is over.<br>Thank you for your participation.",
                defaultSectionIntro: "You are now starting a new part of the survey.<br>Click \"Next\" to proceed.",
            },
            errors: {
                inactive: "This survey is currently empty or inactive.",
                incomplete: "Some questions have not been replied yet.<br>Please resume from question<br>{{question}}",
                empty: "This survey contains no questions.",
                outOfBounds: "This question expects a number between {{min}} and {{max}}.",
                notGreaterThanMin: "This question expects a number greater than or equal to {{min}}.",
                notLessThanMax: "This question expects a number less than or equal to {{max}}."
            },
            orchestrator: {
                globalTitle: "Survey orchestration",
                surveyTitle: "Dashboard for survey \"{{surveyName}}\"",
                currentStatus: "Current status: ",
                notStarted: "Not yet started",
                requested: "Start requested",
                started: "Started",
                validated: "Validated",
                closed: "Closed",
                requestButton: "Start survey",
                teamOrPlayer: "Team/Player",
                teamStatus: "Status",
                teamReplies: "Replies",
                noLogId: "No \"Log ID\" has been set for this session.<br>Replies to the survey will not be saved!<br>Please contact the platform administrator (AlbaSim).",
            }
        }
    });
});

