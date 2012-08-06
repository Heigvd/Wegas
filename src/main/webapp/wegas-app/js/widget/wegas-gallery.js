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


YUI.add("wegas-gallery", function(Y){

    var WegasGallery;

    WegasGallery = Y.Base.create("wegas-gallery", Y.Widget, [Y.Wegas.Widget], {
        //TODO : fix on screen resize, scroll
        // parse page content on domchange.
        CONTENT_TEMPLATE:"<ul></ul>",

        scrollView: null,
        container:null,
        fullScreeNode:null,
        styleSheet: null,
        isFullScreen: false,
        eventInstances:[],
        images:{},

        initializer : function(){
            this.images = {};
            this.eventInstances = [];
            this.isFullScreen = false;
            this.fullScreenNode = new Y.Node.create("<span></span>");
            this.scrollView = new Y.ScrollView({

                width: (parseInt(this.get("selectedWidth")) + 30),
                srcNode:this.get(BOUNDING_BOX),
                flick:{
                    minDistance:10,
                    minVelocity:0.3,
                    axis: "x"
                },
                bounce:0
            });
            this.scrollView.plug(Y.Plugin.ScrollViewPaginator, {
                selector: 'li'
            });

        },
        renderUI : function(){

            this.get("gallery");                                                // LAZY init
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-mask gallery-mask-left'><div>PREVIOUS</div></div>");
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-mask gallery-mask-right'><div>NEXT</div></div>");
            this.fullScreenNode.appendTo(Y.one("body"));
            this.loadImage(this.scrollView.pages.get("index"));
        },
        syncUI: function(){
            var scrollViewId = "#" + this.scrollView.get("id") + " ",           // prefix css with id, allow multiple instance with different style
            selW = parseInt(this.get("selectedWidth")),
            selH = parseInt(this.get("selectedHeight")),
            smaH = parseInt(this.get("smallHeight")),
            smaW = parseInt(this.get("smallWidth"));
            try{
                this.styleSheet.disable();
            }catch(e){

            }
            if(this.get("fullScreen")){
                selH = document.height - 80;
                selW = document.width - 190;
                smaH = 50;
                smaW = 50;
                if(!this.isFullScreen){
                    this.isFullScreen = true;
                    this.scrollView.get(BOUNDING_BOX).swap(this.fullScreenNode);
                }
            }else{
                if(this.isFullScreen){
                    this.isFullScreen = false;
                    this.scrollView.get(BOUNDING_BOX).swap(this.fullScreenNode);
                }
            }
            this.scrollView.set("width", selW + 30);
            this.styleSheet = new Y.StyleSheet(scrollViewId + ".wegas-gallery li{width:"
                + (selW + 30)
                + "px;height:"
                + (selH + 30)
                + "px;}"
                + scrollViewId
                + ".wegas-gallery img{max-width:"
                + (smaW)
                + "px;max-height:"
                + (smaH)
                + "px;}"
                + scrollViewId
                + ".wegas-gallery .gallery-selected img{max-width:"
                + (selW)
                + "px;max-height:"
                + (selH)
                + "px;}"
                + scrollViewId
                + ".gallery-mask{width:"
                + (smaW + 30)
                + "px;}"
                + scrollViewId
                + ".gallery-text{width:"
                + (selW + 24)
                + "px;max-height:"
                + (selH)
                + "px;}");
            this.scrollView.get(BOUNDING_BOX).setStyles({
                padding:"0 "+ (smaW+45) + "px 0 " + (smaW+15) + "px"
            });

            if(this.scrollView.get("rendered")){
                //TODO : HACK fix it
                window.setTimeout(Y.bind(this.scrollView.syncUI,this.scrollView), 300);
            //this.scrollView.syncUI();
            }else{
                this.scrollView.render();
            }
            this.setSelected(this.scrollView.pages.get("index"));
        },
        bindUI: function(){
            this.eventInstances.push(this.after("fullScreenChange", this.syncUI));
            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-left > div').on("click", function(e){
                e.halt(true);
                this.prev();

            }, this));
            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-right > div').on("click", function(e){
                e.halt(true);
                this.next();
            }, this));
            //Prevent scroll on borders
            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-left').on("mousedown", function(e){
                e.halt(true);
            }));
            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-right').on("mousedown", function(e){
                e.halt(true);
            }));
            this.eventInstances.push(this.scrollView.on("flick", function(e){
                this.setSelected(e.target.pages.get("index"));

            }, this));

        },
        next: function(){
            this.scrollView.pages.next();
            this.setSelected(this.scrollView.pages.get("index"));
        },
        prev: function(){
            this.scrollView.pages.prev();
            this.setSelected(this.scrollView.pages.get("index"));
        },
        setSelected: function(index){
            var list = this.get(CONTENT_BOX).all("li");
            list.each(function(){
                this.removeClass("gallery-selected");
                this.removeClass("gallery-before-selected");
            });
            if(index > 0){
                list.item(index - 1).addClass("gallery-before-selected");
            }
            list.item(index).addClass("gallery-selected");
            if(this.images[index -1] && !this.images[index-1].loaded){
                this.loadImage(index - 1);
            }
            if(this.images[index + 1] && !this.images[index+1].loaded){
                this.loadImage(index + 1);
            }

        },
        loadImage: function(i){
            if(this.get(CONTENT_BOX).all("li").item(i).hasChildNodes()){
                return;
            }
            var img = Y.Node.create("<img src='"+this.get("gallery")[i].srcUrl+"' ></img>");
            img.index = i;
            img.once("load", function(e){
                e.target.get("parentNode").removeClass("img-loading");
                this.images[e.target.index].loaded = true;
            }, this);
            this.get(CONTENT_BOX).all("li").item(i).appendChild(img);
            if(this.get("gallery")[i].description){
                this.get(CONTENT_BOX).all("li").item(i).appendChild("<div class='gallery-text'>"+this.get("gallery")[i].description+"</div>");
            }
        },
        destructor: function(){
            this.styleSheet.disable();
            this.fullScreenNode.destroy();
            for(var i in this.eventInstances){
                this.eventInstances[i].detachAll();
            }
        }

    }, {
        ATTRS:{
            gallery:{
                value:[],
                lazyAdd : true,
                setter: function(o){
                    this.get(CONTENT_BOX).empty();
                    this.images = {};
                    for(var i in o){
                        this.images[i] = {
                            loaded : false
                        };
                        this.get(CONTENT_BOX).appendChild("<li class='img-loading'></li>");
                    }
                    this.scrollView.syncUI();
                    return o;
                }
            },
            selectedWidth:{
                value:400,
                validator: Y.Lang.isNumber,
                setter: function(v){
                    if(this.scrollView){
                        this.scrollView.set("width", (parseInt(v) + 30))
                    }
                    return v;
                }
            },
            selectedHeight:{
                value:300,
                validator: Y.Lang.isNumber
            },
            smallWidth:{
                value:250,
                validator: Y.Lang.isNumber
            },
            smallHeight:{
                value:250,
                validator: Y.Lang.isNumber
            },
            fullScreen:{
                value:false,
                validator:Y.Lang.isBoolean
            }

        }
    });

    Y.namespace("Wegas").WegasGallery = WegasGallery;
});
