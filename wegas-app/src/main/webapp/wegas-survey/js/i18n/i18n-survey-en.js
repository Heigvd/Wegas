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
                doImport: "Import selected surveys",
                importing: "Importing surveys",
                importTerminated: "Overview of imported surveys",
                hasPlayerScope: "This survey is to be answered individually by each player",
                hasTeamScope: "This survey is to be answered teamwise",
                currentStatus: "Status",
                inactive: "Empty or inactive",
                inviting: "Invitations sent",
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
                progressDetailsButton: "Details",
                teamOrPlayer: "Team/Player",
                team: "Team",
                player: "Player",
                teamStatus: "Status",
                teamRepliesCompulsory: "Compulsory Replies",
                teamRepliesOptional: "Optional Replies",
                alreadyLaunched: "This survey is already launched",
                deleteRunning: "This survey is already running.<br>Really delete it?",
                modifyRunning: "This survey is running and cannot be modified now.",
                surveyCancelled: "The survey is cancelled.",
                surveyLaunched: "The survey has been started successfully.",
                scenarioCreated: "This survey is now available for sharing in game scenario<br>\"{{name}}\".<br>Please refresh the browser tab containing your current scenarios.",
                sessionCreated: "This survey is now available for sharing in game session<br>\"{{name}}\".<br>Please refresh the browser tab containing your current sessions.",
                invitePanel: {
                    invitePanelTitle: "Invite to",
                    currentPlayers: "Current number of players who joined the game",
                    inviteTitle: "Send invitations:",
                    inviteLiveChoice: "<b>Option A</b><br>To players who already joined the game",
                    inviteListChoice: "<b>Option B</b><br>To an email list<br>(anonymous replies)",
                    inviteLiveAndListChoice: "<b>Option C</b><br>Combine (A) with (B) to reach everyone optimally",
                    inviteLiveTitle: "Player replies shall be:",
                    inviteLiveAnonChoice: "Anonymous",
                    inviteLiveLinkedChoice: "Linked to their accounts",
                    sendButton: "Send invitations",
                    liveRecipients: "Emails of current players",
                    liveRecipientsAutomatic: "(updated automatically)",
                    listRecipients: "Emails of all course participants",
                    countEmails: "Count: ",
                    cleanupButton: "Remove duplicates",
                    cleanupMessage: "Removed {{number}} duplicates from your list",
                    validationMessage: "Found {{number}} valid emails in your list",
                    senderName: "Your sender name",
                    subject: "Subject",
                    body: "Message",
                    surveyInvitedFromLive: "Invitations have been sent to {{number}} current players.",
                    surveyInvitedFromList: "Invitations have been sent to {{number}} guests from your mailing list.",
                    defaultMailBody: "Hi {\\{player}\\},<br>As a participant in the software simulation \"{{game}}\", you are cordially invited to complete an online survey.<br>Please click here to start: {\\{link}\\}<br>Thank you!",
                    defaultMailSubject: "[Albasim Wegas] Survey"
                },
                errors: {
                    inviteNoEmails: "Currently no players have joined the game<br>(or they have no registered email address)",
                    nameTaken: "a variable in this game already has the same internal name \"{{name}}\"",
                    noLogId: "No \"Log ID\" has been set for this session.<br>Replies to the survey will not be saved!<br>Please contact the platform administrator (AlbaSim).",
                    invalidEmail: "Invalid email address: {{email}}<br>Please correct and try again.",
                    noValidPlayers: "No players have joined the game yet",
                    noValidEmails: "Please enter at least one recipient email address.",
                    noValidSender: "Please enter your name (not your email address)",
                    noValidSubject: "Please enter the subject of the message",
                    noValidBody: "The body of the message cannot be empty",
                    noLinkInBody: "The body of the message must contain the code <b>{\\{link}\\}</b> which will automatically be replaced by the real URL address of the survey",
                    noPlayerInBody: "The body of the message must contain the code <b>{\\{player}\\}</b> which will automatically be replaced by the real name or email of the participant"
                }
            }
        }
    });
});

