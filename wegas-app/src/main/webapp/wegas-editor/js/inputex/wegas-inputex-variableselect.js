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
     * @name Y.inputEx.Wegas.VariableDescriptorGetter
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorSelect
     * @param {Object} options InputEx definition object
     */
    var VariableDescriptorGetter = function(options) {
        Y.inputEx.VariableDescriptorSelect.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorGetter, Y.inputEx.VariableDescriptorSelect, {
        /** @lends Y.inputEx.Wegas.VariableDescriptorGetter# */

        syncUI: function() {
            VariableDescriptorGetter.superclass.syncUI.call(this);

            if (this.currentEntity && this.currentEntity.get("items") && this.currentEntity.get("items").length > 0) {
                this.addField(this.generateSelectConfig(null,
                        this.currentEntity, this.currentEntity.get("items")));  // Pushes the current entity methods and children to the stack
            } else {
                (new Y.Node(this.fieldset)).append("<em>no variable created </em>");
            }
        },
        genChoices: function(entity, items) {
            var choices = [];

            if (items && items.length > 0) {                                    // If required, push separator
                choices.push({
                    value: "----------"
                });
            }

            return choices.concat(VariableDescriptorGetter.superclass.genChoices.apply(this, arguments));
        }
    });
    inputEx.registerType("variabledescriptorgetter", VariableDescriptorGetter);

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
            this.options.fields = [{
                    label: "Variable to display",
                    type: 'variabledescriptorgetter',
                    classFilter: options.classFilter,
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
            if (this.inputs[1].getValue() && !this.inputs[1].getValue().length > 0) {
                return {
                    expr: this.inputs[1].getValue()
                };
            } else if (this.inputs[0].currentEntityField) {
                return {//save name for portability instead of id
                    name: this.inputs[0].currentEntityField.getValue()
                };
            } else {
                return {};
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
