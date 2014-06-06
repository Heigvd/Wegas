/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add("wegas-teaching-rectangle", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", TeachingRectangle;

    TeachingRectangle = Y.Base.create("wegas-teaching-rectangle", Y.Widget, [], {
        CONTENT_TEMPLATE: '<div><div class="label"></div><div class="description"></div></div>',
        renderUI: function() {
            this.get("boundingBox").setStyles({
                top: this.get("y") + "px",
                left: this.get("x") + "px"
            });
        },
        bindUI: function() {
            this.after("descriptionChange", this.syncUI);
            this.after("labelChange", this.syncUI);
        },
        syncUI: function() {
            var cb = this.get(CONTENTBOX), description = this.get('description');

            cb.one(".label").setHTML(this.get("label"));
            cb.one(".description").setHTML((description && description.length > 0) ? description : "<em><center><br /><br /><br />Click to edit</center></em>");
        }
    }, {
        ATTRS: {
            x: {
                type: "Integer",
                value: 0
            },
            y: {
                type: "Integer",
                value: 0
            },
            width: {
                type: "Integer",
                value: "200px"
            },
            height: {
                type: "Integer",
                value: "150px"
            },
            label: {
                type: "String"
            },
            description: {},
            id: {
                type: "Integer",
                value: 0
            }
        }
    });

    Y.Wegas.TeachingRectangle = TeachingRectangle;
});
