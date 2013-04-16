/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @deprecated Use Y.Wegas.Template instead
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-variabledisplay', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', VariableDisplay;

    /**
     * @name Y.Wegas.VariableDisplay
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class class to display Wegas variables instance (or/and descriptor).
     * @constructor
     * @deprecated replaced by Y.Wegas.Template
     * @description  Display  Wegas variables instance (or/and descriptor) under
     * specifique shape : text, title, box, fraction and valuebox.
     */
    VariableDisplay = Y.Base.create("wegas-variabledisplay", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /** @lends Y.Wegas.VariableDisplay# */

        // *** Private fields *** //
        /**
         * Reference to each used functions
         */
        handlers: null,
        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @description Set variable with initials values.
         */
        initializer: function() {
            Y.log("Y.Wegas.VariableDisplay is deprecated, use Y.Wegas.Template instead.", "info", "Y.Wegas.VariableDisplay");
            this.handlers = [];
        },
        /**
         * @function
         * @private
         * @description bind function to events.
         * When VariableDescriptorFacade is updated, do syncUI
         */
        bindUI: function() {
            this.handlers.push(
                    Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this));
        },
        /**
         * @function
         * @private
         * @description get given variable descriptor and call
         *  "genMarkup" function with this variable.
         */
        syncUI: function() {
            var variableDescriptor = this.get("variable.evaluated");
            if (!variableDescriptor) {
                return;
            }

            if (variableDescriptor instanceof Y.Wegas.persistence.ListDescriptor) {   // If the widget is a list,
                variableDescriptor = variableDescriptor.get("currentItem");     // display it with the current list and the current element
            }

            this.get(CONTENTBOX).setHTML(this.genMarkup(variableDescriptor));   // Display the variable

        },
        /**
         * @function
         * @private
         * @description Detach all functions created by this widget
         */
        destructor: function() {
            for (var i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },
        // *** Private Methods *** //
        /**
         * @function
         * @private
         * @param variableDescriptor
         * @description format variables informations, in case of :
         * text : Display "as is" the value with the label.
         * title : Display "as is" he public label with the label.
         * box : Display the label, so many div as shown by the number
         *  from variable descriptor and the number.
         * fraction : Display the label, the min val of the descriptor, a
         *  separator, the value, a other separator and the max value.
         * valuebox : Display the label and so many div as shown from the min
         *  value to the max value. On each created div indicate if the div is
         *  under value, on value or over the value.
         */
        genMarkup: function(variableDescriptor) {
            var acc, i, maxVal = variableDescriptor.get("maxValue"),
                    minVal = variableDescriptor.get("minValue"),
                    value = variableDescriptor.getInstance().get("value"),
                    label = this.get("label") || variableDescriptor.getPublicLabel();

            switch (this.get('view')) {
                case 'text':
                    return '<span class="wegas-label wegas-variabledisplay-text-label">' + label + '</span>'
                            + ' <span class="wegas-value wegas-variabledisplay-text-value">' + value + '</span>';
                    break;

                case 'title':
                    return '<span class="wegas-label wegas-variabledisplay-text-label">' + label + '</span>'
                            + ' <span class="wegas-value wegas-variabledisplay-text-value">' + variableDescriptor.getPublicLabel() + '</span>';
                    break;

                case 'box':
                    acc = [];
                    for (i = 0; i < value; i += 1) {
                        acc.push('<div class="wegas-variabledisplay-box-unit"></div>');
                    }
                    return '<div class="wegas-variabledisplay-box-label">' + label + '</div>'
                            + '<span class="wegas-variabledisplay-box-units">' + acc.join('') + '</span>'
                            + '<span class="wegas-variabledisplay-box-value">(' + value + '<span class="wegas-variabledisplay-box-valueMax">/' + maxVal + '</span>)</span>';
                    break;

                case 'fraction':
                    return '<span class="wegas-variabledisplay-fraction-label">' + label + '</span>'
                            + '<span class="wegas-variabledisplay-fraction-minValue">' + minVal + '</span>'
                            + '<span class="wegas-variabledisplay-fraction-minSeparator"> / </span>'
                            + '<span class="wegas-variabledisplay-fraction-value">' + value + '</span>'
                            + '<span class="wegas-variabledisplay-fraction-maxSeparator"> / </span>'
                            + '<span class="wegas-variabledisplay-fraction-maxValue">' + maxVal + '</span>';
                    break;

                case 'valuebox':
                    acc = [];
                    if (variableDescriptor) {
                        for (i = variableDescriptor.get("minValue"); i <= variableDescriptor.get("maxValue"); i += 1) {
                            acc.push('<div class="wegas-valuebox-unit '
                                    + ((i === value) ? "wegas-valuebox-selected" : "")
                                    + ((i < value) ? "wegas-valuebox-previous" : "")
                                    + ((i > value) ? "wegas-valuebox-next" : "")
                                    + '">' + i + '</div>');
                        }
                    }
                    return '<span class="wegas-label wegas-variabledisplay-valuebox-label">' + label + '</span>'
                            + '<div class="wegas-value wegas-variabledisplay-valuebox-units">' + acc.join('') + "</div>";
                    break;
            }

        }
    }, {
        /** @lends Y.Wegas.VariableDisplay# */

        /**
         * @field
         * @static
         * @description
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>variable: The target variable, returned either based on the variableName attribute,
         *    and if absent by evaluating the expr attribute.</li>
         *    <li>label: A label if you want display other label than public label
         * of the variable descriptor</li>
         *    <li>view: Choose the view to display variable descriptor</li>
         * </ul>
         */
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
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
             * A label if you want display other label than public label
             * of the variable descriptor
             */
            label: {
                type: "string",
                optional: true,
                validator: Y.Lang.isString
            },
            /**
             * Choose the view to display variable descriptor
             */
            view: {
                type: "string",
                value: "text",
                choices: [{
                        value: "text"
                    }, {
                        value: "title"
                    }, {
                        value: "box"
                    }, {
                        value: "valuebox"
                    }, {
                        value: "fraction"
                    }]
            }
        }
    });
    Y.namespace('Wegas').VariableDisplay = VariableDisplay;

});
