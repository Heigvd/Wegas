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

    var WegasGallery,
    CONTENT_BOX="contentBox",
    BOUNDING_BOX="boundingBox";

    /*
     * ATTRS:<br/>
     * gallery: {Array} an array of picture to display, format : {srcUrl: ...[, description: ...]}
     * fullScreen : {Boolean} toggles fullScreen<br/>
     * lightGallery : {Boolean} An instance which will read DOM for "light-picture" or "light-gallery" classes<br/>
     * <br/>
     * light-picture class nodes : "href" attribute (url) , "title" attribute (description)<br/>
     * light-gallery class nodes : child nodes with "href" attribute (url), "title" attribute (description)
     */
    WegasGallery = Y.Base.create("wegas-gallery", Y.Widget, [Y.Wegas.Widget], {
        CONTENT_TEMPLATE:"<ul></ul>",

        scrollView: null,
        container:null,
        fullScreeNode:null,
        styleSheet: null,
        isFullScreen: false,
        eventInstances:[],
        images:{},

        initializer : function(){
            var prev = Y.Widget.getByNode(".wegas-lightGallery");
            if(prev){               // TODO: currently destroying previous one, do a singleton
                prev.destroy();
            }
            this.images = {};
            this.eventInstances = [];
            this.isFullScreen = false;
            this.fullScreenNode = new Y.Node.create("<span></span>");
            this.scrollView = new Y.ScrollView({
                width: (parseInt(this.get("selectedWidth")) + 30),
                srcNode:this.get(BOUNDING_BOX),
                axis: "x",
                flick:{
                    minDistance:10,
                    minVelocity:0.3,
                    axis: "x"
                },
                bounce:0
            });

            if(this.get("lightGallery")){
                this.set("render", "body");
                this.set("gallery", []);
                this.render();
            }

        },
        renderUI : function(){
            // LAZY init
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-mask gallery-mask-left'><div>PREVIOUS</div></div>");
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-mask gallery-mask-right'><div>NEXT</div></div>");
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-toggle'></div>");
            this.get(CONTENT_BOX).appendChild("<li class='img-loading'></li>");
            if(this.get("lightGallery")){
                this.scrollView.get(BOUNDING_BOX).addClass("wegas-lightGallery");
            }else if(this.get("gallery").length > 0){
                this.loadImage(0);
            }
            this.fullScreenNode.appendTo(Y.one("body"));

        },
        syncUI: function(){
            if(!this.scrollView.get("rendered")){
                return;
            }
            var scrollViewId = "#" + this.scrollView.get("id") + " ",           // prefix css with id, allow multiple instance with different style
            selW = parseInt(this.get("selectedWidth")),
            selH = this.get("selectedHeight"),
            smaH,
            smaW;

            if(this.styleSheet){
                this.styleSheet.disable();
            }
            if(this.get("fullScreen") || this.get("lightGallery")){
                selH = Y.one("body").get("winHeight") - 100;
                selW = Y.one("body").get("winWidth") * 0.8;
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
            smaW = (this.scrollView.get(BOUNDING_BOX).get("parentNode").get("region").width - parseInt(this.scrollView.get(BOUNDING_BOX).get("parentNode").getStyle("padding-right")) - parseInt(this.scrollView.get(BOUNDING_BOX).get("parentNode").getStyle("padding-left")) - selW - 90)/2;
            smaH = selW;
            if(this.get("gallery").length > 0){
                this.scrollView.show();
            }else{
                this.scrollView.hide();
                return;
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

            this.scrollView.syncUI();
            if(this.scrollView.get("rendered")){
                this.scrollView.pages.scrollToIndex(this.scrollView.pages.get("index"));
            }
            if(this.get("lightGallery") && !this.get("fullScreen")){
                this.scrollView.hide();
            }
        },
        bindUI: function(){
            this.after("fullScreenChange", function(e){
                if(this.get("lightGallery")){
                    if(this.get("fullScreen")){
                        this.scrollView.show();
                    }else{
                        this.scrollView.hide();
                    }
                }else{
                    this.syncUI();
                }
            });

            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-left > div').on("click", function(e){
                e.halt(true);
                this.prev();

            }, this));
            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-right > div').on("click", function(e){
                e.halt(true);
                this.next();
            }, this));
            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-toggle').on("click", function(e){
                this.set("fullScreen", !this.get("fullScreen"));
            }, this));
            //Prevent scroll on borders
            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-left').on("mousedown", function(e){
                e.halt(true);
            }));
            this.eventInstances.push(this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-right').on("mousedown", function(e){
                e.halt(true);
            }));
            this.scrollView.after("scrollEnd", function(e){
                this.scrollView.pages.scrollToIndex(this.scrollView.pages.get("index"));              //Constrain
                Y.later(600, this, function(){                                  // Let some time before loading next one
                    var index = this.scrollView.pages.get("index");
                    if(this.images[index + 1] && !this.images[index + 1].loaded){
                        this.loadImage(index + 1);
                    }
                    if(this.images[index - 1] && !this.images[index - 1].loaded){
                        this.loadImage(index - 1);
                    }
                });

            }, this);
            this.eventInstances.push( Y.on("windowresize", Y.bind(this.windowResizeEvent, this)));
            this.after("galleryChange", function(e){
                if(e.newVal.length > 0){
                    this.loadImage(0);
                    if(e.newVal.length > 1){
                        this.loadImage(1);
                    }
                }
                if(!this.scrollView.get("rendered")){
                    this.scrollView.plug(Y.Plugin.ScrollViewPaginator, {
                        selector: 'li'
                    });

                    this.scrollView.render();
                    this.scrollView.pages.after("indexChange", function(e){
                        this.setSelected(e.target.get("index"));
                    }, this);
                }else{
                    this.scrollView.syncUI();

                }
                this.setSelected(0);
                this.scrollView.pages.set("index", 0);
                this.syncUI();
            });
            if(this.get("lightGallery")){
                this.eventInstances.push(Y.one("body").delegate("click", function(e){
                    var children, gallery = [];
                    e.halt(true);
                    children = e.target.get("children");
                    children.each(function(){
                        if(this.getAttribute("href")){
                            gallery.push({
                                srcUrl:this.getAttribute("href"),
                                description:this.getAttribute("title")
                            });
                        }
                    });
                    this.set("fullScreen", true);
                    this.set("gallery", gallery);

                },'.light-gallery', this));
                this.eventInstances.push(Y.one("body").delegate("click", function(e){
                    e.halt(true);

                    this.set("fullScreen", true);
                    this.set("gallery", [{
                        srcUrl:e.target.getAttribute("href"),
                        description:e.target.getAttribute("title")
                    }]);
                },'.light-picture', this));
            }
        },
        windowResizeEvent:function(){
            if(this.get("fullScreen")){
                this.scrollView.hide();
                this.syncUI();
                this.scrollView.show();
            }
        },
        next: function(){
            this.scrollView.pages.next();
        },
        prev: function(){
            this.scrollView.pages.prev();
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
            if(list.size()> index){
                list.item(index).addClass("gallery-selected");
            }
            if(this.images[index] && !this.images[index].loaded){
                this.loadImage(index);
            }

        },
        loadImage: function(i){
            var img;
            if(this.get(CONTENT_BOX).all("li").item(i).hasChildNodes()){
                return;
            }
            img = Y.Node.create("<img src='"+this.get("gallery")[i].srcUrl+"' ></img>");

            img.index = i;
            img.once("error", function(e){
                e.target.get("parentNode").setStyles({
                    background:"url('../../wegas-editor/images/wegas-icon-error-48.png') no-repeat 50%"
                });
            });
            img.once("load", function(e){
                e.target.get("parentNode").removeClass("img-loading");
                this.images[e.target.index].loaded = true;
            }, this);
            this.get(CONTENT_BOX).all("li").item(i).appendChild(img);
            if(this.get("gallery")[i].description) {
                this.get(CONTENT_BOX).all("li").item(i).appendChild("<div class='gallery-text'>"+this.get("gallery")[i].description+"</div>");
            }
        },
        destructor: function(){
            if(this.styleSheet){
                this.styleSheet.disable();
            }
            this.fullScreenNode.destroy();
            for ( var i = 0; i < this.eventInstances.length; i = i + 1 ){
                this.eventInstances[i].detach();
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
                        if ( Y.Lang.isString( o[i] ) ) {
                            o[i] = {                                            // If the arguent is a string, treat it as an url
                                srcUrl: o[i]
                            }
                        }
                        this.images[i] = {
                            loaded : false
                        };
                        this.get(CONTENT_BOX).appendChild("<li class='img-loading'></li>");
                    }
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
                value:250,
                validator: Y.Lang.isNumber
            },
            fullScreen:{
                value:false,
                validator:Y.Lang.isBoolean
            },
            lightGallery:{
                value:false,
                writeOnce: "initOnly",
                validator:Y.Lang.isBoolean
            }

        }
    });

    Y.namespace("Wegas").WegasGallery = WegasGallery;

    var FileExplorerGallery = Y.Base.create("wegas-gallery", WegasGallery, [], {

        loadImage: function(i) {
            var img, imgLoader;
            if(this.get(CONTENT_BOX).all("li").item(i).hasChildNodes()){
                return;
            }

            img = Y.Node.create("<img />");
            imgLoader = new Y.Wegas.ImgageLoader({
                target: img,
                srcUrl: Y.Plugin.CRDataSource.getFullpath( this.get("gallery")[i].srcUrl )
            });
            imgLoader.fetch();
            imgLoader.once( "load", function ( e ) {
                if ( e.meta.description ) {
                    this.get(CONTENT_BOX).all("li").item(i).appendChild("<div class='gallery-text'>" + e.meta.description + "</div>");
                }
            }, this );
            img.index = i;
            img.once("error", function(e){
                e.target.get("parentNode").setStyles({
                    background:"url('../../wegas-editor/images/wegas-icon-error-48.png') no-repeat 50%"
                });
            });
            img.once("load", function(e){
                e.target.get("parentNode").removeClass("img-loading");
                this.images[e.target.index].loaded = true;
            }, this);
            this.get(CONTENT_BOX).all("li").item(i).appendChild(img);

        }
    });

    Y.namespace("Wegas").FileExplorerGallery = FileExplorerGallery;
});
