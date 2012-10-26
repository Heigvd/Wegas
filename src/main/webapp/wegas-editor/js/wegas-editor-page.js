/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

YUI.add('wegas-editor-page', function(Y){
    var PageEditor, CONTENT_BOX = "contentBox", BOUNDING_BOX = "boundingBox";

    PageEditor = Y.Base.create("wegas-editor-page", Y.Widget, [Y.WidgetChild],{
        initializer: function(){
            this.dataSource = Y.Wegas.PageFacade.rest;
            this.plug(Y.Plugin.WidgetToolbar);
        },
        renderUI: function(){
            this.tw = new Y.TreeView({
                render:this.get(CONTENT_BOX)
            });
        },
        syncUI: function(){
            this.dataSource.getIndex(Y.bind(this.buildIndex, this));
        },
        bindUI: function(){
            this.tw.on("treeleaf:click", function(e){
                this.get("pageLoader").set("pageId", e.node.get("data"));
            }, this);
            this.dataSource.after("pageUpdated", this.syncUI);
        },
        buildIndex: function(index){
            var i;
            this.tw.removeAll();
            for(i in index){
                this.tw.add(new Y.TreeLeaf({
                    label: "Page: "+index[i],
                    data: index[i]
                }));
            }
        },
        destructor: function(){
            this.tw.destroy();
        }
    },{
        ATTRS:{
            pageLoader:{
                value:"previewPageLoader",
                getter: function(v){
                    return Y.Wegas.PageLoader.find(v);
                }
            }
        }
    });

    Y.namespace("Wegas").PageEditor = PageEditor;
});