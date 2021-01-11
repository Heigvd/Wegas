/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-review-de", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-review", "de", {
        review: {
            orchestrator: {
                mainTitle: "Peer-Review-Prozess für \"{{variableName}}\"",
                includeEvicted: "Autoren, die keine Daten zur Begutachtung eingereicht haben, müssen noch etwas zur Bewertung erhalten",
                state: {
                    edition: {
                        title: "Abfassung",
                        description: "Die Autoren editieren, was begutachtet wird<br/> <br /><i> Der Prozess hat noch nicht begonnen</i>"
                    },
                    reviewing: {
                        title: "Peer-Review",
                        description: "Autoren bewerten ihre Kollegen<br /><br /><i>Das ist der erste Schritt in diesem Prozess</i>"
                    },
                    commenting: {
                        title: "Kommentare",
                        description: "Autoren lesen die Meinungen ihrer Kollegen <br /><br /><i>i>Sie kommentieren diese Meinungen"
                    },
                    completed: {
                        title: "Abgeschlossen",
                        description: "Der Peer-Review-Prozess is abgeschlossen<br /><br /><i>Peers lesen die Kommentare, die über ihre Meinungen gemacht wurden</i>"
                    }
                },
                properties: "Eigenschaften",
                overview: "Überblick",
                reviews: "Feedbacks",
                comments: "Kommentare",
                charts: "Statistiken",
                playerData: "Peer-Review-Informationen fûr den \"{{playerName}}\" Spieler",
                teamData: "Peer-Review-Informationen fûr das \"{{teamName}}\" Team",
                goNextConfirmation: "Diese Aktion ist nicht umkehrbar.<br />Bist du sicher, dass du sie auf die nächste Stufe bringen willst?",
                stats: {
                    mean: "Mittel..",
                    median: "Median",
                    sd: "&sigma;",
                    bounds: "Grenzen",
                    basedOn: "auf {{available}}/{{expected}} der Werte",
                    avgWc: "Durchschnittliche Wortzahl",
                    avgCc: "Durchschnittliche Zeichenzahl"
                },
                notAvailableYet: "Noch nicht verfügbar"
            },
            global: {
                submit: "einreichen",
                confirmation: "Einmal validiert, können Sie diese Informationen nicht mehr ändern.<br />Sind Sie sicher, dass Sie fortfahren wollen?",
                save: "Speichern"
            },
            tabview: {
                emptyness_message: "Derzeit ist keine Peer-Review sichtbar",
                toReviewTitle: "Überprüfen Sie Ihre Kollegen",
                toReview: "Einreichung",
                toCommentTitle: "Hinweis zu Ihrer Einreichung",
                toComment: "Hinweis"
            },
            editor: {
                given: "Nach : ",
                number: "Nr. ",
                ask_your_feedback: "Geben Sie Ihr Feedback",
                your_feedback: "Ihr Feedback",
                reviewer_feedback: "erhaltene Feedback",
                ask_reviewer_feedback: "",
                ask_comment: "Was halten Sie von dem erhaltenen Feedback?",
                comment: "Ce que vous pensez du feedback reçu",
                author_comment: "Was Sie von dem erhaltenen Feedback halten",
                noValueProvided: "Keine Auswertung vorhanden",
                didNotProvide: "hat keine Bewertung abgegeben",
                didNotProvidePluralized: "haben keine Bewertung abgegeben",
                noTeamProvide: "kein Team hat eine Bewertung abgegeben",
                noPlayerProvide: "kein Spieler hat eine Bewertung abgegeben"
            }
        }
    });
});
