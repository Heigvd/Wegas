
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

YUI.add("wegas-i18n-global-it", function(Y) {
    Y.Wegas.I18n.register("wegas-i18n-global", "it",
        {
            wegas: {
                player: "giocatore",
                players: "giocatori",
                team: "squadra",
                teams: "squadre"
            },
            global: {
                and: "e",
                description: "descrizione",
                details: "dettagli",
                delete: "eliminare",
                dunno: "Non lo so",
                variableNotFound: "Impossibile trovare la variabile \"{{name}}\"",
                logout: "esci",
                statistics: "Statistica",
                peerReview: "Revisione paritaria",
                backToMenu: "torna al menu",
                mcqBackToMenu: "torna alla lista",
                ok: "OK",
                cancel: "Annulla",
                yes: "sì",
                no: "no"
            },
            i18n: {
                manager: {
                    title: "Gestione delle lingue"
                },
                languages: "Lingue",
                availables: "Lingue a disposizione dei giocatori"
            },
            errors: {
                conflict: "La sua query non ha potuto essere completata dovuta a un conflitto. Questo di solito significa che si è tentato di aggiornare un elemento obsoleto.",
                greaterThan: "{{value}} è maggiore di {{max}}",
                lessThan: "{{value}} è più piccolo di {{min}}",
                limitReached: "Non è possibile selezionare più di {{num}} valori",
                prohibited: "\"{{value}}\" è proibito. Deve essere scelto tra :{{values}}",
                nan: "\"{{value}}\" non è un numero",
                notAPositiveInteger: "\"{{value}}\" non è un numero intero positivo",
                outOfBounds: "{{value}} non deve essere {{min}} e {{max}}"
            },
            inbox: {
                deleteEmailConfirmation: "L'e-mail {{subject}} sarà cancellato definitivamente. Continua?",
                noMessages: "Non hai messaggi",
                noMessageSelected: "Selezionare un elemento a sinistra"
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
                suffix: " CHF",
                decimalPlaces: 2
            },
            euro: {
                suffix: " €",
                decimalPlaces: 2
            },
            pounds: {
                suffix: " £",
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


    Y.Wegas.I18n.register("wegas-i18n-global", "it-CH", {
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

