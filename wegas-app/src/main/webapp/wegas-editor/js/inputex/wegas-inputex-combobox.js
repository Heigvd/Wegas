/* 
 * Wegas
 * http://wegas.albasim.ch
 
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-inputex-combobox", function(Y) {
    "use strict";

    var inputEx = Y.inputEx;

    /**
     * Combobox module for inputex, options added are<br/>
     * source: Array of strings or object{value:"the value"[, label:"the label, optional default to value"]}
     * @constructor
     * @param {type} options
     * @returns {undefined}
     */
    Y.namespace("inputEx.Wegas").Combobox = function(options) {
        inputEx.AutoComplete.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.Combobox, inputEx.AutoComplete, {
        /**
         *
         * @param {type} options
         * @returns {undefined}
         */
        setOptions: function(options) {
            options.autoComp = options.autoComp || {};
            options.autoComp.source = options.autoComp.source || options.source || [];
            options.className = options.className || 'inputEx-Field inputEx-AutoComplete inputEx-ComboBox';
            options.autoComp = Y.merge(options.autoComp, {
                minQueryLength: 0,
                activateFirstItem: false,
                tabSelect: false,
                resultFilters: function(q, results) {
                    q = q.toLowerCase();
                    return Y.Array.filter(results, function(r) {
                        return r.raw.label.toLowerCase().indexOf(q) === 0 || r.raw.value.toLowerCase().indexOf(q) === 0;
                    });
                },
                resultTextLocator: 'label'
            });
            options.returnValue = function(v) {
                return Y.Lang.isUndefined(v.value) ? v.label : v.value;
            };
            inputEx.Wegas.Combobox.superclass.setOptions.call(this, options);
            this._buildSource();
        },
        renderComponent: function() {
            inputEx.Wegas.Combobox.superclass.renderComponent.call(this);
            Y.one(this.el).ancestor().setStyle("position", "relative")
                .appendChild("<span class='inputex-combobox-select'></span>")
                .on("click", function(e) {
                    e.stopPropagation();
                    if (!this.yEl) {
                        return;
                    }
                    if (this.yEl.ac.get("visible")) {
                        this.yEl.ac.hide();
                    } else {
                        this.yEl.ac.sendRequest("");
                        this.yEl.ac.show();
                    }
                }, this);
        },
        itemSelectHandler: function(o) {
            o.halt(true);
            var aData = o.result.raw;
            this.setValue(this.options.returnValue ? this.options.returnValue(aData) : aData.label);
            //This is YUI autocompletelist default select function. Value has been altered
            this.yEl.ac._inputNode.focus();
            this.yEl.ac._updateValue(this.getValue());
            this.yEl.ac._ariaSay('item_selected', {item: this.getValue()});
            this.yEl.ac.hide();
        },
        onBlur: function() {
            Y.inputEx.StringField.prototype.onBlur.call(this);
        },
//        getValue: function(value) {
//            return inputEx.Wegas.Combobox.superclass.getValue.call(this, value);
//        },
//        validate: function() {
//            return inputEx.Wegas.Combobox.superclass.validate.apply(this, arguments);
//        },
        /**
         * build object(label, value) for source Array.
         * @private
         * @returns {undefined}
         */
        _buildSource: function() {
            Y.Array.each(this.options.autoComp.source, function(item, i, a) {
                if (Y.Lang.isString(item)) {
                    item = {value: item, label: item};
                } else {
                    item.label = Y.Lang.isUndefined(item.label) ? item.value : item.label;
                }
                a[i] = item;
            });
        }
    });

    inputEx.registerType("combobox", inputEx.Wegas.Combobox);
});

