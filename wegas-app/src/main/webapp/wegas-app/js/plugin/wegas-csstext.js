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
YUI.add('wegas-csstext', function(Y) {
    "use strict";

    /**
     *  @class Add text CSS styles
     *  @name Y.Plugin.CSSText
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    var CSSText = function() {
        CSSText.superclass.constructor.apply(this, arguments);
    };

    CSSText = Y.extend(CSSText, Y.Plugin.CSSStyles, {
        /** @lends Y.Plugin.CSSText */
    }, {
        ATTRS: {
            styles: {
                _inputex: {
                    _type: "group",
                    fields: [{
                        type: "colorpicker",
                        name:"color",
                        label: "text color"
                    }, {
                        type: "string",
                        name:"font-size",
                        label: "text size"
                    }, {
                        type: "select",
                        name: "font-style",
                        choices: ["", "normal", "italic", "oblique", "inherit"],
                        label: "text style"
                    }, {
                        type: "select",
                        name: "text-align",
                        choices: ["", "left", "right", "center", "justify", "inherit"],
                        label: "text align"
                    }]
                }
            }
        },
        NS: "CSSText",
        NAME: "CSSText"
    });
    Y.namespace("Plugin").CSSText = CSSText;

});
