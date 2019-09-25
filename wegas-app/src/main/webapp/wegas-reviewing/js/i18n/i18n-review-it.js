
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
/*global Variable, gameModel, self */

YUI.add("wegas-i18n-review-it", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-review", "it", {
        review: {
            orchestrator: {
                mainTitle: "Processo di revisione paritaria per \"{{variableName}}\"",
                includeEvicted: "Gli autori che non hanno inviati dati devono comunque ricevere qualcosa a valutare",
                state: {
                    edition: {
                        title: "Modificazione",
                        description: "Gli autori modificano quello che sara giudicato tra pari<br/> <br /><i>Il processo non e ancora iniziato</i>"
                    },
                    reviewing: {
                        title: "Esaminazione",
                        description: "Gli autori esaminano i loro pari<br /><br /><i>È un primo passo del processo</i>"
                    },
                    commenting: {
                        title: "Osservazione",
                        description: "Gli autori vengono a conoscenza del parere di loro pari<br /><br /><i>Commentano queste revisioni</i>"
                    },
                    completed: {
                        title: "Completato",
                        description: "Il processo di revisione e finito<br /><br /><i>Gli autori venivano a conoscenza dei commenti delle sue revisioni</i>"
                    }
                },
                properties: "proprietà",
                overview: " visione d'insieme",
                reviews: "revisioni",
                comments: "commentari",
                charts: "tabelle",
                playerData: "Dati valutati da pari per il giocatore \"{{playerName}}\"",
                teamData: "Dati valutati da pari per la squadra \"{{teamName}}\"",
                goNextConfirmation: "Questa azione e irreversibile.<br />\nAvviare nonostante la fase successiva?",
                stats: {
                    mean: "media.",
                    median: "mediana.",
                    sd: "&sigma;",
                    bounds: "limiti",
                    basedOn: "basato su {{available}}/{{expected}} valori",
                    avgWc: "Numero medio delle parole",
                    avgCc: "Numero medio dei caratteri"
                },
                notAvailableYet : "Non ancora disponibile"
            },
            global: {
                submit: "inviare",
                confirmation: "Una volta inviate, queste dati non sarano piu modificabile!<br /> Inviare nonostante ?",
                save: "Salvare"
            },
            tabview: {
                emptyness_message: "Niente revisione ancora disponibile",
                toReviewTitle: "Esaminare le sue pari",
                toReview: "Presentazione",
                toCommentTitle: "Revisione delle vostre presentazioni",
                toComment: "Revisioni"
            },
            editor: {
                given: "Considerato: ",
                number: "nº",
                ask_your_feedback: "Dare un feedback",
                your_feedback: "Vostro feedback:",
                reviewer_feedback: "Feedback ricevuto",
                ask_reviewer_feedback: "",
                ask_comment: "Che cosa pensa del feedback ricevuto?",
                comment: "Ciò che pensa del feedback ricevuto",
                author_comment: "Ciò che l'autore pensa del vostro feedback",
                noValueProvided: "Non è stata fornita alcuna valutazione",
                didNotProvide: "non ha fornito alcuna valutazione",
                didNotProvidePluralized: "non hanno fornito alcuna valutazione",
                noTeamProvide: "nessuna squadra ha fornito alcuna valutazione",
                noPlayerProvide: "nessun gioccatore ha fornito alcuna valutazione"
            }
        }
    });
});

