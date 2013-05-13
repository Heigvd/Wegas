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
YUI.add('wegas-cssbackground', function(Y) {
    "use strict";

    /**
     *  @class Add background CSS styles
     *  @name Y.Plugin.CSSBackground
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    var CSSBackground = function() {
        CSSBackground.superclass.constructor.apply(this, arguments);
    };

    CSSBackground = Y.extend(CSSBackground, Y.Plugin.CSSStyles, {
        /** @lends Y.Plugin.CSSBackground */
    }, {
        ATTRS: {
            styles: {
                _inputex: {
                    _type: "group",
                    fields: [{
                        type: "colorpicker",
                        palette:3,
                        name:"backgroundColor",
                        label: "backroung color"
                    }]
                }
            }
        },
        NS: "CSSBackground",
        NAME: "CSSBackground"
    });
    Y.namespace("Plugin").CSSBackground = CSSBackground;

});
