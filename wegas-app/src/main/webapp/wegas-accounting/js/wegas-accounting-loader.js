/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Maxence Laurent 'maxence.laurent' 'gmail.com'
 */
"use strict";

YUI.addGroup("wegas-pmg", {
    base: './wegas-accounting/',
    root: '/wegas-accounting/',
    modules: {
        "wegas-accounting-balance": {
            path: 'js/wegas-accounting-balance-min.js',
            requires: [],
            ws_provides: "BalanceSheet"
        }
    }
});
