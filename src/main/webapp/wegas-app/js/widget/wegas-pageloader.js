/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-pageloader', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', PageLoader;

    PageLoader = Y.Base.create("wegas-pageloader", Y.Widget, [Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget], {
        // *** Private Methods ***/
        isLoadingALoop: function (pageId) {                                     //Page loader mustn't load the page who contain himself.
            var k, isALoop = false;
            for (k in PageLoader.pageLoaderInstances) {
                if (PageLoader.pageLoaderInstances[k].get('id') === this.get('id')) { //don't check pageId of current instance and contained childrens
                    break;
                }
                if (pageId === PageLoader.pageLoaderInstances[k].get('pageId')
                        || pageId === PageLoader.pageLoaderInstances[k].get('variable.evaluated')) {
                    isALoop = true;
                    Y.log("Attempt to load the PageLoader of this PageLoader's instance is aborted.", 'warn', 'Wegas.PageLoader');
                }
            }
            return isALoop;
        },
        // *** Lifecycle Methods ***/
        initializer: function () {
            PageLoader.pageLoaderInstances[this.get("id")] = this;              // We keep a references of all loaded PageLoaders
            this.currentPageId = null;
            if (this.get("defaultPageId")) {
                this.set("pageId", this.get("defaultPageId"));
            }
        },
        bindUI: function () {
            //Y.Wegas.app.dataSources.Page.after("response", this.syncUI, this);
            var onUpdate = function (e) {
                if (this.get("variable.evaluated") !== this.get('pageId')) {          //Don't sync if it's the same page (can occure only with a varableDesc)
                    this.syncUI();
                }
            };
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", onUpdate, this);
            Y.Wegas.app.after('currentPlayerChange', onUpdate, this);
        },
        syncUI: function () {
            var val = this.get("variable.evaluated");
            if (this.get("variable")) {
                if (val && val.getInstance().get('value')) {
                    this.set("pageId", val.getInstance().get('value'));
                }
            } else {
                this.set("pageId", this.get("pageId"));
            }
        }
    }, {
        ATTRS: {
            defaultPageId: {
                type: "string"
            },
            pageId: {
                type: "string",
                "transient": true,
                setter: function (val) {
                    if (!val) {// If the widget is currently being loaded, escape
                        return val;
                    }
                    if (val === this.currentPageId || this.isLoadingALoop(val)) {// If the widget is currently being loaded, escape
                        return val;
                    }
                    this.currentPageId = val;
                    var widgetCfg = Y.Wegas.PageFacade.rest.findById(val).toObject(),
                            oldWidget = this.get("widget");
                    if (oldWidget) {
                        if (oldWidget.get("id") === val) {                      // If the widget is the same as the one currently loaded, exit
                            return val;
                        }
                        oldWidget.destroy();                                    // @fixme we should remove the widget instead of destroying it
                    }
                    this.get(CONTENTBOX).empty();
                    this.showOverlay();
                    try {
                        Y.Wegas.Widget.use(widgetCfg, Y.bind(function (cfg) {   // Load the subwidget dependencies
                            var widget = Y.Wegas.Widget.create(cfg);            // Render the subwidget
                            widget.render(this.get(CONTENTBOX));
                            this.set("widget", widget);
                            this.hideOverlay();
                        }, this, widgetCfg));
                    } catch (e) {
                        Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.PageLoader');
                    }

                    return val;
                }
            },
            variable: {
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                getter: Y.Wegas.persistence.Editable.VARIABLEDESCRIPTORGETTER
//                getter: function (val, fullName) {
//                    var val = Y.Wegas.persistence.Editable.VARIABLEDESCRIPTORGETTER(val, fullName);
//                    if(val && val.evaluated && val.evaluated.getInstance().get('value')){
//                        val.pageId = val.evaluated.getInstance().get('value');
//                    }
//                    return val;
//                }

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
