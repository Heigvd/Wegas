/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.addGroup('wegas-proggame', {
    base: './wegas-proggame/',
    root: '/wegas-proggame/',
    modules: {
        /** Prog game **/
        'wegas-proggame-level': {
            requires: [
                'tabview',
                'treeview',
                'event-key',
                'transition',
                'wegas-tabview',
                'wegas-widget',
                'wegas-inputex-ace',
                'wegas-proggame-scriptfiles',
                'wegas-treeview',
                'resize',
                'wegas-proggame-display',
                'wegas-proggame-jsinstrument',
                'wegas-conditionaldisable',
                'wegas-tutorial',
                'wegas-alerts',
                'wegas-text',
            ],
            ws_provides: 'ProgGameLevel',
        },
        'wegas-proggame-display': {
            requires: ['wegas-widget', 'crafty', 'yui-later'],
            ws_provides: 'ProgGameDisplay',
        },
        'wegas-proggame-inputex': {
            requires: ['wegas-inputex', 'inputex-list'],
            ix_provides: ['proggametile', 'proggamemap'],
        },
        'wegas-proggame-jsinstrument': {
            requires: ['esprima', 'escodegen'],
        },
        'wegas-proggame-scriptfiles': {
            requires: 'wegas-panel',
            ws_provides: 'ScriptFiles',
        },
    },
});
