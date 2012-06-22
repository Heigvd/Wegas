/**
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-displayarea', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', DisplayArea;

    DisplayArea = Y.Base.create("wegas-displayarea", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        renderUI: function () {
            this.get(CONTENTBOX).setContent('<div class="yui3-widget wegas-text"><div class="wegas-text-content">Welcome to AlbaSIM.</div></div>');
        },
        syncUI: function () {
        }
    }, {
        ATTRS : {
            classTxt: {
                value: "DisplayArea"
            },
            type: {
                value: "DisplayArea"
            }
        }
    });

    Y.namespace('Wegas').DisplayArea = DisplayArea;
});