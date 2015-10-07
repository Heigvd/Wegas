/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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
        /** @lends Y.Wegas.GaugeDisplay# */
        // *** Private fields *** //
        /**
         * Content box of this widget, static
         */
        CONTENT_TEMPLATE: '<div style="text-align: center;line-height:3px;min-width:100px"><canvas class="background-percent" height="50px" width="100px"></canvas><canvas class="gauge" style="margin-left: -100px;" height="50px" width="100px"></canvas><center class="label"></center><center class="percent wegas-gauge-value"></center></div>',
        /**
         * Maximum value displayed by the gauge, static
         */
        MAXVAL: 200,
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
        initializer: function() {
            this.handlers = [];
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
                angle: this.angleTransform(cfg.angle) || 0.15, // The length of each line
                lineWidth: cfg.lineWidth || 0.44, // The line thickness
                pointer: cfg.pointer ? Y.merge(cfg.pointer) : {
                    pointerlength: 0.6, // The radius of the inner circle
                    strokeWidth: 0.035, // The rotation offset
                    color: '#000000'                                            // Fill color
                },
                strokeColor: 'RGBA(0, 0, 0, 0)',
                percentColors: cfg.percentColors || [[0.0, "RGBA(0, 0, 0, 0)"]]
                    //colorStart: cfg.colorStart || '#0981A9',              // Colors, don't work with this new version of gauge library
                    //colorStop: cfg.colorStop || '#000000',
                    // lines: cfg.lines || 1,                               // The number of lines to draw //don't work with this new version of gauge library
                    //generateGradient: cfg.generateGradient || false       // don't work with this new version of gauge library
            };
            opts.pointer.length = opts.pointer.pointerlength;
            this.gauge = new Gauge(this.get("contentBox").one(".gauge").
                getDOMNode());                                              // create the  gauge!conso
            this.gauge.setOptions(opts);
            this.gauge.maxValue = this.defineMaxGaugeValue();
            this.gauge.animationSpeed = 1;                                     // set animation speed (32 is default value)
            this.backgroundPercent();
        },
        defineMaxGaugeValue: function() {
            var variableDescriptor = this.get("variable.evaluated"),
                maxVal = this.get("maxValue") || (variableDescriptor && variableDescriptor.get("maxValue") ? variableDescriptor.get("maxValue") : this.MAXVAL),
                minVal = this.get("minValue") || (variableDescriptor && variableDescriptor.get("minValue") ? variableDescriptor.get("minValue") : 0);
            return maxVal - minVal;
        },
        angleTransform: function(angle) {
            var angleValue = (180 - angle) / 180 * 0.5;
            if (angleValue === 0) {
                angleValue = 0.0000000000001;
            }
            return angleValue;
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When VariableDescriptorFacade is updated, do sync.
         */
        bindUI: function() {
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
            this.handlers.push(Y.Wegas.Facade.Variable.on("sourceChange", function() {
                this.gauge.animationSpeed = 1;
            }, this));
            this.after('disabledChange', this.syncUI, this);

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
                this.get("boundingBox").setHTML("<i>Unable to find variable</i>");
                Y.log("Unable to find variable descriptor", "error", "Y.Wegas.GaugeDisplay");
                return;
            }

            label = Y.Template.Micro.compile(this.get("label") || "")() /*|| variableDescriptor.getLabel()*/;
            maxVal = this.defineMaxGaugeValue();
            minVal = this.get("minValue") || variableDescriptor.get("minValue") || 0;
            value = variableDescriptor.getInstance().get("value");
            if (this.gauge.prevDisabled && !this.get("disabled")) {
                this.gauge.animationSpeed = 1;
            }
            this.gauge.prevDisabled = this.get("disabled");
            if (!value || this.get("disabled")) {
                value = 0;
                this.gauge.animationSpeed = 1;
            }

            this.backgroundPercent();
            this.gauge.maxValue = maxVal;                                      // @hack for change max value clear gauge background and pointer and reder it
            this.gauge.gp[0].maxValue = maxVal;
            this.gauge.gp[0].ctx.clearRect(0, 0, this.gauge.canvas.width, this.gauge.canvas.height);
            this.gauge.gp[0].render();
            this.gauge.render();

            if (value - minVal > maxVal) {
                this.gauge.set(maxVal);
            } else if (value < minVal) {
                this.gauge.set(0);
            } else {
                this.gauge.set(value - minVal);
            }

            this.get(CONTENTBOX).one(".label").setContent(label);
            this.get(CONTENTBOX).one(".percent").
                setContent(value);
            this.gauge.animationSpeed = 32;
        },
        getEditorLabel: function() {
            var variable = this.get("variable.evaluated");
            if (variable) {
                return variable.getEditorLabel();
            }
            return null;
        },
        backgroundPercent: function() {
            var canvas = this.get("contentBox").one(".background-percent").getDOMNode(),
                cfg = this.get("cfg"), i, size,
                startAngle = (1 + this.gauge.options.angle) * Math.PI,
                endAngle = (2 - this.gauge.options.angle) * Math.PI,
                r = endAngle - startAngle,
                p = cfg.backgroundPercentColors;

            if (canvas.getContext) {
                this.ctx = canvas.getContext('2d');
                this.ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (!cfg.backgroundPercentColors) {
                    p = [[0, "rgba(255, 0, 0, 0.9)"], [0.3333, "rgba(255, 204, 0, 0.9)"], [0.6666, "rgba(97, 186, 9, 0.9)"]];
                }

                if (this.get("disabled")) {
                    p = [[0, "rgba(100, 100, 100, 0.6)"], [0.3333, "rgba(180, 180, 180, 0.6)"], [0.6666, "rgba(140, 140, 140, 0.6)"]];
                }

                for (i = 0; i < p.length; i += 1) {
                    size = ((i !== p.length - 1) ? parseFloat(p[i + 1][0]) : 1) - parseFloat(p[i][0]);
                    this.color(p[i][1], startAngle + r * parseFloat(p[i][0]), startAngle + r * (parseFloat(p[i][0]) + size));
                }
            }
        },
        color: function(color, startAngle, endAngle) {
            var x = this.gauge.canvas.width / 2,
                y = this.gauge.canvas.height * (1 - this.gauge.paddingBottom),
                radius = this.gauge.radius;

            this.ctx.beginPath();
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = this.gauge.lineWidth;
            this.ctx.arc(x, y, radius, startAngle, endAngle, false);
            this.ctx.stroke();

            this.ctx.closePath();
        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget.
         */
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
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
                    label: "variable",
                    classFilter: ["NumberDescriptor"]
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
            minValue: {
                type: "number",
                optional: true,
                _inputex: {
                    label: "Display from"
                }
            },
            maxValue: {
                type: "number",
                optional: true,
                _inputex: {
                    label: "to"
                }
            },
            /**
             * The configuration of the gauge (object)
             */
            cfg: {
                value: {},
                _inputex: {
                    _type: "wegasobject",
                    label: "Configuration",
//                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                    elementType: {
                        type: "wegaskeyvalue",
                        availableFields: [{
                                name: "pointer",
                                type: "group",
                                fields: [
                                    {type: "number", name: 'pointerlength', typeInvite: "length 0.5 [0.1 - ...]", required: true},
                                    {type: "number", name: 'strokeWidth', typeInvite: "width 0.035 [0.02 - 0.5]", required: true},
                                    {type: "colorpicker", name: 'color', required: true}
                                ]
                            }, {
                                label: "background colors",
                                name: "backgroundPercentColors",
                                type: "list",
                                elementType: {
                                    type: "combine",
                                    fields: [
                                        {type: "string", name: "value", typeInvite: "[0 - 1]"},
                                        {type: "colorpicker", name: "color"}
                                    ]
                                },
                                palette: 3
                            }, {
                                name: "percentColors",
                                label: "percent colors",
                                type: "list",
                                elementType: {
                                    type: "combine",
                                    fields: [
                                        {type: "string", name: "value", typeInvite: "[0 - 1]"},
                                        {type: "colorpicker", name: "color"}
                                    ]
                                },
                                palette: 3
                            }, {
                                name: "lineWidth",
                                label: "arc width",
                                type: "number",
                                typeInvite: "0.44 [0 - 0.7]",
                                required: true
                            }, {
                                name: "angle",
                                label: "arc angle",
                                type: "number",
                                typeInvite: "126° [0° - 180°]",
                                required: true
                            }]
                    }
                }
            }
        }
    });
    Y.Wegas.GaugeDisplay = GaugeDisplay;
});
