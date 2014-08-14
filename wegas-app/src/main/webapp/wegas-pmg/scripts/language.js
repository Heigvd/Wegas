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

var defaultLocale = "fr",
    locale = null,
    i18nTable;




i18nTable = {
    fr : {
        endTaskNextFrom: "%employeeName%",
        endTaskNextSubject: "(%step%) Fin de la tâche : %task%",
        endTaskNextContent: 'La tâche "%task%" est terminée, je passe à la tâche %nextTask% <br/> Salutations <br/>%employeeName%<br/> %job%',

        endTaskNormalFrom: "%employeeName%",
        endTaskNormalSubject: "(%step%) Fin de la tâche : %task%",
        endTaskNormalContent: 'La tâche "%task%" est terminée. Je retourne à mes activités traditionnelles. <br/> Salutations <br/>%employeeName%<br/> %job%',
        
        predTaskFrom: "%employeeName%",
        predTaskSubject: "(%step%) Impossible de progresser sur la tâche : %task%",
        presTaskContent: 'Je suis sensé travailler sur la tâche "%task%" mais les tâches précedentes ne sont pas assez avancées. <br/> Je retourne donc à mes occupations habituel. <br/> Salutations <br/>%employeeName%<br/> %job%',
        
        partFinTaskFrom: "%employeeName%",
        partFinTaskSubject: "(%step%) Tâche : %task% en partie terminée",
        partFinTaskContent: 'Nous avons terminé la partie %work% de la tâche %task%. <br/> Salutations <br/>%employeeName%<br/> %job%',

        qualifTaskFrom: "%employeeName%",
        qualifTaskSubject: "(%step%) Impossible de progresser sur la tâche : %task%",
        qualifTaskContent: 'Je suis censé travailler sur la tâche %task% mais je ne suis pas qualifié pour ce travail. <br/> Salutations <br/>%employeeName%<br/> %job%'
    },
    en: {
    }
};

function setLocale(newLocale){
    locale = newLocale.toLowerCase();
}

/*
 * Take the initial string and replace ALL parameters by theirs argument value 
 * provided by k/v in args object.
 * 
 * All paramters (i.e. identifier [a-zA-Z0-9_] surrounded by two '%' are mandatory
 * 
 */
function mapArguments(string, args, tName) {
    var pattern = /.*%([a-zA-Z0-9_]*)%/,
        match;
    
    while (match = pattern.exec(string)){
        var key = match[1];
        if (args.hasOwnProperty(key)) {
            string = string.replace("%" + key + "%", args[key]);
        } else {
            return "[I18N] MISSING MANDATORY ARGUMENT \"" + key + "\" FOR \"" + tName + "\"";
        }
    }
    return string;
}

/**
 * Return the translation for the key messages, according to current locale
 * 
 * @param {type} key the message identifier
 * @param {type} object contains message arguments to replace {k: value, etc}
 * @returns {String} the translated string filled with provided arguments
 */
function I18n_t(key, object){
    var currentLocale = (locale ? locale : defaultLocale);
    translations = i18nTable[currentLocale];
    if (translations){
        var text = translations[key];
        if (text){
            return mapArguments(text, object, key);
        } else {
            return "[I18N] MISSING " + currentLocale + " translation for \"" + key + "\"";
        }
    } else {
        return "[I18N] MISSING " + currentLocale + " LOCALE";
    }
}