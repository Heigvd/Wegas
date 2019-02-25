/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Jarle.Hulaas@heig-vd.ch
 */
YUI.addGroup("wegas-mbenefits", {
    base: './wegas-mbenefits/',
    root: '/wegas-mbenefits/',
    modules: {
        'wegas-mbenefits-confirm': {
            path: "js/wegas-benefits-confirm.js",
            requires: ['wegas-plugin'],
            ws_provides: "MBConfirmExecuteScriptAction"
        },
        'wegas-mbenefits-css': {
            path: "css/wegas-benefits.css",
            type: "css"
        },
        "wegas-show-onclick": {
            path: "js/wegas-show-onclick-min.js",
            ws_provides: "ShowOnClick"
        },
        'wegas-mbenefits-actions': {
            path: "js/wegas-benefits-actions-min.js",
            requires: ['wegas-button', 'wegas-mbenefits-css', 'wegas-mcq-tabview',
                'wegas-simpledialogue', 'wegas-historydialog', 'wegas-panel-pageloader'],
            ws_provides: ["BenefitsActions", "BenefitsAction", "MBenefitsMainQuest", "MBenefitsSeqQuest", "MBenefitsUnread"]
        },

        'wegas-mbenefits-bargauge': {
            path: "js/wegas-benefits-bargauge.js",
            requires: ['wegas-widget', 'd3'],
            ws_provides: "BarGauge"
        },
        'd3': {
            path: "js/d3.min.js",
            ws_provides: "d3"
        }
    }
});
