
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global YUI*/

YUI.add("wegas-i18n-global-de", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-global", "de", {
        wegas: {
            player: "Spieler",
            players: "Spieler",
            team: "Team",
            teams: "Teams"
        },
        global: {
            and: "und",
            description: "Beschreibung",
            details: "Details",
            delete: "löschen",
            dunno: "Ich weiss nicht",
            variableNotFound: "Variable \"{{name}}\" nicht gefunden",
            logout: "abmelden",
            statistics: "Statistiken",
            peerReview: "Peer-Review",
            survey: "Umfrage",
            backToMenu: "zurück zum Menü",
            mcqBackToMenu: "zurück zur Frageliste",
            ok: "OK",
            cancel: "Abbrechen",
            yes: "Ja",
            no: "Nein",
            submit: "einreichen"
        },
        i18n: {
            manager: {
                title: "Sprachen-Manager"
            },
            languages: "Sprachen",
            availables: "Sprachen, die den Spielern zur Verfügung stehen"
        },
        errors: {
            conflict: "Ihre Anfrage kann nicht bearbeitet werden, da bei der Ausführung ein Konflikt aufgetreten ist. Dies bedeutet wahrscheinlich, dass Sie versucht haben, ein Element gleichzeitig mit einem anderen Benutzer zu ändern.",
            greaterThan: "{{value}} ist  grösser als {{max}}",
            lessThan: "{{value}} ist kleiner als {{min}}",
            limitReached: "Sie können nich mehr als {{num}} Antworten auswählen",
            nan: "\"{{value}}\" ist keine Nummer",
            notAPositiveInteger: "\"{{value}}\" ist keine positive ganze Zahl",
            outOfBounds: "{{value}} ist nicht im Intervall [{{min}},{{max}}] enthalten",
            prohibited: "\"{{value}}\" ist nicht erlaubt. Es muss ausgewählt werden aus: {{values}}"
        },
        inbox: {
            deleteEmailConfirmation: "Sind Sie sicher, dass Sie die E-Mail \"{{subject}}\" dauerhaft löschen wollen?",
            noMessages: "Keine E-Mail",
            noMessageSelected: "Wählen Sie eine E-Mail auf der linken Seite aus."
        }
    }, {
        base: {
            prefix: "",
            suffix: "",
            decimalPlaces: "",
            thousandsSeparator: ".",
            decimalSeparator: ","
        },
        extra: {
            chf: {
                prefix: "CHF ",
                decimalPlaces: 2
            },
            euro: {
                prefix: "€",
                decimalPlaces: 2
            },
            pounds: {
                prefix: "£",
                decimalPlaces: 2
            },
            int: {
                decimalPlaces: 0
            },
            fixed2: {
                decimalPlaces: 2
            }
        }
    });

    Y.Wegas.I18n.register("wegas-i18n-global", "de-CH", {
    }, {
        base: {
            prefix: '',
            suffix: '',
            decimalPlaces: "",
            thousandsSeparator: "'",
            decimalSeparator: "."
        },
        extra: {
        }
    });
});

