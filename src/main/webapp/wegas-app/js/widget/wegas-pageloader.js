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
        isLoadingALoop: function(pageId){                                            //Page loader mustn't load the page who contain himself.
            var k, isALoop = false;
            for(k in PageLoader.pageLoaderInstances){
                if(PageLoader.pageLoaderInstances[k].get('id')===this.get('id')){ //don't check pageId of current instance and contained childrens
                    break;
                }
                if(pageId == PageLoader.pageLoaderInstances[k].get('pageId')
                    || pageId == PageLoader.pageLoaderInstances[k].get('variableDesc')){
                    isALoop = true;
                    Y.log('Attempt to load the container of this PageLoader instance is aborted.', 'warn', 'Wegas.PageLoader');
                }
            }
            return isALoop;
        },
        
        // *** Lifecycle Methods ***/
        initializer: function () {
            PageLoader.pageLoaderInstances[this.get("id")] = this;              // We keep a references of all loaded PageLoaders
        },

        bindUI: function () {
            //Y.Wegas.app.dataSources.Page.after("response", this.syncUI, this);
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", function(e){
                if(this.get("variableDesc") != this.get('pageId')){
                    this.syncUI();
                }
            }, this);
        },

        syncUI: function () {
            if(this.get("variableDesc")){
                this.set("pageId", this.get("variableDesc"));
            } else{
                this.set("pageId", this.get("pageId"));
            }
        }
    }, {
        ATTRS : {
            variableName:{},
            pageId: {
                setter: function (val) {
                    if (!val || this.isLoadingALoop(val)) {
                        return val;
                    }

                    var widgetCfg = Y.Wegas.PageFacade.rest.findById(val).toObject(),
                    oldWidget = this.get("widget");

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
                        // id: Y.Wegas.App.genId(),
                        type: "Text",
                        content: "Loading..."
                    };

                    try {
                        Y.Wegas.Widget.use(widgetCfg, Y.bind( function (cfg) {  // Load the subwidget dependencies
                            var widget = Y.Wegas.Widget.create( cfg );// Render the subwidget
                            widget.render(this.get(CONTENTBOX));
                            this.set("widget", widget);
                        }, this, widgetCfg));
                    } catch (e) {
                        Y.log('renderUI(): Error rendering widget: ' + (e.stack || e), 'error', 'Wegas.PageLoader');
                    }

                    return val;
                }
            },
            variableDesc:{
                "transient": true,
                getter: function(){
                    var variable;
                    if(!this.get('variableName')) return null;
                    variable = Y.Wegas.VariableDescriptorFacade.rest.find('name', this.get("variableName"));
                    if(!variable || !variable.getInstance().get("value")) return null;
                    return variable.getInstance().get("value");
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
