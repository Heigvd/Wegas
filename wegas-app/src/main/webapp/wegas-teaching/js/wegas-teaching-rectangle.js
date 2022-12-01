/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
YUI.add("wegas-teaching-rectangle", function(Y) {
    "use strict";

    Y.Wegas.TeachingRectangle = Y.Base.create("wegas-teaching-rectangle", Y.Widget, [], {
        CONTENT_TEMPLATE: '<div><div class="label"></div><div class="description"></div></div>',
        renderUI: function() {
            this.get("boundingBox").setStyles({
                top: this.get("y") + "px",
                left: this.get("x") + "px"
            });
        },
        bindUI: function() {
            this.after(["descriptionChange", "labelChange"], this.syncUI);
        },
        syncUI: function() {
            var cb = this.get("contentBox");

            cb.one(".label").setHTML(this.get("label"));
            cb.one(".description").setHTML(this.get('description') || "<em><center><br /><br /><br />Click to edit</center></em>");
        }
    }, {
        ATTRS: {
            x: {
                value: 0
            },
            y: {
                value: 0
            },
            width: {
                value: "200px"
            },
            height: {
                value: "150px"
            },
            label: {},
            description: {},
            rId: {},
            position: {}
        }
    });
});
