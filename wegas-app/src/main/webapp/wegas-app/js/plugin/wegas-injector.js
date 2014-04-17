/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add("wegas-injector", function(Y) {
    "use strict";

    var MATCHER = "[data-file]", Injector;

    /**
     * @name Y.Plugin.Injector
     * @extends Y.Plugin.Base
     * @constructor
     * @description 
     * 
     * + light-picture class nodes : "href"|"src" attribute (url) , "title" attribute (description). <br/>
     *  Create a gallery with all elements with the same data-gallery attribute <br/>
     * + light-gallery class nodes : child nodes with "href"|"src" attribute (url), "title" attribute (description)
     */
    Injector = function() {
        Injector.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Injector, Y.Plugin.Base, {
        /** @lends Y.Plugin.Injector# */
        initializer: function() {
            this.handlers = [];

            // Add required events to Y.Node 
            Y.mix(Y.Node.DOM_EVENTS, {
                DOMNodeInserted: true
                        //DOMNodeRemoved: true,
                        //DOMCharacterDataModified: true
            });

            // data-file attribute injection
            var bb = this.get("host").get("boundingBox");
            this.handlers.push(bb.on("DOMNodeInserted", function(e) {
                if (this.timer) {
                    this.timer.cancel();
                }
                this.timer = Y.later(100, this, function() {
                    bb.all(MATCHER).each(Injector.parser);                      // Transform data-file attribute to src/href attribute
                    this.timer = null;
                });
            }, this));
            //this.afterHostEvent("*:render", function(e) {
            //    e.currentTarget.get("boundingBox").all(MATCHER).each(Injector.parser);// Transform data-file attribute to src/href attribute
            //}, this);

            // Load gallery on .light-gallery click
            this.handlers.push(Y.one("body").delegate("click", function(e) {
                var link, gallery = [];
                e.halt(true);
                e.target.get("children").each(function() {
                    link = this.getAttribute("href") || this.getAttribute("src");
                    if (link) {
                        gallery.push({
                            srcUrl: link,
                            description: this.get("title")
                        });
                    }
                });
                this.instantiateGallery(gallery);
            }, '.wegas-light-gallery', this));

            // Load gallery on .light-picture click
            this.handlers.push(Y.one("body").delegate("click", function(e) {
                var gallery = [], index,
                        link = e.target.getAttribute("href") || e.target.getAttribute("src");
                e.halt(true);
                if (e.target.hasAttribute("data-gallery")) {                    // Group same data-gallery together 
                    Y.all("[data-gallery='" + e.target.getAttribute("data-gallery") + "']").each(function(item, i) {
                        if (item === e.target) {
                            index = i;
                        }
                        gallery.push({
                            srcUrl: item.getAttribute("href") || item.getAttribute("src"),
                            description: item.get("title")
                        });
                    });
                    this.instanciateGallery(gallery, index);
                } else if (link) {
                    this.instanciateGallery([{
                            srcUrl: link,
                            description: e.target.get("title")
                        }]);
                }
            }, '.wegas-light-picture', this));
        },
        /**
         * 
         * @param {Array} gallery
         * @param {number} index
         */
        instantiateGallery: function(gallery, index) {
            Y.use("wegas-gallery", function() {                                 // Lazy load gallery
                if (!Injector.Gallery) {                                        // Singleton pattern
                    Injector.Gallery = new Y.Wegas.Gallery({//                  // Create gallery
                        lightGallery: true,
                        fullScreen: true
                    });
                    Injector.Gallery.render();                                  // and render it
                }
                Injector.Gallery.set("gallery", gallery);                       // Set the new set of pictures
                Injector.Gallery.set("fullScreen", true);
                if (index) {
                    Injector.Gallery.scrollView.pages.scrollToIndex(index);     // Scroll to current picture node
                }
            });
        },
        destructor: function() {
            if (this.timer) {
                this.timer.cancel();
            }
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        }
    }, {
        /** @lends Y.Plugin.Injector */
        NAME: "Injector",
        NS: "injector",
        /**
         * Replaces href/src attribute on given node with file repository URI
         * if necessary.
         * @param {Y.Node} element Node (usually img or a) to alter.
         * @returns {undefined}
         */
        parser: function(element) {
            var attr = (element.get("nodeName") === "IMG") ? "src" : "href";

            if (!element.hasAttribute(attr) || !element.getAttribute(attr).match("^(https?://)")) {
                element.set(attr, Y.Wegas.Facade.File.get("source") + "read" + element.getAttribute("data-file"))
                        .removeAttribute("data-file");
            }
        }
    });
    Y.Plugin.Injector = Injector;
});
