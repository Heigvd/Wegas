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
var i18nTable_fr = {
    messages: {
        startOnTask: {
            from: "%employeeName%",
            subject: "(%step%) Tâche : %task%",
            content: 'Jecommence mon travail sur la tâche %task% <br/> Salutations <br/>%employeeName%<br/> %job%'
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
            on_date: "le %day% %month%",
            on_weekday: "%day% %ampm%",
            date: "%day% %month%",
            weekday: "%day% %ampm%"
        }
    }
};