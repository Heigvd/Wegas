/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add('wegas-teacherpage', function(Y) {
    "use strict";

    /**
     *  @class TeacherPage plugin
     *  @name Y.Plugin.TeacherPage
     *  @extends Y.Plugin.Base
     *  @constructor
     */

    var TeacherPage = Y.Base.create("wegas-teacherpage", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /** @lends Y.Plugin.TeacherPage */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            if (this.get("host") instanceof Y.Wegas.AbsoluteLayout) {
                this.setup();
            } else {
                Y.log("Host's type mistmach", "warn", "Y.Plugin.TeacherPage");
                return;
            }
        },
        setup: function() {
            var teacher = this.get("teacher"),
                editor = this.get("scenarist"),
                centerTab, tab, hostMode, label, pageID;

            label = this.get("label");

            centerTab = Y.Widget.getByNode("#centerTabView");
            //this.get("host").get("@pageId");

            if (centerTab) {
                hostMode = Y.one(".wegas-hostmode");

                if (hostMode && teacher || !hostMode && editor) {
                    centerTab.some(function(child) {
                        if (child.get("label") === label) {
                            centerTab.remove(child.get("index"));
                            return true;
                        }
                    });

                    tab = centerTab.add({
                        label: label,
                        children: [{
                                type: "PageLoader",
                                pageLoaderId: label,
                                defaultPageId: this.get("pageNumber")
                            }]
                    }).item(0);

                    if (!hostMode) {
                        tab.plug(Y.Plugin.TabDocker);
                    }
                }
            }
        },
        destructor: function() {

        }
    }, {
        ATTRS: {
            teacher: {
                type: "boolean",
                value: true
            },
            scenarist: {
                type: "boolean",
                value: true
            },
            pageNumber: {
                type: "number",
                value: 1
            },
            label: {
                type: "string",
                value : "label"
            }
        },
        NS: "TeacherPage",
        NAME: "TeacherPage"
    });
    Y.Plugin.TeacherPage = TeacherPage;
});
