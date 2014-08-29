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

i18nTable.en = {
    messages: {
        startOnTask: {
            from: "%employeeName%",
            subject: "Task : %task%",
            content: "I've started to work on the task %task% on %step%.<br/> Regards <br/>%employeeName%<br/> %job%"
        },
        endOfTaskSwitchToNew: {
            from: "%employeeName%",
            subject: "Task %task% completed",
            content: "Hello <br /><br />I hereby inform you that since %step% I finished working on task \"%task%\", and started working on task \"%nextTask%\". <br /> <br />Regards<br />%employeeName%"
        },
        endOfTaskOtherActivities: {
            from: "%employeeName%",
            subject: "Task %task% completed",
            content: "Hello <br /><br />I finished working on task \"%task%\" in %step%. As I can't work on another task of the project, I go back to my others activities <br /> <br />Regards<br />%employeeName%"
        },
        blockedByPredecessors: {
            from: "%employeeName%",
            subject: "(%step%) Unable to work on task \"%task%\"",
            content: "I came to work on task %task% on %step% but it wasn't possible at this time. I will recontact you as soon as I will have found some work . <br /> <br />Regards<br />%employeeName%"
        },
        skillCompleted: {
            from: "%skill%",
            subject: "Task : %task% partialy completed",
            content: "The %skill% part of the task \"%task%\" has been completed on %step%. <br />Regards"
        },
        notMyWork: {
            from: "%employeeName%",
            subject: "Unable to work on task \"%task%\"",
            content: "I came to work on task %task% on %step% but I'm not qualified for this job. I will recontact you as soon as I will have found some work . <br /> <br />Regards<br />%employeeName%"
        },
        planningProblem: {
            from: "%employeeName%",
            subject: "Planning Problem",
            content: "Hello, <br><br> You had booked me %wholePeriod%. As I didn't have any task to do on the project, I got back to my activities. Unfortunatly, I have to charge few hours to the project. <br />Regards<br />%employeeName%"
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
            onDate: "on %day% %month%",
            onWeekday: "%day% %ampm%",
            date: "%month% %day%",
            weekday: "%day% %ampm%",
            wholeMonth: "the whole month",
            wholeWeek: "the whole week"
        }
    },
    phase: {
        phase1: "Initiation",
        phase2: "Planning",
        phase3: "Execution",
        phase4: "Closing"
    },
    question: {
        question: "Question",
        action: "Action"
    }
};

i18nOrdinate.en = (function(number) {
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
});