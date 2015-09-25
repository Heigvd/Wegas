
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
/*global YUI*/

YUI.add("wegas-i18n-pmg-en", function(Y) {
    Y.Wegas.I18n.register("en", {
        pmg: {
            navigation: {
                thisWeek: "this week",
                thisMonth: "this month",
                home: "home",
                project: "project",
                tasks: "tasks",
                gantt: "gantt",
                resources: "resources",
                evm: "evm",
                iterations: "iteration",
                actions: "actions",
                questions: "questions",
                mailbox: "mailbox",
                history: "history",
                nextPeriod: "next period",
                nextPhase: "next phase",
                news: "news"
            },
            indicators: {
                costs: "costs",
                quality: "quality",
                schedule: "schedule",
                timebudget: "time budget"
            },
            project: {
                overview: "project Overview",
                details: "project execution details",
                history: "indicators history",
                initialBudget: "initial budget",
                percentOfInitialBudget: "{{percent}}% of initial budget",
                bac: "budgeted at completion (BAC)",
                sumBac: "total BAC: {{total}}",
                bac_short: "BAC",
                percentOfBac: "{{percent}}% of bac",
                progress: "Progress",
                wages: "Wages",
                fixedCosts: "Project Fixed Costs",
                tasksFixedCosts: "Tasks Fixed Costs",
                unworkedHours: "Unworked Hours"
            },
            tasks: {
                index: "No",
                name: "Name",
                estimatedDuration: "Estimated<br />Duration",
                duration: "Duration",
                fixedCosts: "Fixed Costs",
                requirements: "Required Resources",
                assignees: "Assigned Resources",
                realized: "Realised"
            },
            resources: {
                name: "Name",
                grade: "Grade",
                wages: "Monthly Wages",
                rate: "Rate",
                motivation: "Motiv.",
                assignments: "Assignments",
                willWork: "Will Work"
            },
            gantt: {
                worked: 'worked',
                willWork: 'will work',
                mayWork: 'may work',
                unavailable: "unavailable",
                delay: "too late to change",
                baseline: "baseline",
                effective: "worked",
                projection: "projection"
            },
            grade: {
                apprentice: "Apprentice",
                junior: "Junior",
                senior: "Senior",
                expert: "Expert"
            },
            evm: {
                pv: "Planned Value (PV)",
                ev: "Earned Value (EV)",
                ac: "Actual Cost (AC)"
            },
            mcq: {
                questionsTitle: "Questions to answer {{thisTime}}",
                actionsTitle: "Available actions during this phase"
            },
            mailbox: {
                title: "inbox",
                message: "message"
            },
            iterations: {
                tasks: "tasks",
                teamSize: "team size",
                workloads: "workload",
                period: "period",
                willBeginAt: "will begin at period",
                beganAt: "began at period",
                planned: "planned",
                realized: "realised",
                projection: "projection",
                spent: "spent",
                deleteConfirmation: "Are you sure you want to delete this iteration?"
            }
        }
    });
});

