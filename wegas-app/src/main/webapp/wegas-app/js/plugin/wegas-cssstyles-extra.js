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
YUI.add('wegas-cssstyles-extra', function(Y) {
    "use strict";

    /**
     *  @class Add background CSS styles
     *  @name Y.Plugin.CSSBackground
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    var Plugin = Y.Plugin, CSSBackground, CSSSize, CSSText, CSSPosition;

    CSSBackground = function() {
        CSSBackground.superclass.constructor.apply(this, arguments);
    };

    CSSBackground = Y.extend(CSSBackground, Plugin.CSSStyles, {}, {
        /** @lends Y.Plugin.CSSBackground */
        ATTRS: {
            styles: {
                _inputex: {
                    _type: "group",
                    fields: [{
                            type: "colorpicker",
                            palette: 3,
                            name: "backgroundColor",
                            label: "background"
                        }]
                }
            }
        },
        NS: "CSSBackground",
        NAME: "CSSBackground"
    });
    Plugin.CSSBackground = CSSBackground;

    /**
     *  @class Add text CSS styles
     *  @name Y.Plugin.CSSText
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    CSSPosition = function() {
        CSSPosition.superclass.constructor.apply(this, arguments);
    };

    CSSPosition = Y.extend(CSSPosition, Plugin.CSSStyles, {}, {
        /** @lends Y.Plugin.CSSPosition */
        ATTRS: {
            styles: {
                _inputex: {
                    _type: "group",
                    fields: [{
                            type: "hidden",
                            value: "absolute",
                            name: "position",
                            label: "position",
                            //  type: "select",
                            choices: ["", "static", "relative", "absolute", "fixed", "inherit"]

                        }, {
                            type: "hidden",
                            name: "zIndex",
                            value: ""
                        }, {
                            type: "string",
                            name: "top",
                            label: "top"
                        }, {
                            type: "string",
                            name: "left",
                            label: "left"
                        }, {
                            type: "string",
                            name: "bottom",
                            label: "bottom",
                            wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                        }, {
                            type: "string",
                            name: "right",
                            label: "right",
                            wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                        }]
                }
            }
        },
        NS: "CSSPosition",
        NAME: "CSSPosition"
    });
    Plugin.CSSPosition = CSSPosition;

    /**
     *  @class Add text CSS styles
     *  @name Y.Plugin.CSSText
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    CSSText = function() {
        CSSText.superclass.constructor.apply(this, arguments);
    };

    CSSText = Y.extend(CSSText, Plugin.CSSStyles, {}, {
        /** @lends Y.Plugin.CSSStyles */
        ATTRS: {
            styles: {
                _inputex: {
                    _type: "group",
                    fields: [{
                            type: "colorpicker",
                            name: "color",
                            label: "text color"
                        }, {
                            type: "string",
                            name: "fontSize",
                            label: "text size"
                        }, {
                            type: "select",
                            name: "fontStyle",
                            choices: ["", "normal", "italic", "oblique", "inherit"],
                            label: "text style"
                        }, {
                            type: "select",
                            name: "textAlign",
                            choices: ["", "left", "right", "center", "justify", "inherit"],
                            label: "text align"
                        }, {
                            type: "select",
                            name: "fontVariant",
                            choices: ["", "normal", "small-caps"],
                            label: "text variant"
                         }]
                }
            }
        },
        NS: "CSSText",
        NAME: "CSSText"
    });
    Plugin.CSSText = CSSText;

    /**
     *  @class Add size CSS styles
     *  @name Y.Plugin.CSSSize
     *  @extends Y.Plugin.CSSStyles
     *  @constructor
     */
    CSSSize = function() {
        CSSSize.superclass.constructor.apply(this, arguments);
    };

    CSSSize = Y.extend(CSSSize, Plugin.CSSStyles, {}, {
        /** @lends Y.Plugin.CSSSize */
        ATTRS: {
            styles: {
                _inputex: {
                    _type: "group",
                    fields: [{
                            type: "string",
                            name: "width",
                            label: "Width"
                        }, {
                            type: "string",
                            name: "height",
                            label: "Height"
                        }]
                }
            }
        },
        NS: "CSSSize",
        NAME: "CSSSize"
    });
    Plugin.CSSSize = CSSSize;
});
