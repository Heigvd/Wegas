/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.addGroup('wegas-pact', {
    base: './wegas-pact/',
    root: '/wegas-pact/',
    modules: {
        /** Prog game **/
        'pact-level': {
            requires: [
                'tabview',
                'treeview',
                'event-key',
                'transition',
                'wegas-tabview',
                'wegas-widget',
                'ace',
                'pact-scriptfiles',
                'wegas-treeview',
                'wegas-scripteval',
                'resize',
                'pact-display',
                'pact-jsinstrument',
                'wegas-conditionaldisable',
                'wegas-tutorial',
                'wegas-alerts',
                'wegas-text',
            ],
            ws_provides: 'ProgGameLevel',
        },
        'pact-display': {
            requires: ['wegas-widget', 'crafty', 'yui-later', 'promise'],
            ws_provides: 'ProgGameDisplay',
        },

        'pact-jsinstrument': {
            requires: ['esprima', 'escodegen'],
        },
        'pact-scriptfiles': {
            requires: 'wegas-panel',
            ws_provides: 'ScriptFiles',
        },
    },
});
