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
YUI.add('wegas-cssstyles-extra', function(Y) {
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
                            palette: 3,
                            name: "backgroundColor",
                            label: "backroung color"
                        }]
                }
            }
        },
        NS: "CSSBackground",
        NAME: "CSSBackground"
    });
    Y.namespace("Plugin").CSSBackground = CSSBackground;

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
                            name: "position",
                            label: "position",
                            choices: ["", "static", "relative", "absolute", "fixed", "inherit"]

                        }, {
                            type: "hidden",
                            name: "zIndex",
                            value: "10"
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
                            label: "bottom"
                        }, {
                            type: "string",
                            name: "right",
                            label: "right"
                        }]
                }
            }
        },
        NS: "CSSPosition",
        NAME: "CSSPosition"
    });
    Y.namespace("Plugin").CSSPosition = CSSPosition;

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
                        }]
                }
            }
        },
        NS: "CSSText",
        NAME: "CSSText"
    });
    Y.namespace("Plugin").CSSText = CSSText;

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
    Y.namespace("Plugin").CSSSize = CSSSize;
});
