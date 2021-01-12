/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add("wegas-gallery", function(Y) {
    "use strict";

    var Gallery,
        CONTENT_BOX = "contentBox",
        BOUNDING_BOX = "boundingBox";

    /**
     * ATTRS:<br/>
     * gallery: {Array} an array of picture to display, format : {srcUrl: ...[, description: ...]}
     * fullScreen : {Boolean} toggles fullScreen<br/>
     * lightGallery : {Boolean} An instance which will read DOM for "light-picture" or "light-gallery" classes<br/>
     * 
     * @name Y.Wegas.Gallery
     * @extends Y.Widget
     * @borrows Y.Wegas.Widget
     * @class class to display image in lightbox
     * @constructor
     * @description Display image in lightbox with classic lightbox functions
     */
    Gallery = Y.Base.create("wegas-gallery", Y.Widget, [], {
        /** @lends Y.Wegas.Gallery# */
        /**
         * Content box of this widget, static
         * @field
         * @private
         */
        CONTENT_TEMPLATE: "<ul><li class='img-loading'></li></ul>",
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         * Create a ScrollView
         */
        initializer: function() {
            /**
             * Store reference to fullscreen node
             * @field
             * @private
             */
            if (!Gallery.FULLSCREENNODE) {                                      // Init singleton full screen node
                var fullscreenNode = new Y.Node.create("<div class='gallery-fullscreen'><span></span></div>");
                Y.one("body").append(fullscreenNode);
                Gallery.FULLSCREENNODE = fullscreenNode.get("firstChild");
            }
            /**
             * image loaded in the widget
             * @field
             * @private
             */
            this.images = {};
            /**
             * Reference to each used functions
             * @field
             * @private
             */
            this.handlers = [];
            /**
             * Current display mode of this widget (boolean fullscreen)
             * @field
             * @private
             */
            this.isFullScreen = false;
            /**
             * Reference to the ScrollView widget
             * @field
             * @private
             */
            this.scrollView = new Y.ScrollView({
                width: (parseInt(this.get("selectedWidth")) + 30),
                srcNode: this.get(BOUNDING_BOX),
                axis: "x",
                flick: false,
                bounce: 0,
                drag: false
            });

            Y.StyleSheet.register(new Y.StyleSheet(), this.get("id"));
        },
        /**
         * @function
         * @private
         * @description Render DOM skeleton of this widget.
         */
        renderUI: function() {
            // LAZY init
            this.scrollView.get(BOUNDING_BOX).append("<div class='gallery-mask gallery-mask-left'><div></div></div>"
                + "<div class='gallery-mask gallery-mask-right'><div></div></div>"
                + "<div class='gallery-toggle'></div>"
                + "<div class='gallery-scroll-indicator'></div>");
            if (this.get("lightGallery")) {
                this.scrollView.get(BOUNDING_BOX).addClass("wegas-lightGallery");
            } else if (this.get("gallery").length > 0) {
                this.loadImage(0);
            }
            this.galleryChangeEvent({
                newVal: this.get("gallery")
            });
        },
        /**
         * @function
         * @public
         * @description set the css of widget to adjust display to the
         *  loaded images
         *  @returns {undefined}
         */
        syncUI: function() {
            if (!this.scrollView.get("rendered")) {
                return;
            }
            var smaH, smaW, container,
                selW = parseInt(this.get("selectedWidth")),
                selH = this.get("selectedHeight"),
                galleryId = "#" + this.scrollView.get("id") + " ", // prefix css with id, allow multiple instance with different style
                styleSheet = Y.StyleSheet(this.get("id")),
                bb = this.scrollView.get(BOUNDING_BOX);

            this.set("selectedWidth", this.get("selectedWidth"));
            this.set("selectedHeight", selH);

            if (styleSheet) {
                styleSheet.disable();
            }
            if (this.get("fullScreen") || this.get("lightGallery")) {
                selH = Y.one("body").get("winHeight") - 100;
                selW = Y.one("body").get("winWidth") / 1.7;
                if (!this.isFullScreen) {
                    this.isFullScreen = true;
                    bb.swap(Gallery.FULLSCREENNODE);
                }
            } else {
                if (this.isFullScreen) {
                    this.isFullScreen = false;
                    bb.swap(Gallery.FULLSCREENNODE);
                }
            }
            container = bb.get("parentNode");
            smaW = (parseInt(container.getComputedStyle("width")) - selW - 90) / 2;
            smaH = selH * 0.5;
            //smaW = selW * 0.6;
            if (this.get("gallery").length > 0) {
                this.scrollView.show();
            } else {
                this.scrollView.hide();
                return;
            }
            this.scrollView.set("width", selW + 30);
            styleSheet.set(galleryId + ".wegas-gallery li", {width: (selW + 30) + "px", height: (selH + 30) + "px"});
            styleSheet.set(galleryId + ".gallery-mask", {width: (smaW + 30) + "px"});
            styleSheet.set(galleryId + ".gallery-text", {width: (selW + 24) + "px", "maxHeight": selH + "px"});
            styleSheet.set(galleryId + ".wegas-gallery img", {"maxWidth": smaW + "px", "maxHeight": (selH + 30) + "px"});
            styleSheet.set(galleryId + ".wegas-gallery .gallery-selected img", {"maxWidth": selW + "px", "maxHeight": selH + "px"});

            styleSheet.enable();
            bb.setStyles({
                padding: "0 " + (smaW + 45) + "px 0 " + (smaW + 15) + "px"
            });
            this.scrollView.syncUI();
            if (this.scrollView.get("rendered")) {
                this.scrollView.pages.scrollToIndex(+this.scrollView.pages.get("index"));
            }
            if (this.get("lightGallery") && !this.get("fullScreen")) {
                this.scrollView.hide();
            }
            this.genScrollIndicator();
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
        bindUI: function() {
            /* CLICK events */
            var bb = this.scrollView.get(BOUNDING_BOX);
            bb.one(".gallery-scroll-indicator").delegate("click", function(e) { // Scroll indicators 
                e.halt(true);
                this.scrollView.pages.scrollToIndex(+e.currentTarget.getData("index"));
            }, "span", this);
            bb.one('.gallery-mask-left > div').on("click", function(e) {        // Scroll left button
                e.halt(true);
                this.prev();
            }, this);
            bb.one('.gallery-mask-right > div').on("click", function(e) {       // Scroll right button
                e.halt(true);
                this.next();
            }, this);
            bb.one('.gallery-toggle').on("click", function(e) {                 // Toggle full screen button 
                e.halt(true);
                this.set("fullScreen", !this.get("fullScreen"));
            }, this);
            this.get(CONTENT_BOX).delegate("click", function(e) {               // When a picture is clicked,
                if (!this.get("fullScreen")) {
                    e.halt(true);
                    this.set("fullScreen", true);                               // Go full screen
                }
            }, "li > *", this);
            bb.on("click", function(e) {                                        //
                e.halt(true);
                this.set("fullScreen", false);
            }, this);
            /* SYSTEM events */
            this.scrollView.after("scrollEnd", function(e) {
                Y.later(50, this, function() {                                  // Let some time before loading next one
                    var index = +this.scrollView.pages.get("index");
                    if (this.images[index + 1] && !this.images[index + 1].loaded) {
                        this.loadImage(index + 1);
                    }
                    if (this.images[index - 1] && !this.images[index - 1].loaded) {
                        this.loadImage(index - 1);
                    }
                });
            }, this);
            this.after("fullScreenChange", function(e) {
                if (this.get("lightGallery")) {
                    this.scrollView.set("visible", this.get("fullScreen"));
                } else {
                    this.syncUI();
                }
            });
            this.handlers.push(Y.on("windowresize", Y.bind(this.windowResizeEvent, this)));
            this.after("galleryChange", this.galleryChangeEvent);
        },
        galleryChangeEvent: function(event) {
            if (event.newVal.length > 0) {
                this.loadImage(0);
                if (event.newVal.length > 1) {
                    this.loadImage(1);
                }
                if (!this.scrollView.get("rendered")) {
                    this.scrollView.plug(Y.Plugin.ScrollViewPaginator, {
                        selector: 'li'
                    });
                    this.scrollView.render();
                    this.scrollView.pages.after("indexChange", function(e) {
                        this.setSelected(e.target.get("index"));
                    }, this);
                } else {
                    this.scrollView.syncUI();
                }

                this.scrollView.pages.set("index", 0);
                this.syncUI();
                this.setSelected(0);
            }
        },
        /**
         * @function
         * @private
         * @description disable stylesheet, remove full screen node and detach
         *  all functions created by this widget.
         */
        destructor: function() {
            if (Y.StyleSheet(this.get("id"))) {
                Y.StyleSheet(this.get("id")).disable();
            }
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
            this.scrollView.destroy();
            this.get("boundingBox").purge(true);
        },
        // *** Private Methods *** //
        /**Generate index indicator
         * @private
         * @function
         * @returns {undefined}
         */
        genScrollIndicator: function() {
            var container = this.scrollView.get(BOUNDING_BOX).one(".gallery-scroll-indicator");
            container.empty();
            if (this.get("gallery").length > 1) {
                container.append(Y.Array.map(this.get("gallery"), function(item, i) {
                    return "<span data-index='" + i + "'></span>";
                }).join(""));
                this.setSelected(+this.scrollView.pages.get("index"));
            }
        },
        /**
         * @function
         * @private
         * @description if this is in fullscreen, do sync properly
         */
        windowResizeEvent: function() {
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
        next: function() {
            this.scrollView.pages.next();
        },
        /**
         * @function
         * @private
         * @description pass to the previous page in scrollview.
         */
        prev: function() {
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
        setSelected: function(index) {
            var bb = this.scrollView.get(BOUNDING_BOX),
                list = this.get(CONTENT_BOX).all("li");

            index = +index;

            list.removeClass("gallery-selected")
                .removeClass("gallery-before-selected");

            if (+index > 0) {
                list.item(index - 1).addClass("gallery-before-selected");
            }
            bb.one(".gallery-mask-left > div").toggleView(+index > 0);
            bb.one(".gallery-mask-right > div").toggleView(index !== list.size() - 1);

            if (list.size() > index) {
                list.item(index).addClass("gallery-selected");
            }
            if (this.images[index] && !this.images[index].loaded) {
                this.loadImage(index);
            }
            bb.one(".gallery-scroll-indicator").all("span").each(function(item, i) {
                item.toggleClass("gallery-current-index", index === i);
            });
        },
        /**
         * @function
         * @private
         * @param i
         * @description load selected image or display error's image if an error
         * occur.
         */
        loadImage: function(index) {
            var target = this.get(CONTENT_BOX).all("li").item(index),
                cfg = this.get("gallery")[index],
                img = Y.Node.create("<img src='" + cfg.srcUrl + "' />");

            if (target.hasChildNodes()) {
                return;
            }
            img.index = index;
            img.once("error", function(e) {
                e.target.get("parentNode").setStyles({
                    background: "url('wegas-app/images/wegas-icon-error-48.png') no-repeat 50%"
                });
            });
            img.once("load", function(e) {
                e.target.get("parentNode").removeClass("img-loading");
                this.images[e.target.index].loaded = true;
            }, this);
            target.appendChild(img);
            if (cfg.description) {
                target.appendChild("<div class='gallery-text'>" + cfg.description + "</div>");
            }
        }
    }, {
        /** @lends Y.Wegas.Gallery */
        CSS_PREFIX: "wegas-gallery",
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
                type: "array",
                lazyAdd: true,
                setter: function(o) {
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
                type: "number",
                validator: Y.Lang.isNumber,
                setter: function(v) {
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
                type: "number",
                validator: Y.Lang.isNumber
            },
            /**
             * Display mode of the gallery (boolean)
             */
            fullScreen: {
                value: false,
                "transient": "true",
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
    Y.namespace("Wegas.util").Gallery = Gallery;

    /**
     * @name Y.Wegas.FileLibraryGallery
     * @extends Y.Wegas.Gallery
     * @class class to create a loader-image
     * @constructor
     * @description create a loader-image and remove them when wanted image
     *  is loaded.
     */
    var FileLibraryGallery = Y.Base.create("wegas-gallery", Gallery, [], {
        /** @lends Y.Wegas.FileLibraryGallery */
        // *** Private Methods *** //
        /**
         * @function
         * @private
         * @param i
         * @description create a loader-image and remove them when wanted image
         *  is loaded. If an error occur, display an error image.
         */
        loadImage: function(i) {
            var img, imgLoader;
            if (this.get(CONTENT_BOX).all("li").item(i).hasChildNodes()) {
                return;
            }

            img = Y.Node.create("<img />");
            imgLoader = new Y.Wegas.ImgageLoader({
                target: img,
                srcUrl: Y.Wegas.Facade.File.getPath() + this.get("gallery")[i].srcUrl
            });
            imgLoader.fetch();
            imgLoader.once("load", function(e) {
                if (e.meta.description) {
                    this.get(CONTENT_BOX).all("li").item(i).appendChild("<div class='gallery-text'>" + e.meta.description + "</div>");
                }
            }, this);
            img.index = i;
            img.once("error", function(e) {
                e.target.get("parentNode").setStyles({
                    background: "url('wegas-app/images/wegas-icon-error-48.png') no-repeat 50%"
                });
            });
            img.once("load", function(e) {
                e.target.get("parentNode").removeClass("img-loading");
                this.images[e.target.index].loaded = true;
            }, this);
            this.get(CONTENT_BOX).all("li").item(i).appendChild(img);
        }
    }, {
        CSS_PREFIX: "wegas-gallery"
    });
    Y.namespace("Wegas.util").FileLibraryGallery = FileLibraryGallery;

    /**
     * Editable Gallery
     */
    Y.Wegas.Gallery = Y.Base.create("wegas-gallery", Gallery, [Y.Wegas.Widget, Y.Wegas.Editable], {}, {});

});
