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
            var i;
            if (this.get("host") instanceof Y.Widget) {
                node = this.get("host").get(this.get("targetNode"));
            } else if (this.get("host") instanceof Y.Node){
                node = this.get("host");
            } else {
                Y.log("Host's type mistmach", "warn", "Y.Plugin.CSSStyles");
                return;
            }

            if (this.get("styles")){
                for (var style in this.get("styles")){
                    this.addStyle(style);
                }
            }
        },
        
        removeStyle: function(style) {
            var i;
            for (i=0; i<styleList.length; i++){
                if (styleList[i] == style){
                    styleList.splice(i);
                    // TODO remove css style
                }
            }
            console.log(styleList);
        },
        
        addStyle: function(style) {
            styleList.push(style);
            node.setStyle(style, this.get("styles")[style]);         
        }
    }, {
        ATTRS: {
            styles: {
                value: {},
                _inputex: {
                    _type: "object"
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
