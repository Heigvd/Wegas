/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
         * @function
         * @private
         */
        initializer: function() {   
            if (this.get("host") instanceof Y.Widget) {
                node = this.get("host").get(this.get("targetNode"));
            } else if (this.get("host") instanceof Y.Node){
                node = this.get("host");
            } else {
                Y.log("Host's type mistmach", "warn", "Y.Plugin.CSSStyles");
                return;
            }
            this.set("styles",  this.get("styles"));
        },
        
        removeStyle: function(style) {
            var i;
            for (i=0; i<styleList.length; i++){
                if (styleList[i] === style){
                    styleList.splice(i);
                    node.setStyle(style, "");
                }
            }
        },
        
        addStyle: function(stylesList, style) {
            styleList.push(style);
            node.setStyle(style, stylesList[style]);
        },
        
        destructor: function(){
            var i;
            for (i=0; i<styleList.length; i++){
                this.removeStyle(styleList[i]);
            }
        },
        
        setValue: function(styles) {
            if (styles){
                for (var style in styles){
                    var value = styles[style];                 
                    if (value){
                        if (style === "font-size" || style === "top" || style === "right" || style === "bottom" || style === "left" || style === "min-width"){
                            if (value.substr(-2) !== "px" && value.substr(-2) !== "pt" && value.substr(-2) !== "em" && value.substr(-2) !== "%"){
                                  styles[style] = value + "pt";
                            }
                        }
                    }
                    this.removeStyle(style);
                    this.addStyle(styles, style);
                }
            }
        }
    }, {
        ATTRS: {
            styles: {
                setter: function(value) {
                    this.setValue(value);
                    return value;
                },            
                value: {},
                _inputex: {
                    _type: "wegasobject",
                    elementType: {
                        type:"wegaskeyvalue",
                        availableFields: [{
                            name: "background-color",
                            type: "colorpicker",
                            palette:3
                        }, {
                            name: "color",
                            type: "colorpicker",
                            palette:3
                        }, {
                            type: "string",
                            name: "font-size"
                        }, {
                            type: "select",
                            name: "font-style",
                            choices: ["", "normal", "italic", "oblique", "inherit"]
                        }, {
                            type: "select",
                            name: "text-align",
                            choices: ["", "left", "right", "center", "justify", "inherit"]
                        }, {
                            type: "string",
                            name: "min-width"
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
