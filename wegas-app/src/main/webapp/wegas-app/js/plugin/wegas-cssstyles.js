/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-cssstyles', function(Y) {
    "use strict";


    var Wegas = Y.Wegas,
            MESURE_STYLE = [
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
    ],
            /**
             *  @class Add styles CSS styles
             *  @name Y.Plugin.CSSStyles
             *  @extends Y.Plugin.Base
             *  @constructor
             */
            CSSStyles = Y.Base.create("wegas-cssstyles", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.CSSStyles */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.styleList = [];
            if (this.get("host") instanceof Y.Widget) {
                this.get("host").onceAfter("render", function() {
                    this.setValue(this.get("styles"));
                }, this);
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
                    this.styleList.splice(this.styleList.indexOf(styleToRemove));
                }
            }
        },
        /**
         * @function
         * @private
         */
        setStyle: function(newStylesList, style) {
            if (this.styleList.indexOf(style) === -1) {
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
                    this.styleList.splice(this.styleList.indexOf(styleToRemove));
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
            if (this.get("host") instanceof Y.Widget) {
                this.get("host").get(this.get("targetNode")).setStyle(key, value);
            } else if (this.get("host") instanceof Y.Node) {
                return this.get("host").setStyle(key, value);
            }
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
                            value = value.trim();
                            if (Y.Array.indexOf(MESURE_STYLE, style) > -1) {
                                if (parseInt(value, 10).toString() === value) {
                                    styles[style] = value + this.get("mesureSuffix");
                                }
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
                                name: "backgroundColor",
                                type: "colorpicker",
                                palette: 3
                            }, {
                                name: "color",
                                type: "colorpicker",
                                palette: 3
                            }, {
                                type: "string",
                                name: "fontSize"
                            }, {
                                type: "select",
                                name: "fontStyle",
                                choices: ["", "normal", "italic", "oblique", "inherit"]
                            }, {
                                type: "select",
                                name: "textAlign",
                                choices: ["", "left", "right", "center", "justify", "inherit"]
                            }, {
                                type: "string",
                                name: "minWidth"
                            }]
                    }
                }
            },
            targetNode: {
                value: "boundingBox",
                type: "string",
                "transient": true
            },
            mesureSuffix: {
                value: "pt",
                type: "string",
                "transient": true
            }
        },
        NS: "CSSStyles",
        NAME: "CSSStyles"
    });
    Y.namespace("Plugin").CSSStyles = CSSStyles;

});
