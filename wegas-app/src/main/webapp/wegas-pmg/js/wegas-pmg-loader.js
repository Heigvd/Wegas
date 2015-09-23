/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
"use strict";

YUI.addGroup("wegas-pmg", {
    base: './wegas-pmg/',
    root: '/wegas-pmg/',
    modules: {
        "wegas-scheduledatatable": {
            ws_provides: 'ScheduleDT'
        },
        "wegas-pmgwidget-css": {
            path: 'css/wegas-pmgwidget-min.css',
            type: 'css'
        },
        "wegas-pmg-breadcrumb": {
            ws_provides: "PmgBreadcrumb"
        },
        "wegas-pmg-burndown": {
            requires: ['wegas-pmg-slidepanel', 'chartist',
                "chartist-axistitle"
            ],
            ws_provides: ['PmgIterationsPanels', 'PmgIterationWidget']
        },
        "wegas-pmg-datatable": {
            requires: ['datatable', 'datatable-mutable', "template"],
            ws_provides: "PmgDatatable"
        },
        "wegas-pmg-slidepanel": {
            requires: ['anim', 'wegas-pmgwidget-css', "wegas-pmg-datatable", "wegas-pmg-reservation",
                "wegas-pmg-occupationcolor", "wegas-pmg-activitycolor", "wegas-pmg-assignment",
                "wegas-scheduledatatable", "wegas-text", "wegas-pmg-autoreservation-color", "wegas-pmg-linefilter"],
            ws_provides: ["PmgSlidePanel", "PmgResourcesPanels"]
        },
        "wegas-pmg-reservation": {
            path: 'js/plugin/wegas-pmg-reservation-min.js',
            ws_provides: 'Reservation'
        },
        /*"wegas-pmg-abstractpert": {
         path: 'js/plugin/wegas-pmg-abstractpert-min.js',
         ws_provides: 'AbstractPert'
         },*/
        "wegas-pmg-autoreservation-color": {
            path: 'js/plugin/wegas-pmg-autoreservation-color-min.js',
            requires: ['wegas-pmgwidget-css'],
            ws_provides: 'AutoReservationColor'
        },
        "wegas-pmg-occupationcolor": {
            path: 'js/plugin/wegas-pmg-occupationcolor-min.js',
            requires: 'wegas-pmgwidget-css',
            ws_provides: 'OccupationColor'
        },
        "wegas-pmg-linefilter": {
            path: 'js/plugin/wegas-pmg-linefilter-min.js',
            requires: 'wegas-pmgwidget-css',
            ws_provides: ['PMGLineFilter', 'PMGLineCompleteness']
        },
        "wegas-pmg-activitycolor": {
            path: 'js/plugin/wegas-pmg-activitycolor-min.js',
            requires: 'wegas-pmgwidget-css',
            ws_provides: 'ActivityColor'
        },
        "wegas-pmg-assignment": {
            path: 'js/plugin/wegas-pmg-assignment-min.js',
            requires: ['sortable', 'wegas-pmgwidget-css', 'wegas-widgetmenu', 'event-hover'],
            ws_provides: 'Assignment'
        },
        "wegas-pmg-planification": {
            path: 'js/plugin/wegas-pmg-planification-min.js',
            ws_provides: 'Planification'
        },
        "wegas-pmg-plannificationcolor": {
            path: 'js/plugin/wegas-pmg-plannificationcolor-min.js',
            requires: 'wegas-pmgwidget-css',
            ws_provides: 'Plannificationcolor'
        },
        "wegas-pmg-plannificationactivitycolor": {
            path: 'js/plugin/wegas-pmg-plannificationactivitycolor-min.js',
            requires: 'wegas-pmgwidget-css',
            ws_provides: 'PlannificationActivityColor'
        },
        "wegas-pmg-plannificationprogresscolor": {
            path: 'js/plugin/wegas-pmg-plannificationprogresscolor-min.js',
            requires: ['wegas-pmgwidget-css'],
            ws_provides: 'PlannificationProgressColor'
        },
        "wegas-pmg-bac": {
            path: 'js/plugin/wegas-pmg-bac-min.js',
            ws_provides: 'Bac'
        },
        "wegas-pmg-tablepopup": {
            path: 'js/plugin/wegas-pmg-tablepopup-min.js',
            requires: 'wegas-widgetmenu',
            ws_provides: 'Tablepopup'
        },
        /*"wegas-pmg-tabletooltip": {
         path: 'js/plugin/wegas-pmg-tabletooltip-min.js',
         requires: ['overlay', 'wegas-pmgwidget-css'],
         ws_provides: 'Tabletooltip'
         },*/
        /*"wegas-pmg-taskpopup": {
         path: 'js/plugin/wegas-pmg-taskpopup-min.js',
         requires: ['overlay', 'wegas-pmgwidget-css'],
         ws_provides: 'Taskpopup'
         },*/
        "wegas-pmg-taskonclickpopup": {
            path: 'js/plugin/wegas-pmg-taskonclickpopup-min.js',
            requires: ['overlay', 'wegas-pmgwidget-css'],
            ws_provides: ['Taskonclickpopup', 'Taskontableclickpopup', 'Taskoniterationclickpopup']
        },
        "wegas-pmg-advancementlimit": {
            path: 'js/wegas-pmg-advancementlimit-min.js',
            requires: ["wegas-template"],
            ws_provides: "AdvancementLimit"
        }
    }
});
