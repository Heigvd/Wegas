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

YUI.add("wegas-injector", function(Y) {
    "use strict";
    var MATCHER = "[data-file]",
            Injector = function(cfg) {
        Injector.superclass.constructor.apply(this, arguments);
    },
            parser = function(element) {
        var nodeName = element.getDOMNode().nodeName;
        switch (nodeName) {
            case "IMG":
                if (!element.hasAttribute("src")) {
                    element.setAttribute("src", Y.Wegas.app.get("dataSources").File.source + "read" + element.getAttribute("data-file"));
                }
                break;
            default:
                if (!element.hasAttribute("href")) {
                    element.setAttribute("href", Y.Wegas.app.get("dataSources").File.source + "read" + element.getAttribute("data-file"));
                }
        }
    };

    Y.extend(Injector, Y.Plugin.Base, {
        initializer: function() {
            this.gallery = false;
            this.insertEvent = this.get("host").get("boundingBox").delegate("DOMNodeInserted", function(e) {
                parser(e.currentTarget);
                this.instanciateGallery(e.currentTarget);
            }, MATCHER, this);
            this.renderEvent = this.afterHostEvent("*:render", function(e) {
                var list = e.currentTarget.get("boundingBox").all(MATCHER);
                list.each(function(item) {
                    parser(item);
                });
                this.instanciateGallery(e.currentTarget.get("boundingBox"));
            }, this);
        },
        instanciateGallery: function(element) {
            /* Check for gallery elements and loads it*/
            if (!this.gallery && (element.one(".light-picture") || element.one(".light-gallery"))) {
                if (!Injector.GALLERY) {
                    Y.use("wegas-gallery", function() {
                        Injector.GALLERY = new Y.Wegas.WegasGallery({
                            "lightGallery": true
                        });
                    });
                }
                Injector.GALLERY_COUNTER += 1;
                this.gallery = true;
            }
        },
        destructor: function() {
            this.insertEvent.detach();
            this.renderEvent.detach();
            if (this.gallery && Injector.GALLERY) {
                Injector.GALLERY_COUNTER -= 1;
                if (Injector.GALLERY_COUNTER === 0) {
                    Injector.GALLERY.destroy();
                }
            }
        }
    });
    Injector.NAME = "Injector";
    Injector.NS = "injector";
    Injector.GALLERY = null;
    Injector.GALLERY_COUNTER = 0;
    Injector.ATTRS = {
    };

    Y.Plugin.Injector = Injector;
});
