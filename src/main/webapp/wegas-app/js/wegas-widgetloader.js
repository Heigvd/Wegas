/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-widgetloader', function(Y) {

    var CONTENTBOX = 'contentBox',

    WidgetLoader = Y.Base.create("wegas-widgetloader", Y.Widget, [Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget], {

        _widget: null,

        initializer: function(cfg) {
        },
        destroyer: function() {
        },
        renderUI: function () {
        },
        bindUI: function() {
            Y.Wegas.app.dataSources.Page.after("response", function(e) {
                this.syncUI();
            }, this);
        },
        syncUI: function() {
            var widgetCfg = Y.Wegas.app.dataSources.Page.rest.getCachedVariableById(this.get("pageId"));

            this.get(CONTENTBOX).setContent("");

            if (!widgetCfg) {
                this.get(CONTENTBOX).setContent("No widget to display here.");
                return;
            }

            this._widget = Y.Wegas.Widget.create(widgetCfg);

            try {
                this._widget.render(this.get(CONTENTBOX));
            } catch (e) {
                Y.log('renderUI(): Error rendering widget: '+(e.stack || e ), 'error', 'Wegas.WidgetLoader');
            }
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'WidgetLoader'
            },
            type: {
                value: "WidgetLoader"
            },
            pageId: {}
        }
    });


    Y.namespace('Wegas').WidgetLoader = WidgetLoader;
});