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
            subject: "(%step%) T�che : %task%",
            content: 'Jecommence mon travail sur la t�che %task% <br/> Salutations <br/>%employeeName%<br/> %job%'
        },
        endOfTaskSwitchToNew: {
            from: "%employeeName%",
            subject: "(%step%) Fin de la t�che : %task%",
            content: 'La t�che "%task%" est termin�e, je passe � la t�che %nextTask% <br/> Salutations <br/>%employeeName%<br/> %job%'
        },
        endOfTaskOtherActivities: {
            from: "%employeeName%",
            subject: "(%step%) Fin de la t�che : %task%",
            content: 'La t�che "%task%" est termin�e. Je retourne � mes activit�s traditionnelles. <br/> Salutations <br/>%employeeName%<br/> %job%'
        },
        blockedByPredecessors: {
            from: "%employeeName%",
            subject: "(%step%) Impossible de progresser sur la t�che : %task%",
            content: 'Je suis cens� travailler sur la t�che "%task%" mais les t�ches pr�cedentes ne sont pas assez avanc�es. <br/> Je retourne donc � mes occupations habituelles. <br/> Salutations <br/>%employeeName%<br/> %job%'
        },
        skillCompleted: {
            from: "%skill%",
            subject: "(%step%) T�che : %task% en partie termin�e",
            content: 'Nous avons termin� la partie %skill% de la t�che %task%. <br/> Salutations'
        },
        notMyWork: {
            from: "%employeeName%",
            subject: "(%step%) Impossible de progresser sur la t�che : %task%",
            content: 'Je suis cens� travailler sur la t�che "%task%" mais je ne suis pas qualifi� pour ce travail. <br /> Salutations <br/>%employeeName%<br/> %job%'
        }
    },
    date: {
        am: "matin",
        pm: "apr�s-midi",
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
            feb: "f�vrier",
            mar: "mars",
            avr: "avril",
            may: "mai",
            jun: "juin",
            jul: "juillet",
            aug: "ao�t",
            sep: "septembre",
            oct: "octobre",
            nov: "novembre",
            dec: "d�cembre"
        },
        formatter: {
            on_date: "le %day% %month%",
            on_weekday: "%day% %ampm%",
            date: "%day% %month%",
            weekday: "%day% %ampm%"
        }
    }
};