/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-gaugedisplay', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', GaugeDisplay;

    /**
     * @name Y.Wegas.GaugeDisplay
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class Manage a canevas gauge
     * @constructor
     * @description Manage a canevas gauge based on a instance's value
     */
    GaugeDisplay = Y.Base.create("wegas-gauge", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /**
         * @lends Y.Wegas.GaugeDisplay#
         */
        // *** Private fields *** //
        /**
         * Content box of this widget, static
         */
        CONTENT_TEMPLATE: '<div style="text-align: center;line-height:3px"><canvas height="50px" width="100px"></canvas><center class="label"></center><center class="percent"></center></div>',
        /**
         * Maximum value displayed by the gauge, static
         */
        MAXVAL: 200,
        /**
         * Reference to each used functions
         */
        handlers: null,
        /**
         * reference to the gauge object
         */
        gauge: null,
        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         */
        initializer: function () {
            this.handlers = [];
        },
        /**
         * @function
         * @private
         * @description create  and render a gauge with a defined configuration
         *  or given cfg (in ATTRS)
         */
        renderUI: function () {
            var opts = {
                lines: this.get('cfg').lines || 12, // The number of lines to draw
                angle: this.get('cfg').angle || 0.15, // The length of each line
                lineWidth: this.get('cfg').lineWidth || 0.44, // The line thickness
                pointer: this.get('cfg').pointer || {
                    length: 0.5, // The radius of the inner circle
                    strokeWidth: 0.035, // The rotation offset
                    color: '#000000'                                            // Fill color
                },
                colorStart: this.get('cfg').colorStart || '#0981A9', // Colors
                colorStop: this.get('cfg').colorStop || '#000000',
                //strokeColor: '#E0E0E0',
                strokeColor: this.get('cfg').strokeColor || '#FFFFFF',
                generateGradient: this.get('cfg').generateGradient || true
            };
            this.gauge = new Gauge(this.get("contentBox").one("canvas").getDOMNode());// create the  gauge!conso
            this.gauge.setOptions(opts);
            this.gauge.maxValue = this.MAXVAL;                                  // set max gauge value
            this.gauge.animationSpeed = 32;                                     // set animation speed (32 is default value)
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When VariableDescriptorFacade is updated, do sync.
         */
        bindUI: function () {
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("update", this.syncUI, this));
        },
        /**
         * @function
         * @private
         * @description Set the label, the min value, the max value, the
         *  value and display the percentage based on these value. This values
         *   are based on the descriptor/instance variable given in ATTRS.
         */
        syncUI: function () {
            var maxVal, minVal, value, label,
                    variableDescriptor = this.get("variable.evaluated");
            if (!variableDescriptor) {
                return;
            }

            label = this.get("label") || variableDescriptor.getPublicLabel();
            minVal = variableDescriptor.get("minValue");
            maxVal = variableDescriptor.get("maxValue") - minVal;
            value = (variableDescriptor.getInstance().get("value") - minVal) / maxVal * this.MAXVAL;
            if (!value) {
                value = 0.1;                                                    // @hack @fixme unkown bug, value seams to be treated by gauge as false...
            }

            this.gauge.set(value);                                              // set actual value
            this.get(CONTENTBOX).one(".label").setContent(label);
            this.get(CONTENTBOX).one(".percent").setContent(Math.round(value / this.MAXVAL * 100) + "%");
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function () {
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        /**
         * @lends Y.Wegas.GaugeDisplay#
         */
        /**
         * @field
         * @static
         * @description
         ** <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>variable: The target variable, returned either based on the name attribute,
         * and if absent by evaluating the expr attribute.</li>
         *    <li>label: A label for the gauge, if no one is given, take the
         *     public label of the variable</li>
         *    <li>cfg: the configuration of the gauge (object)</li>
         * </ul>
         */
        ATTRS: {
            /**
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable"
                }
            },
            /**
             * A label for the gauge, if no one is given, take the public
             *  label of the variable
             */
            label: {
                type: "string",
                optional: true,
                validator: Y.Lang.isString,
                _inputex: {
                    label: "Label"
                }
            },
            /**
             * The configuration of the gauge (object)
             */
            cfg: {
                value: {},
                _inputex: {
                    _type: "object"
                }
            }
        }
    });

    Y.namespace('Wegas').GaugeDisplay = GaugeDisplay;
});
