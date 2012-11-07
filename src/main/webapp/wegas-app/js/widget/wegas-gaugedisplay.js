/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-gaugedisplay', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', GaugeDisplay;

    GaugeDisplay = Y.Base.create("wegas-gauge", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable], {

        CONTENT_TEMPLATE: '<div style="text-align: center;line-height:3px"><canvas height="50px" width="100px"></canvas><center class="label"></center><center class="percent"></center></div>',
        MAXVAL: 200,

        // ** Lifecycle Methods ** //

        renderUI: function() {
            var opts = {
                lines: 12,                                                      // The number of lines to draw
                angle: 0.15,                                                    // The length of each line
                lineWidth: 0.44,                                                // The line thickness
                pointer: {
                    length: 0.5,                                                // The radius of the inner circle
                    strokeWidth: 0.035,                                         // The rotation offset
                    color: '#000000'                                            // Fill color
                },
                colorStart: '#0981A9',                                          // Colors
                colorStop: '#000000',
                //strokeColor: '#E0E0E0',
                strokeColor: '#FFFFFF',
                generateGradient: true
            };
            this.gauge = new Gauge(this.get("contentBox").one("canvas" ).getDOMNode());// create the  gauge!
            this.gauge.setOptions( opts );
            this.gauge.maxValue = this.MAXVAL;                                  // set max gauge value
            this.gauge.animationSpeed = 32;                                     // set animation speed (32 is default value)
            //this.gauge.set(10);
        },

        bindUI: function() {
            this.handlers = [];
            this.handlers.push(
                Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(
                Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
        },

        syncUI: function() {
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
            this.get(CONTENTBOX).one(".percent").setContent(Math.round(value / this.MAXVAL * 100 ) + "%");
        },

        destructor: function () {
            for (var i = 0; i < this.handler.length; i = i + 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        ATTRS : {
            variable: {
                getter: Y.Wegas.persistence.Editable.VARIABLEDESCRIPTORGETTER
            },
            label : {
                type: "string",
                optional: true,
                validator: Y.Lang.isString
            }
        }
    });

    Y.namespace('Wegas').GaugeDisplay = GaugeDisplay;
});
