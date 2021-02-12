/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
/**
 * @module inputex-select
 */
YUI.add("wegas-inputex-multipleoptions", function(Y) {

    var inputEx = Y.inputEx;

    /**
     * Create a select field
     * @class inputEx.MultipleOptions
     * @extends inputEx.Group
     * @constructor
     */
    inputEx.MultipleOptions = function(options) {
        options.className = options.className || "inputEx-Group wegas-inputex-multioptions";
        inputEx.MultipleOptions.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.MultipleOptions, inputEx.Group, {
        renderField: function(fieldOptions) {
            var field = inputEx.MultipleOptions.superclass.renderField.call(this, fieldOptions);
            field.on("focus", function(e) {
                this.select(e.target);
            }, this);
            if (this.inputs.length > 1) {
                this.toggle(field, false);
            } else {
                this.select(field);
            }
            Y.one(field.divEl).on("click", field.el.focus, field.el);           // When a user click
            return field;
        },
        select: function(field) {
            this.selectedField = field;
            this.toggleAll(false);
            this.toggle(field, true);
        },
        getSelected: function() {
            return this.selectedField;
        },
        addField: function(fieldOptions) {
            inputEx.MultipleOptions.superclass.addField.call(this, fieldOptions);
            //if (this.inputs.length === 1) {
            //     Y.one(field.divEl).append("<div class=\"wegas-inputex-nulti-separator\"><br /><center>OR</center><br /></div>");
            //}
        },
        toggleAll: function(value) {
            var i;
            for (i = 0; i < this.inputs.length; i += 1) {
                this.toggle(this.inputs[i], value);
            }
        },
        toggle: function(field, value) {
            Y.one(field.divEl).toggleClass("wegas-inputex-multi-selected", value);
        }
    });

    Y.inputEx.Field.prototype.onFocus = function(e) {
        var el = Y.one(this.getEl());
        el.removeClass('inputEx-empty');
        el.addClass('inputEx-focused');
        this.publish("focus", {
            emitFacade: true
        });
        this.fire("focus");
    };

    // Register this class as "select" type
    inputEx.registerType("multipleoptions", inputEx.MultipleOptions);

}, '3.1.0', {
    requires: ['inputex-field', 'inputex-group']
});
