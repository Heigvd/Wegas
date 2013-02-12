/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod cyril.junod at gmail.com
 */
YUI.add('wegas-absolutelayout', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', AbsoluteLayout, PositionPlugin;

    /**
     * @name Y.Wegas.AbsoluteLayout
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @constructor
     * @description Absolute position container
     */
    AbsoluteLayout = Y.Base.create("wegas-absolutelayout", Y.Widget,
            [Y.WidgetChild, Y.WidgetParent, Y.Wegas.Widget, Y.Wegas.Editable], {
        /**
         * @lends Y.Wegas.AbsoluteLayout#
         */
        CONTENT_TEMPLATE: "<div style='position:relative'></div>",
        /**
         * @private
         * @function
         * @returns {undefined}
         */
        bindUI: function() {
            this.after("addChild", function(e) {
                console.log("ssss", e);
            });
            this.onceAfter("render", function(e) {
                this.each(function(item) {
                    if (!item.position) {
                        item.plug(Y.Plugin.Position);
                    }
                });
            });
        },
        toObject: function() {
            var i, object, children = [], args = Array.prototype.slice.call(arguments);
            object = Y.Wegas.Editable.prototype.toObject.apply(this, args);
            for (i = 0; i < this.size(); i = i + 1) {
                children.push(this.item(i).toObject(args));
            }
            object.children = children;
            return object;
        }
    }, {
        /**
         * @lends Y.Wegas.AbsoluteLayout
         */
        NAME: "wegas-absolutelayout",
        ATTRS: {
        }
    });

    PositionPlugin = Y.Base.create("wegas-position", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /**
         * @lends Y.Plugin.Position#
         */
        initializer: function() {
            this.get("host").get("boundingBox").setStyle("position", "absolute");
            this.set("x", this.get("x"));
            this.set("y", this.get("y"));
        }
    }, {
        /**
         * @lends Y.Plugin.Position
         */
        NAME: "position",
        NS: "position",
        ATTRS: {
            x: {
                value: 0,
                setter: function(value) {
                    this.get("host").get("boundingBox").setStyle("left", +value + "px");
                    return value;
                }
            },
            y: {
                value: 0,
                setter: function(value) {
                    this.get("host").get("boundingBox").setStyle("top", +value + "px");
                    return value;
                }
            }
        }
    });

    Y.namespace('Wegas').AbsoluteLayout = AbsoluteLayout;
    Y.namespace("Plugin").Position = PositionPlugin;
});