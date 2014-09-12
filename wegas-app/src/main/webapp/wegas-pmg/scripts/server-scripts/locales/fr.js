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
 */
var i18nOrdinate = (function(module) { return module;}(i18nOrdinate || {})),
    i18nTable = (function(module) { return module;}(i18nTable || {}));



/* 
 * REGEX
 * Accent detection : [^\w\s\d\{\}\[\],.%\*\/\(\)<>@.:\"\\=;|\'-+]
 * 
 */
i18nTable.fr = {
    messages: {
        startOnTask: {
            from: "%employeeName%",
            subject: "T&#226che: %task%",
            content: "J'ai commenc&#233 mon travail sur la t&#226che \"%task%\" %step%<br/> Salutations <br /><br/>%employeeName%<br/> %job%"
        },
        endOfTask: {
            from: "Suivi de projet",
            subject: "T&#226che %task%",
            content: "Bonjour, <br /> <br /> Nous vous informons que la t&#226che \"%task%\" a &#233t&#233 termin&#233e %step%"
        },
        endOfTaskSwitchToNew: {
            from: "%employeeName%",
            subject: "Fin de la t&#226che: %task%",
            content: "La t&#226che \"%task%\" est termin&#233e. Depuis %step%, je travaille sur la t&#226che \"%nextTask%\".<br/> Salutations <br/ ><br />%employeeName%<br /> %job%"
        },
        endOfTaskOtherActivities: {
            from: "%employeeName%",
            subject: "Fin de la t&#226che: %task%",
            content: "La t&#226che \"%task%\" est termin&#233e. Je suis retourn&#233 &#224 mes activit&#233s traditionnelles depuis %step%. <br/> Salutations <br /><br/>%employeeName%<br/> %job%"
        },
        blockedByPredecessors: {
            from: "%employeeName%",
            subject: "Impossible de progresser sur la t&#226che: %task%",
            content: "Je suis venu %step% pour travailler sur la t&#226che \"%task%\" mais les t&#226ches pr&#233c&#233dentes ne sont pas assez avanc&#233es. <br/> J' ai perdu un peu de temps, mais je devrais rapidement trouver quelque chose &#224 faire sur le projet. <br/> Salutations <br /><br/>%employeeName%<br/> %job%"
        },
        skillCompleted: {
            from: "%skill%",
            subject: "T&#226che: %task% en partie termin&#233e",
            content: "Nous avons termin&#233 la partie %skill% de la t&#226che \"%task% \"%step%. <br /><br/> Salutations"
        },
        notMyWork: {
            from: "%employeeName%",
            subject: "Impossible de progresser sur la t&#226che: %task%",
            content: "Je suis venu %step% pour travailler sur la t&#226che \"%task%\" mais je ne suis pas qualifi&#233 pour ce travail. <br /><br /> Salutations <br/>%employeeName%<br/> %job%"
        },
        planningProblem: {
            from: "%employeeName%",
            subject: "Probl&eacute;e de planification",
            content: "Bonjour, <br><br> Vous m'avez r&#233serv&#233 pour %wholePeriod%. Comme je n'avais aucune t&#226che &#224 effectuer sur le projet, je suis retourn&#233 &#224 mes autres activit&#233s. Malheureusement je suis oblig&#233 d'affecter quelques heures au projet. <br /> Salutations <br /><br/>%employeeName%<br/> %job%"
        }
    },
    date: {
        am: "matin",
        pm: "apr&#232s-midi",
        weekday: {
            day1: "lundi",
            day2: "mardi",
            day3: "mercredi",
            day4: "jeudi",
            day5: "vendredi",
            day6: "samedi",
            day7: "dimanche"
        },
        month: {
            month1: "janvier",
            month2: "f&#233vrier",
            month3: "mars",
            month4: "avril",
            month5: "mai",
            month6: "juin",
            month7: "juillet",
            month8: "ao&#251t",
            month9: "septembre",
            month10: "octobre",
            month11: "novembre",
            month12: "d&#233cembre"
        },
        formatter: {
            onDate: "le %day% %month%",
            onWeekday: "%day% %ampm%",
            date: "le %day% %month%",
            weekday: "%day% %ampm%",
            wholeMonth: "tout le mois",
            wholeWeek: "toute la semaine"
        }
    },
    phase: {
        phase1: "Initiation",
        phase2: "Planification",
        phase3: "R&#233alisation",
        phase4: "Terminaison"
    },
    question: {
        question: "Question",
        action: "Action"
    }
};

i18nOrdinate.fr = (function(number) {
    switch (number) {
        case 1:
            return number + "er";
        default:
            return number + "&#232me";
    }
});
