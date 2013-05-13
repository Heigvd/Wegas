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
YUI.add('wegas-csssize', function(Y) {
    "use strict";

    /**
     *  @class Add size CSS styles
     *  @name Y.Plugin.CSSSize
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    var CSSSize = function() {
        CSSSize.superclass.constructor.apply(this, arguments);
    };

    CSSSize = Y.extend(CSSSize, Y.Plugin.CSSStyles, {
        /** @lends Y.Plugin.CSSSize */
        initializer: function() { 
        }
    }, {
        ATTRS: {
            styles: {
                _inputex: {
                    _type: "group",
                    fields: [{
                        type: "string",
                        name:"width",
                        label: "Width"
                    }, {
                        type: "string",
                        name:"height",
                        label: "Height"
                    }]
                }
            }
        },
        NS: "CSSSize",
        NAME: "CSSSize"
    });
    Y.namespace("Plugin").CSSSize = CSSSize;

});
