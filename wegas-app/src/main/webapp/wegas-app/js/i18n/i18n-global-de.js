
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
            euro:{
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

