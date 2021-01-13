/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-markup", function(Y) {

    var lang = Y.Lang,
        inputEx = Y.inputEx,
        MarkupField;

    /**
     * Basic string field (equivalent to the input type "text")
     * @class MarkupField
     * @extends inputEx.Field
     * @constructor
     * @param {Object} options Added options:
     * <ul>
     *	  <li>regexp: regular expression used to validate (otherwise it always validate)</li>
     *   <li>size: size attribute of the input</li>
     *   <li>maxLength: maximum size of the string field (no message display, uses the maxlength html attribute)</li>
     *   <li>minLength: minimum size of the string field (will display an error message if shorter)</li>
     *   <li>typeInvite: string displayed when the field is empty</li>
     *   <li>readonly: set the field as readonly</li>
     * </ul>
     */
    MarkupField = function(options) {
        MarkupField.superclass.constructor.call(this, options);

        if (this.options.typeInvite) {
            this.updateTypeInvite();
        }
    };

    Y.extend(MarkupField, inputEx.Field, {
        /**
         * Render an 'INPUT' DOM node
         * @method renderComponent
         */
        renderComponent: function() {
            // This element wraps the input node in a float: none div
            this.wrapEl = inputEx.cn('div', {className: 'MarkupField-wrapper'});

            // Attributes of the input field
            var attributes = {};
            attributes.id = this.divEl.id ? this.divEl.id + '-field' : Y.guid();
            if (this.options.size) {
                attributes.size = this.options.size;
            }
            if (this.options.name) {
                attributes.name = this.options.name;
            }

            // Create the node
            this.el = inputEx.cn('div');

            // Append it to the main element
            this.wrapEl.appendChild(this.el);
            this.fieldContainer.appendChild(this.wrapEl);
        },
        /**
         * Function to set the value
         * @method setValue
         * @param {String} value The new value
         * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the 'updated' event or not (default is true, pass false to NOT send the event)
         */
        setValue: function(value, sendUpdatedEvt) {
            this.el.innerHTML = value;

            // call parent class method to set style and fire "updated" event
            MarkupField.superclass.setValue.call(this, value, sendUpdatedEvt);
        }
    });

    inputEx.registerType("markup", MarkupField);                                // Register this class as "markup" type

});
