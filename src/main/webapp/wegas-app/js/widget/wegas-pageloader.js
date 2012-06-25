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
                    if (this.get("widget")) {                                   // If there is already a widget, we destroy it
                        this.get("widget").destroy();                           // @fixme we should remove the widget instead of destroying it
                    }

                    var widget = Y.Wegas.app.getPageById(val);
                    if (!widget) {
                        widget = new Y.Wegas.Text({
                            content: "No widget to display here."
                        });
                    }

                    try {
                        widget.render(this.get(CONTENTBOX));
                    } catch (e) {
                        Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.PageLoader');
                    }

                    this.set("widget", widget);
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