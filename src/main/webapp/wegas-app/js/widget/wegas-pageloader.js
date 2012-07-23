/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-pageloader', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', PageLoader;

    PageLoader = Y.Base.create("wegas-pageloader", Y.Widget, [Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget], {

        // *** Lifecycle Methods ***/
        initializer: function () {
            PageLoader.pageLoaderInstances[this.get("id")] = this;              // We keep a references of all loaded PageLoaders
        },

        bindUI: function () {
            Y.Wegas.app.dataSources.Page.after("response", this.syncUI, this);
        },

        syncUI: function () {
            this.set("pageId", this.get("pageId"))
        }
    }, {
        ATTRS : {
            pageId: {
                setter: function (val) {
                    console.log("setPageId", this.get("widget"), val)
                    var widgetCfg, oldWidget = this.get("widget");

                    if (!val) {
                        return val;
                    }

                    widgetCfg = Y.Wegas.PageFacade.rest.findById(val);

                    if (widgetCfg && widgetCfg.id && this.widgetCfg             // If the widget is currently being loaded, escape
                        && this.widgetCfg.id && this.widgetCfg.id == widgetCfg.id) {
                        return val;
                    }
                    this.widgetCfg = widgetCfg;

                    if (oldWidget) {                                            // If there is already a widget, we destroy it
                        if (oldWidget.get("id") == val) {                       // If the widget is the same as the one currently loaded, exit
                            return val;
                        }
                        oldWidget.destroy();                                    // @fixme we should remove the widget instead of destroying it
                        this.get(CONTENTBOX).empty();
                    }

                    widgetCfg = widgetCfg || {
                       /* id: val,*/
                        type: "Text",
                        content: "Loading..."
                    };

                    console.log("loading", widgetCfg);
                    try {
                        Y.Wegas.Widget.use(widgetCfg, Y.bind( function (cfg) {  // Load the subwidget dependencies

                    console.log("rendering", cfg);
                            var widget = Y.Wegas.Widget.create(cfg);            // Render the subwidget
                            widget.render(this.get(CONTENTBOX));
                            this.set("widget", widget);
                        }, this, widgetCfg));
                    } catch (e) {
                        Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.PageLoader');
                    }

                    return val;
                }
            },
            widget: {}
        },

        pageLoaderInstances: [],
        find: function (id) {
            return PageLoader.pageLoaderInstances[id];
        }
    });

    Y.namespace('Wegas').PageLoader = PageLoader;
});