/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-cssstyles-extra', function(Y) {
    'use strict';
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

    CSSBackground = Y.extend(
        CSSBackground,
        Plugin.CSSStyles,
        {},
        {
            /** @lends Y.Plugin.CSSBackground */
            ATTRS: {
                styles: {
                    type: 'object',
                    view: { type: 'object' },
                    properties: {
                        backgroundColor: {
                            type: 'string',
                            view: {
                                label: 'Background',
                                type: 'colorpicker'
                            }
                        }
                    }
                }
            },
            NS: 'CSSBackground',
            NAME: 'CSSBackground'
        }
    );
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

    CSSPosition = Y.extend(
        CSSPosition,
        Plugin.CSSStyles,
        {},
        {
            /** @lends Y.Plugin.CSSPosition */
            ATTRS: {
                styles: {
                    type: 'object',
                    view: { type: 'object' },
                    properties: {
                        position: {
                            type: 'string',
                            value: 'absolute',
                            view: {
                                type: 'select',
                                label: 'Position',
                                choices: [
                                    '',
                                    'static',
                                    'relative',
                                    'absolute',
                                    'fixed',
                                    'inherit'
                                ],
                                className: 'wegas-advanced-feature'
                            }
                        },
                        zIndex: {
                            type: 'number',
                            view: {
                                label: 'Z-Index',
                                className: 'wegas-advanced-feature'
                            }
                        },
                        top: {
                            type: 'string',
                            view: { label: 'Top' }
                        },
                        left: {
                            type: 'string',
                            view: { label: 'Left' }
                        },
                        bottom: {
                            type: 'string',
                            view: {
                                label: 'Bottom',
                                className: 'wegas-advanced-feature'
                            }
                        },
                        right: {
                            type: 'string',
                            view: {
                                label: 'right',
                                className: 'wegas-advanced-feature'
                            }
                        }
                    }
                }
            },
            NS: 'CSSPosition',
            NAME: 'CSSPosition'
        }
    );
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

    CSSText = Y.extend(
        CSSText,
        Plugin.CSSStyles,
        {},
        {
            /** @lends Y.Plugin.CSSStyles */
            ATTRS: {
                styles: {
                    type: 'object',
                    view: { type: 'object' },
                    properties: {
                        color: {
                            type: 'string',
                            view: {
                                label: 'Text color',
                                type: 'colorpicker'
                            }
                        },
                        fontSize: {
                            type: 'string',
                            view: {
                                label: 'Text size'
                            }
                        },
                        fontStyle: {
                            type: 'string',
                            view: {
                                label: 'Text style',
                                type: 'select',
                                choices: [
                                    '',
                                    'normal',
                                    'italic',
                                    'oblique',
                                    'inherit'
                                ]
                            }
                        },
                        textAlign: {
                            type: 'string',
                            view: {
                                label: 'Text align',
                                type: 'select',
                                choices: [
                                    '',
                                    'left',
                                    'right',
                                    'center',
                                    'justify',
                                    'inherit'
                                ]
                            }
                        },
                        fontVariant: {
                            type: 'string',
                            view: {
                                label: 'Text variant',
                                type: 'select',
                                choices: ['', 'normal', 'small-caps']
                            }
                        }
                    }
                }
            },
            NS: 'CSSText',
            NAME: 'CSSText'
        }
    );
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

    CSSSize = Y.extend(
        CSSSize,
        Plugin.CSSStyles,
        {},
        {
            /** @lends Y.Plugin.CSSSize */
            ATTRS: {
                styles: {
                    type: 'object',
                    view: { type: 'object' },
                    properties: {
                        width: {
                            type: 'string',
                            view: {
                                label: 'Width'
                            }
                        },
                        height: {
                            type: 'string',
                            view: {
                                label: 'Height'
                            }
                        }
                    }
                }
            },
            NS: 'CSSSize',
            NAME: 'CSSSize'
        }
    );
    Plugin.CSSSize = CSSSize;
});
