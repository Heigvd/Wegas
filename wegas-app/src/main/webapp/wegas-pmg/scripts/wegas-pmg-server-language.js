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
    i18nTable = {
        fr: {
            specialChars : "éàæ ???????",
            messages: {
                startOnTask: {
                    from: "%employeeName%",
                    subject: "(%step%) Tâche : %task%",
                    content: 'Je passe commence mon travail sur la tâche %task% <br/> Salutations <br/>%employeeName%<br/> %job%'
                },
                endOfTaskSwitchToNew: {
                    from: "%employeeName%",
                    subject: "(%step%) Fin de la tâche : %task%",
                    content: 'La tâche "%task%" est terminée, je passe à la tâche %nextTask% <br/> Salutations <br/>%employeeName%<br/> %job%'
                },
                endOfTaskOtherActivities: {
                    from: "%employeeName%",
                    subject: "(%step%) Fin de la tâche : %task%",
                    content: 'La tâche "%task%" est terminée. Je retourne à mes activités traditionnelles. <br/> Salutations <br/>%employeeName%<br/> %job%'
                },
                blockedByPredecessors: {
                    from: "%employeeName%",
                    subject: "(%step%) Impossible de progresser sur la tâche : %task%",
                    content: 'Je suis censé travailler sur la tâche "%task%" mais les tâches précedentes ne sont pas assez avancées. <br/> Je retourne donc à mes occupations habituelles. <br/> Salutations <br/>%employeeName%<br/> %job%'
                },
                skillCompleted: {
                    from: "%skill%",
                    subject: "(%step%) Tâche : %task% en partie terminée",
                    content: 'Nous avons terminé la partie %skill% de la tâche %task%. <br/> Salutations'
                },
                notMyWork: {
                    from: "%employeeName%",
                    subject: "(%step%) Impossible de progresser sur la tâche : %task%",
                    content: 'Je suis censé travailler sur la tâche "%task%" mais je ne suis pas qualifié pour ce travail. <br /> Salutations <br/>%employeeName%<br/> %job%'
                },
                incoherentPlanning: {
                    from: "%employeeName%",
                    subject: "(%step%) : Tâche %task%",
                    content: "Bonjour, <br /><br /> Je suis venu %step% pour travailler sur la tâche \"%task%\" mais cela n'était pas possible à ce moment. <br /> J'ai perdu un peu de temps, mais je devrais trouver autre chose à faire en attendant. Je vous recontacte dès que j'ai trouvé du travail."
                }
            },
            date: {
                am: "matin",
                pm: "après-midi",
                weekday: {
                    mon: "lundi",
                    tue: "mardi",
                    wed: "mercredi",
                    thu: "jeudi",
                    fri: "vendredi",
                    sat: "samedi",
                    sun: "dimanche"
                },
                month: {
                    jan: "janvier",
                    feb: "février",
                    mar: "mars",
                    avr: "avril",
                    may: "mai",
                    jun: "juin",
                    jul: "juiller",
                    aug: "août",
                    sep: "septembre",
                    oct: "octobre",
                    nov: "novembre",
                    dec: "décembre"
                },
                formatter: {
                    on_date: "le %day% %month%",
                    on_weekday: "%day% %ampm%",
                    date: "%day% %month%",
                    weekday: "%day% %ampm%"
                }
            }
        },
        en: {
        }};

function setLocale(newLocale) {
    locale = newLocale.toLowerCase();
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
    return (locale ? locale : defaultLocale);
}
/**
 * Return the translation for the key messages, according to current locale
 * 
 * @param {type} key the message identifier
 * @param {type} object contains message arguments to replace {k: value, etc}
 * @returns {String} the translated string filled with provided arguments
 */
function I18n_t(key, object) {
    var value = i18nTable[currentLocale()];
    if (value) {
        var res = key.split("."),
            i;
        for (i = 0; i < res.length; i++) {
            value = value[res[i]];
            if (!value) {
                return "[I18N] MISSING " + currentLocale() + " translation for \"" + key + "\"";
            }
        }

        if (typeof value !== "string") {
            return "[I18N] INCOMPLETE KEY \"" + key + "\"";
        }

        return mapArguments(value, object, key);
    } else {
        return "[I18N] MISSING " + currentLocale() + " LOCALE";
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