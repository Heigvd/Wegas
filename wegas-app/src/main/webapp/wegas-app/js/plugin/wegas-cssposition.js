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
YUI.add('wegas-cssposition', function(Y) {
    "use strict";

    /**
     *  @class Add text CSS styles
     *  @name Y.Plugin.CSSText
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    var CSSPosition = function() {
        CSSPosition.superclass.constructor.apply(this, arguments);
    };

    CSSPosition = Y.extend(CSSPosition, Y.Plugin.CSSStyles, {
        /** @lends Y.Plugin.CSSPosition */
        initializer: function() { 
        }
    }, {
        ATTRS: {
            styles: {
                _inputex: {
                    _type: "group",
                    fields: [{
                        type: "hidden",
                        value: "absolute",
//                        type: "select",
                        name:"position",
                        label: "position",
                        choices: ["", "static", "relative", "absolute", "fixed", "inherit"]
                        
                    }, {
                        type: "hidden",
                        name: "zIndex",
                        value: "10"                        
                    }, {
                        type: "string",
                        name:"top",
                        label: "top"
                    }, {
                        type: "string",
                        name:"left",
                        label: "left"
                    }, {
                        type: "string",
                        name:"bottom",
                        label: "bottom"
                    }, {
                        type: "string",
                        name:"right",
                        label: "right"
                    }]
                }
            }
        },
        NS: "CSSPosition",
        NAME: "CSSPosition"
    });
    Y.namespace("Plugin").CSSPosition = CSSPosition;

});
