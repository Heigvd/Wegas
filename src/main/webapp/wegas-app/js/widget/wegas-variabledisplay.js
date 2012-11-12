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

YUI.add('wegas-variabledisplay', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox', VariableDisplay;

    VariableDisplay = Y.Base.create("wegas-variabledisplay", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.persistence.Editable], {

        // ** Lifecycle Methods ** //
        initializer: function () {
            this.handlers = [];
        },

        destructor: function () {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        },

        bindUI: function () {
            this.handlers.push(Y.Wegas.VariableDescriptorFacade.after("response", this.syncUI, this));
            this.handlers.push(Y.Wegas.app.after('currentPlayerChange', this.syncUI, this));
        },

        syncUI: function () {
            var variableDescriptor = this.get("variable.evaluated");

            if (!variableDescriptor) {
                return;
            }

            if (variableDescriptor instanceof Y.Wegas.persistence.ListDescriptor) {   // If the widget is a list,
                variableDescriptor = variableDescriptor.get("currentItem");     // display it with the current list and the current element
            }

            this.get(CONTENTBOX).setHTML(this.genMarkup(variableDescriptor));   // Display the variable

        },

        genMarkup: function (variableDescriptor) {
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
                    + '<span class="wegas-variabledisplay-fraction-value">' + value +'</span>'
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
        ATTRS : {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.persistence.Editable.VARIABLEDESCRIPTORGETTER
            },
            label : {
                type: "string",
                optional: true,
                validator: Y.Lang.isString
            },
            view: {
                type: "string",
                value: "text",
                choices: [{
                    value: "text"
                }, {
                    value: "box"
                }, {
                    value: "gauge"
                }, {
                    value: "valuebox"
                }, {
                    value: "fraction"
                }]
            }
        }
    });

    var ListDisplay = Y.Base.create("wegas-listdisplay", VariableDisplay, [], {

        // ** Lifecycle Methods ** //

        syncUI: function () {
            var acc, maxVal, minVal, i, value, label,
            variableDescriptor = this.get("variable.evaluated");

            if (!variableDescriptor) {
                return;
            }

            maxVal = variableDescriptor.get("maxValue");
            minVal = variableDescriptor.get("minValue");
            value = variableDescriptor.getInstance().get("value");
            label = this.get("label") || variableDescriptor.getPublicLabel();

            switch (this.get('view')) {
                case 'text':
                    this.get(CONTENTBOX).setContent('<span class="wegas-variabledisplay-text-label">' + label + '</span>'
                        + ' <span class="wegas-variabledisplay-text-value">' + value + '</span>');
                    break;
                case 'box':
                    acc = [];
                    for (i = 0; i < value; i += 1) {
                        acc.push('<div class="wegas-variabledisplay-box-unit"></div>');
                    }
                    this.get(CONTENTBOX).setContent('<div class="wegas-variabledisplay-box-label">' + label + '</div>'
                        + '<span class="wegas-variabledisplay-box-units">' + acc.join('') + '</span>'
                        + '<span class="wegas-variabledisplay-box-value">(' + value + '<span class="wegas-variabledisplay-box-valueMax">/' + maxVal + '</span>)</span>');

                    break;

                case 'fraction':
                    if (variableDescriptor) {
                        this.get(CONTENTBOX).setContent('<span class="wegas-variabledisplay-fraction-label">' + label + '</span>'
                            + '<span class="wegas-variabledisplay-fraction-minValue">' + minVal + '</span>'
                            + '<span class="wegas-variabledisplay-fraction-minSeparator"> / </span>'
                            + '<span class="wegas-variabledisplay-fraction-value">' + value + '</span>'
                            + '<span class="wegas-variabledisplay-fraction-maxSeparator"> / </span>'
                            + '<span class="wegas-variabledisplay-fraction-maxValue">' + maxVal + '</span>');

                    }
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
                    this.get(CONTENTBOX).setContent('<span class="wegas-variabledisplay-valuebox-label">' + label + '</span>'
                        + '<div class="wegas-variabledisplay-valuebox-units">' + acc.join('') + "</div");
                    break;
            }
        }
    }, {
        ATTRS : {

            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.persistence.Editable.VARIABLEDESCRIPTORGETTER
            },
            label : {
                type: "string",
                optional: true,
                validator: Y.Lang.isString
            },
            view: {
                type: "string",
                value: "text",
                choices: [{
                    value: "text"
                }, {
                    value: "box"
                }, {
                    value: "gauge"
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
