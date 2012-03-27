/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-widgetloader', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', WidgetLoader;

    WidgetLoader = Y.Base.create("wegas-widgetloader", Y.Widget, [Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget], {

        // *** Lifecycle Methods ***/
        
        bindUI: function () {
            Y.Wegas.app.dataSources.Page.after("response", this.syncUI, this);
        },

        syncUI: function () {
            var widgetCfg = Y.Wegas.app.dataSources.Page.rest.getCachedVariableById(this.get("pageId")),
            widget;

            this.get(CONTENTBOX).setContent("");

            if (!widgetCfg) {
                this.get(CONTENTBOX).setContent("No widget to display here.");
                return;
            }

            widget = Y.Wegas.Widget.create(widgetCfg);

            try {
                widget.render(this.get(CONTENTBOX));
            } catch (e) {
                Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.WidgetLoader');
            }
            this.set("widget", widget);
        }
    }, {
        ATTRS : {
            pageId: {},
            widget: {}
        }
    });

    Y.namespace('Wegas').WidgetLoader = WidgetLoader;
});