/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 */

YUI.add("wegas-gallery", function (Y) {
    "use strict";

    var WegasGallery,
            CONTENT_BOX = "contentBox",
            BOUNDING_BOX = "boundingBox";

    /*
     * ATTRS:<br/>
     * gallery: {Array} an array of picture to display, format : {srcUrl: ...[, description: ...]}
     * fullScreen : {Boolean} toggles fullScreen<br/>
     * lightGallery : {Boolean} An instance which will read DOM for "light-picture" or "light-gallery" classes<br/>
     * <br/>
     * *light-picture class nodes : "href"|"src" attribute (url) , "title" attribute (description). <br/>
     *  Create a gallery with all elements with the same data-gallery attribute <br/>
     * *light-gallery class nodes : child nodes with "href"|"src" attribute (url), "title" attribute (description)
     */
    /**
     * @name Y.Wegas.WegasGallery
     * @extends Y.Widget
     * @borrows Y.Wegas.Widget
     * @class class to display image in lightbox
     * @constructor
     * @description Display image in lightbox with classic lightbox functions
     */
    WegasGallery = Y.Base.create("wegas-gallery", Y.Widget, [Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.WegasGallery#
         */
        // *** Private fields *** //
        /**
         * Content box of this widget, static
         */
        CONTENT_TEMPLATE: "<ul></ul>",

        /**
         * Reference to the ScrollView widget
         */
        scrollView: null,

        /**
         * Node to render gallery in full screen
         */
        fullScreenNode: null,

        /**
         * Default styleSheet of this widget
         */
        styleSheet: null,

        /**
         * Current display mode of this widget (boolean fullscreen)
         */
        isFullScreen: false,

        /**
         * Reference to each used functions
         * @private
         * @field
         */
        handlers: null,

        /**
         * image loaded in the widget
         */
        images: null,

        /**
         * @function
         * @private
         * @description Set variables with initials values.
         * Create a ScrollView and plug scrollViewScrollBars.
         */
        initializer: function () {
            var prev = Y.Widget.getByNode(".wegas-lightGallery");
            if (prev) {               // TODO: currently destroying previous one, do a singleton
                prev.destroy();
            }
            this.images = {};
            this.handlers = [];
            this.isFullScreen = false;
            this.fullScreenNode = new Y.Node.create("<span></span>");
            this.scrollView = new Y.ScrollView({
                width: (parseInt(this.get("selectedWidth")) + 30),
                srcNode: this.get(BOUNDING_BOX),
                axis: "x",
                flick: {
                    minDistance: 10,
                    minVelocity: 0.3,
                    axis: "x"
                },
                bounce: 0
            });

            if (this.get("lightGallery")) {
                this.set("render", "body");
                this.set("gallery", []);
                this.render();
            }

            this.scrollView.plug(Y.Plugin.ScrollViewScrollbars);
        },

        /**
         * @function
         * @private
         * @description Render DOM skeleton of this widget.
         */
        renderUI: function () {
            // LAZY init
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-mask gallery-mask-left'><div></div></div>");
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-mask gallery-mask-right'><div></div></div>");
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-toggle'></div>");
            this.get(CONTENT_BOX).appendChild("<li class='img-loading'></li>");
            if (this.get("lightGallery")) {
                this.scrollView.get(BOUNDING_BOX).addClass("wegas-lightGallery");
            } else if (this.get("gallery").length > 0) {
                this.loadImage(0);
            }
            this.fullScreenNode.appendTo(Y.one("body"));
        },

        /**
         * @function
         * @private
         * @description set the css of widget to adjust display to the
         *  loaded images
         */
        syncUI: function () {
            if (!this.scrollView.get("rendered")) {
                return;
            }
            var scrollViewId = "#" + this.scrollView.get("id") + " ", // prefix css with id, allow multiple instance with different style
                    selW = parseInt(this.get("selectedWidth")),
                    selH = this.get("selectedHeight"),
                    smaH,
                    smaW;

            if (this.styleSheet) {
                this.styleSheet.disable();
            }
            if (this.get("fullScreen") || this.get("lightGallery")) {
                selH = (Y.one("body").get("winHeight") - 100);
                selW = Y.one("body").get("winWidth") / 2;
                if (!this.isFullScreen) {
                    this.isFullScreen = true;
                    this.scrollView.get(BOUNDING_BOX).swap(this.fullScreenNode);
                }
            } else {
                if (this.isFullScreen) {
                    this.isFullScreen = false;
                    this.scrollView.get(BOUNDING_BOX).swap(this.fullScreenNode);
                }
            }
            smaW = (this.scrollView.get(BOUNDING_BOX).get("parentNode").get("region").width - parseInt(this.scrollView.get(BOUNDING_BOX).get("parentNode").getStyle("padding-right")) - parseInt(this.scrollView.get(BOUNDING_BOX).get("parentNode").getStyle("padding-left")) - selW - 90) / 2;
            smaH = selH * 0.5;
            //smaW = selW * 0.6;
            if (this.get("gallery").length > 0) {
                this.scrollView.show();
            } else {
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
                padding: "0 " + (smaW + 45) + "px 0 " + (smaW + 15) + "px"
            });

            this.scrollView.syncUI();
            if (this.scrollView.get("rendered")) {
                this.scrollView.pages.scrollToIndex(this.scrollView.pages.get("index"));
            }
            if (this.get("lightGallery") && !this.get("fullScreen")) {
                this.scrollView.hide();
            }
        },

        /**
         * @function
         * @private
         * @description bind function to events.
         * When full screen change, if it's the light gallery, show the
         *  scrollView (fullscreen) or hide it. if it's not the light Gallery,
         *  just do sync.
         * When node ".gallery-mask-left" is clicked, stop loading and display previous picture.
         * When node ".gallery-mask-right" is clicked, stop loading and display next picture.
         * When node ".gallery-toggle" is clicked, toggle fullscreen
         * When node ".gallery-mask-left" capte event "mousedown", prevent scrollview scrolling.
         * When node ".gallery-mask-right" capte event "mousedown", prevent scrollview scrolling.
         * When scrollEnd and after 600 milisecondes, load next pictures.
         * When window is resized, do windowResizeEvent.
         * When gallery Change, reset scrollview and select picture 0.
         * When node 'light-gallery' is clicked and if it's lightGallery,
         *  active full screen and load pictures.
         */
        bindUI: function () {
            this.after("fullScreenChange", function (e) {
                if (this.get("lightGallery")) {
                    if (this.get("fullScreen")) {
                        this.scrollView.show();
                    } else {
                        this.scrollView.hide();
                    }
                } else {
                    this.syncUI();
                }
            });

            this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-left').on("click", function (e) {
                e.halt(true);
                this.prev();

            }, this);
            this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-right').on("click", function (e) {
                e.halt(true);
                this.next();
            }, this);
            this.scrollView.get(BOUNDING_BOX).one('.gallery-toggle').on("click", function (e) {
                this.set("fullScreen", !this.get("fullScreen"));
            }, this);
            //Prevent scroll on borders
            this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-left').on("mousedown", function (e) {
                e.halt(true);
            });
            this.scrollView.get(BOUNDING_BOX).one('.gallery-mask-right').on("mousedown", function (e) {
                e.halt(true);
            });
            this.scrollView.after("scrollEnd", function (e) {
                this.scrollView.pages.scrollToIndex(this.scrollView.pages.get("index"));              //Constrain
                Y.later(600, this, function () {                                  // Let some time before loading next one
                    var index = this.scrollView.pages.get("index");
                    if (this.images[index + 1] && !this.images[index + 1].loaded) {
                        this.loadImage(index + 1);
                    }
                    if (this.images[index - 1] && !this.images[index - 1].loaded) {
                        this.loadImage(index - 1);
                    }
                });

            }, this);
            this.handlers.push(Y.on("windowresize", Y.bind(this.windowResizeEvent, this)));
            this.after("galleryChange", function (e) {
                if (e.newVal.length > 0) {
                    this.loadImage(0);
                    if (e.newVal.length > 1) {
                        this.loadImage(1);
                    }
                    if (!this.scrollView.get("rendered")) {
                        this.scrollView.plug(Y.Plugin.ScrollViewPaginator, {
                            selector: 'li'
                        });

                        this.scrollView.render();
                        this.scrollView.pages.after("indexChange", function (e) {
                            this.setSelected(e.target.get("index"));
                        }, this);
                    } else {
                        this.scrollView.syncUI();

                    }
                    this.setSelected(0);
                    this.scrollView.pages.set("index", 0);
                    this.syncUI();
                    arguments: [{
                            type: "hidden",
                            value: "self"
                        }];
                }
            });
            if (this.get("lightGallery")) {
                this.handlers.push(Y.one("body").delegate("click", function (e) {
                    var children, gallery = [];
                    e.halt(true);
                    children = e.target.get("children");
                    children.each(function () {
                        if (this.getAttribute("href") || this.getAttribute("src")) {
                            gallery.push({
                                srcUrl: this.getAttribute("href") || this.getAttribute("src"),
                                description: this.getAttribute("title")
                            });
                        }
                    });
                    this.set("fullScreen", true);
                    this.set("gallery", gallery);

                }, '.light-gallery', this));
                this.handlers.push(Y.one("body").delegate("click", function (e) {
                    var gallery = [], index;
                    e.halt(true);
                    if (e.target.getAttribute("href") || e.target.getAttribute("src")) {
                        this.set("fullScreen", true);
                        if (e.target.hasAttribute("data-gallery")) {            /* group same data-gallery together */
                            Y.all("[data-gallery='" + e.target.getAttribute("data-gallery") + "']").each(function (item, i) {
                                if (item === e.target) {
                                    index = i;
                                }
                                gallery.push({
                                    srcUrl: item.getAttribute("href") || item.getAttribute("src"),
                                    description: item.getAttribute("title")
                                });
                            });
                            this.set("gallery", gallery);
                            this.scrollView.pages.scrollToIndex(index);
                        } else {
                            this.set("gallery", [{
                                    srcUrl: e.target.getAttribute("href") || e.target.getAttribute("src"),
                                    description: e.target.getAttribute("title")
                                }]);
                        }
                    }
                }, '.light-picture', this));
            }
        },

        /**
         * @function
         * @private
         * @description disable stylesheet, remove full screen node and detach
         *  all functions created by this widget.
         */
        destructor: function () {
            if (this.styleSheet) {
                this.styleSheet.disable();
            }
            this.fullScreenNode.destroy();
            for (var i = 0; i < this.handlers.length; i = i + 1) {
                this.handlers[i].detach();
            }
        },

        // *** Private Methods *** //
        /**
         * @function
         * @private
         * @description if this is in fullscreen, do sync properly
         */
        windowResizeEvent: function () {
            if (this.get("fullScreen")) {
                this.scrollView.hide();
                this.syncUI();
                this.scrollView.show();
            }
        },

        /**
         * @function
         * @private
         * @description pass to the next page in scrollview.
         */
        next: function () {
            this.scrollView.pages.next();
        },

        /**
         * @function
         * @private
         * @description pass to the previous page in scrollview.
         */
        prev: function () {
            this.scrollView.pages.prev();
        },

        /**
         * @function
         * @private
         * @param index
         * @description call "loadImage fonction to load selected image and
         *  hide/show next/previous picture's controls accordings with the
         *  existence of a next/previous picture.
         */
        setSelected: function (index) {
            var list = this.get(CONTENT_BOX).all("li");
            list.each(function () {
                this.removeClass("gallery-selected");
                this.removeClass("gallery-before-selected");
            });
            if (index > 0) {
                list.item(index - 1).addClass("gallery-before-selected");
                this.scrollView.get(BOUNDING_BOX).one(".gallery-mask-left > div").show();
            } else {
                this.scrollView.get(BOUNDING_BOX).one(".gallery-mask-left > div").hide();
            }
            if (index === list.size() - 1) {
                this.scrollView.get(BOUNDING_BOX).one(".gallery-mask-right > div").hide();
            } else {
                this.scrollView.get(BOUNDING_BOX).one(".gallery-mask-right > div").show();
            }
            if (list.size() > index) {
                list.item(index).addClass("gallery-selected");

            }
            if (this.images[index] && !this.images[index].loaded) {
                this.loadImage(index);
            }

        },

        /**
         * @function
         * @private
         * @param i
         * @description load selected image or display error's image if an error
         * occur.
         */
        loadImage: function (i) {
            var img;
            if (this.get(CONTENT_BOX).all("li").item(i).hasChildNodes()) {
                return;
            }
            img = Y.Node.create("<img src='" + this.get("gallery")[i].srcUrl + "' ></img>");

            img.index = i;
            img.once("error", function (e) {
                e.target.get("parentNode").setStyles({
                    background: "url('../../wegas-app/images/wegas-icon-error-48.png') no-repeat 50%"
                });
            });
            img.once("load", function (e) {
                e.target.get("parentNode").removeClass("img-loading");
                this.images[e.target.index].loaded = true;
            }, this);
            this.get(CONTENT_BOX).all("li").item(i).appendChild(img);
            if (this.get("gallery")[i].description) {
                this.get(CONTENT_BOX).all("li").item(i).appendChild("<div class='gallery-text'>" + this.get("gallery")[i].description + "</div>");
            }
        }
    }, {
        /** @lends Y.Wegas.WegasGallery */

        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>gallery: contains list of pictures</li>
         *    <li>selectedWidth: width of the gallery</li>
         *    <li>selectedHeight: height of the gallery</li>
         *    <li>fullScreen: display mode of the gallery (boolean)</li>
         *    <li>lightGallery: style mode of the gallery (boolean)</li>
         * </ul>
         */
        ATTRS: {
            /**
             *  Contains list of pictures
             */
            gallery: {
                value: [],
                lazyAdd: true,
                setter: function (o) {
                    this.get(CONTENT_BOX).empty();
                    this.images = {};
                    for (var i in o) {
                        if (Y.Lang.isString(o[i])) {
                            o[i] = {// If the arguent is a string, treat it as an url
                                srcUrl: o[i]
                            };
                        }
                        this.images[i] = {
                            loaded: false
                        };
                        this.get(CONTENT_BOX).appendChild("<li class='img-loading'></li>");
                    }
                    return o;
                }
            },
            /**
             * Width of the gallery
             */
            selectedWidth: {
                value: 250,
                validator: Y.Lang.isNumber,
                setter: function (v) {
                    if (this.scrollView) {
                        this.scrollView.set("width", (parseInt(v) + 30));
                    }
                    return v;
                }
            },
            /**
             * Height of the gallery
             */
            selectedHeight: {
                value: 250,
                validator: Y.Lang.isNumber
            },
            /**
             * Display mode of the gallery (boolean)
             */
            fullScreen: {
                value: false,
                validator: Y.Lang.isBoolean
            },
            /**
             * Style mode of the gallery (boolean)
             */
            lightGallery: {
                value: false,
                writeOnce: "initOnly",
                validator: Y.Lang.isBoolean
            }

        }
    });
    Y.namespace("Wegas").WegasGallery = WegasGallery;

    /**
     * @name Y.Wegas.FileExplorerGallery
     * @extends Y.Wegas.WegasGallery
     * @class class to create a loader-image
     * @constructor
     * @description create a loader-image and remove them when wanted image
     *  is loaded.
     */
    var FileExplorerGallery = Y.Base.create("wegas-gallery", WegasGallery, [], {
        /** @lends Y.Wegas.FileExplorerGallery */

        // *** Private Methods *** //
        /**
         * @function
         * @private
         * @param i
         * @description create a loader-image and remove them when wanted image
         *  is loaded. If an error occur, display an error image.
         */
        loadImage: function (i) {
            var img, imgLoader;
            if (this.get(CONTENT_BOX).all("li").item(i).hasChildNodes()) {
                return;
            }

            img = Y.Node.create("<img />");
            imgLoader = new Y.Wegas.ImgageLoader({
                target: img,
                srcUrl: Y.Plugin.CRDataSource.getFullpath(this.get("gallery")[i].srcUrl)
            });
            imgLoader.fetch();
            imgLoader.once("load", function (e) {
                if (e.meta.description) {
                    this.get(CONTENT_BOX).all("li").item(i).appendChild("<div class='gallery-text'>" + e.meta.description + "</div>");
                }
            }, this);
            img.index = i;
            img.once("error", function (e) {
                e.target.get("parentNode").setStyles({
                    background: "url('../../wegas-editor/images/wegas-icon-error-48.png') no-repeat 50%"
                });
            });
            img.once("load", function (e) {
                e.target.get("parentNode").removeClass("img-loading");
                this.images[e.target.index].loaded = true;
            }, this);
            this.get(CONTENT_BOX).all("li").item(i).appendChild(img);

        }
    });
    Y.namespace("Wegas").FileExplorerGallery = FileExplorerGallery;

});
