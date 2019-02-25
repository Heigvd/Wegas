/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod cyril.junod at gmail.com
 */
YUI.add('wegas-layout-absolute', function(Y) {
    "use strict";
    var AbsoluteLayout, PositionPlugin;
    /**
     * @name Y.Wegas.AbsoluteLayout
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.WidgetParent, Y.Wegas.Editable, Y.Wegas.Parent
     * @constructor
     * @description Absolute position layout
     */
    AbsoluteLayout = Y.Base.create("wegas-absolutelayout", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
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
                if (!e.child.CSSPosition) {
                    e.child.plug(Y.Plugin.CSSPosition, {styles: {
                            position: "absolute",
                            top: "0px",
                            left: "0px",
                            zIndex: "10"
                        }
                    });
                }
                if (!e.child.CSSSize) {
                    e.child.plug(Y.Plugin.CSSSize);
                }
            });
            this.onceAfter("render", function(e) {
                this.each(function(item) {
                    if (!item.CSSPosition) {
                        item.plug(Y.Plugin.CSSPosition, {styles: {
                                position: "absolute",
                                top: "0px",
                                left: "0px"
                            }
                        });
                    }
                    if (!item.CSSSize) {
                        item.plug(Y.Plugin.CSSSize);
                    }
                });
            });
        }
    }, {
        /**
         * @lends Y.Wegas.AbsoluteLayout
         */
        NAME: "wegas-absolutelayout",
        CSS_PREFIX: "wegas-absolutelayout",
        EDITORNAME: "Absolute layout",
        ATTRS: {
        }
    });
    Y.Wegas.AbsoluteLayout = AbsoluteLayout;


    /**
     * @deprecated use CSSPosition instead
     */
    PositionPlugin = Y.Base.create("wegas-position", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /**
         * @lends Y.Plugin.Position#
         */
        initializer: function() {
            Y.log("warn", "Deprecated, use Y.Plugin.CSSPosition", "Y.Plugin.Position");
            this.get("host").get("boundingBox").setStyle("position", "absolute");
            this.set("left", this.get("left"));
            this.set("top", this.get("top"));
            this.set("right", this.get("right"));
            this.set("bottom", this.get("bottom"));
        }
    }, {
        /**
         * @lends Y.Plugin.Position
         */
        NAME: "position",
        NS: "position",
        ATTRS: {
            left: {
                type: "number",
                optional: true,
                setter: function(value) {
                    if (!Y.Lang.isNumber(parseInt(value, 10))) {
                        return null;
                    }
                    this.get("host").get("boundingBox").setStyle("left", +value + "px");
                    return parseInt(value, 10);
                },
                getter: Y.Wegas.Editable.removeNullValue
            },
            top: {
                type: "number",
                optional: true,
                setter: function(value) {
                    if (!Y.Lang.isNumber(parseInt(value, 10))) {
                        return null;
                    }
                    this.get("host").get("boundingBox").setStyle("top", +value + "px");
                    return parseInt(value, 10);
                },
                getter: Y.Wegas.Editable.removeNullValue
            },
            right: {
                type: "number",
                optional: true,
                setter: function(value) {
                    if (!Y.Lang.isNumber(parseInt(value, 10))) {
                        return null;
                    }
                    this.get("host").get("boundingBox").setStyle("right", +value + "px");
                    return parseInt(value, 10);
                },
                getter: Y.Wegas.Editable.removeNullValue
            },
            bottom: {
                type: "number",
                optional: true,
                setter: function(value) {
                    if (!Y.Lang.isNumber(parseInt(value, 10))) {
                        return null;
                    }
                    this.get("host").get("boundingBox").setStyle("bottom", +value + "px");
                    return parseInt(value, 10);
                },
                getter: Y.Wegas.Editable.removeNullValue
            }
        }
    });
    Y.Plugin.Position = PositionPlugin;
});
