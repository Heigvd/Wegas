/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent <maxence.laurent> <gmail.com>
 */
var i18nOrdinate = (function(module) {
    return module;
}(i18nOrdinate || {})),
    i18nTable = (function(module) {
        return module;
    }(i18nTable || {}));
/* 
 * REGEX
 * Accent detection : [^\w\s\d\{\}\[\],.%\*\/\(\)<>@.:\"\\=;|\'-+&#]
 * 
 */
i18nTable.fr = {
    messages: {
        startOnTask: {
            from: "%employeeName%",
            subject: "Début de la tâche \"%task%\"",
            content: "Bonjour, <br /><br />J'ai commencé mon travail sur la tâche \"%task%\" %step%.<br /><br />Salutations<br />%employeeName%<br/> %job%"
        },
        startOnTask_grouped: {
            from: "%employeeName%",
            subject: "Début de la tâche \"%task%\"",
            content: "Bonjour, <br /><br />%others% et moi avons commencé notre travail sur la tâche \"%task%\" %step%.<br /><br />Salutations<br />%employeeName%<br/> %job%"
        },
        endOfTaskOtherActivities: {
            from: "%employeeName%",
            subject: "Fin de la tâche \"%task%\"",
            content: "Bonjour, <br /><br />La tâche \"%task%\" est terminée. <br /><br />Je suis retourné à mes activités traditionnelles %step%. <br /><br /> Salutations <br />%employeeName%<br/> %job%"
        },
        endOfTaskOtherActivities_grouped: {
            from: "%employeeName%",
            subject: "Fin de la tâche \"%task%\"",
            content: "Bonjour, <br /><br />La tâche \"%task%\" est terminée. <br /><br />%others% et moi sommes retournés à nos activités traditionnelles %step%. <br /><br /> Salutations <br />%employeeName%<br/> %job%"
        },
        blockedByPredecessors: {
            from: "%employeeName%",
            subject: "Pas encore possible de progresser sur \"%task%\"",
            content: "Bonjour, <br /><br />Je suis venu %step% pour travailler sur la tâche \"%task%\" mais les tâches précédentes ne sont pas assez avancées. <br /><br /> J'ai perdu un peu de temps, mais je devrais rapidement trouver quelque chose à faire sur le projet. <br /><br /> Salutations <br/>%employeeName%<br/> %job%"
        },
        blockedByPredecessors_grouped: {
            from: "%employeeName%",
            subject: "Pas encore possible de progresser sur \"%task%\"",
            content: "Bonjour, <br /><br />%others% et moi sommes venus %step% pour travailler sur la tâche \"%task%\" mais les tâches précédentes ne sont pas assez avancées. <br /><br /> Nous avons perdu un peu de temps, mais nous devrions rapidement trouver quelque chose à faire sur le projet. <br /><br /> Salutations <br/>%employeeName%<br/> %job%"
        },
        notMyWork: {
            from: "%employeeName%",
            subject: "Pas qualifié pour \"%task%\"",
            content: "Bonjour, <br /><br />Je suis venu %step% pour travailler sur la tâche \"%task%\" mais je ne suis pas qualifié pour ce travail. <br /><br />J'ai perdu un peu de temps et j'ai retiré cette tâche de ma liste.<br /><br /> Salutations <br/>%employeeName%<br /> %job%"
        },
        notMyWork_grouped: {
            from: "%employeeName%",
            subject: "Pas qualifiés pour \"%task%\"",
            content: "Bonjour, <br /><br />%others% et moi sommes venus %step% pour travailler sur la tâche \"%task%\" mais nous ne sommes pas qualifiés pour ce travail. <br /><br />Nous avons perdu un peu de temps et avons retiré cette tâche de nos listes.<br /><br /> Salutations <br/>%employeeName%<br /> %job%"
        },
        skillCompleted: {
            from: "%employeeName%",
            subject: "Travail terminé sur la tâche \"%task%\"",
            content: "Bonjour, <br /><br />Le travail de \"%job%\" est terminé pour la tâche \"%task%\" depuis  %step%.<br /><br /> Salutations <br/>%employeeName%<br /> %job%"
        },
        skillCompleted_grouped: {
            from: "%employeeName%",
            subject: "Travail terminé sur la tâche \"%task%\"",
            content: "Bonjour, <br /><br />%others% et moi avons terminé le travail de \"%job%\" pour la tâche \"%task%\" depuis  %step%.<br /><br /> Salutations <br/>%employeeName%<br /> %job%"
        },
        endOfTaskSwitchToNew: {
            from: "%employeeName%",
            subject: "Fin de la tâche \"%task%\"",
            content: "Bonjour, <br /><br />La tâche \"%task%\" est terminée. <br /><br />Depuis %step%, je travaille sur la tâche \"%nextTask%\".<br/> <br />Salutations <br />%employeeName%<br /> %job%"
        },
        endOfTaskSwitchToNew_grouped: {
            from: "%employeeName%",
            subject: "Fin de la tâche \"%task%\"",
            content: "Bonjour, <br /><br />La tâche \"%task%\" est terminée. <br /><br />Depuis %step%, %others% et moi travaillons sur la tâche \"%nextTask%\".<br/> <br />Salutations <br />%employeeName%<br /> %job%"
        },
        planningProblem: {// Individual
            from: "%employeeName%",
            subject: "Problème de planification",
            content: "Bonjour, <br /><br />Vous m'avez réservé pour %wholePeriod%. Comme je n'avais aucune tâche à effectuer sur le projet, je suis retourné à mes autres activités. Malheureusement, je suis obligé d'affecter quelques heures au projet. <br /><br /> Salutations <br />%employeeName%<br/> %job%"
        },
        endOfTask: {
            from: "Suivi de projet",
            subject: "Fin de la tâche \"%task%\"",
            content: "Bonjour, <br /> <br /> Nous vous informons que la tâche \"%task%\" a été terminée %step%. <br /><br />Salutations"
        }
    },
    date: {
        am: "matin",
        pm: "après-midi",
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
            month2: "février",
            month3: "mars",
            month4: "avril",
            month5: "mai",
            month6: "juin",
            month7: "juillet",
            month8: "août",
            month9: "septembre",
            month10: "octobre",
            month11: "novembre",
            month12: "décembre"
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
    question: {
        question: "Question",
        action: "Action"
    }
};
i18nOrdinate.fr = function(number) {
    "use strict";
    switch (number) {
        case 1:
            return number + "er";
        default:
            return number + "ème";
    }
};