/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
/*global Variable, gameModel, self */

YUI.add("wegas-i18n", function(Y) {
    "use strict";

    var I18n;

    I18n = (function() {

        var config = {
            fr: {
                capitalize: function() {
                    return this.slice(0, 1).toUpperCase() + this.slice(1);
                },
                colonize: function() {
                    return this + " :";
                },
                pluralize: function() {
                    return this + "s"; // mostly...
                }
            },
            en: {
                capitalize: function() {
                    return this.slice(0, 1).toUpperCase() + this.slice(1);
                },
                colonize: function() {
                    return this + ":";
                },
                pluralize: function() {
                    return this + "s";
                }
            }
        };
        /**
         * String extension with additional methods
         * to transform given string
         *
         * @constructor I18nString
         * @extends String
         * @param String str the given string
         */
        function I18nString(str) {
            this.value = str;
        }
        I18nString.prototype = new String();
        I18nString.prototype.toString = function() {
            return "" + this.value
        }
        I18nString.prototype.valueOf = I18nString.prototype.toString
        /**
         * Capitalize sentence's first letter.
         * Uppercase first letter, language dependant
         */
        I18nString.prototype.capitalize = function() {
            this.value = config[currentLocale()].capitalize.call(this.value)
            return this;
        }
        /**
         * Colonize sentence, append ":" to it, language dependant
         */
        I18nString.prototype.colonize = function() {
            this.value = config[currentLocale()].colonize.call(this.value)
            return this;
        }
        /**
         * Pluralize sentence's last word, language dependant.
         */
        I18nString.prototype.pluralize = function() {
            this.value = config[currentLocale()].pluralize.call(this.value)
            return this;
        }
        /*
         * Take the initial string and replace ALL parameters by theirs argument value
         * provided by k/v in args object.
         *
         * All paramters (i.e. identifier [a-zA-Z0-9_] surrounded by '{{' and '}}') are mandatory
         *
         */
        function mapArguments(str, args, tName) {
            var pattern = /.*\{\{([a-zA-Z0-9_]*)\}\}/,
                match, key;
            while (match = pattern.exec(str)) {
                key = match[1];
                if (args && args.hasOwnProperty(key)) {
                    str = str.replace("{{" + key + "}}", args[key]);
                } else {
                    return "[I18N] MISSING MANDATORY ARGUMENT \"" + key + "\" FOR \"" + tName + "\"";
                }
            }
            // return new I18nString(str);
            return str;
        }


        function currentLocale() {
            return Y.Wegas.I18n._currentLocale;
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
                value = Y.Wegas.I18n._tables[locale],
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

        function add(module, lang, table) {
            var currentTable;
            Y.Wegas.I18n._modules[module] = true;
            currentTable = Y.Wegas.I18n._tables[lang] || {};
            Y.Wegas.I18n._tables[lang] = Y.merge(currentTable, table);
        }

        function isObject(item) {
            return (item && typeof item === 'object' && !Array.isArray(item));
        }

        function mergeDeep(target, source) {
            if (isObject(target) && isObject(source)) {
                for (var key in source) {
                    if (isObject(source[key])) {
                        if (!target[key]) {
                            var empty = {};
                            empty[key] = {};
                            Object.assign(target, empty);
                        }
                        mergeDeep(target[key], source[key]);
                    } else {
                        var empty = {};
                        empty[key] = source[key];
                        Object.assign(target, empty);
                    }
                }
            }
        }

        /*
        ** Merges an existing table with the given new table, without deleting any existing keys, only inserting or
        ** modifying keys from the given table.
         */
        function update(module, lang, table) {
            var currentTable;
            Y.Wegas.I18n._modules[module] = true;
            currentTable = Y.Wegas.I18n._tables[lang] || {};
            mergeDeep(currentTable, table);
        }

        function setLang(lang) {
            var module,
                deps = [];
            for (module in Y.Wegas.I18n._modules) {
                deps.push(module + "-" + lang);
            }
            Y.use(deps, function(Y) {
                Y.Wegas.I18n._currentLocale = lang;
                String.prototype.capitalize = config[lang].capitalize; // don't
                String.prototype.colonize = config[lang].colonize; // don't
                String.prototype.pluralize = config[lang].pluralize; // don't
            });
        }

        return {
            /**
             *  {"lang" : { "token" : { "token" : "translation"}}
             */
            _tables: {},
            _modules: {},
            _currentLocale: undefined,
            _currentTable: function() {
                return Y.Wegas.I18n._tables[Y.Wegas.I18n._currentLocale];
            },
            register: function(module, lang, table) {
                add(module, lang, table);
            },
            update: function(module, lang, table) {
                update(module, lang, table);
            },
            lang: function() {
                return currentLocale();
            },
            setLang: setLang,
            t: function(key, args) {
                return translate(key, args);
            }
        };
    }());

    Y.config.win.I18n = I18n; // @hack -> let I18n module be accessible from the outside
    Y.Wegas.I18n = I18n;
    I18n.setLang("en");

});
