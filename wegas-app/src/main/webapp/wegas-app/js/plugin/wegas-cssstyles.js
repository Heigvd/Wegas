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

    /**
     *  @class Add styles CSS styles
     *  @name Y.Plugin.CSSStyles
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Wegas = Y.Wegas,
        styleList = [],
        node,
    CSSStyles = Y.Base.create("wegas-cssstyles", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.CSSStyles */

        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.setValue(this.get("styles"));
            this.after("stylesChange", function(e){
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
            for (styleToRemove in e.prevVal){
                if (!e.newVal.hasOwnProperty(styleToRemove)){
                    node.setStyle(styleToRemove, "");
                    styleList.splice(styleList.indexOf(styleToRemove));
                }
            }
        },
        /**
         * @function
         * @private
         */        
        setStyle: function(newStylesList, style){
            if (styleList.indexOf(style) === -1){
                styleList.push(style);
            }
            node.setStyle(style, newStylesList[style]);
        },
        
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function(){
            var styleToRemove;
            for (styleToRemove in this.get("styles")){
                node.setStyle(styleToRemove, "");
                styleList.splice(styleList.indexOf(styleToRemove));
            }
        },
        
        /**
         * @function
         * @private
         * @description setValue from style
         */
        setValue: function(styles) {
            if (this.get("host") instanceof Y.Widget) {
                node = this.get("host").get(this.get("targetNode"));
            } else if (this.get("host") instanceof Y.Node){
                node = this.get("host");
            } else {
                Y.log("Host's type mistmach", "warn", "Y.Plugin.CSSStyles");
                return;
            }

            if (styles){
                for (var style in styles){
                    var value = styles[style].trim();
                    if (value){
                        if (style === "fontSize" || style === "top" || style === "right" || style === "bottom" || style === "left" || style === "minWidth" || style === "width" || style === "height"){
                            if (value.substr(-2) !== "px" && value.substr(-2) !== "pt" && value.substr(-2) !== "em" && value.substr(-1) !== "%" && value.substr(-2) !== "ex"){
                                  styles[style] = value + "pt";
                            }
                        }
                    }
                    this.setStyle(styles, style);
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
                        type:"wegaskeyvalue",
                        availableFields: [{
                            name: "backgroundColor",
                            type: "colorpicker",
                            palette:3
                        }, {
                            name: "color",
                            type: "colorpicker",
                            palette:3
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
            }
        },
        NS: "CSSStyles",
        NAME: "CSSStyles"
    });
    Y.namespace("Plugin").CSSStyles = CSSStyles;

});
