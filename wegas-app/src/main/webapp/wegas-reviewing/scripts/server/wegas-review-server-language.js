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
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

/*global Variable, gameModel, self */
var i18nOrdinate = (function(module) {
    return module;
}(i18nOrdinate || {})),
    i18nTable = (function(module) {
        return module;
    }(i18nTable || {}))
    ,
    I18n = (function() {
        "use strict";

        /*
         * Take the initial string and replace ALL parameters by theirs argument value 
         * provided by k/v in args object.
         * 
         * All paramters (i.e. identifier [a-zA-Z0-9_] surrounded by two '%') are mandatory
         * 
         */
        function mapArguments(string, args, tName) {
            var pattern = /.*%([a-zA-Z0-9_]*)%/,
                match, key;
            while (match = pattern.exec(string)) {
                key = match[1];
                if (args && args.hasOwnProperty(key)) {
                    string = string.replace("%" + key + "%", args[key]);
                } else {
                    return "[I18N] MISSING MANDATORY ARGUMENT \"" + key + "\" FOR \"" + tName + "\"";
                }
            }
            return string;
        }


        function currentLocale() {
            try {
                return Variable.find(gameModel, "language").getValue(self);
            } catch (error) {
                return "fr";
            }
        }
        /**
         * Return the translation for the key messages, according to current locale
         * 
         * @param {type} key the message identifier
         * @param {type} object contains message arguments to replace {k: value, etc}
         * @returns {String} the translated string filled with provided arguments
         */
        function translate(key, object) {
            var locale = currentLocale(),
                value = i18nTable[locale],
                res, i;
            if (value) {
                res = key.split(".");
                for (i = 0; i < res.length; i += 1) {
                    if (value.hasOwnProperty(res[i])) {
                        value = value[res[i]];
                    } else {
                        return "[I18N] MISSING " + locale + " translation for \"" + key + "\"";
                    }
                }

                if (typeof value !== "string") {
                    return "[I18N] INCOMPLETE KEY \"" + key + "\"";
                }

                return mapArguments(value, object, key);
            } else {
                return "[I18N] MISSING " + locale + " LOCALE";
            }
        }


        function ordinate(number) {
            var lang = currentLocale();
            return i18nOrdinate[lang](number);
        }

        return {
            lang: function() {
                return currentLocale();
            },
            t: function(key, args) {
                return translate(key, args);
            },
            o: function(number) {
                return ordinate(number);
            }
        };
    }());
