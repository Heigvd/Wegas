/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add("wegas-inputex-variableselect", function(Y) {
    "use strict";
    var inputEx = Y.inputEx;
    /**
     * Edit an object referencing a variable with format:
     *    {
     *      name: "name",
     *      expr: "expr",
     *      dataSource: "ds"
     *    }
     *
     * @class inputEx.Variableselect
     * @extends inputEx.StringGroup
     **/
    Y.namespace("inputEx.Wegas").Variableselect = function(options) {
        inputEx.Wegas.Variableselect.superclass.constructor.call(this, options);
    };
    Y.extend(inputEx.Wegas.Variableselect, inputEx.Group, {
        setOptions: function(options) {
            inputEx.Wegas.Variableselect.superclass.setOptions.call(this, options);
//            this.options.mode = options.mode || "wysiwyg";
            this.options.legend = options.legend || "Variable";
            this.options.fields = [{
                    label: "Variable",
                    type: 'variabledescriptorgetter',
                    name: 'name'
                }, {
                    label: 'Or expression',
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                    name: 'expr'
                }];
        },
        validate: function() {
            return this.inputs[1].validate() || this.inputs[0].validate();
        },
        getValue: function() {
            if (this.inputs[1].getValue() && !this.inputs[1].getValue().isEmpty()) {
                return {
                    expr: this.inputs[1].getValue()
                };
            } else {
                return {//save name for portability instead of id
                    name: this.inputs[0].currentEntityField.getValue()
                };
            }
        },
        setValue: function(val, fireUpdatedEvent) {
            if (val.id) {
                var findVal = Y.Wegas.Facade.VariableDescriptor.cache.findById(val.id);
                val.name = findVal.get("name");                                 // @fixme
            }

            inputEx.Wegas.Variableselect.superclass.setValue.call(this, val, fireUpdatedEvent);
        }

    });
    inputEx.registerType("variableselect", inputEx.Wegas.Variableselect); // Register this class as "wegasurl" type

});
