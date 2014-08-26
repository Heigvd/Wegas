/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */


/**
 * 
 * @param {type} locale 
 * @returns {unresolved} 
 */
function getI18nTable(locale) {
    if (locale == "fr") {
        return i18nTable_fr;
    } else if (locale == "en") {
        return i18nTable_en;
    } else {
        return null;
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
        match;
    while (match = pattern.exec(string)) {
        var key = match[1];
        if (args && args.hasOwnProperty(key)) {
            string = string.replace("%" + key + "%", args[key]);
        } else {
            return "[I18N] MISSING MANDATORY ARGUMENT \"" + key + "\" FOR \"" + tName + "\"";
        }
    }
    return string;
}


function currentLocale() {
    return Variable.findByName(gameModel, "language").getValue(self);
}
/**
 * Return the translation for the key messages, according to current locale
 * 
 * @param {type} key the message identifier
 * @param {type} object contains message arguments to replace {k: value, etc}
 * @returns {String} the translated string filled with provided arguments
 */
function I18n_t(key, object) {
    var locale = currentLocale(),
        value = getI18nTable(locale);
    if (value) {
        var res = key.split("."),
            i;
        for (i = 0; i < res.length; i++) {
            value = value[res[i]];
            if (!value) {
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

function I18n_ordinate(number) {
    var lang = currentLocale();
    if (lang == "fr") {
        switch (number) {
            case 1:
                return number + "er";
            default:
                return number + "ème";
        }
    } else if (lang == "en") {
        switch (number) {
            case 1:
                return number + "st";
            case 2:
                return number + "nd";
            case 3:
                return number + "rd";
            default:
                return number + "th";
        }
    }
    return number;
}