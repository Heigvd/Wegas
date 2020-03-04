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
YUI.add('wegas-cssstyles', function(Y) {
    'use strict';
    /**
     *  @class Add styles CSS styles
     *  @name Y.Plugin.CSSStyles
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var CSSStyles = Y.Base.create(
        'CSSStyles',
        Y.Plugin.Base,
        [Y.Wegas.Plugin, Y.Wegas.Editable],
        {
            /** @lends Y.Plugin.CSSStyles */
            /**
             * Lifecycle methods
             * @function
             * @private
             */
            initializer: function() {
                this.styleList = [];
                if (this.get('host') instanceof Y.Widget) {
                    this.onceAfterHostEvent('render', function() {
                        this.setValue(this.get('styles'));
                    });
                } else if (this.get('host') instanceof Y.Node) {
                    this.setValue(this.get('styles'));
                } else {
                    Y.log("Host's type mistmach", 'warn', 'Y.Plugin.CSSStyles');
                    return;
                }
                this.after('stylesChange', function(e) {
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
                for (styleToRemove in e.prevVal) {
                    if (
                        e.prevVal.hasOwnProperty(styleToRemove) &&
                        !e.newVal.hasOwnProperty(styleToRemove)
                        ) {
                        this.nodeStyle(styleToRemove, '');
                        this.styleList.splice(
                            Y.Array.indexOf(this.styleList, styleToRemove)
                            );
                    }
                }
            },
            /**
             * @function
             * @private
             */
            setStyle: function(newStylesList, style) {
                if (Y.Array.indexOf(this.styleList, style) === -1) {
                    this.styleList.push(style);
                }
                this.nodeStyle(style, newStylesList[style]);
            },
            /**
             * Destructor methods.
             * @function
             * @private
             */
            destructor: function() {
                var styleToRemove;
                for (styleToRemove in this.get('styles')) {
                    if (this.get('styles').hasOwnProperty(styleToRemove)) {
                        this.nodeStyle(styleToRemove, '');
                        this.styleList.splice(
                            Y.Array.indexOf(this.styleList, styleToRemove)
                            );
                    }
                }
            },
            /**
             *
             * @private
             * @param {type} key Style to edit
             * @param {type} value Style's value
             * @returns {undefined}
             */
            nodeStyle: function(key, value) {
                var host = this.get('host'),
                    node = host instanceof Y.Widget
                    ? host.get(this.get('targetNode'))
                    : host;

                node.setStyle(key, value);
            },
            /**
             * @function
             * @private
             * @description setValue from style
             */
            setValue: function(oStyles) {
                var styles = Y.clone(oStyles);
                var style, value;
                if (styles) {
                    for (style in styles) {
                        if (styles.hasOwnProperty(style)) {
                            value = styles[style];
                            if (value) {
                                value = Y.Lang.trim(value);
                                if (Y.Array.indexOf(CSSStyles.MEASURE_STYLE, style) > -1
                                    && parseInt(value, 10).toString() === value) {
                                    styles[style] = value + CSSStyles.MEASURE_SUFFIX;
                                } else if (Y.Array.indexOf(CSSStyles.FILE_STYLE, style) > -1) {
                                    if (value.indexOf("/") === 0) {
                                        value = Y.Wegas.Facade.File.get("source") + "read" + value;
                                    }
                                    styles[style] = "url(" + value + ")";
                                }
                            }
                            this.setStyle(styles, style);
                        }
                    }
                }
            }
        },
        {
            ATTRS: {
                styles: {
                    type: 'object',
                    value: {},
                    view: {
                        type: 'hashlist'
                    },
                    additionalProperties: {
                        type: 'string'
                    }
                },
                targetNode: {
                    value: 'boundingBox',
                    type: 'string',
                    transient: true
                }
            },
            NS: 'CSSStyles',
            NAME: 'CSSStyles',
            MEASURE_SUFFIX: 'px',
            MEASURE_STYLE: [
                'fontSize',
                'top',
                'left',
                'right',
                'bottom',
                'width',
                'height',
                'minWidth',
                'minHeight',
                'maxWidth',
                'maxHeight',
                'marginLeft',
                'marginTop',
                'marginRight',
                'marginBottom',
                'paddingLeft',
                'paddingTop',
                'paddingBottom',
                'paddingRight'
            ],
            FILE_STYLE: [
                'backgroundImage'
            ]
        }
    );
    Y.Plugin.CSSStyles = CSSStyles;
});
