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
                inactive: "Diese Umfrage ist derzeit leer oder inaktiv.",
                incomplete: "Einige Fragen sind noch nicht beantwortet worden.<br>Bitte beantworten Sie die Frage<br>{{question}}",
                returnToQuestion: "Zurück zu dieser Frage",
                empty: "Diese Umfrage enthält derzeit keine Fragen.",
                outOfBounds: "Diese Frage erwartet eine Wert zwischen {{min}} und {{max}}.",
                notGreaterThanMin: "Diese Frage erwartet eine Zahl grösser oder gleich {{min}}.",
                notLessThanMax: "Diese Frage erwartet eine Zahl kleiner oder gleich {{max}}."
            },
            orchestrator: {
                globalTitle: "Orchestrierung der Umfragen",
                searchExternalSurveys: "Nach Umfragen in anderen Spielen suchen",
                standardSurveysTitle: "Standardumfragen",
                externalSurveysTitle: "Ihre Umfragen",
                noSurveyFound: "Keine Umfrage gefunden",
                lastModifiedOn: "letzte Änderung am",
                sessionOfScenario: "Session des Szenarios",
                scenario: "Szenario",
                nameTaken: "eine Variable in diesem Spiel hat bereits den gleichen internen Namen \"{{name}}\"",
                doImport: "Ausgewählte Umfragen importieren",
                importing: "Import im Gange",
                importTerminated: "Übersicht der Importe",
                playedIndividually: "von jedem Spieler individuell zu beantworten",
                currentStatus: "Aktueller Stand: ",
                notStarted: "Noch nicht gestartet",
                requested: "Start angefordert",
                ongoing: "Laufend",
                completed: "Bestätigt",
                closed: "Geschlossen",
                requestImmediatelyButton: "Umfrage sofort starten",
                teamOrPlayer: "Team/Spieler",
                team: "Team",
                player: "Spieler",
                teamStatus: "Stand",
                teamRepliesCompulsory: "Erforderliche Antworte",
                teamRepliesOptional: "Optionale Antworte",
                noLogId: "Für diese Sitzung wurde keine \"Log-ID\" festgelegt.<br>Antworten auf die Umfrage werden nicht gespeichert!<br>Bitte kontaktieren Sie den Plattform-Administrator (AlbaSim)."
            }
        }
    });
});
