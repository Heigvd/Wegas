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
                incomplete: "Einige Fragen sind noch nicht beantwortet worden.<br>Bitte füllen Sie die Umfrage aus.",
                unavailableValue: "(anonyme Antwort)",
                statusSaving: "Speicherung...",
                statusSaved: "Gespeichert",
                defaultInitialWords: "Vielen Dank, dass Sie sich die Zeit genommen haben, diese Umfrage zu beantworten.<br>Klicken Sie \"Weiter\", um zu beginnen.",
                defaultFinalWords: "Diese Umfrage ist beendet.<br>Vielen Dank für Ihre Teilnahme.",
                defaultSectionIntro: "Sie beginnen nun einen neuen Teil der Umfrage.<br>Klicken Sie zum Fortfahren auf \"Weiter\".",
            },
            errors: {
                inactive: "Diese Umfrage ist derzeit leer oder inaktiv.",
                incomplete: "Einige Fragen sind noch nicht beantwortet worden.<br>Bitte beantworten Sie die Frage<br>{{question}}",
                empty: "Diese Umfrage enthält derzeit keine Fragen.",
                outOfBounds: "Diese Frage erwartet eine Wert zwischen {{min}} und {{max}}.",
                notGreaterThanMin: "Diese Frage erwartet eine Zahl grösser oder gleich {{min}}.",
                notLessThanMax: "Diese Frage erwartet eine Zahl kleiner oder gleich {{max}}."
            },
            orchestrator: {
                globalTitle: "Orchestrierung der Umfragen",
                surveyTitle: "Dashboard der Umfrage \"{{surveyName}}\"",
                currentStatus: "Aktueller Stand: ",
                notStarted: "Noch nicht gestartet",
                requested: "Start angefordert",
                ongoing: "Laufend",
                completed: "Bestätigt",
                closed: "Geschlossen",
                requestButton: "Umfrage starten",
                teamOrPlayer: "Team/Spieler",
                teamStatus: "Stand",
                teamReplies: "Antworte",
                noLogId: "Für diese Sitzung wurde keine \"Log-ID\" festgelegt.<br>Antworten auf die Umfrage werden nicht gespeichert!<br>Bitte kontaktieren Sie den Plattform-Administrator (AlbaSim)."
            }
        }
    });
});
