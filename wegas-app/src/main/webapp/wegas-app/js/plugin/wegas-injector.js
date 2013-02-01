/*
 * Wegas
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
        switch (element.getDOMNode().nodeName) {
            case "IMG":
                if (!element.hasAttribute("src") || !element.getAttribute("src").match("^(https?://)")) {
                    element.setAttribute("src", Y.Wegas.FileFacade.get("source") + "read" + element.getAttribute("data-file"));
                    element.removeAttribute("data-file");
                }
                break;
            default:
                if (!element.hasAttribute("href") || !element.getAttribute("href").match("^(http://)")) {
                    element.setAttribute("href", Y.Wegas.FileFacade.get("source")  + "read" + element.getAttribute("data-file"));
                    element.removeAttribute("data-file");
                }
        }
    };

    Y.extend(Injector, Y.Plugin.Base, {
        initializer: function() {
            Y.mix(Y.Node.DOM_EVENTS, {
                DOMNodeInserted: true,
                DOMNodeRemoved: true,
                DOMCharacterDataModified: true
            });
            this.gallery = false;

            this.insertEvent = this.get("host").get("boundingBox").delegate("DOMNodeInserted", function(e) {
                e.halt(true);
                e.currentTarget.all(MATCHER).each(parser);
                this.instanciateGallery(e.currentTarget);
            }, function(item) {
                return (item.all(MATCHER).size() > 0);
            }, this);

            this.afterHostEvent("*:render", function(e) {
                var bb = e.currentTarget.get("boundingBox");
                bb.all(MATCHER).each(parser);
                this.instanciateGallery(bb);
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
            if (this.gallery && Injector.GALLERY) {
                Injector.GALLERY_COUNTER -= 1;
                if (Injector.GALLERY_COUNTER === 0) {
                    Injector.GALLERY.destroy();
                }
            }
        }
    }, {
        NAME: "Injector",
        NS: "injector",
        GALLERY: null,
        GALLERY_COUNTER: 0,
        ATTRS: {}
    });
    Y.Plugin.Injector = Injector;

});

