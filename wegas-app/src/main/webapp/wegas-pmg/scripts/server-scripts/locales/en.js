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

i18nTable.en = {
    messages: {
        startOnTask: {
            from: "%employeeName%",
            subject: "Task \"%task%\" began",
            content: "Hello, <br /><br />I've started to work on the task \"%task%\" on %step%.<br/> <br />Regards <br/>%employeeName%<br/> %job%"
        },
        startOnTask_grouped: {
            from: "%employeeName%",
            subject: "Task \"%task%\" began",
            content: "Hello, <br /><br />%others% and I have started to work on the task \"%task%\" on %step%.<br/> <br />Regards <br/>%employeeName%<br/> %job%"
        },
        endOfTaskOtherActivities: {
            from: "%employeeName%",
            subject: "Task \"%task%\" completed",
            content: "Hello <br /><br />I finished working on task \"%task%\". <br /><br />As I can't work on another task of the project, I've gone back to my others activities since %step%.<br /> <br />Regards<br />%employeeName% <br /> %job%"
        },
        endOfTaskOtherActivities_grouped: {
            from: "%employeeName%",
            subject: "Task \"%task%\" completed",
            content: "Hello <br /><br />%others% and I finished working on task \"%task%\". <br /><br />As we can't work on another task of the project, we've gone back to our others activities since %step%.<br /> <br />Regards<br />%employeeName% <br /> %job%"
        },
        blockedByPredecessors: {
            from: "%employeeName%",
            subject: "Unable to work yet on task \"%task%\"",
            content: "I came to work on task \"%task%\" on %step% but it wasn't possible at this time. <br /><br />I will recontact you as soon as I will have found some work . <br /> <br />Regards<br />%employeeName% <br /> %job%"
        },
        blockedByPredecessors_grouped: {
            from: "%employeeName%",
            subject: "Unable to work yet on task \"%task%\"",
            content: "%others% and I came to work on task \"%task%\" on %step% but it wasn't possible at this time. <br /><br />We will recontact you as soon as we will have found some work . <br /> <br />Regards<br />%employeeName% <br /> %job%"
        },
        notMyWork: {
            from: "%employeeName%",
            subject: "Not qualified for \"%task%\"",
            content: "I came to work on task \"%task%\" on %step% but I'm not qualified for this job. <br /><br />I will recontact you as soon as I will have found some work . <br /> <br />Regards<br />%employeeName% <br /> %job%"
        },
        notMyWork_grouped: {
            from: "%employeeName%",
            subject: "Not qualified for \"%task%\"",
            content: "%others% and I came to work on task \"%task%\" on %step% but we're not qualified for this job. <br /><br />We will recontact you as soon as we will have found some work . <br /> <br />Regards<br />%employeeName% <br /> %job%"
        },
        skillCompleted: {
            from: "%employeeName%",
            subject: "Work done on task \"%task%\"",
            content: "The \"%job%\" part is completed for task \"%task%\" since %step%.<br /><br /> Salutations <br/>%employeeName%<br /> %job%"
        },
        skillCompleted_grouped: {
            from: "%employeeName%",
            subject: "Work done on task \"%task%\"",
            content: "%others% and I finished the \"job\" part on task \"%task%\" since %step%.<br /><br /> Salutations <br/>%employeeName%<br /> %job%"
        },
        endOfTaskSwitchToNew: {
            from: "%employeeName%",
            subject: "Task \"%task%\" completed",
            content: "Hello <br /><br />I hereby inform you that I finished working on task \"%task%\" and started working on task \"%nextTask%\" since %step%. <br /> <br />Regards<br />%employeeName% <br /> %job%"
        },
        endOfTaskSwitchToNew_grouped: {
            from: "%employeeName%",
            subject: "Task \"%task%\" completed",
            content: "Hello <br /><br />I hereby inform you that %others% and I finished working on task \"%task%\" and started working on task \"%nextTask%\" since %step%. <br /> <br />Regards<br />%employeeName% <br /> %job%"
        },
        planningProblem: {
            from: "%employeeName%",
            subject: "Planning Problem",
            content: "Hello, <br /><br /> You had booked me %wholePeriod%. As I didn't have any task to do on the project, I got back to my activities. Unfortunatly, I have to charge few hours to the project. <br /><br />Regards<br />%employeeName% <br /> %job%"
        },
        endOfTask: {
            from: "Project Tracking",
            subject: "Task \"%task%\" completed",
            content: "Hello, <br /> <br /> We inform you that task \"%task%\" has been completed on %step% <br /><br />Regards"
        },
        manual: {
            from: "Project Tracking",
            subject: "Manual for \"%phase%\" phase",
            content: "You'll find <a target=\"_blank\" href=\"%href%\">here</a> the manual for the \"%phase%\" phase"
        }
    },
    date: {
        am: "morning",
        pm: "afternoon",
        weekday: {
            day1: "monday",
            day2: "thuesday",
            day3: "wednesday",
            day4: "thursday",
            day5: "friday",
            day6: "saturday",
            day7: "sunday"
        },
        month: {
            month1: "january",
            month2: "february",
            month3: "march",
            month4: "april",
            month5: "may",
            month6: "june",
            month7: "july",
            month8: "august",
            month9: "september",
            month10: "october",
            month11: "november",
            month12: "december"
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
    question: {
        question: "Question",
        action: "Action"
    }
};

i18nOrdinate.en = function(number) {
    "use strict";
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
};