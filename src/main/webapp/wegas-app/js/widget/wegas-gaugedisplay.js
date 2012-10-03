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

YUI.add('wegas-gaugedisplay', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', GaugeDisplay;

    GaugeDisplay = Y.Base.create( "wegas-gauge", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable ], {

        CONTENT_TEMPLATE: '<div style="text-align: center;line-height:3px"><canvas height="50px" width="100px"></canvas><center class="label"></center></div>',

        // ** Lifecycle Methods ** //
        renderUI: function () {
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
            this.gauge = new Gauge( this.get( "contentBox" ).one( "canvas" ).getDOMNode() );// create the  gauge!
            this.gauge.setOptions( opts );
            this.gauge.maxValue = 200;                                          // set max gauge value
            this.gauge.animationSpeed = 32;                                     // set animation speed (32 is default value)
        },

        bindUI: function () {
            this.handlers = [];
            this.handlers.push(
                Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this ) );
            this.handlers.push(
                Y.Wegas.app.after('currentPlayerChange', this.syncUI, this ) );
        },

        syncUI: function () {
            var maxVal, minVal, value, label,
            variableDescriptor = this.get("dataSource").rest.find( "name", this.get( "variable" ) );

            if (!variableDescriptor) {
                return;
            }

            //maxVal = variableDescriptor.get( "maxValue" );
            //minVal = variableDescriptor.get( "minValue" );
            value = variableDescriptor.getInstance().get( "value" );
            label = this.get( "label" ) || variableDescriptor.getPublicLabel();

            this.gauge.set( value * 100);                                       // set actual value
            this.get( CONTENTBOX ).one( ".label" ).setContent( label );
        },

        destructor: function () {
            for ( var i = 0; i < this.handler.length; i = i + 1 ) {
                this.handlers[i].detach();
            }
        }
    }, {
        ATTRS : {
            variable: {
                type: "string"
            },
            dataSource: {
                "transient": true,
                getter: function () {
                    return Y.Wegas.VariableDescriptorFacade;
                }
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
