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
var i18nTable_en = {
    messages: {
        startOnTask: {
            from: "%employeeName%",
            subject: "(%step%) Task : %task%",
            content: "I've started to work on the task %task% on %step%.<br/> Regards <br/>%employeeName%<br/> %job%"
        },
        endOfTaskSwitchToNew: {
            from: "%employeeName%",
            subject: "(%step%) Task %task% completed",
            content: "Hello <br /><br />I hereby inform you that I finished working on task \"%task%\", and started working on task \"%nextTask%\". <br /> <br />Regards<br />%employeeName%"
        },
        endOfTaskOtherActivities: {
            from: "%employeeName%",
            subject: "(%step%) Task %task% completed",
            contentOld: 'La tâche "%task%" est terminée. Je retourne à mes activités traditionnelles. <br/> Salutations <br/>%employeeName%<br/> %job%',
            content: "Hello <br /><br />I finished working on task \"%task%\". As I can't work on another task of the project, I go back to my others activities <br /> <br />Regards<br />%employeeName%"
        },
        blockedByPredecessors: {
            from: "%employeeName%",
            subject: "(%step%) Unable to work on task \"%task%\"",
            content: "I came to work on task %task% on %step% but it wasn't possible at this time. I will recontact you as soon as I will have found some work . <br /> <br />Regards<br />%employeeName%"
        },
        skillCompleted: {
            from: "%skill%",
            subject: "(%step%) Task : %task% partialy completed",
            content: 'Nous avons terminé la partie %skill% de la tâche %task%. <br/> Salutations'
        },
        notMyWork: {
            from: "%employeeName%",
            subject: "(%step%) Unable to work on task \"%task%\"",
            content: "I came to work on task %task% on %step% but I'm not qualified for this job. I will recontact you as soon as I will have found some work . <br /> <br />Regards<br />%employeeName%"
        }
    },
    date: {
        am: "morning",
        pm: "afternoon",
        weekday: {
            mon: "monday",
            tue: "thuesday",
            wed: "wednesday",
            thu: "thursday",
            fri: "friday",
            sat: "saturday",
            sun: "sunday"
        },
        month: {
            jan: "january",
            feb: "february",
            mar: "march",
            avr: "april",
            may: "may",
            jun: "june",
            jul: "july",
            aug: "august",
            sep: "september",
            oct: "october",
            nov: "november",
            dec: "december"
        },
        formatter: {
            on_date: "on %day% %month%",
            on_weekday: "%day% %ampm%",
            date: "%day% %month%",
            weekday: "%day% %ampm%"
        }
    }
};