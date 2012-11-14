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
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-wysiwygscript", function (Y) {
    "use strict";

    var inputEx = Y.inputEx;

    inputEx.WysiwygScript = function (options) {
        inputEx.WysiwygScript.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.WysiwygScript, inputEx.Script, {

        /**
         *
         */
        destroy: function () {
            this.exprList.destroy();
            this.viewSrc.destroy();
            inputEx.WysiwygScript.superclass.destroy.call(this);
        },
        /**
         *
         */
        setOptions: function (options) {
            inputEx.WysiwygScript.superclass.setOptions.call(this, options);
            this.options.className = options.className || 'inputEx-Field inputEx-WysiwigScript';
            this.options.mode = options.mode || "wysiwyg";
            this.options.expects = options.expects || "expression";             // condition or expression
        },

        /**
         *
         */
        getValue: function () {
            if (this.options.mode === "wysiwyg") {
                var ct = "";
                if (this.exprList.getArray().length > 0) {
                    if (this.options.expects === "condition") {
                        ct = this.exprList.getArray().join(" && ");
                    } else {
                        ct = this.exprList.getArray().join(";\n") + ";";
                    }
                }
                return {
                    '@class': "Script",
                    language: "JavaScript",
                    content: ct
                };
            } else {
                return inputEx.WysiwygScript.superclass.getValue.apply(this, arguments);
            }
        },


        // *** Private Methods *** //
        /**
         *
         */
        renderComponent: function () {
            inputEx.Script.superclass.renderComponent.call(this);

            this.viewSrc = new Y.Wegas.Button({                                 // Add the "view src" button
                label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>"
            });
            this.viewSrc.after("click", function () {
                if (!this.viewSrc.get("disabled")) {
                    this.setMode((this.options.mode === "wysiwyg") ? "text" : "wysiwyg");
                }
            }, this);
            this.viewSrc.render(this.fieldContainer);

            var container = new Y.Node(this.fieldContainer);                    // Render a div where the wysiwyg list will be rendered
            container.prepend(this.viewSrc.get("boundingBox"));
            container.append("<em class=\"msg\"></em>");

            this.on("updated", this.updateExpressionList, this);                // Whenever the value is updated, we synchronize the UI

            this.setMode(this.options.mode);
        },

        /**
         *
         */
        setMode: function (mode) {
            var wysiwygmode = (mode === "wysiwyg");

            if (mode !== this.options.mode && this.options.mode === "wysiwyg") { // If current mode is wysiwyg
                this.updateTextarea();                                          // update textatea content
            } else {
                this.updateExpressionList();
            }

            this.wrapEl.style["display"] = (wysiwygmode) ? "none" : "block";

            this.viewSrc.set("selected", wysiwygmode ? 0 : 1);
            this.exprList.addButton.set("disabled", !wysiwygmode);

            if (wysiwygmode) {
                this.exprList.show();
            } else {
                this.exprList.hide();
            }

            this.options.mode = mode;
        },

        /**
         *
         */
        updateTextarea: function () {
            if (this.options.mode === "wysiwyg") {                              // If current mode is wysiwyg
                this.el.value =  this.getValue().content;                       // update textatea content
            }
        },

        updateExpressionList: function () {
            var i, tree,
            container = new Y.Node(this.fieldContainer),
            fields = [];

            container.one(".msg").setContent("");                               // Reset layout

            try {
                tree = window.esprima.parse(this.el.value, {                    // Generate the syntaxic tree using esprima
                    raw: true
                });

                for (i = 0; i < tree.body.length; i = i + 1) {
                    fields = fields.concat(this.generateExpression(tree.body[i].expression));
                }
            } catch (e) {
                //Y.error("Error evaluating line: " + window.escodegen.generate(tree.body[i].expression, {indent: true}));
                this.setMode("text");
                this.viewSrc.set("disabled", true);
                container.one(".msg").setContent("Unable to read this impact, displaying source only.");
                return;
            }

            this.viewSrc.set("disabled", false);
            if (this.exprList) {
                this.exprList.destroy();
            }
            if (this.options.expects === "condition") {
                for (i = 0; i< fields.length; i += 1) {
                    fields[i].type = "variabledescriptorcondition";
                }
            }
            this.exprList = Y.inputEx({                                         // Render the expression as a Y.inputEx.Wegas.ListField
                type:"inputlist",
                fields: fields,
                useButtons: true,
                parentEl: this.fieldContainer,
                addType: (this.options.expects === "condition") ? "variabledescriptorcondition" : "variabledescriptorsetter"
            })
            this.exprList.addButton.get("boundingBox").setStyle("display", "inline-block");

        // this.setMode(this.options.mode);
        },

        /**
         *
         */
        generateExpression: function (expression) {
            Y.log("generateExpression(" + expression.type + ")");
            switch (expression.type) {

                case "Literal":
                    // @fixme GOTCHA catch for the true hack in condition
                    return [];

                case "BinaryExpression":
                    var vdSelect = this.generateExpression(expression.left)[0], args = [];
                    vdSelect.type = "variabledescriptorcondition";
                    vdSelect.operator = expression.operator;
                    vdSelect.rightValue = expression.right.raw;
                    return [vdSelect];

                case "LogicalExpression":
                    //return [{
                    //    type: "inputlist",
                    //    fields: this.generateExpression(expression.left).concat(this.generateExpression(expression.right),
                    //    useButtons: true,
                    //    addType: "variabledescriptorcondition"
                    //}]
                    return this.generateExpression(expression.left).concat(this.generateExpression(expression.right));;

                case "CallExpression":
                    switch (expression.callee.object.type) {
                        case "Identifier":
                            switch (expression.callee.object.name) {
                                case "VariableDescriptorFacade":
                                    return {
                                        type: "variabledescriptorsetter",
                                        value: expression.arguments[0].value
                                    };
                            }
                            break;
                        default:
                            //return new MethodSelect({
                            //    object: this.generateExpression(expression.callee.object),
                            //    name: expression.callee.property.value,
                            //    arguments: expression.callee.arguments
                            var vdSelect = this.generateExpression(expression.callee.object), args = [];

                            Y.Array.each(expression.arguments, function (i) {
                                args.push(i.value || i.name);
                            });
                            Y.mix(vdSelect, {
                                //type: "variabledescriptormethodselect",
                                //object: this.generateExpression(expression.callee.object),
                                //fields: [],
                                method: expression.callee.property.name,
                                arguments: args

                            });
                            return [vdSelect];
                    }
                    break;
            }
            throw new Error("Unable to parse expression.");
        }
    });

    inputEx.registerType('script', inputEx.WysiwygScript);                             // Register this class as "script" type

    /**
     *  Adds a method that retrieves the value of each input in the group
     *  (unlike Y.inputEx.Group.getValue() that returns an object based on
     *  inputs names):
     */
    Y.inputEx.Group.prototype.getArray = function () {
        var i, ret = [];
        for (i = 0; i < this.inputs.length; i =  i + 1) {
            ret.push(this.inputs[i].getValue());
        }
        return ret;
    };

    /**
     * @class VariableDescriptorSelect
     * @constructor
     * @extends
     * @param {Object} options InputEx definition object
     */
    var VariableDescriptorSelect = function (options) {
        VariableDescriptorSelect.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorSelect, inputEx.Group, {

        entityId: null,
        /**
	 * Setup the options.fields from the availableFields option
	 */
        setOptions: function (options) {
            options.fields = options.fields || [];
            VariableDescriptorSelect.superclass.setOptions.call(this, options);
        },

        render: function () {
            VariableDescriptorSelect.superclass.render.call(this);
            this.syncUI();
        },

        setValue: function (val) {
        // Set value should not ba called directly
        //Y.log("VariableDescriptorSelect.setValue", val);
        },

        getValue: function () {
            return "VariableDescriptorFacade.find(" + this.inputs[this.inputs.length - 1].getValue() + ")";
        },
        getEntityId: function () {
            return this.inputs[this.inputs.length - 3].getValue();
        },
        getEntity: function () {
            return Y.Wegas.VariableDescriptorFacade.rest.findById(this.getEntityId());
        },
        getMethods: function (entity) {
            var i, methods = entity.getMethodCfgs(), ret = [];
            for (i in methods) {
                if (!this.options.returnsFilter                                 // Apply filter on the method return type
                    || this.options.returnsFilter.indexOf(methods[i].returns || "void") >= 0) {

                    methods[i].value = i;
                    methods[i].label =  methods[i].label || i;
                    ret.push(methods[i]);
                /* ret.push({
                        label: methods[i].label || i,
                        value: i
                    });*/
                }
            }
            return ret;
        },

        syncUI: function () {
            this.empty();

            var i, ret = [],
            currentId = this.entityId || this.options.value,
            rootEntities = Y.Wegas.VariableDescriptorFacade.rest.getCache(),
            currentEntity = Y.Wegas.VariableDescriptorFacade.rest.findById(currentId) || rootEntities[0];

            while (this.getMethods(currentEntity).length === 0                  // If the current entity has no methods,
                && currentEntity.get("items") && currentEntity.get("items").length > 0) { // but it has a child
                currentEntity = currentEntity.get("items")[0];                  // select its first child
            }

            this.currentEntity = currentEntity;                                 // Keeps a reference to the current entity

            while (currentEntity.parentDescriptor) {                            // Add the current entity hierarchy
                ret.push(this.generateSelectConfig(currentEntity.parentDescriptor,
                    currentEntity, currentEntity.parentDescriptor.get("items")));
                currentEntity = currentEntity.parentDescriptor;
            }
            ret.push(this.generateSelectConfig(null,                            // Add the root context (entities that are at the root of the gameModel
                currentEntity, rootEntities));

            ret = ret.reverse();
            for (i = 0; i < ret.length; i += 1) {
                this.addField(ret[i]);
            }
        },
        /**
         *
         * @overrride Y.inputEx.Group.onChange()
         */
        onChange: function (fieldValue, fieldInstance) {

            if (Y.Lang.isNumber(fieldValue)) {                                  // value is an number, it is the new current entity's id'
                this.entityId = fieldValue;
                this.options.method = null;
                this.options.arguments = null;
                this.syncUI();
            } else if (Y.Lang.isString(fieldValue)) {                           // The id is a string, it's the new current mehtod
                this.entityId = fieldInstance.options.parentEntity.get("id");
                this.options.method = fieldValue;
                this.options.arguments = null;
                this.syncUI();
            } else {                                                            // Otherwise current args value
                this.options.arguments = this.inputs[this.inputs.length - 1].getValue();
            }
            this.fireUpdatedEvt();
        },

        empty: function () {
            while (this.inputs.length > 0) {
                this.inputs.pop().destroy();
            }
        },

        /**
         *  Overriden to add reference to parententity
         */
        addField: function (fieldOptions) {
            VariableDescriptorSelect.superclass.addField.call(this, fieldOptions);
            this.inputs[this.inputs.length - 1].options.parentEntity = fieldOptions.parentEntity;
        },
        /**
         * Generate
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
        genChoices: function (entity, items) {
            var i, choices = [];

            if (items) {
                for (i = 0; i < items.length; i++) {
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
     * @class VariableDescriptorMethod
     * @constructor
     * @extends VariableDescriptorSelect
     * @param {Object} options InputEx definition object
     */
    var VariableDescriptorMethod = function (options) {
        VariableDescriptorMethod.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorMethod, VariableDescriptorSelect, {

        syncUI: function () {
            VariableDescriptorMethod.superclass.syncUI.call(this);

            this.addField(this.generateSelectConfig(this.currentEntity,         // Pushes the current entity methods and children to the stack
                null, this.currentEntity.get("items")));

            var i, args, methods  = this.getMethods(this.currentEntity),
            cMethod = methods[this.options.method];

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
            var i, l = this.inputs.length,
            args = this.inputs[l - this.argsOffset].getValue(),
            method = this.inputs[l - this.argsOffset - 1].getValue();

            if (!method) {
                return "true";
            }
            for (i = 0; i < args.length; i = i + 1) {
                if (this.currentMethod.arguments[i].scriptType === "string") {
                    args[i] = '"' + args[i].replace('"', '\\"') + '"';
                }
            }
            return "VariableDescriptorFacade.find(" + this.inputs[l - this.argsOffset - 2].getValue() + ")" +
            "." + method +
            "(" + args.join(", ") + ")";
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
        }
    });

    inputEx.registerType("variabledescriptormethod", VariableDescriptorMethod, {});

    /**
     * @class VariableDescriptorMethodSelect
     * @constructor
     * @extends VariableDescriptorMethod
     * @param {Object} options InputEx definition object
     */
    var VariableDescriptorSetter = function (options) {
        VariableDescriptorSetter.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorSetter, VariableDescriptorMethod, {
        setOptions: function (options) {
            VariableDescriptorSetter.superclass.setOptions.call(this, options);
            this.options.returnsFilter = ["void"];
        }
    });

    inputEx.registerType("variabledescriptorsetter", VariableDescriptorSetter, {});


    /**
     * @class VariableDescriptorCondition
     * @constructor
     * @extends VariableDescriptorMethod
     * @param {Object} options InputEx definition object
     */
    var VariableDescriptorCondition = function (options) {
        VariableDescriptorCondition.superclass.constructor.call(this, options);
    };

    Y.extend(VariableDescriptorCondition, VariableDescriptorMethod, {

        setOptions: function (options) {
            VariableDescriptorCondition.superclass.setOptions.call(this, options);
            this.argsOffset = 1;
            this.options.returnsFilter = ["number", "boolean"];
            this.options.operator = options.operator;
            this.options.rightValue = options.rightValue || 0;
        },

        getValue: function() {
            var value = VariableDescriptorCondition.superclass.getValue.call(this);

            if (this.argsOffset > 1) {
                value += this.inputs[this.inputs.length - 1].getValue().join("");
            }
            return value;
        },

        onChange: function (fieldValue, fieldInstance) {
            VariableDescriptorCondition.superclass.onChange.apply(this, arguments);
        },

        syncUI: function () {
            VariableDescriptorCondition.superclass.syncUI.call(this);

            var methods  = this.getMethods(this.currentEntity),
            cMethod = methods[this.options.method];

            if (!cMethod && Y.Object.values(methods).length > 0) {
                cMethod = Y.Object.values(methods)[0];                          // By default select the first method available
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
                        },{
                            value: ">",
                            label: "is greater than"
                        },{
                            value: "<",
                            label: "is smaller than"
                        },{
                            value: ">=",
                            label: "is greater or equal to"
                        },{
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
     * @class ListField
     * @constructor
     * @extends inputEx.Group
     * @param {Object} options InputEx definition object
     */
    var ListField = function (options) {
        ListField.superclass.constructor.call(this, options);

        var parentNode = new Y.Node(this.divEl.parentNode);
        //parentNode.insert(this.addButton.get("boundingBox").remove(), 1);
        this.addButton.render(this.divEl.parentNode);
        parentNode.prepend(this.addButton.get("boundingBox"));
    };
    Y.extend(ListField, inputEx.Group, {

        /**
	 * Set the ListField classname
	 * @param {Object} options Options object as passed to the constructor
	 */
        setOptions: function (options) {
            ListField.superclass.setOptions.call(this, options);
            this.options.className = options.className || 'inputEx-Field inputEx-ListField';
            this.options.addType = options.addType || "variabledescriptorsetter";
        },

        /**
	 * Render the addButton
	 */
        render: function () {
            ListField.superclass.render.call(this);

            this.addButton = new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-add\"></span>"
            });
            this.addButton.on("click", this.onAdd, this);
        },
        /**
         *
         */
        destroy: function () {
            ListField.superclass.destroy.call(this);
            this.addButton.destroy();
        },
        /**
	 * Handle the click event on the add button
	 */
        initEvents: function () {
            ListField.superclass.initEvents.call(this);

        },

        renderField: function (fieldOptions) {
            var fieldInstance = ListField.superclass.renderField.call(this, fieldOptions),
            removebutton = new Y.Wegas.Button({
                label: '<span class="wegas-icon wegas-icon-remove"></span>'
            });

            removebutton.targetField = fieldInstance;
            removebutton.render(fieldInstance.divEl);
            removebutton.on("click", this.onRemove, this);

            return fieldInstance;
        },

        onRemove: function (e) {
            var i = Y.Array.indexOf(this.inputs, e.target.targetField),
            d = this.inputs[i];
            d.destroy();
            this.inputs.splice(i, 1);
            this.fireUpdatedEvt();
        },

        onAdd: function (e) {
            this.addField({
                type: this.options.addType
            });
            this.fireUpdatedEvt();
        },

        /**
         * Override to disable
         */
        runInteractions: function () { }

    });

    inputEx.registerType("inputlist", ListField);


    /**
     * @class EntityArrayFieldSelect
     * @constructor
     * @extends inputEx.SelectField
     * @param {Object} options InputEx definition object
     */
    var EntityArrayFieldSelect = function(options) {
        EntityArrayFieldSelect.superclass.constructor.call(this, options);
    };
    Y.extend(EntityArrayFieldSelect, inputEx.SelectField, {

        /**
	 * Set the ListField classname
	 * @param {Object} options Options object as passed to the constructor
	 */
        setOptions: function (options) {
            var i, results = options.entity ? options.entity.get("results") :
            Y.Plugin.EditEntityAction.currentEntity.get("results");
            options.choices = [];

            for (i = 0; i < results.length; i = i + 1) {
                //if (!(results[i] instanceof Y.Wegas.persistence.Entity)) {        //Object is not an entity
                //    options.choices.push({                                      //TODO : result should be an entity
                //        value: results[i]["id"],
                //        label: results[i]["name"]
                //    });
                //} else {
                options.choices.push({
                    value: results[i].get("id"),
                    label: results[i].get("editorLabel")
                });
            //}

            }

            EntityArrayFieldSelect.superclass.setOptions.call(this, options);
            this.options.entity = options.entity;
        }
    });

    inputEx.registerType("entityarrayfieldselect", EntityArrayFieldSelect);    // Register this class as "list" type

});
