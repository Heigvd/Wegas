/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add("wegas-inputex-wysiwygscript", function(Y) {
    "use strict";

    var inputEx = Y.inputEx;

    inputEx.WysiwygScript = function(options) {
        inputEx.WysiwygScript.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.WysiwygScript, inputEx.Script, {
        /**
         *
         */
        destroy: function() {
            this.exprList.destroy();
            this.viewSrc.destroy();
            inputEx.WysiwygScript.superclass.destroy.call(this);
        },
        /**
         *
         */
        setOptions: function(options) {
            inputEx.WysiwygScript.superclass.setOptions.call(this, options);
            this.options.className = options.className || 'inputEx-Field inputEx-WysiwigScript';
            this.options.mode = options.mode || "wysiwyg";
            this.options.expects = options.expects || "expression";             // condition or expression
            this.options.classFilter = options.classFilter;
        },
        /**
         *
         */
        getValue: function() {
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
                    //language: "JavaScript",
                    content: ct
                };
            } else {
                return inputEx.WysiwygScript.superclass.getValue.apply(this, arguments);
            }
        },
        /**
         * 
         */
        setValue: function(val, sendUpdated) {
            if (val && val.name) {                                              // @backwardcompatibility Convert old format to new one (for flexitests)
                val = {
                    content: "Variable.find('" + val.name + "');"
                };
            }
            inputEx.WysiwygScript.superclass.setValue.call(this, val, sendUpdated);
            this.updateExpressionList();
        },
        // *** Private Methods *** //
        /**
         *
         */
        renderComponent: function() {
            inputEx.Script.superclass.renderComponent.call(this);

            this.viewSrc = new Y.Wegas.Button({// Add the "view src" button
                label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>",
                tooltip: "View source"
            });
            this.viewSrc.get("boundingBox").addClass("inputEx-WysiwigScript-viewsrc");

            this.viewSrc.after("click", function() {
                if (!this.viewSrc.get("disabled")) {
                    if (this.options.mode === "wysiwyg") {                      // If current mode is wysiwyg
                        this.updateTextarea();                                  // update textatea content
                    } else {
                        this.updateExpressionList();
                    }
                    this.setMode((this.options.mode === "wysiwyg") ? "text" : "wysiwyg");
                }
            }, this);
            this.viewSrc.render(this.fieldContainer);

            var container = new Y.Node(this.fieldContainer);                    // Render a div where the wysiwyg list will be rendered
            container.prepend(this.viewSrc.get("boundingBox"));
            container.append("<em class=\"msg\"></em>");

            this.on("updated", function() {
                if (this.options.mode === "text") {
                    this.updateExpressionList();
                }
            }, this);                // Whenever the value is updated, we synchronize the UI

            this.updateExpressionList();                                        // Synchronize the wysiwig list
            this.setMode(this.options.mode);                                    // Set the default mode (wysiwyg or source)
        },
        /**
         *
         */
        setMode: function(mode) {
            var wysiwygmode = (mode === "wysiwyg");

            this.options.mode = mode;
            this.viewSrc.set("selected", wysiwygmode ? 0 : 1);
            this.wrapEl.style.display = (wysiwygmode) ? "none" : "block";

            if (wysiwygmode) {
                this.exprList.show();
            } else {
                this.exprList.hide();
            }
        },
        /**
         *
         */
        updateTextarea: function() {
            if (this.options.mode === "wysiwyg") {                              // If current mode is wysiwyg
                this.el.value = this.getValue().content;                        // update textatea content
            }
        },
        updateExpressionList: function() {
            var i, tree,
                    container = new Y.Node(this.fieldContainer),
                    fields = [];

            container.one(".msg").setContent("");                               // Reset layout

            try {                                                               // Generate the syntaxic tree using esprima    
                tree = window.esprima.parse(this.el.value, {
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
            this.exprList = Y.inputEx({//                                       // Render the expression as a Y.inputEx.Wegas.ListField
                type: "listfield",
                fields: fields,
                useButtons: true,
                parentEl: this.fieldContainer,
                addType: {
                    type: this.options.expects, // conditon/expression/getter,
                    classFilter: this.options.classFilter
                }
            });
            this.exprList.on("updated", function() {                            // Whenever the list is update,
                if (this.options.mode === "wysiwyg") {
                    this.fireUpdatedEvt();                                      // fire updated event
                }
            }, this);

            if (this.options.mode !== "wysiwyg") {
                this.exprList.hide();
            }
        },
        /**
         *
         */
        generateExpression: function(expression) {
            //Y.log("generateExpression(" + expression.type + ")");
            switch (expression.type) {

                case "Identifier":
                    return expression.name;

                case "Literal":
                    return expression.value;
                    //return unesacapeJSString(expression.raw);

                case "UnaryExpression":
                    return expression.operator + this.generateExpression(expression.argument);

                case "ObjectExpression":
                    var args = {};
                    Y.Array.each(expression.properties, function(i) {
                        args[i.key.value] = this.generateExpression(i.value);
                    }, this);
                    return args;

                case "ArrayExpression":
                    var args = [];
                    Y.Array.each(expression.elements, function(i) {
                        args.push(this.generateExpression(i));
                    }, this);
                    return args;

                case "BinaryExpression":
                    var vdSelect = this.generateExpression(expression.left)[0], args = [];
                    vdSelect.type = "condition";
                    vdSelect.operator = expression.operator;
                    vdSelect.rightValue = this.generateExpression(expression.right);
                    return [vdSelect];

                case "LogicalExpression":
                    if (expression.operator === "&&") {
                        return this.generateExpression(expression.left).
                                concat(this.generateExpression(expression.right));
                    }
                    break;

                case "CallExpression":
                    switch (expression.callee.object.type) {
                        case "Identifier":
                            switch (expression.callee.object.name) {
                                case "Variable":                                // @backwardcompatibility
                                case "VariableDescriptorFacade":
                                    return {
                                        type: this.options.expects,
                                        classFilter: this.options.classFilter,
                                        value: (expression.arguments[1]) ? expression.arguments[1].value :
                                                expression.arguments[0].value   // First argument (gameModel) is optional
                                    };
                                case "RequestManager":
                                case "Event":
                                    var ret, args = [];

                                    Y.Array.each(expression.arguments, function(i) {
                                        args.push(this.generateExpression(i));
                                    }, this);
                                    ret = {
                                        type: this.options.expects,
                                        classFilter: this.options.classFilter,
                                        value: "GLOBAL" + expression.callee.object.name + "." + expression.callee.property.name,
                                        arguments: args
                                    };

                                    if (expression.callee.property.name === "fired") {
                                        return [ret];
                                    } else {
                                        return ret;
                                    }
                            }
                            break;
                        default:
                            //return new MethodSelect({
                            //    object: this.generateExpression(expression.callee.object),
                            //    name: expression.callee.property.value,
                            //    arguments: expression.callee.arguments
                            var vdSelect = this.generateExpression(expression.callee.object), args = [];

                            Y.Array.each(expression.arguments, function(i) {
                                args.push(this.generateExpression(i));
                            }, this);
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
    inputEx.registerType('script', inputEx.WysiwygScript);                      // Register this class as "script" type

    /**
     * 
     */
    inputEx.SingleLineWysiwygScript = function(options) {
        inputEx.SingleLineWysiwygScript.superclass.constructor.call(this, options);
    };
    Y.extend(inputEx.SingleLineWysiwygScript, inputEx.WysiwygScript, {
        setOptions: function(options) {
            options.defaultValue = [{}];
            options.expects = options.expects || "getter";
            options.className = options.className || 'inputEx-Field inputEx-WysiwigScript inputEx-singleLineWysiwygScript';
            inputEx.SingleLineWysiwygScript.superclass.setOptions.apply(this, arguments);
        },
        updateExpressionList: function() {
            inputEx.SingleLineWysiwygScript.superclass.updateExpressionList.apply(this, arguments);
            Y.later(10, this, function() {
                if (this.exprList.inputs.length === 0) {
                    this.exprList.onAdd();
                }
            });
        }
    });
    inputEx.registerType("variableselect", inputEx.SingleLineWysiwygScript);    // Register this class as "variableselect"
});
