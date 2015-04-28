/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
/*global Y, persistence */
(function() {
    "use strict";

    Y.Wegas.app.once("render", function() {
        var centerTab, orchestrator, hostMode;

        /*
         * Review Orchestrator
         * Add a Orchestrator for teacher and scenarist
         * TODO -> Rewrite as a page plugin
         */
        centerTab = Y.Widget.getByNode("#centerTabView");

        if (centerTab) {
            hostMode = Y.one(".wegas-hostmode");

            centerTab.some(function(child) {
                if (child.get("label") === "Orchestrator") {
                    centerTab.remove(child.get("index"));
                    return true;
                }
            });

            // Add orchestrator tab
            orchestrator = centerTab.add({
                label: "Orchestrator",
                children: [{
                        type: "PageLoader",
                        pageLoaderId: "orcherstrator",
                        defaultPageId: 5
                    }]
            }).item(0);

            if (!hostMode) {
                orchestrator.plug(Y.Plugin.TabDocker);
            }
        }
    });
}());


