/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-variabledescriptorselect", function(Y) {
    "use strict";

    var inputEx = Y.inputEx,
        Wegas = Y.Wegas,
        VariableDescriptorSelect, VariableDescriptorMethod, VariableDescriptorCondition,
        VariableDescriptorStatement, EntityArrayFieldSelect,
        DISABLED_CHOICE_LABEL = {
            //variable: "\u2501Select\u2501",
            variable: "-Select-",
            method: "\u2501\u2501\u2501\u2501"
        };

    Y.namespace("inputEx.Wegas");

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorSelect
     * @class
     * @constructor
     * @extends Y.inpuEx.Group
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorSelect = function(options) {
        VariableDescriptorSelect.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorSelect, inputEx.Group, {
        /** @lends Y.Wegas.VariableDescriptorSelect# */
        currentEntityField: null,
        /**
         * Setup the options.fields from the availableFields option
         * @function
         */
        setOptions: function(options) {
            options.fields = options.fields || [];
            VariableDescriptorSelect.superclass.setOptions.call(this, options);
            this.options.className = options.className || 'wegas-inputex-variabledescriptorselect-group inputEx-Group';
            this.options.label = options.label;
            this.options.raw = options.raw;
            if (options.classFilter) {
                if (!Y.Lang.isArray(options.classFilter)) {
                    options.classFilter = [options.classFilter];
                }
                this.options.classFilter = options.classFilter;
                //    this.options.classFilter.push("ListDescriptor"); // Folders are always selectable (to
                // select sub variables)
            }
        },
        /**
         * @function
         */
        render: function() {
            VariableDescriptorSelect.superclass.render.call(this);
            this.fieldset.classList.add("wegas-inputex-variabledescriptorselect");
            this.fieldContainer = this.fieldset.parentNode;
            this.msgEl = Y.Node.create("<div class='inputEx-message'></div>").getDOMNode();
            Y.one(this.divEl).append(this.msgEl);
            this.syncUI();
            if (this.options.label) {
                Y.one(this.fieldset).get("parentNode").prepend("<label>" + this.options.label + "</label>");
            }
            //            this.on("updated", function() {
            //                this.setClassFromState();
            //            });
        },
        /**
         * @function
         */
        setValue: function(val) {
            // Set value should not ba called directly
            //Y.log("VariableDescriptorSelect.setValue", val);
            VariableDescriptorSelect.superclass.setValue.apply(this, arguments);
            this.options.value = val;
            this.syncUI();
            if (!this.validate()) {
                this._fallback(this.options.raw, "Failed to validate statement");
            }
        },
        /**
         * @function
         */
        getValue: function() {
            if (this._fallbackMode) {
                return this.inputs[0].getValue() || this.options.raw;
            }
            if (this.currentEntityField && this.currentEntityField.getValue()) {
                return "Variable.find(gameModel, \"" + this.currentEntityField.getValue() + "\")";
            }
            return null;
        },
        validate: function() {
            var valid = !!this.getValue() && VariableDescriptorSelect.superclass.validate.call(this), entity;
            if (valid) {
                try {
                    window.esprima.parse(this.getValue());
                } catch (e) {
                    valid = false;
                }
            }
            if (this.options.classFilter && this.currentEntityField && this.currentEntityField.getValue()) {
                entity = Wegas.Facade.Variable.cache.find("name", this.currentEntityField.getValue());
                if (entity && Y.Array.indexOf(this.options.classFilter, entity.get("@class")) < 0) {
                    valid = false;
                }
            }
            if (!valid) {
                this.options.showMsg = true;
            }
            return valid;
        },
        /**
         * @function
         */
        syncUI: function() {
            var entityStack = [], //rootEntities = Wegas.Facade.Variable.cache.findAll(),
                currentEntity = Wegas.Facade.Variable.cache.find('name', this.options.value) /* || rootEntities[0]*/;
            this.empty();
            this._fallbackMode = false;
            if (currentEntity) {
                this.currentEntity = currentEntity; // Keeps a reference to the current entity
                entityStack.push(currentEntity);

                while (currentEntity.get("parentDescriptorType") !== "GameModel") { // Add the current entity hierarchy
                    currentEntity = currentEntity.getParent();
                    entityStack.push(currentEntity);

                }
                Y.Array.each(entityStack.reverse(), function(item) {
                    this._renderSelectConfig(item);
                }, this);
                // ret.push(this.generateSelectConfig(null, currentEntity, rootEntities)); // Add the root context
                // (entities that are at the root of the gameModel this._renderSelectConfig(currentEntity);
                // Y.Array.each(ret.reverse(), this.addField, this);
                this.currentEntityField = this.inputs[this.inputs.length - 1];
            } else {
                if (this.options.raw) {

                    if (Y.Lang.isString(this.options.value)) {
                        //                        this._fallbackMode = true;
                        //                        this._renderSelectConfig(null);
                        //                        this.displayMessage("Unable to find variable '" + this.options.value
                        // + "'");
                        this._fallback(this.options.raw, "Unable to find variable '" + this.options.value + "'");
                        //                        this.setClassFromState("invalid");
                    } else {
                        this._fallback(this.options.raw, "Unable to parse field");
                        return;
                    }
                } else {
                    this._renderSelectConfig(null);
                }
                this.currentEntityField = this.inputs[this.inputs.length - 1];
            }
        },
        /**
         * Wrapper for generateSelectConfig -> addField for a given entity
         * @private
         * @function
         * @param {VariableDescriptor} currentEntity
         * @returns {undefined}
         */
        _renderSelectConfig: function(currentEntity) {
            var ret = [],
                entity = currentEntity ? currentEntity.getParent() : Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                items = entity.get("items");

            if (entity instanceof Y.Wegas.persistence.GameModel) {
                entity = null;
            }

            ret.push(this.generateSelectConfig(entity, currentEntity, items));
            Y.Array.each(ret, this.addField, this);
        },
        /**
         * Add text as fallback.
         * @function
         * @private
         * @param {type} value the field value
         * @param {type} message the message to provide to the user.
         * @returns {undefined}
         */
        _fallback: function(value, message) {
            var msg = [], /**
             * Crawl inputs to find error messages.
             * Inputs should add an error message to explain validation fail.
             * @param {type} scope the input
             * @returns {undefined}
             */
                crawlMsg = function(scope) {
                    var i;
                    if (scope.inputs && scope.inputs.length) {
                        for (i in scope.inputs) {
                            if (scope.inputs[i].options.messages.error) {
                                msg.push(scope.inputs[i].options.messages.error);
                            }
                            crawlMsg(scope.inputs[i]);
                        }
                    }
                };
            crawlMsg(this);
            value = value || "";
            this.empty();
            this.addField({
                type: "text",
                value: value,
                rows: value.split("\n").length + 1,
                cols: 500,
                wrapperClassName: "inputEx-fieldWrapper wegas-variabledescriptor-select-fallback"
            });
            this.displayMessage(msg.length ? msg.join("<br>") : message);
            this._fallbackMode = true;
        },
        /**
         *
         * @overrride Y.inputEx.Group.onChange()
         */
        onChange: function(fieldValue) {
            if (!fieldValue) {
                return;
            }

            var entity = Wegas.Facade.Variable.cache.find('name', fieldValue);
            if (entity) { //An entity was found, it is the new current entity
                // if (Y.Lang.isNumber(fieldValue)) {
                this.options.value = fieldValue;
                this.options.method = null;
                this.options.methodCfg = null;
                this.options["arguments"] = null;
                this.syncUI();
            }
            /*else if (Y.Lang.isString(fieldValue)) { // The id is a method, it's the new current mehtod
             this.options.value = fieldInstance.options.parentEntity.get("name");
             this.options.method = fieldValue;
             this.options["arguments"] = null;
             this.syncUI();
             } else { // Otherwise current args value
             this.options["arguments"] = this.inputs[this.inputs.length - 1].getValue();
             }*/
            this.fireUpdatedEvt();
        },
        /**
         * @function
         */
        empty: function() {
            while (this.inputs.length > 0) {
                this.inputs.pop().destroy();
            }
            Y.one(this.fieldset).empty();
        },
        /**
         * Disable all choices matching the given label
         * @param {type} fields
         * @param {type} label
         * @returns {undefined}
         */
        disableChoices: function(field, label) {
            var length = field.choicesList.length,
                i = 0;
            for (i = 0; i < length; i++) {
                if (field.choicesList[i].label === label) {
                    field.disableChoice({
                        position: i
                    });
                }
            }
        },
        /**
         * Overriden to add reference to parententity
         * @function
         */
        addField: function(fieldOptions) {
            var addedField;
            VariableDescriptorSelect.superclass.addField.call(this, fieldOptions);
            addedField = this.inputs[this.inputs.length - 1];
            addedField.options.parentEntity = fieldOptions.parentEntity;
            if (addedField.disableChoice) {
                this.disableChoices(addedField, DISABLED_CHOICE_LABEL.variable);
                this.disableChoices(addedField, DISABLED_CHOICE_LABEL.method);
            }
        },
        /**
         * Generate
         * @function
         */
        generateSelectConfig: function(entity, selectedEntity, items) {
            var value, choices;
            if (entity === this.currentEntity) {
                value = this.options.method;
            }
            if (selectedEntity) {
                value = selectedEntity.get("name");
            }
            choices = this.genChoices(entity, items);
            if (choices.length) {
                return {
                    type: 'select',
                    choices: [{
                            label: DISABLED_CHOICE_LABEL.variable,
                            value: null,
                            disabled: true
                        }].concat(choices),
                    value: value,
                    parentEntity: entity
                };
            }
            return {
                type: "hidden"
            };
        },
        /**
         * @function
         */
        genChoices: function(entity, items) {
            if (items) {
                return Y.Array.map(Y.Array.filter(items, function(i) { // Apply class filter
                    return (!this.options.classFilter || Y.Array.indexOf(this.options.classFilter.concat("ListDescriptor"), i.get("@class")) > -1);
                }, this), function(i) {
                    return {
                        value: i.get("name"),
                        label: i.getTreeEditorLabel()
                    };
                }, this);
            }
            return [];
        }
    });
    Y.mix(VariableDescriptorSelect, {
        BINARYOPERATORS: [{
                value: "===",
                label: "equals"
            }, {
                value: "!==",
                label: "is different than"
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
            }],
        LOGICALOPERATORS: [{
                value: "&&",
                label: "AND"
            }, {
                value: "||",
                label: "OR"
            }]
    });
    inputEx.Wegas.VariableDescriptorSelect = VariableDescriptorSelect;
    inputEx.registerType("variabledescriptorselect", VariableDescriptorSelect, {});

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorMethod
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorSelect
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorMethod = function(options) {
        VariableDescriptorMethod.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorMethod, VariableDescriptorSelect, {
        /** @lends Y.inputEx.Wegas.VariableDescriptorMethod# */
        GLOBALMETHODS: {},
        generateSelectConfig: function(entity, selectedEntity, items) {
            if (this.isGlobalMethod()) {
                return {
                    type: 'select',
                    choices: this.genChoices(entity, items),
                    value: this.options.value,
                    parentEntity: entity
                };
            } else {
                return VariableDescriptorMethod.superclass.generateSelectConfig.apply(this, arguments);
            }
        },
        /**
         * Check if val is a global method. If no value is provided, current value is checked.
         * @function
         * @param {String} val the value to test
         * @returns {Boolean} result
         */
        isGlobalMethod: function(val) {
            val = val || this.options.value;
            return Y.Lang.isString(val) && Y.Object.hasKey(this.GLOBALMETHODS, val.replace("GLOBAL", ""));
        },
        syncUI: function() {
            var args, methods, cMethod, //rootEntities = Wegas.Facade.Variable.cache.findAll(),
                currentEntity = Wegas.Facade.Variable.cache.find('name', this.options.value) /*|| rootEntities[0]*/;

            if (this.isGlobalMethod()) {
                //VariableDescriptorSelect.prototype.syncUI.apply(this, arguments);
                this.empty();
                this._renderSelectConfig(null);
                this._fallbackMode = false;
                this.displayMessage("");
                cMethod = this.GLOBALMETHODS[this.options.value.replace("GLOBAL", "")];

                this.options.methodCfg = cMethod;
                this.addField(Y.mix({
                    type: "combine",
                    fields: cMethod["arguments"],
                    value: this.options["arguments"],
                    label: null
                }, cMethod));

            } else if (this.options.value && this.options.value.indexOf("GLOBAL") === 0) {
                this._fallback(this.options.raw, "Unable to find global '" + this.options.raw.split("(")[0] + "'");
            } else if (currentEntity) {

                /*  while (this.getMethods(currentEntity).length === 0          // If the current entity has no methods,
                 && currentEntity.get("items") && currentEntity.get("items").length > 0) { // but it has a child
                 currentEntity = currentEntity.get("items")[0];                 // select its first child
                 this.options.value = currentEntity.get("name");
                 }*/

                VariableDescriptorMethod.superclass.syncUI.call(this);
                this.addField(this.generateSelectConfig(this.currentEntity, null, currentEntity.get("items"))); // Pushes the current entity methods and children to the stack
                cMethod = this.options.methodCfg; //assign cMethod after set
                // this.options.methodCfg by
                // this.getMethods()

                if (!cMethod && this.options.method) {
                    this._fallback(this.options.raw, "Unable to find method '" + this.options.method + "'");
                    return;
                }

                methods = this.getMethods(this.currentEntity);

                if (!cMethod && Y.Object.values(methods).length > 0) {
                    // cMethod = this.options.methodCfg = Y.Object.values(methods)[0]; // By default select the first
                    // method available
                    cMethod = this.options.methodCfg = this.inputs[this.inputs.length - 1].options.choices[0];
                }

                args = (cMethod && cMethod["arguments"]) ? cMethod["arguments"] : [];
                Y.Array.each(args, function(i) { // @Hack Add default size to arguments
                    i.size = i.size || 5;
                });
                Y.Array.each(args, function(a) {
                    a.entity = this.currentEntity;
                }, this); // Adds a reference to the target entity to the argument Fields;

                this.currentMethod = cMethod;

                this.addField(Y.mix({
                    type: "combine",
                    fields: args,
                    value: this.options["arguments"],
                    label: null
                }, cMethod));

                // Same as above, but using json object format for method definitions
                //var schemaMap = {
                //    Entity: {
                //        type: "array",
                //        items: cMethod["arguments"]
                //    }
                //}, builder = new inputEx.JsonSchema.Builder({
                //    'schemaIdentifierMap': schemaMap,
                //    'defaultOptions':{
                //        'showMsg':true
                //    }
                //}), field  = builder.schemaToInputEx(schemaMap.Entity);
            } else {
                VariableDescriptorSelect.prototype.syncUI.apply(this, arguments);
            }
        },
        setOptions: function(options) {
            VariableDescriptorMethod.superclass.setOptions.call(this, options);
            this.options.method = options.method;
            this.options["arguments"] = options["arguments"];
            this.argsOffset = 1;
        },
        getValue: function() {
            if (this._fallbackMode) {
                return VariableDescriptorMethod.superclass.getValue.call(this);
            }
            if (Y.Lang.isString(this.options.value) &&
                Y.Object.hasKey(this.GLOBALMETHODS, this.options.value.replace("GLOBAL", ""))) {
                var k = this.options.value.replace("GLOBAL",
                    ""),
                    cMethod = this.GLOBALMETHODS[this.options.value.replace("GLOBAL", "")];
                return k + "(" + this.encodeArgs(this.inputs[1].getValue(), cMethod["arguments"]) + ")";

            } else if (this.inputs[this.inputs.length - this.argsOffset] &&
                (this.inputs.length - this.argsOffset - 1) > -1) { // Not true only if there are no entites
                var length = this.inputs.length,
                    args = this.inputs[length -
                        this.argsOffset].getValue(),
                    method = this.inputs[length -
                        this.argsOffset -
                        1].getValue(),
                    variableSelect = VariableDescriptorMethod.superclass.getValue.call(this);

                if (!method) {
                    return null;
                }
                return variableSelect + "." + method + "(" + this.encodeArgs(args, this.currentMethod["arguments"]) +
                    ")";
            }
            return VariableDescriptorMethod.superclass.getValue.call(this);
        },
        encodeArgs: function(args, argsCfg) {
            var i;
            for (i = 0; i < args.length; i = i + 1) {
                if (argsCfg[i].scriptType === "string") {
                    /* if (Y.Lang.isArray(args[i])) {
                     for (j = 0; j < args[i].length; j++) {
                     args[i][j] = Wegas.Helper.escapeJSString(args[i][j]);
                     }
                     args[i] = Y.JSON.stringify(args[i]);
                     } else if (Y.Lang.isObject(args[i])) {
                     for (j in args[i]) {
                     args[i][j] = Wegas.Helper.escapeJSString(args[i][j]);
                     }
                     args[i] = Y.JSON.stringify(args[i]);
                     } else {
                     args[i] = '"' + Wegas.Helper.escapeJSString(args[i]) + '"';
                     }*/
                    args[i] = Y.JSON.stringify(args[i]);
                } else if (argsCfg[i].scriptType === "array") {
                    args[i] = Y.JSON.stringify(args[i]);
                } else if (argsCfg[i].scriptType === "object") {
                    args[i] = Y.JSON.stringify(args[i]);
                }
            }
            return args.join(", ");
        },
        onChange: function(fieldValue, fieldInstance) {
            if (!fieldValue) {
                return;
            }
            var entity = Wegas.Facade.Variable.cache.find('name', fieldValue);
            if (this.isGlobalMethod(fieldValue)) {
                this.options.value = fieldValue;
                this.options["arguments"] = null;
                this.options.methodCfg = null;
                this.syncUI();
            } else if (entity || this._fallbackMode) {
                VariableDescriptorMethod.superclass.onChange.apply(this, arguments);
            } else if (Y.Lang.isString(fieldValue)) { // The id is a method, it's the new current mehtod
                this.options.value = fieldInstance.options.parentEntity.get("name");
                this.options.method = fieldValue;
                this.options["arguments"] = null;
                this.syncUI();
            } else { // Otherwise current args value
                this.options["arguments"] = this.inputs[this.inputs.length - 1].getValue();
            }
            this.fireUpdatedEvt();
        },
        /**
         * Generate choices for a given entity: add it's methods and then pass up to parent class
         * to add children variable descriptors.
         */
        genChoices: function(entity, items) {
            var i,
                choices = [];

            if (entity) {
                choices = choices.concat(this.getMethods(entity)); // Push the methods to the select
                // choices
                if (items && choices.length) {
                    choices.push({
                        label: DISABLED_CHOICE_LABEL.method,
                        value: null,
                        disabled: true,
                        arguments: []
                    });
                }
            }

            /* if (items && choices.length > 0) { // If required, push separator
             choices.push({
             value: "----------"
             });
             }*/
            choices = choices.concat(VariableDescriptorMethod.superclass.genChoices.apply(this, arguments));

            if (!entity) { // If the entity is at root level of its hierarchy (game model
                // level)
                for (i in this.GLOBALMETHODS) { // Adds all global methods
                    choices.push({
                        label: this.GLOBALMETHODS[i].label,
                        value: "GLOBAL" + i
                    });
                }
            }
            return choices;
        },
        getMethods: function(entity) {
            var i,
                methods = entity.getMethodCfgs(),
                ret = [];
            for (i in methods) {
                if (!this.options.returnsFilter // Apply filter on the method return type
                    || Y.Array.indexOf(this.options.returnsFilter, methods[i].returns || "void") >= 0) {

                    methods[i].value = i;
                    methods[i].label = methods[i].label || i;
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
     * Adds to VariableDescriptorSelect some global methods, for exemple:
     *      RequestManager.sendEvent("evt", "msg");
     *
     * @name Y.inputEx.Wegas.VariableDescriptorStatement
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorMethod
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorStatement = function(options) {
        VariableDescriptorStatement.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorStatement, VariableDescriptorMethod, {
        /** @lends Y.Wegas.VariableDescriptorStatement# */
        setOptions: function(options) {
            VariableDescriptorStatement.superclass.setOptions.call(this, options);
            this.options.returnsFilter = ["void"];
        },
        GLOBALMETHODS: {
            separatorVariables: {
                label: "\u2501\u2501\u2501\u2501"
            },
            "RequestManager.sendCustomEvent": {
                className: "wegas-method-returnline",
                label: "Send popup",
                "arguments": [{
                        type: "hidden",
                        value: "popupEvent",
                        scriptType: "string"
                    }, {
                        type: "group",
                        fields: [{
                                name: "content",
                                type: "html",
                                scriptType: "string"
                            }],
                        scriptType: "string"
                    }]
            },
            "Event.fire": {
                label: "Fire event",
                "arguments": [{
                        type: "string",
                        typeInvite: "event name",
                        scriptType: "string",
                        required: true
                    }]
            },
            "DelayedEvent.delayedFire": {
                label: "Fire delayed event",
                "arguments": [
                    {
                        type: "number",
                        typeInvite: "minutes",
                        scriptType: "string",
                        required: true
                    }, {
                        type: "number",
                        typeInvite: "seconds",
                        scriptType: "string",
                        required: true
                    }, {
                        type: "string",
                        typeInvite: "event name",
                        scriptType: "string",
                        required: true
                    }]
            }
        }
    });
    inputEx.registerType("statement", VariableDescriptorStatement, {});
    inputEx.Wegas.VariableDescriptorStatement = VariableDescriptorStatement;

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorCondition
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorMethod
     * @param {Object} options InputEx definition object
     */
    VariableDescriptorCondition = function(options) {
        VariableDescriptorCondition.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorCondition, VariableDescriptorMethod, {
        /** @lends Y.inputEx.Wegas.VariableDescriptorCondition# */
        GLOBALMETHODS: {
            "Event.fired": {
                returns: "boolean",
                label: "Event has been fired",
                "arguments": [{
                        type: "string",
                        typeInvite: "event name",
                        scriptType: "string"
                    }]
            }
        },
        setOptions: function(options) {
            VariableDescriptorCondition.superclass.setOptions.call(this, options);
            this.argsOffset = 1;
            this.options.returnsFilter = ["number", "boolean", "string"];
            this.options.operator = options.operator;
            this.options.rightValue = options.rightValue;
        },
        getValue: function() {
            var value = VariableDescriptorCondition.superclass.getValue.call(this);

            if (this.argsOffset > 1 && !this._fallbackMode) {
                var i = this.inputs[this.inputs.length - 1],
                    values = i.getValue();

                if (!(i.inputs[1] instanceof inputEx.NumberField)) {
                    values[1] = '"' + values[1] + '"';
                }

                value += values.join("");
            }
            return value;
        },
        syncUI: function() {
            VariableDescriptorCondition.superclass.syncUI.call(this);

            var cMethod = this.options.methodCfg, choices;

            if (cMethod && cMethod.returns === "number") {
                this.argsOffset = 2;
                this.addField({
                    type: "combine",
                    fields: [{
                            type: "select",
                            value: this.options.operator,
                            choices: VariableDescriptorSelect.BINARYOPERATORS
                        }, {
                            type: "number",
                            required: true,
                            size: 5,
                            value: this.options.rightValue
                        }]
                });
            } else if (cMethod && cMethod.returns === "string" && cMethod.choices === undefined) {
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
                                    value: "!==",
                                    label: "is different than"
                                }]
                        }, {
                            type: "string",
                            required: true,
                            value: this.options.rightValue
                        }]
                });
            } else if (cMethod && cMethod.returns === "string" && cMethod.choices !== undefined) {
                this.argsOffset = 2;
                choices = [{
                        label: "-select-",
                        value: undefined
                    }];
                choices = choices.concat(cMethod.choices);
                this.addField({
                    type: "combine",
                    fields: [{
                            type: "select",
                            value: this.options.operator,
                            choices: [{
                                    value: "===",
                                    label: "equals"
                                }, {
                                    value: "!==",
                                    label: "is different than"
                                }]
                        }, {
                            type: "select",
                            required: true,
                            choices: choices,
                            value: this.options.rightValue
                        }]
                });
            } else {
                this.argsOffset = 1;
            }
        }
    });
    inputEx.registerType("condition", VariableDescriptorCondition, {});
    inputEx.Wegas.VariableDescriptorCondition = VariableDescriptorCondition;

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorGetter
     * @class
     * @constructor
     * @extends Y.inputEx.Wegas.VariableDescriptorSelect
     * @param {Object} options InputEx definition object
     */
    var VariableDescriptorGetter = function(options) {
        VariableDescriptorGetter.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorGetter, VariableDescriptorSelect, {
        /** @lends Y.inputEx.Wegas.VariableDescriptorGetter# */
        syncUI: function() {
            VariableDescriptorGetter.superclass.syncUI.call(this);

            if (this.currentEntity && this.currentEntity.get("items") && this.currentEntity.get("items").length > 0) {
                this.addField(this.generateSelectConfig(null, this.currentEntity, this.currentEntity.get("items"))); // Pushes the current entity methods and children to the stack
            }
            if (!this.currentEntity) {
                Y.one(this.fieldset).append("<div><em>No variable created</em></div>");
            }
        }
    });
    inputEx.registerType("getter", VariableDescriptorGetter);

    /**
     * This field allow to select an entity's child. Used to select current reply in mcq.
     *
     * @name Y.inputEx.Wegas.EntityArrayFieldSelect
     * @class
     * @constructor
     * @extends Y.inputEx.SelectField
     * @param {Object} options InputEx definition object
     */
    EntityArrayFieldSelect = function(options) {
        EntityArrayFieldSelect.superclass.constructor.call(this, options);
    };
    Y.extend(EntityArrayFieldSelect, inputEx.SelectField, {
        /** @lends Y.Wegas.EntityArrayFieldSelect# */
        /**
         * Set the ListField classname
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function(options) {
            var results;
            if (options.scope !== "instance") {
                results = options.entity ? options.entity.get(options.field) :
                    Y.Plugin.EditEntityAction.currentEntity.get(options.field);
            } else {
                results = options.entity ? options.entity.getInstance().get(options.field) :
                    Y.Plugin.EditEntityAction.currentEntity.getInstance().get(options.field);
            }
            options.choices = [{
                    label: DISABLED_CHOICE_LABEL.variable,
                    value: null,
                    disabled: true
                }].concat(Y.Array.map(results, function(r) {
                return {
                    value: r.get(options.returnAttr || "name"),
                    label: r.getEditorLabel() || this.optionNameToString(r, options)
                };
            }, this));

            EntityArrayFieldSelect.superclass.setOptions.call(this, options);
            this.options.entity = options.entity;
            this.options.field = options.field;
        },
        setValue: function(value) {
            EntityArrayFieldSelect.superclass.setValue.apply(this, arguments);
            this.options.value = value;
        },
        validate: function() {
            var valid = this.getValue();
            if (valid) {
                this.options.messages.error = null;
            } else {
                this.options.messages.error = "'" + this.options.value + "' is not a valid choice";
            }
            return valid || !this.options.required;
        },
        addChoice: function() {
            EntityArrayFieldSelect.superclass.addChoice.apply(this, arguments);
            this.disableChoice({
                label: DISABLED_CHOICE_LABEL.variable
            });
        },
        optionNameToString: function(result, options) {
            var string = [],
                separator = (options.name) ? options.name.separator || "," : ",";
            if (!options.name || !options.name.values || options.name.values.length <= 0) {
                string.push("undefined");
            } else {
                string = Y.Array.map(options.name.values, function(v) {
                    return result.get(v);
                });
            }
            return string.join(separator);
        }
    });
    inputEx.registerType("entityarrayfieldselect", EntityArrayFieldSelect); // Register this class as "list" type

    /**
     * @name Y.inputEx.Wegas.VariableDescriptorSelect
     * @class
     * @constructor
     * @extends Y.inpuEx.Group
     * @param {Object} options InputEx definition object
     */
    var FlatVariableSelect = function(options) {
        FlatVariableSelect.superclass.constructor.call(this, options);
    };

    Y.extend(FlatVariableSelect, inputEx.SelectField, {
        /** @lends Y.Wegas.VariableDescriptorSelect# */
        /**
         * Setup the options.feields from the availableFields option
         * @function
         */
        setOptions: function(options) {
            FlatVariableSelect.superclass.setOptions.call(this, options);
            this.options.className = options.className || 'wegas-inputex-variabledescriptorselect-group inputEx-Group';
            this.toDisable = [];
            this.options.maxLevel = options.maxLevel || null;
            this.options.root = options.root || null;

            var that = this,
                items,
                enableFolder = false;

            if (this.options.root) {
                if (!Y.Lang.isArray(options.root)) {
                    items = [Y.Wegas.Facade.Variable.cache.find("name", this.options.root)];
                } else {
                    items = Y.Array.map(this.options.root, function(item) {
                        return Y.Wegas.Facade.Variable.cache.find("name", item);
                    }, this);
                }
            } else {
                items = Wegas.Facade.GameModel.cache.getCurrentGameModel().get("items");
            }

            if (options.selectableLevels) {
                if (!Y.Lang.isArray(options.classFilter)) {
                    this.options.selectable = [options.selectableLevels];
                } else {
                    this.options.selectable = options.selectableLevels;
                }
            }

            if (options.classFilter) {
                if (!Y.Lang.isArray(options.classFilter)) {
                    options.classFilter = [options.classFilter];
                }
                this.options.classFilter = options.classFilter;
                enableFolder = this.options.classFilter.indexOf("ListDescriptor") !== -1;
            }


            function genSpaces(nb) {
                var i,
                    ret = "";
                for (i = 0; i < nb; i++) {
                    ret += "&nbsp;&nbsp;";
                }
                return ret;
            }

            function genChoices(items, level) {
                var ret = [];
                if (!that.options.maxLevel || level <= that.options.maxLevel) {
                    Y.Array.each(items, function(i) {
                        if (i.get("@class") === "ListDescriptor") {
                            var items = genChoices(i.get("items"), level + 1);
                            if (items.length > 0 || enableFolder) {
                                ret.push({
                                    label: genSpaces(level) + I18n.t(i.get("label")),
                                    value: i.get("name")
                                });
                                if (!enableFolder || (that.options.selectable && that.options.selectable.indexOf(level) === -1)) {
                                    that.toDisable.push(ret[ret.length - 1]);
                                }
                                ret = ret.concat(items);
                            }
                        } else if (!that.options.classFilter || that.options.classFilter.indexOf(i.get("@class")) !== -1) {
                            ret.push({
                                label: genSpaces(level) + I18n.t(i.get("label")),
                                value: i.get("name")
                            });
                            if (that.options.selectable && that.options.selectable.indexOf(level) === -1) {
                                that.toDisable.push(ret[ret.length - 1]);
                            }
                        }
                    });
                }
                return ret;
            }

            that.options.choices = genChoices(items, 0);
        },
        validate: function() {
            return this.toDisable.filter(function(e) {
                return e.value === this.getValue();
            }, this).length === 0;
        },
        renderComponent: function() {
            FlatVariableSelect.superclass.renderComponent.call(this);
            Y.Array.each(this.toDisable, function(i) {
                this.disableChoice(i, false);
            }, this);
        }
    });
    inputEx.registerType("flatvariableselect", FlatVariableSelect); // Register this class as "list" type
});
