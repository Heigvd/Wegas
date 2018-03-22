
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
    Y.Wegas.I18n.register("wegas-i18n-global", "it", {
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
            euro:{
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

