YUI.add("wegas-teaching-rectangle", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", TeachingRectangle;

    TeachingRectangle = Y.Base.create("wegas-teaching-rectangle", Y.Widget, [], {
        BOUNDING_TEMPLATE: '<div class="rectangle"></div>',
        renderUI: function() {
            this.get("boundingBox").setStyles({
                top: this.get("y") + "px",
                left: this.get("x") + "px"
            });
        },
        syncUI: function() {
            this.get(CONTENTBOX).setHTML(this.get('label'));
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
                type: "String",
                value: "Rectangle"
            },
            id: {
                type: "Integer",
                value: 0
            }
        }
    });

    Y.namespace("Wegas").TeachingRectangle = TeachingRectangle;
});
