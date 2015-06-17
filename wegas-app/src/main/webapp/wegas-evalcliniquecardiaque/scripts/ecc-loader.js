/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.addGroup("wegas-ecc", {
    base: './wegas-evalcliniquecardiaque/',
    root: '/wegas-evalcliniquecardiaque/',
    modules: {
        'ecc-entitychooser-pageloaderact': {
            ws_provides: ["EntityChooserPageloaderAction"]
        }
    }
});
