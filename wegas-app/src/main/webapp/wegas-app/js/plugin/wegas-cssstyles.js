/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-cssstyles', function(Y) {
    "use strict";

    /**
     *  @class Add styles CSS styles
     *  @name Y.Plugin.CSSStyles
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var CSSStyles = Y.Base.create("wegas-cssstyles", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /** @lends Y.Plugin.CSSStyles */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.styleList = [];
            if (this.get("host") instanceof Y.Widget) {
                this.onceAfterHostEvent("render", function() {
                    this.setValue(this.get("styles"));
                });
            } else if (this.get("host") instanceof Y.Node) {
                this.setValue(this.get("styles"));
            } else {
                Y.log("Host's type mistmach", "warn", "Y.Plugin.CSSStyles");
                return;
            }
            this.after("stylesChange", function(e) {
                this.removeStyle(e);
                this.setValue(e.newVal);
            });
        },
        /**
         * @function
         * @private
         * @description remove a style
         */
        removeStyle: function(e) {
            var styleToRemove;
            for (styleToRemove in e.prevVal) {
                if (e.prevVal.hasOwnProperty(styleToRemove) && !e.newVal.hasOwnProperty(styleToRemove)) {
                    this.nodeStyle(styleToRemove, "");
                    this.styleList.splice(Y.Array.indexOf(this.styleList, styleToRemove));
                }
            }
        },
        /**
         * @function
         * @private
         */
        setStyle: function(newStylesList, style) {
            if (Y.Array.indexOf(this.styleList, style) === -1) {
                this.styleList.push(style);
            }
            this.nodeStyle(style, newStylesList[style]);
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            var styleToRemove;
            for (styleToRemove in this.get("styles")) {
                if (this.get("styles").hasOwnProperty(styleToRemove)) {
                    this.nodeStyle(styleToRemove, "");
                    this.styleList.splice(Y.Array.indexOf(this.styleList, styleToRemove));
                }
            }
        },
        /**
         *
         * @private
         * @param {type} key Style to edit
         * @param {type} value Style's value
         * @returns {undefined}
         */
        nodeStyle: function(key, value) {
            var host = this.get("host"),
                node = host instanceof Y.Widget ? host.get(this.get("targetNode")) : host;

            node.setStyle(key, value);
        },
        /**
         * @function
         * @private
         * @description setValue from style
         */
        setValue: function(styles) {
            var style, value;
            if (styles) {
                for (style in styles) {
                    if (styles.hasOwnProperty(style)) {
                        value = styles[style];
                        if (value) {
                            value = Y.Lang.trim(value);
                            if (Y.Array.indexOf(CSSStyles.MEASURE_STYLE, style) > -1
                                && parseInt(value, 10).toString() === value) {
                                styles[style] = value + CSSStyles.MEASURE_SUFFIX;
                            }
                        }
                        this.setStyle(styles, style);
                    }
                }
            }
        }
    }, {
        ATTRS: {
            styles: {
                value: {},
                _inputex: {
                    _type: "wegasobject",
                    elementType: {
                        type: "wegaskeyvalue",
                        availableFields: [{
                                name: "background"
                            }, {
                                name: "border"
                            }, {
                                name: "borderTop"
                            }, {
                                name: "borderLeft"
                            }, {
                                name: "borderBottom"
                            }, {
                                name: "borderRight"
                            }, {
                                name: "borderRadius"
                            }, {
                                name: "color",
                                type: "colorpicker",
                                palette: 3
                            }, {
                                name: "fontSize"
                            }, {
                                type: "select",
                                name: "fontStyle",
                                choices: ["normal", "italic", "oblique", "inherit"]
                            }, {
                                name: "fontFamily"
                            }, {
                                name: "fontWeight"
                            }, {
                                name: "lineHeight"
                            }, {
                                name: "margin"
                            }, {
                                name: "minWidth"
                            }, {
                                name: "minHeight"
                            }, {
                                name: "padding"
                            }, {
                                name: "textAlign",
                                type: "select",
                                choices: ["left", "right", "center", "justify", "inherit"]
                            }, {
                                name: "textShadow"
                            }, {
                                name: "textTransform",
                                type: "select",
                                choices: ["uppercase", "lowercase", "capitalize"]
                            }, {
                                name: "top"
                            }, {
                                name: "left"
                            }, {
                                name: "right"
                            }, {
                                name: "bottom"
                            }, {
                                type: "select",
                                name: "overflow",
                                choices: ["visible", "hidden", "scroll", "auto", "inherit"]
                            }, {
                                type: "select",
                                name: "overflow-x",
                                choices: ["visible", "hidden", "scroll", "auto", "inherit"]
                            }, {
                                type: "select",
                                name: "overflow-y",
                                choices: ["visible", "hidden", "scroll", "auto", "inherit"]
                            }, {
                                type: "select",
                                name: "font-variant",
                                choices: ["inherit", "initial", "normal", "small-caps"]
                            }
                            //{
                            //    name: "backgroundColor",
                            //    type: "colorpicker",
                            //    palette: 3
                            //},
                        ]
                    }
                }
            },
            targetNode: {
                value: "boundingBox",
                type: "string",
                "transient": true
            }
        },
        NS: "CSSStyles",
        NAME: "CSSStyles",
        MEASURE_SUFFIX: "px",
        MEASURE_STYLE: [
            "fontSize",
            "top",
            "left",
            "right",
            "bottom",
            "width",
            "height",
            "minWidth",
            "minHeight",
            "maxWidth",
            "maxHeight",
            "marginLeft",
            "marginTop",
            "marginRight",
            "marginBottom",
            "paddingLeft",
            "paddingTop",
            "paddingBottom",
            "paddingRight"
        ]
    });
    Y.Plugin.CSSStyles = CSSStyles;

});
