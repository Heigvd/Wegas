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
        setOptions: function(options) {
            inputEx.WysiwygScript.superclass.setOptions.call(this, options);
            this.options.className = options.className || "inputEx-Field inputEx-WysiwigScript";
            this.options.wrapperClassName = options.wrapperClassName || "inputEx-fieldWrapper inputEx-WysiwigScriptWrapper";
            this.options.viewSrc = options.viewSrc || false;                    // wysywig / text
            this.options.expects = options.expects || "statement";              // conditon/statement/getter
            this.options.classFilter = options.classFilter;
            this.options.messages.invalid = "";                                 //Invalid message should appear near invalid fields
        },
        /**
         *
         */
        getValue: function() {
            if (!this.options.viewSrc) {
                var ct = "";
                if (this.exprList.getArray().length > 0) {
                    ct = this.exprList.getArray().join((this.options.expects === "condition") ? " && " : ";\n");
                }
                return {
                    "@class": "Script",
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
        validate: function() {
            var val = this.getValue();
            if (val.content.trim() === "") { // accept empty if not required.
                return !this.options.required;
            }
            if (!this.options.viewSrc) {
                return this.exprList.validate() && inputEx.WysiwygScript.superclass.validate.call(this);
            }
            return inputEx.WysiwygScript.superclass.validate.call(this);
        },
        isEmpty: function() {
            return this.options.viewSrc ?
                this.getValue().content.trim() === "" :
                this.exprList.getArray().join("").trim() === "";
        },
        // *** Private Methods *** //
        /**
         *
         */
        renderComponent: function() {
            inputEx.Script.superclass.renderComponent.call(this);
            var field = (new Y.Node(this.fieldContainer));
            // Add the "view src" button
            this.viewSrc = new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>",
                tooltip: "View source",
                cssClass: "inputEx-WysiwigScript-viewsrc",
                on: {
                    click: Y.bind(function() {
                        if (!this.viewSrc.get("disabled") && (this.validate() || this.isEmpty())) {
                            if (!this.options.viewSrc) {                        // If current mode is wysiwyg
                                this.updateTextarea();                          // update textatea content
                            } else if (!this.updateExpressionList()) {
                                return;
                            }
                            this.toggleViewSrc();
                        }
                    }, this)
                }
            }).render(field);
            this.addButton = new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-add\"></span>",
                tooltip: "Add",
                cssClass: "inputEx-WysiwigScript-add",
                on: {
                    click: Y.bind(function() {
                        if (!this.addButton.get("disabled")) {
                            this.exprList.onAdd();
                        }
                    }, this)
                }
            }).render(field);
            this.sortButton = new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-sort\"></span>",
                tooltip: "Sort",
                on: {
                    click: Y.bind(function() {
                        var mode = this.options.viewSrc;
                        if (!this.validate()) {
                            return;
                        }
                        this.updateTextarea();
                        this.toggleViewSrc(false);
                        this.updateExpressionList(true);
                        this.updateTextarea();
                        this.toggleViewSrc(mode);
                        this.fireUpdatedEvt();
                    }, this)
                }
            }).render(field);
            this.runButton = new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>",
                tooltip: "Test impact",
                on: {
                    click: Y.bind(this.eval, this)
                }
            }).render(field);
            (new Y.Node(this.fieldContainer))
                .prepend(this.viewSrc.get("boundingBox"))
                .prepend(this.sortButton.get("boundingBox"))
                .prepend(this.runButton.get("boundingBox"))
                .prepend(this.addButton.get("boundingBox"))                     // Move view src and add buttons to the top of the the wysiwyg list 
                .append("<em class=\"msg\"></em>"); // Add a div for messages

            this.on("updated", function() {
                if (this.options.viewSrc) {
                    this.updateExpressionList();
                }
                //this.setClassFromState();
            }, this);                                                           // Whenever the value is updated, we synchronize the UI

            this.updateExpressionList();                                        // Synchronize the wysiwig list      
            this.toggleViewSrc(this.options.viewSrc);                           // Set the default mode (wysiwyg or source)
        },
        /**
         *
         */
        destroy: function() {
            this.exprList.destroy();
            this.viewSrc.destroy();
            this.addButton.destroy();
            this.runButton.destroy();
            this.sortButton.destroy();
            inputEx.WysiwygScript.superclass.destroy.call(this);
        },
        eval: function() {
            Y.Wegas.Facade.Variable.script.remoteEval(this.getValue(), {
                on: {
                    success: Y.bind(function() {
                        Y.Widget.getByNode(this.divEl).showMessageBis("success", "Impact executed successfully.");
                    }, this),
                    failure: Y.bind(function(e) {
                        Y.Widget.getByNode(this.divEl).showMessageBis("error", "Error executing impact: <br /><br />"
                            + (e.response.results.exception || e.response));
                    }, this)
                }
            });
        },
        /**
         *
         * @param {type} viewSrc
         * @returns {undefined}
         */
        toggleViewSrc: function(viewSrc) {
            if (Y.Lang.isUndefined(viewSrc)) {
                viewSrc = !this.options.viewSrc;
            }
            this.options.viewSrc = viewSrc;
            this.viewSrc.set("selected", viewSrc ? 1 : 0);
            this.el.toggleView(viewSrc);
            this.addButton.set("disabled", viewSrc);
            if (viewSrc) {
                this.exprList.hide();
            } else {
                this.exprList.show();
            }
        },
        updateTypeInvite: function() {
            //nothing to do, let other do that
        },
        /**
         *
         */
        updateTextarea: function() {
            if (!this.options.viewSrc) {                                        // If current mode is wysiwyg
                inputEx.AceField.prototype.setValue.call(this, this.getValue().content); // update textatea content
            }
        },
        updateExpressionList: function(sort) {
            var i, tree,
                container = new Y.Node(this.fieldContainer),
                fields = [];
            container.one(".msg").setContent("");                               // Reset layout

            try { // Generate the syntaxic tree using esprima    
                tree = window.esprima.parse(inputEx.WysiwygScript.superclass.getValue.call(this).content, {
                    raw: true,
                    range: true
                });
                for (i = 0; i < tree.body.length; i = i + 1) {
                    if (tree.body[i].type !== "EmptyStatement") {
                        try {
                            fields = fields.concat(this.generateExpression(tree.body[i].expression));
//                            fields[i].raw = String.prototype.substring.apply(inputEx.WysiwygScript.superclass.getValue.call(this).content, tree.body[i].expression.range);
                        } catch (e) {
                            fields.push({
                                raw: tree.body[i].range,
                                type: this.options.expects
                            });
                        }
                    }
                }
                Y.Array.each(fields, function(item, index, array) {
                    if (item.raw) {
                        item.raw = String.prototype.substring.apply(inputEx.WysiwygScript.superclass.getValue.call(this).content, item.raw);
                    } else {
                        array[index] = {
                            raw: item,
                            type: this.options.expects
                        };
                    }
                }, this);
                this.viewSrc.set("disabled", false);
                if (this.exprList) {
                    this.exprList.destroy();
                }
                if (sort) {
                    fields = this.sortInputex(fields);
                }
                this.exprList = Y.inputEx({//                                   // Render the expression as a Y.inputEx.Wegas.ListField
                    type: "listfield",
                    fields: fields,
                    sortable: true,
                    parentEl: this.fieldContainer,
                    addType: {
                        type: this.options.expects, // conditon/statement/getter,
                        classFilter: this.options.classFilter
                    }
                });
                this.exprList.on("updated", function() {                        // Whenever the list is update,
                    if (!this.options.viewSrc) {
                        this.fireUpdatedEvt();                                  // fire updated event
                    }
//                    if(this.validate()){
//                        this.setClassFromState();
//                    }
                }, this);
                if (this.options.viewSrc) {
                    this.exprList.hide();
                }
                return true;
            } catch (ex) {
                //Y.error("Error evaluating line: " + window.escodegen.generate(tree.body[i].expression, {indent: true}));
                this.toggleViewSrc(true);
                //this.viewSrc.set("disabled", true);
                container.one(".msg").setContent("Unable to read impact, displaying sources");
                return;
            }
        },
        sortInputex: function(fields) {
            var order = [];
            Y.Array.each(Y.Wegas.Facade.Variable.data, function(item) {
                if (item.flatten) {
                    Y.Array.each(item.flatten(), function(i) {
                        order.push(i.get("name"));
                    });
                } else {
                    order.push(item.get("name"));
                }
            });
            fields.sort(function(a, b) {
                return Y.Array.indexOf(order, a.value) - Y.Array.indexOf(order, b.value);
            });
            return fields;
        },
        /**
         *
         */
        generateExpression: function(expression) {
            var args, vdSelect, ret;
            //Y.log("generateExpression(" + expression.type + ")");
            switch (expression.type) {

                case "Identifier":
                    return expression.name;
                case "Literal":
                    return expression.value;
                case "UnaryExpression":
                    return expression.operator + this.generateExpression(expression.argument);
                case "ObjectExpression":
                    args = {};
                    Y.Array.each(expression.properties, function(i) {
                        args[i.key.value] = this.generateExpression(i.value);
                    }, this);
                    return args;
                case "ArrayExpression":
                    args = [];
                    Y.Array.each(expression.elements, function(i) {
                        args.push(this.generateExpression(i));
                    }, this);
                    return args;
                case "BinaryExpression":
                    vdSelect = this.generateExpression(expression.left)[0];
                    args = [];
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
                                case "Variable": // @backwardcompatibility
                                case "VariableDescriptorFacade":
                                    return {
                                        type: this.options.expects,
                                        classFilter: this.options.classFilter,
                                        raw: expression.range,
                                        value: (expression["arguments"][1]) ? expression["arguments"][1].value : expression["arguments"][0].value // First argument (gameModel) is optional
                                    };
                                case "RequestManager":
                                case "Event":
                                default:
                                    args = [];
                                    Y.Array.each(expression["arguments"], function(i) {
                                        args.push(this.generateExpression(i));
                                    }, this);
                                    ret = {
                                        type: this.options.expects,
                                        classFilter: this.options.classFilter,
                                        raw: expression.range,
                                        value: "GLOBAL" + expression.callee.object.name + "." + expression.callee.property.name,
                                        "arguments": args
                                    };
                                    if (expression.callee.property.name === "fired") {
                                        return [ret];
                                    } else {
                                        return ret;
                                    }
                            }
                            break;
                        default:
                            vdSelect = this.generateExpression(expression.callee.object);
                            args = [];
                            Y.Array.each(expression["arguments"], function(i) {
                                args.push(this.generateExpression(i));
                            }, this);
                            Y.mix(vdSelect, {
                                method: expression.callee.property.name,
                                "arguments": args

                            });
                            vdSelect.raw = expression.range;
                            return [vdSelect];
                    }
                    break;
            }
            throw new Error("Unable to parse expression.");
        }
    });
    inputEx.registerType("script", inputEx.WysiwygScript);                      // Register this class as "script" type

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
            options.className = options.className || "inputEx-Field inputEx-WysiwigScript inputEx-singleLineWysiwygScript";
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
