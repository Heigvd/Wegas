/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.addGroup("wegas-leaderway", {
    base: './wegas-leaderway/',
    root: '/wegas-leaderway/',
    modules: {
        'wegas-nodeformatter': {},
        'wegas-itemselector': {
            requires: ['wegas-nodeformatter', 'scrollview', "wegas-button", 'wegas-widgetmenu'],
            ws_provides: "ItemSelector"
        },
        'wegas-leaderway-team': {
            requires: ['wegas-itemselector', "wegas-injector",
                "wegas-panel", "wegas-simpledialogue"],
            ws_provides: "LeaderwayTeam"
        },
        "wegas-leaderway-translator": {
            path: 'js/wegas-leaderway-translator/wegas-leaderway-translator-min.js',
            pkg: 'js/wegas-leaderway-translator',
            lang: ["en"]
        }
        //'wegas-leaderway-folder': {
        //    requires: 'wegas-itemselector',
        //    ws_provides: "LWFolder"
        //},
        //'wegas-leaderway-tasklist': {
        //    requires: 'datatable',
        //    ws_provides: "TaskList"
        //},
        //'wegas-leaderway-score': {
        //    requires: 'datatable',
        //    ws_provides: "Score"
        //},
        //'wegas-leaderway-dialogue': {
        //    requires: ['charts', 'charts-legend'],
        //    ws_provides: "Dialogue"
        //},
    }
});
