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
YUI.addGroup("wegas-crimesim", {
    base: './wegas-crimesim/',
    root: '/wegas-crimesim/',
    modules: {
        /** CrimeSim **/
        'wegas-crimesim-scheduledisplay': {
            requires: ['wegas-widget', 'wegas-widgetmenu', 'wegas-crimesim-treeble', 'wegas-gallery', 'wegas-crimesim-translator'],
            ws_provides: "ScheduleDisplay"
        },
        'wegas-crimesim-resultsdisplay': {
            requires: ['wegas-widget', 'wegas-crimesim-treeble', 'wegas-crimesim-translator'],
            ws_provides: "ResultsDisplay"
        },
        'wegas-crimesim-choicesrepliesunreadcount': {
            requires: 'wegas-button',
            ws_provides: "ChoicesRepliesUnreadCount"
        },
        'wegas-crimesim-treeble': {
            requires: ['datatable', 'datasource-arrayschema', 'gallery-treeble', 'wegas-crimesim-translator'],
            ws_provides: "CrimeSimTreeble"
        },
        "wegas-crimesim-translator": {
            path: 'js/wegas-crimesim-translator/wegas-crimesim-translator-min.js',
            pkg: 'js/wegas-crimesim-translator',
            lang: ["fr"]
        }
    }
});
