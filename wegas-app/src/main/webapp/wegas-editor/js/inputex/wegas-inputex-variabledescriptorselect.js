/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-variabledescriptorselect", function (Y) {
    "use strict";

    var inputEx = Y.inputEx, VariableDescriptorSelect, VariableDescriptorMethod,
    VariableDescriptorSetter, VariableDescriptorGetter, VariableDescriptorCondition,
    EntityArrayFieldSelect;

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorSelect
     * @class
     * @constructor
     * @extends Y.inpuEx.Group
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorSelect = function (options) {
        VariableDescriptorSelect.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorSelect, inputEx.Group, {
        currentEntityField: null,

        /** @lends Y.Wegas.VariableDescriptorSelect# */
        /**
	 * Setup the options.fields from the availableFields option
         * @function
	 */
        setOptions: function (options) {
            options.fields = options.fields || [];
            VariableDescriptorSelect.superclass.setOptions.call(this, options);
        },

        /**
         * @function
	 */
        render: function () {
            VariableDescriptorSelect.superclass.render.call(this);
            this.divEl.classList.add("wegas-inputex-variabledescriptorselect");
            this.syncUI();
        },

        /**
         * @function
	 */
        setValue: function (val) {
            // Set value should not ba called directly
            //Y.log("VariableDescriptorSelect.setValue", val);
            VariableDescriptorSelect.superclass.setValue.apply(this, arguments);
            this.options.value = val;
            this.syncUI();
        },

        /**
         * @function
	 */
        getValue: function () {
            return "VariableDescriptorFacade.find(" + this.currentEntityField.getValue() + ")";
        },

        /**
         * @function
	 */
        syncUI: function () {
            this.empty();

            var i, ret = [],
            rootEntities = Y.Wegas.Facade.VariableDescriptor.cache.findAll(),
            currentEntity = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.options.value) || rootEntities[0];

            this.currentEntity = currentEntity;                                 // Keeps a reference to the current entity

            while (currentEntity.parentDescriptor) {                            // Add the current entity hierarchy
                ret.push(this.generateSelectConfig(currentEntity.parentDescriptor,
                    currentEntity, currentEntity.parentDescriptor.get("items")));
                currentEntity = currentEntity.parentDescriptor;
            }
            ret.push(this.generateSelectConfig(null, currentEntity, rootEntities));// Add the root context (entities that are at the root of the gameModel

            ret = ret.reverse();
            for (i = 0; i < ret.length; i += 1) {
                this.addField(ret[i]);
            }
            this.currentEntityField = this.inputs[this.inputs.length - 1];
        },

        /**
         *
         * @overrride Y.inputEx.Group.onChange()
         */
        onChange: function (fieldValue, fieldInstance) {
            if (fieldValue === "----------") {
                return; /* @fixme */
            }

            if (Y.Lang.isNumber(fieldValue)) {                                  // value is an number, it is the new current entity's id'
                this.options.value = fieldValue;
                this.options.method = null;
                this.options.methodCfg = null;
                this.options.arguments = null;
                this.syncUI();
            } else if (Y.Lang.isString(fieldValue)) {                           // The id is a string, it's the new current mehtod
                this.options.value = fieldInstance.options.parentEntity.get("id");
                this.options.method = fieldValue;
                this.options.arguments = null;
                this.syncUI();
            } else {                                                            // Otherwise current args value
                this.options.arguments = this.inputs[this.inputs.length - 1].getValue();
            }
            this.fireUpdatedEvt();
        },

        /**
         * @function
	 */
        empty: function () {
            while (this.inputs.length > 0) {
                this.inputs.pop().destroy();
            }
            (new Y.Node(this.fieldset)).empty();
        },

        /**
         * Overriden to add reference to parententity
         * @function
         */
        addField: function (fieldOptions) {
            VariableDescriptorSelect.superclass.addField.call(this, fieldOptions);
            this.inputs[this.inputs.length - 1].options.parentEntity = fieldOptions.parentEntity;
        },

        /**
         * Generate
         * @function
	 */
        generateSelectConfig: function (entity, selectedEntity, items) {
            var value;

            if (entity === this.currentEntity) {
                value = this.options.method;
            }
            if (selectedEntity) {
                value = selectedEntity.get("id");
            }
            return {
                type: 'select',
                choices: this.genChoices(entity, items),
                value: value,
                parentEntity: entity
            };
        },

        /**
         * @function
	 */
        genChoices: function (entity, items) {
            var i, choices = [];

            if (items) {
                for (i = 0; i < items.length; i += 1) {
                    choices.push({
                        value: items[i].get("id"),
                        label: items[i].get("editorLabel")
                    });
                }
            }
            return choices;
        }
    });
    inputEx.registerType("variabledescriptorselect", VariableDescriptorSelect, {});

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorGetter
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorSelect
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorGetter = function (options) {
        VariableDescriptorMethod.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorGetter, VariableDescriptorSelect, {
        /** @lends Y.inputEx.Wegas.VariableDescriptorGetter# */

        syncUI: function () {
            VariableDescriptorGetter.superclass.syncUI.call(this);

            if (this.currentEntity.get("items") && this.currentEntity.get("items").length > 0) {
                this.addField(this.generateSelectConfig(null,                   // Pushes the current entity methods and children to the stack
                    this.currentEntity, this.currentEntity.get("items")));
            }
        },

        genChoices: function (entity, items) {
            var choices = [];

            if (items && items.length > 0) {                                    // If required, push separator
                choices.push({
                    value: "----------"
                });
            }

            return choices.concat(VariableDescriptorGetter.superclass.genChoices.apply(this, arguments));
        }
    });
    inputEx.registerType("variabledescriptorgetter", VariableDescriptorGetter, {});

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorMethod
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorSelect
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorMethod = function (options) {
        VariableDescriptorMethod.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorMethod, VariableDescriptorSelect, {
        /** @lends Y.inputEx.Wegas.VariableDescriptorMethod# */

        syncUI: function () {
            var i, args, methods, cMethod,
            rootEntities = Y.Wegas.Facade.VariableDescriptor.cache.findAll(),
            currentEntity = Y.Wegas.Facade.VariableDescriptor.cache.findById(this.options.value) || rootEntities[0];

            while (this.getMethods(currentEntity).length === 0                  // If the current entity has no methods,
                && currentEntity.get("items") && currentEntity.get("items").length > 0) { // but it has a child
                currentEntity = currentEntity.get("items")[0];                  // select its first child
                this.options.value = currentEntity.get("id");
            }
            cMethod = this.options.methodCfg;                                   //assign cMethod after set this.options.methodCfg by this.getMethods()

            VariableDescriptorMethod.superclass.syncUI.call(this);

            this.addField(this.generateSelectConfig(this.currentEntity,         // Pushes the current entity methods and children to the stack
                null, this.currentEntity.get("items")));

            methods  = this.getMethods(this.currentEntity);

            if (!cMethod && Y.Object.values(methods).length > 0) {
                cMethod = Y.Object.values(methods)[0];                          // By default select the first method available
            }

            args = (cMethod && cMethod.arguments) ? cMethod.arguments : [];

            for (i = 0; i < args.length; i = i + 1) {
                args[i].entity = this.currentEntity;                            // Adds a reference to the target entity to the argument Fields;
            }

            this.currentMethod = cMethod;

            this.addField(Y.mix({
                type: "combine",
                fields: args,
                value: this.options.arguments,
                label: null
            }, cMethod));

        // Same as above, but using json object format for method definitions
        //var schemaMap = {
        //    Entity: {
        //        type: "array",
        //        items: cMethod.arguments
        //    }
        //}, builder = new Y.inputEx.JsonSchema.Builder({
        //    'schemaIdentifierMap': schemaMap,
        //    'defaultOptions':{
        //        'showMsg':true
        //    }
        //}), field  = builder.schemaToInputEx(schemaMap.Entity);
        },
        setOptions: function (options) {
            VariableDescriptorMethod.superclass.setOptions.call(this, options);
            this.options.method = options.method;
            this.options.arguments = options.arguments;
            this.argsOffset = 1;
        },

        getValue: function () {
            var i, j, l = this.inputs.length,
            args = this.inputs[l - this.argsOffset].getValue(),
            method = this.inputs[l - this.argsOffset - 1].getValue();

            if (!method) {
                return "true";
            }

            for (i = 0; i < args.length; i = i + 1) {
                if (this.currentMethod.arguments[i].scriptType === "string") {
                    if (Y.Lang.isArray(args[i])) {
                        for (j = 0; j < args[i].length; j++) {
                            args[i][j] = Y.Wegas.Helper.escapeJSString(args[i][j]);
                        }
                        args[i] = Y.JSON.stringify(args[i]);
                    } else {
                        args[i] = '"' + Y.Wegas.Helper.escapeJSString(args[i]) + '"';
                    }
                }
            }
            return "VariableDescriptorFacade.find(" + this.inputs[l - this.argsOffset - 2].getValue() + ")"
            + "." + method + "(" + args.join(", ") + ")";
        },
        /**
         * Generate choices for a given entity: add it's methods and then pass up to parent class
         * to add children variable descriptors.
         */
        genChoices: function (entity, items) {
            var choices = [];
            if (entity) {
                choices = choices.concat(this.getMethods(entity));              // Push the methods to the select choices
            }

            if (items && choices.length > 0) {                                  // If required, push separator
                choices.push({
                    value: "----------"
                });
            }
            return choices.concat(VariableDescriptorMethod.superclass.genChoices.apply(this, arguments));
        },

        getMethods: function (entity) {
            var i, methods = entity.getMethodCfgs(), ret = [];
            for (i in methods) {
                if (!this.options.returnsFilter                                 // Apply filter on the method return type
                    || this.options.returnsFilter.indexOf(methods[i].returns || "void") >= 0) {


                    methods[i].value = i;
                    methods[i].label =  methods[i].label || i;
                    ret.push(methods[i]);
                    if (i === this.options.method) {
                        this.options.methodCfg = methods[i];
                    }
                }
            }
            return ret;
        }
    });

    inputEx.registerType("variabledescriptormethod", VariableDescriptorMethod, {});

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorSetter
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorMethod
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorSetter = function (options) {
        VariableDescriptorSetter.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorSetter, VariableDescriptorMethod, {
        /** @lends Y.Wegas.VariableDescriptorSetter# */

        setOptions: function (options) {
            VariableDescriptorSetter.superclass.setOptions.call(this, options);
            this.options.returnsFilter = ["void"];
        }
    });

    inputEx.registerType("variabledescriptorsetter", VariableDescriptorSetter, {});

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorCondition
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorMethod
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorCondition = function (options) {
        VariableDescriptorCondition.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorCondition, VariableDescriptorMethod, {
        /** @lends Y.inputEx.Wegas.VariableDescriptorCondition# */

        setOptions: function (options) {
            VariableDescriptorCondition.superclass.setOptions.call(this, options);
            this.argsOffset = 1;
            this.options.returnsFilter = ["number", "boolean"];
            this.options.operator = options.operator;
            this.options.rightValue = options.rightValue || 0;
        },

        getValue: function () {
            var value = VariableDescriptorCondition.superclass.getValue.call(this);

            if (this.argsOffset > 1) {
                value += this.inputs[this.inputs.length - 1].getValue().join("");
            }
            return value;
        },

        /**
         * Override to prevent
         */
        onChange: function (fieldValue, fieldInstance) {
            VariableDescriptorCondition.superclass.onChange.apply(this, arguments);
        },

        syncUI: function () {
            VariableDescriptorCondition.superclass.syncUI.call(this);

            var methods  = this.getMethods(this.currentEntity),
            cMethod = methods[this.options.method];

            if (!cMethod && methods.length > 0) {
                cMethod = methods[0];                                           // By default select the first method available
            }

            if (cMethod && cMethod.returns === "number") {
                this.argsOffset = 2;
                this.addField({
                    type: "combine",
                    fields: [{
                        type: "select",
                        value: this.options.operator,
                        choices: [{
                            value: "===",
                            label: "equals"
                        }, {
                            value: ">",
                            label: "is greater than"
                        }, {
                            value: "<",
                            label: "is smaller than"
                        }, {
                            value: ">=",
                            label: "is greater or equal to"
                        }, {
                            value: "<=",
                            label: "is smaller or equal to"
                        }]
                    }, {
                        value: this.options.rightValue
                    }]
                //                value: this.options.arguments
                });
            } else {
                this.argsOffset = 1;
            }

        }
    });

    inputEx.registerType("variabledescriptorcondition", VariableDescriptorCondition, {});

    /**
     * @name Y.inputEx.Wegas.EntityArrayFieldSelect
     * @class
     * @constructor
     * @extends Y.inputEx.SelectField
     * @param {Object} options InputEx definition object
     */
    EntityArrayFieldSelect = function (options) {
        EntityArrayFieldSelect.superclass.constructor.call(this, options);
    };
    Y.extend(EntityArrayFieldSelect, inputEx.SelectField, {
        /** @lends Y.Wegas.EntityArrayFieldSelect# */
        /**
	 * Set the ListField classname
	 * @param {Object} options Options object as passed to the constructor
	 */
        setOptions: function (options) {
            var i, results = options.entity ? options.entity.get("results") :
            Y.Plugin.EditEntityAction.currentEntity.get("results");
            options.choices = [];

            for (i = 0; i < results.length; i = i + 1) {
                options.choices.push({
                    value: results[i].get("id"),
                    label: results[i].get("editorLabel")
                });
            }

            EntityArrayFieldSelect.superclass.setOptions.call(this, options);
            this.options.entity = options.entity;
        }
    });
    inputEx.registerType("entityarrayfieldselect", EntityArrayFieldSelect);     // Register this class as "list" type

});
