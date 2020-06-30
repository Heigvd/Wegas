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

YUI.add("wegas-i18n-survey-de", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-survey", "de", {
        survey: {
            global: {
                next: "Weiter",
                back: "Zurück",
                validate: "Einreichen",
                close: "Umfrage schliessen",
                confirmation: "Einmal validiert,<br>können Sie Ihre Antworte nicht mehr ändern.<br>Sind Sie sicher, dass Sie fortfahren wollen?",
                save: "Speichern",
                unavailableValue: "(anonyme Antwort)",
                statusSaving: "Speicherung...",
                statusSaved: "Gespeichert",
                replyCompulsory: "(Erforderliche Antwort)",
                replyOptional: "(Optionale Antwort)"
            },
            errors: {
                incomplete: "Einige Fragen sind noch nicht beantwortet worden.<br>Bitte beantworten Sie die Frage<br>{{question}}",
                returnToQuestion: "Zurück zu dieser Frage",
                empty: "Diese Umfrage enthält derzeit keine Fragen.",
                outOfBounds: "Diese Frage erwartet eine Wert zwischen {{min}} und {{max}}.",
                notGreaterThanMin: "Diese Frage erwartet eine Zahl grösser oder gleich {{min}}.",
                notLessThanMax: "Diese Frage erwartet eine Zahl kleiner oder gleich {{max}}."
            },
            orchestrator: {
                globalTitle: "Orchestrierung der Umfragen",
                searchExternalSurveys: "Nach allen Umfragen suchen",
                standardSurveysTitle: "Standardumfragen",
                externalSurveysTitle: "Ihre Umfragen",
                activeSurveysTitle: "Aktive Umfragen",
                noSurveyFound: "Keine Umfrage gefunden",
                lastModifiedOn: "letzte Änderung am",
                sessionOfScenario: "Session des Szenarios",
                scenario: "Szenario",
                doImport: "Ausgewählte Umfragen importieren",
                importing: "Import im Gange",
                importTerminated: "Übersicht der Importe",
                hasPlayerScope: "Diese Umfrage wird von jedem Spieler individuell beantwortet",
                hasTeamScope: "Diese Umfrage wird teamweise beantwortet",
                currentStatus: "Stand",
                inactive: "Leer oder inaktiv",
                inviting: "Einladungen versandt",
                notStarted: "Noch nicht gestartet",
                requested: "Start angefordert",
                ongoing: "Laufend",
                completed: "Bestätigt",
                closed: "Geschlossen",
                editButton: "Editieren",
                previewButton: "Vorschau",
                copyButton: "Kopieren",
                requestButton: "Starten",
                inviteButton: "Einladen",
                deleteButton: "Löschen",
                renameButton: "Umbenennen (editieren)",
                shareButton: "Teilen",
                scopeTitle: "Wie werden die Teilnehmer antworten:",
                playerScopeButton: "Individuell",
                teamScopeButton: "Teamweise",
                progressDetailsButton: "Details",
                teamOrPlayer: "Team/Spieler",
                team: "Team",
                player: "Spieler",
                teamStatus: "Stand",
                teamRepliesCompulsory: "Erforderliche Antworte",
                teamRepliesOptional: "Optionale Antworte",
                alreadyLaunched: "Diese Umfrage ist schon gestartet",
                deleteRunning: "Diese Umfrage ist gestartet.<br>Wirklich löschen?",
                modifyRunning: "Diese Umfrage ist gestartet und darf jetzt nicht geändert werden.",
                surveyCancelled: "Die Umfrage wurde storniert.",
                surveyLaunched: "Die Umfrage wurde erfolgreich gestartet.",
                scenarioCreated: "Die Umfrage steht nun in diesem Szenario zur Verfügung:<br>\"{{name}}\".<br>Bitte laden Sie den Browser-Tab mit Ihren aktuellen Szenarios neu.",
                sessionCreated: "Die Umfrage steht nun in dieser Session zur Verfügung:<br>\"{{name}}\".<br>Bitte laden Sie den Browser-Tab mit Ihren aktuellen Sessionen neu.",
                invitePanel: {
                    invitePanelTitle: "Einladung an",
                    currentPlayers: "Aktuelle Anzahl der Spieler, die dem Spiel beigetreten sind",
                    inviteTitle: "Einladungen schicken",
                    inviteLiveChoice: "<b>Option A</b><br>An die Spieler, die dem Spiel beigetreten sind",
                    inviteListChoice: "<b>Option B</b><br>An eine Email-Liste<br>(anonyme Antworten)",
                    inviteLiveAndListChoice: "<b>Option C</b><br>Kombinieren Sie (A) mit (B), um alle optimal zu erreichen",
                    inviteLiveTitle: "Die Antworten der Spieler müssen:",
                    inviteLiveAnonChoice: "Anonym sein",
                    inviteLiveLinkedChoice: "Mit Konten verknüpft sein",
                    sendButton: "Einladungen absenden",
                    liveRecipients: "E-Mails der aktuellen Spieler",
                    liveRecipientsAutomatic: "(automatisch aktualisiert)",
                    listRecipients: "E-Mails aller Kursteilnehmer",
                    countEmails: "Anzahl: ",
                    cleanupButton: "Duplikate entfernen",
                    cleanupMessage: "{{number}} Duplikate wuden aus Ihrer Liste entfernt",
                    validationMessage: "{{number}} gültige E-Mails in Ihrer Liste gefunden",
                    senderName: "Ihr Absendername",
                    subject: "Betreff",
                    body: "Nachricht",
                    surveyInvitedFromLive: "Einladungen wurden an {{number}} Spielteilnehmer versandt.",
                    surveyInvitedFromList: "Einladungen wurden an {{number}} Gäste (\"Guests\") Ihrer Email-Liste.",
                    defaultMailBody: "Hallo {\\{player}\\},<br>Als Teilnehmer/in an der Software-Simulation \"{{game}}\" sind Sie herzlich eingeladen, eine Online-Umfrage auszufüllen.<br>Bitte klicken Sie hier, um zu beginnen: {\\{link}\\}<br>Besten Dank!",
                    defaultMailSubject: "[Albasim Wegas] Umfrage"
                },
                errors: {
                    inviteNoEmails: "Derzeit haben sich keine Spieler dem Spiel angeschlossen<br>(oder sie haben keine E-Mail-Adresse registriert)",
                    nameTaken: "eine Variable in diesem Spiel hat bereits den gleichen internen Namen \"{{name}}\"",
                    noLogId: "Für diese Sitzung wurde keine \"Log-ID\" festgelegt.<br>Antworten auf die Umfrage werden nicht gespeichert!<br>Bitte kontaktieren Sie den Plattform-Administrator (AlbaSim).",
                    invalidEmail: "Ungültige E-mail-Adresse: {{email}}<br>Bitte korrigieren und erneut versuchen.",
                    noValidPlayers: "Derzeit haben sich keine Spieler dem Spiel angeschlossen",
                    noValidEmails: "Bitte mindestens eine E-mail-Adresse eingeben.",
                    noValidSender: "Bitte Ihren Namen (nicht Ihre E-Mail-Adresse) eingeben",
                    noValidSubject: "Bitte geben Sie den Betreff der Nachricht ein",
                    noValidBody: "Der Hauptteil der Nachricht darf nicht leer sein",
                    noLinkInBody: "Der Hauptteil der Nachricht muss den Code <b>{\\{link}\\}</b> enthalten. Dieser wird automatisch durch die tatsächliche URL-Adresse der Umfrage ersetzt",
                    noPlayerInBody: "Der Hauptteil der Nachricht muss den Code <b>{\\{player}\\}</b> enthalten. Dieser wird automatisch durch den Namen oder die E-Mail-Adresse des Teilnehmers ersetzt."
                }
            }
        }
    });
});
