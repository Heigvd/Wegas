/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-gaugedisplay', function(Y) {
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
        /**
         * reference to the gauge status
         */
        disable: null,
        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @description Set variables with initials values.
         */
        initializer: function() {
            this.handlers = [];
            this.disable = false;
        },
        /**
         * @function
         * @private
         * @description create  and render a gauge with a defined configuration
         *  or given cfg (in ATTRS)
         */
        renderUI: function() {
            this.setValue(this.get("cfg"));
        },
        /**
         * @function
         * @private
         * @description Create and set value to gauge.
         */
        setValue: function(cfg) {
            var opts = {
//                lines: cfg.lines || 1, //don't work with this new version of gauge library
                // The number of lines to draw
                angle: cfg.angle || 0.15,
                // The length of each line
                lineWidth: cfg.lineWidth || 0.44,
                // The line thickness
                pointer: cfg.pointer || {
                    length: 0.5, // The radius of the inner circle
                    strokeWidth: 0.035, // The rotation offset
                    color: '#000000'                                            // Fill color
                },
//                colorStart: cfg.colorStart || '#0981A9', // Colors, don't work with this new version of gauge library
//                colorStop: cfg.colorStop || '#000000',
                strokeColor: cfg.strokeColor || '#FFFFFF',
                percentColors: cfg.percentColors || [[0.0, "#0981A9"]],
//              generateGradient: cfg.generateGradient || false //don't work with this new version of gauge library
            };
            this.gauge = new Gauge(this.get("contentBox").one("canvas").
                    getDOMNode());// create the  gauge!conso
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
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this));
            this.after('disabledChange', function(e) {
                this.disable = e.newVal;
                this.syncUI();
            }, this);

            this.after("cfgChange", function(e) {
                this.setValue(e.newVal);
            });
        },
        /**
         * @function
         * @private
         * @description Set the label, the min value, the max value, the
         *  value and display the percentage based on these value. This values
         *   are based on the descriptor/instance variable given in ATTRS.
         */
        syncUI: function() {
            var maxVal, minVal, value, label,
                    variableDescriptor = this.get("variable.evaluated");
            if (!variableDescriptor) {
                return;
            }

            label = this.get("label") || variableDescriptor.getLabel();
            minVal = variableDescriptor.get("minValue");
            maxVal = variableDescriptor.get("maxValue") - minVal;
            value = (variableDescriptor.getInstance().
                    get("value") - minVal) / maxVal * this.MAXVAL;
            if (!value || this.disable) {
                value = 0.1;                                                    // @hack @fixme unkown bug, value seams to be treated by gauge as false...
            }

            this.gauge.set(value);                                              // set actual value
            this.get(CONTENTBOX).one(".label").setContent(label);
            this.get(CONTENTBOX).one(".percent").
                    setContent(Math.round(value / this.MAXVAL * this.get("percentMaxValue")) + "%");
        },
        getEditorLabel: function() {
            var variable = this.get("variable.evaluated");
            if (variable) {
                return variable.getEditorLabel();
            }
            return null;
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        /**
         * @lends Y.Wegas.GaugeDisplay#
         */
        EDITORNAME: "Gauge",
        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
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
            percentMaxValue: {
                type: "number",
                optional: true,
                validator: Y.Lang.isNumber,
                value: 100,
                _inputex: {
                    label: "Percent max value"
                }
            },
            /**
             * The configuration of the gauge (object)
             */
            cfg: {
                value: {},
                _inputex: {
                    _type: "wegasobject",
                    useButtons: true,
                    elementType: {
                        type: "wegaskeyvalue",
                        availableFields: [{
                                name: "angle",
                                type: "number"
                            }, {
                                name: "lineWidth",
                                type: "number"
                            }, {
                                name: "strokeColor",
                                type: "colorpicker"
                            }, {
                                name: "pointer",
                                type: "group",
                                fields: [
                                    {type: "number", name: 'length', typeInvite: "length"},
                                    {type: "number", name: 'strokeWidth', typeInvite: "stroke width"},
                                    {type: "colorpicker", name: 'color'}
                                ]
                            }, {
                                name: "percentColors",
                                type: "list",
                                useButtons: true,
                                elementType: {
                                    type: "combine",
                                    fields: [
                                        {type: "string", name: "value", typeInvite: "value"},
                                        {type: "colorpicker", name: "color"}
                                    ]
                                },
                                palette: 3
                            }]
                    }
                }
            }
        }
    });

    Y.namespace('Wegas').GaugeDisplay = GaugeDisplay;
});
