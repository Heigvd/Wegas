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
YUI.addModule("wegas-proggame", {
    base: './wegas-proggame/',
    root: '/wegas-proggame/',
    modules: {
        /** Prog game **/
        'wegas-proggame-level': {
            requires: ['tabview', "treeview", 'event-key',
                'wegas-tabview', 'wegas-widget', 'wegas-inputex-ace',
                "wegas-proggame-scriptfiles", "wegas-treeview",
                'wegas-proggame-display', 'wegas-proggame-jsinstrument'],
            ws_provides: 'ProgGameLevel'
        },
        'wegas-proggame-display': {
            requires: ['wegas-widget', 'crafty'],
            ws_provides: 'ProgGameDisplay'
        },
        'wegas-proggame-inputex': {
            requires: ['wegas-inputex', "inputex-list"],
            ix_provides: ['proggametile', "proggamemap"]
        },
        'wegas-proggame-jsinstrument': {
            requires: ["esprima", "escodegen"]
        },
        'wegas-proggame-scriptfiles': {
            requires: "wegas-panel",
            ws_provides: "ScriptFiles"
        }
    }
});
