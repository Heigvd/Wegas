/**
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
*/

YUI.add('wegas-text', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', Text;

    Text = Y.Base.create("wegas-text", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        syncUI: function () {
            this.get(CONTENTBOX).setContent(this.get('content'));
        }
    }, {
        ATTRS : {
            content: { }
        }
    });

    Y.namespace('Wegas').Text = Text;
});