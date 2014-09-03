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

i18nTable.fr = {
    messages: {
        startOnTask: {
            from: "%employeeName%",
            subject: "Tâche : %task%",
            content: "J'ai commencé mon travail sur la tâche %task% %step%<br/> Salutations <br/>%employeeName%<br/> %job%"
        },
        endOfTaskSwitchToNew: {
            from: "%employeeName%",
            subject: "Fin de la tâche : %task%",
            content: 'La tâche "%task%" est terminée depuis %step%, je passe à la tâche %nextTask% <br/> Salutations <br/>%employeeName%<br/> %job%'
        },
        endOfTaskOtherActivities: {
            from: "%employeeName%",
            subject: "Fin de la tâche : %task%",
            content: 'La tâche "%task%" est terminée depuis %step%. Je retourne à mes activités traditionnelles. <br/> Salutations <br/>%employeeName%<br/> %job%'
        },
        blockedByPredecessors: {
            from: "%employeeName%",
            subject: "Impossible de progresser sur la tâche : %task%",
            content: 'Je suis venu %step% pour travailler sur la tâche "%task%" mais les tâches précedentes ne sont pas assez avancées. <br/> Je retourne donc à mes occupations habituelles. <br/> Salutations <br/>%employeeName%<br/> %job%'
        },
        skillCompleted: {
            from: "%skill%",
            subject: "Tâche : %task% en partie terminée",
            content: 'Nous avons terminé la partie %skill% de la tâche %task% %step%. <br/> Salutations'
        },
        notMyWork: {
            from: "%employeeName%",
            subject: "Impossible de progresser sur la tâche : %task%",
            content: 'Je suis venu %step% pour travailler sur la tâche "%task%" mais je ne suis pas qualifié pour ce travail. <br /> Salutations <br/>%employeeName%<br/> %job%'
        },
        planningProblem: {
            from: "%employeeName%",
            subject: "Problème de planification",
            content: "Bonjour, <br><br> Vous m'avez réservé pour %wholePeriod%. Comme je n'avais aucune tâche à effectuer sur le projet, je suis retourné à mes autres activités. Malheureusement je suis obligé d'affecter quelques heures au projet. <br /> Salutations <br/>%employeeName%<br/> %job%"
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
            jul: "juillet",
            aug: "août",
            sep: "septembre",
            oct: "octobre",
            nov: "novembre",
            dec: "décembre"
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
        phase3: "Réalisation",
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
            return number + "ème";
    }
});