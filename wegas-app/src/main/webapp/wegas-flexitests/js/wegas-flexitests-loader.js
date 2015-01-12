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
YUI.addGroup("wegas-flexitests", {
    base: './wegas-flexitests/',
    root: '/wegas-flexitests/',
    modules: {
        'wegas-flexitests-controller': {
            requires: "wegas-layout-absolute",
            ws_provides: ["FlexitestsController", "FlexiResponse", "wegas-panel"]
        },
        'wegas-flexitests-mcqdisplay': {
            requires: ["wegas-widget", "template"],
            ws_provides: "FlexitestsMCQ"
        },
        'wegas-flexitests-results': {
            requires: ["wegas-widget", "datatable", "datatable-csv"],
            ws_provides: "FlexitestsResults"
        },
        'wegas-addimages-action': {
            requires: ["wegas-plugin", "wegas-panel-fileselect"],
            ws_provides: "AddImagesWidgetAction"
        }
    }
});
