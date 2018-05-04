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
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

/*global Variable, gameModel, self */
var i18nOrdinate = (function(module) {
    return module;
}(i18nOrdinate || {})),
    i18nTable = (function(module) {
        return module;
    }(i18nTable || {})),
    I18n = (function() {
        "use strict";

        function add(lang, table) {
            if (!i18nTable[lang]) {
                i18nTable[lang] = {};
            }
            mergeDeep(i18nTable[lang], table);
        }

        function isObject(item) {
            return (item && typeof item === 'object' && !Array.isArray(item));
        }

        function mergeDeep(target, source) {
            if (isObject(target) && isObject(source)) {
                for (var key in source) {
                    if (isObject(source[key])) {
                        if (!target[key]) {
                            target[key] = {};
                        }
                        mergeDeep(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        }

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


        function foreach(callback, mode) {
            mode = mode || "match";

            var lang, refName, count = 0;
            if (mode === "internal" || mode === "match") {
                for (lang in i18nTable) {
                    if (i18nTable.hasOwnProperty(lang)) {
                        refName = getRefNameByCode(lang);
                        if (refName || mode === "internal") {
                            callback(refName, lang);
                            count++;
                        }
                    }
                }
            } else {
                // ie mode === gamemodel
                for (lang in self.getGameModel().getLanguages) {
                    callback(lang.getRefName(), lang.getCode());
                    count++;
                }
            }

            if (!count) {
                callback("def", currentLocale());
                count++;
            }
        }

        /**
         * 
         * @param {type} code
         * @returns {unresolved}
         */
        function getRefNameByCode(code) {
            var lang = self.getGameModel().getLanguageByCode(code);
            if (lang) {
                return lang.getRefName();
            }
            return null;
        }

        /**
         * Guess language to use, according to player preference and available languages
         * @param {type} refName
         * @returns {undefined|i18nTable|wegas-server-i18nI18n.currentLocale.gmCodes|String}
         */
        function currentLocale(refName) {
            var locale, i,
                gmCodes = self.getGameModel().getPreferredLanguagesCode(refName || self.getRefName());

            for (i in gmCodes) {
                if (i18nTable[gmCodes[i]]) {
                    return gmCodes[i];
                }
            }

            if (!locale) {
                // fallback is english or the first available
                if (i18nTable["en"]) {
                    return "en";
                }
                for (i in i18nTable) {
                    if (i18nTable.hasOwnProperty(i)) {
                        // fallback = first lang
                        return i;
                    }
                }
            }
            return undefined;
        }

        /**
         * Return the translation for the key messages, according to current locale
         * 
         * @param {type} key the message identifier
         * @param {type} object contains message arguments to replace {k: value, etc}
         * @param {string} refName translate to this language, if null, undefined or empty, use the currentLocale
         * @returns {String} the translated string filled with provided arguments
         */
        function translate(key, object, refName) {
            if (typeof key === "string") {
                return translateKey(key, object, refName);
            } else {
                return translateObject(key, object, refName);
            }
        }

        function translateKey(key, object, refName) {
            var locale = currentLocale(refName), value, res, i,
                value = i18nTable[locale];
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

        function translateObject(trContent, config, refName) {
            if (refName) {
                return trContent.translateOrEmpty(self.getGameModel(), refName);
            } else {
                return trContent.translateOrEmpty(self);
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
            t: function(key, args, lang) {
                return translate(key, args, lang);
            },
            o: function(number) {
                return ordinate(number);
            },
            add: function(lang, table) {
                return add(lang, table);
            },
            buildNewTranslation: function() {
                return {
                    "@class": "TranslatableContent",
                    "translations": {
                    }
                };
            },
            /**
             * Call callback for each available languages.
             * 
             * 
             * callback parameters:
             *  * language refName;
             *  * language code:
             *  
             *  mode may be "gameModel", "internal", or "match":
             *   gamemodel: call callback for all gamemodel languages (refName and code are defined)
             *   internal: call callback for internal languages only (the ones in i18nTable, code is defined but refName is not)
             *   match: call callback for langauges which are defined in both set, this is the default setting
             *   
             *   fallback : call def / first language in i18nTable
             *  
             * @param {type} callback
             */
            foreach: function(callback, mode) {
                return foreach(callback, mode);
            }
        };
    }());
