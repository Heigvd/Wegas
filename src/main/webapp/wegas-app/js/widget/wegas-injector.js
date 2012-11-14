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

    function Injector(cfg) {
        Injector.superclass.constructor.apply(this, arguments);
    }

    Y.extend(Injector, Y.Plugin.Base, {
        initializer: function() {
            this.insertEvent = this.get("host").get("boundingBox").delegate("DOMNodeInserted", function(e) {
                parser(e.currentTarget);
            }, MATCHER);
            this.renderEvent = this.afterHostEvent("*:render", function(e) {
                var list = e.currentTarget.get("boundingBox").all(MATCHER);
                list.each(function(item) {
                    parser(item);
                }
                );
            });
        },
        destructor: function() {
            this.insertEvent.detach();
            this.renderEvent.detach();
        }
    });
    Injector.NAME = "Injector";
    Injector.NS = "injector";
    Injector.ATTRS = {
    };

    Y.Plugin.Injector = Injector;
});
