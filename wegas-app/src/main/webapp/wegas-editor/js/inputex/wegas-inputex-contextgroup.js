/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-inputex-contextgroup", function(Y) {
    "use strict";

    var contextGroup = function(options) {
        contextGroup.superclass.constructor.call(this, options);
    };
    Y.extend(contextGroup, Y.inputEx.Group, {
        setOptions: function(options) {
            var o = Y.clone(options, true), keys = [], i;
            this.contextKey = o.contextKey;
            this.fields = o.fields || [];
            for (i in o.fields) {
                keys.push(o.fields[i].name);
            }
            Array.prototype.splice.apply(this.fields, [0, 0].concat([{type: "select", choices: keys}]));
            this.contextKeys = keys;
            contextGroup.superclass.setOptions.call(this, o);
        },
        renderFields: function() {
            contextGroup.superclass.renderFields.apply(this, arguments);
            this.inputs[0].on("updated", function(val) {
                var value;
                if (val === this.context || typeof this.context === "undefined") {
                    return;
                }
                value = this.getFieldByName(this.context).getValue();
                value[this.contextKey] = val;
                this.setValue(value);
            }, this);
            this.enableFields(this.contextKeys[0]);
        },
        setValue: function(val) {
            this.getFieldByName(val[this.contextKey]).setValue(val);
            this.enableFields(val[this.contextKey]);

        },
        enableFields: function(ctx) {
            var sel, i;
            this.context = ctx;
            for (i in this.fields) {
                if (this.fields[i].name === this.context) {
                    sel = +i;
                }
            }

            Y.Array.each(this.inputs, function(item, index) {
                item.hide();
                if (index === sel || index === 0) {
                    item.show();
                }
            });
            this.inputs[0].setValue(this.context);
        },
        getValue: function() {
            return this.getFieldByName(this.context).getValue();
        }
    });
    Y.inputEx.registerType("contextgroup", contextGroup);
});