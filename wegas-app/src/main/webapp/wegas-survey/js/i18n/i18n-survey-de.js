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
                nameTaken: "eine Variable in diesem Spiel hat bereits den gleichen internen Namen \"{{name}}\"",
                doImport: "Ausgewählte Umfragen importieren",
                importing: "Import im Gange",
                importTerminated: "Übersicht der Importe",
                hasPlayerScope: "Diese Umfrage wird von jedem Spieler individuell beantwortet",
                hasTeamScope: "Diese Umfrage wird teamweise beantwortet",
                currentStatus: "Stand",
                inactive: "Leer oder inaktiv",
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
                noLogId: "Für diese Sitzung wurde keine \"Log-ID\" festgelegt.<br>Antworten auf die Umfrage werden nicht gespeichert!<br>Bitte kontaktieren Sie den Plattform-Administrator (AlbaSim).",
                alreadyLaunched: "Diese Umfrage ist schon gestartet",
                deleteRunning: "Diese Umfrage ist gestartet.<br>Wirklich löschen?"
            }
        }
    });
});
