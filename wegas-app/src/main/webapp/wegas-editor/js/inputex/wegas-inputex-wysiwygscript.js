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
YUI.add("wegas-inputex-wysiwygscript", function(Y) {
    "use strict";

    var inputEx = Y.inputEx, Wegas = Y.Wegas, Syntax = window.esprima.Syntax, Parser, WysiwygScript;

    WysiwygScript = function(options) {
        WysiwygScript.superclass.constructor.call(this, options);
    };
    Y.extend(WysiwygScript, inputEx.Script, {
        /**
         *
         */
        setOptions: function(options) {
            WysiwygScript.superclass.setOptions.call(this, options);
            this.options.className = options.className || "inputEx-Field inputEx-WysiwygScript";
            this.options.wrapperClassName = options.wrapperClassName || "inputEx-fieldWrapper inputEx-WysiwygScriptWrapper";
            this.options.viewSrc = options.viewSrc || false;                    // wysywig / text
            this.options.expects = options.expects || "statement";              // conditon/statement/getter
            this.options.classFilter = options.classFilter;
            this.options.messages.invalid = "";                                 //Invalid message should appear near invalid fields
            this.options.removable = options.removable;
            this.options.sortable = options.sortable;
            this.options.numbered = options.numbered;
        },
        /**
         *
         */
        getValue: function() {
            if (!this.options.viewSrc) {
                var ct = "";
                if (this.exprList.getArray().length > 0) {
                    ct = Parser.join(this.exprList.getArray(), this.options.expects);
                    //  this.exprList.getArray().join((this.options.expects === "condition") ? " && " : ";\n");
                }
                return {
                    "@class": "Script",
                    content: ct
                };
            }
            return WysiwygScript.superclass.getValue.apply(this, arguments);
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
            WysiwygScript.superclass.setValue.call(this, val, sendUpdated);
            if (!this.options.viewSrc) {
                this.updateExpressionList();
            }
        },
        validate: function() {
            var val = this.getValue();
            if (val.content.trim() === "") { // accept empty if not required.
                return !this.options.required;
            }
            if (!this.options.viewSrc) {
                return this.exprList.validate() && WysiwygScript.superclass.validate.call(this);
            }
            return WysiwygScript.superclass.validate.call(this);
        },
        isEmpty: function() {
            return this.options.viewSrc ? this.getValue().content.trim() === "" : this.exprList.getArray().join("").trim() === "";
        }, // *** Private Methods *** //
        /**
         *
         */
        renderComponent: function() {
            inputEx.Script.superclass.renderComponent.call(this);
            var field = Y.one(this.fieldContainer);

            this.viewSrc = new Wegas.Button({//                                 //Add the "view src" button
                label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>",
                tooltip: "View source",
                cssClass: "inputEx-WysiwygScript-viewsrc",
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
            this.addButton = new Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-add\"></span>",
                tooltip: "Add",
                cssClass: "inputEx-WysiwygScript-add",
                on: {
                    click: Y.bind(function() {
                        if (!this.addButton.get("disabled")) {
                            this.exprList.onAdd();
                        }
                    }, this)
                }
            }).render(field);
            this.sortButton = new Wegas.Button({
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
            this.runButton = new Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>",
                tooltip: "Test impact",
                on: {
                    click: Y.bind(this.eval, this)
                }
            }).render(field);

            field.prepend(this.viewSrc.get("boundingBox")).prepend(this.sortButton.get("boundingBox")).prepend(this.runButton.get("boundingBox")).prepend(this.addButton.get("boundingBox"))                     // Move view src and add buttons to the top of the the wysiwyg list
                .append("<em class=\"msg\"></em>");                             // Add a div for messages

            this.on("updated", function() {
                if (this.options.viewSrc) {
                    this.updateExpressionList();
                }
                //this.setClassFromState();
            }, this);                                                           // Whenever the value is updated, we synchronize the UI
            if (!this.options.viewSrc) {
                this.updateExpressionList();                                    // Synchronize the wysiwig list
            }
            this.toggleViewSrc(this.options.viewSrc);                           // Set the default mode (wysiwyg or source)
        },
        /**
         *
         */
        destroy: function() {
            if (this.exprList) {
                this.exprList.destroy();
            }
            this.viewSrc.destroy();
            this.addButton.destroy();
            this.runButton.destroy();
            this.sortButton.destroy();
            WysiwygScript.superclass.destroy.call(this);
        },
        eval: function() {
            var parentWidget = Y.Widget.getByNode(this.divEl);
            parentWidget.showOverlay();
            Wegas.Facade.Variable.script.remoteEval(this.getValue(), {
                on: {
                    success: Y.bind(function() {
                        parentWidget.hideOverlay();
                        parentWidget.showMessage("success", "Impact executed successfully.");
                    }, this),
                    failure: Y.bind(function(e) {
                        parentWidget.hideOverlay();
                        parentWidget.showMessage("error",
                            "Error executing impact: <br /><br />" + (e.response.results.exception || e.response));
                    }, this)
                }
            }, undefined, parentWidget.get("form").getValue().id);
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
            if (this.exprList && this.exprList.hide) {
                if (viewSrc) {
                    this.exprList.hide();
                } else {
                    this.exprList.show();
                }
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
                inputEx.AceField.prototype.setValue.call(this, this.getValue().content); // update textarea content
            }
        },
        updateExpressionList: function(sort) {
            var container = Y.one(this.fieldContainer), fields;
            container.one(".msg").setContent("");                               // Reset layout

            try { // Generate the syntactic tree using esprima
                fields = Parser.parse(WysiwygScript.superclass.getValue.call(this).content, this.options);

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
                    sortable: (typeof this.options.sortable === "undefined") ? true : this.options.sortable,
                    removable: this.options.removable,
                    numbered: this.options.numbered,
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
            Y.Array.each(Wegas.Facade.GameModel.cache.getCurrentGameModel().get("items"), function(item) {
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
        }
    });
    inputEx.registerType("script", WysiwygScript);                              // Register this class as "script" type
    inputEx.WysiwygScript = WysiwygScript;
    /**
     *
     */
    inputEx.SingleLineWysiwygScript = function(options) {
        inputEx.SingleLineWysiwygScript.superclass.constructor.call(this, options);
    };
    Y.extend(inputEx.SingleLineWysiwygScript, WysiwygScript, {
        setOptions: function(options) {
            options.defaultValue = [{}];
            options.expects = options.expects || "getter";
            options.className = options.className || "inputEx-Field inputEx-WysiwygScript inputEx-singleLineWysiwygScript";
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
    /**
     * Singleton with parser's logic
     */
    Parser = (function() {
        var eparse = window.esprima.parse;
        return {
            /**
             * Transform a script into an array of json configuration for inputex.
             * @param {String} content the script to parse
             * @param {Object} options used to configure return values
             * @returns {Array} configuration to pass to wysiwyg inputex.
             */
            parse: function(content, options) {
                var tree, i, fields = [];
                tree = eparse(content, {
                    raw: true,
                    range: true
                });
                for (i = 0; i < tree.body.length; i = i + 1) {
                    switch (tree.body[i].type) {
                        case Syntax.EmptyStatement:                             /** STATEMENT **/
                            break;
                        case Syntax.ExpressionStatement:
                            fields = fields.concat(Parser.generateExpression(tree.body[i].expression, options));
                            break;
                        default:
                            fields.push({
                                raw: tree.body[i].range,
                                type: options.expects
                            });
                    }
                }
                Y.Array.each(fields, function(item) {
                    item.raw = String.prototype.substring.apply(content, item.raw);
                }, this);
                return fields;
            },
            /**
             * Used to generate an expression's config
             * Not meant to be used directly
             * @see Parser.parse
             * @param {Object} expression expression to parse, Esprima's output
             * @param {Object} options used to configure return values
             * @returns {_L12.Parser.generateExpression.Anonym$15|_L12.Parser.generateExpression.Anonym$19|_L12.Parser.generateExpression.Anonym$16|Array}
             */
            generateExpression: function(expression, options) {
                var args, vdSelect;
                try {
                    //Y.log("generateExpression(" + expression.type + ")");
                    switch (expression.type) {
                        case Syntax.Identifier:
                            return expression.name;
                        case Syntax.Literal:
                            return expression.value;
                        case Syntax.UnaryExpression:
                            return expression.operator + Parser.generateExpression(expression.argument, options);
                        case Syntax.ObjectExpression:
                            args = {};
                            Y.Array.each(expression.properties, function(i) {
                                args[i.key.value] = Parser.generateExpression(i.value, options);
                            }, this);
                            return args;
                        case Syntax.ArrayExpression:
                            return Y.Array.map(expression.elements, function(i) {
                                return Parser.generateExpression(i, options);
                            }, this);
                        case Syntax.BinaryExpression:
                            vdSelect = Parser.generateExpression(expression.left, options)[0];
                            vdSelect.type = "condition";
                            vdSelect.raw = expression.range;
                            vdSelect.operator = expression.operator;
                            vdSelect.rightValue = Parser.generateExpression(expression.right, options);
                            return [vdSelect];
                        case Syntax.LogicalExpression:
                            if (expression.operator === "&&") {
                                return Parser.generateExpression(expression.left,
                                    options).concat(Parser.generateExpression(expression.right, options));
                            }
                            break;
                        case Syntax.CallExpression:
                            if (expression.callee.type === Syntax.Identifier) { //global function call ie "myFn()"
                                args = Y.Array.map(expression["arguments"], function(i) {
                                    return Parser.generateExpression(i, options);
                                }, this);
                                return [{
                                        type: options.expects,
                                        classFilter: options.classFilter,
                                        raw: expression.range,
                                        value: "GLOBAL" + expression.callee.name,
                                        "arguments": args
                                    }];
                            }
                            switch (expression.callee.object.type) {
                                case Syntax.Identifier:
                                switch (expression.callee.object.name) {
                                    case "Variable":
                                    case "VariableDescriptorFacade":        // @backwardcompatibility
                                        //Assume function is "find"
                                        return [{
                                                type: options.expects,
                                                classFilter: options.classFilter,
                                                raw: expression.range,
                                                value: (expression["arguments"][1]) ? expression["arguments"][1].value : expression["arguments"][0].value // First argument (gameModel) is optional
                                            }];
                                        //                                        case "RequestManager":
                                        //                                        case "Event":
                                    default:
                                        args = Y.Array.map(expression["arguments"], function(i) {
                                            return Parser.generateExpression(i, options);
                                        }, this);
                                        return [{
                                                type: options.expects,
                                                classFilter: options.classFilter,
                                                raw: expression.range,
                                                value: "GLOBAL" + expression.callee.object.name + "." + expression.callee.property.name,
                                                "arguments": args
                                            }];
                                }
                                default:
                                    vdSelect = Parser.generateExpression(expression.callee.object, options);
                                    args = Y.Array.map(expression["arguments"], function(i) {
                                        return Parser.generateExpression(i, options);
                                    }, this);
                                    Y.mix(vdSelect[0], {
                                        method: expression.callee.property.name,
                                        "arguments": args
                                    });
                                    vdSelect[0].raw = expression.range;
                                    return vdSelect;
                            }
                    }
                } catch (e) {
                    return {
                        raw: expression.range,
                        type: options.expects
                    };
                }
            },
            join: function(scripts, joinType) {
                var i, j, tree, next, script = "", tmp, write = function(script, type, nextScript) {
                    switch (type) {
                        case Syntax.EmptyStatement:                         /** STATEMENT **/
                            return false; //Skip it
                        case Syntax.ExpressionStatement:
                            next = nextScript ? eparse(scripts[i + 1]).body[0].type : null;
                            if (joinType === "condition" && next === Syntax.ExpressionStatement) { //Join 2 conditional expression
                                return script.replace(/;*\s*$/, " && ");
                            } else {
                                return script.replace(/;*\s*$/, ";\n");
                            }
                        case Syntax.BlockStatement:
                        case Syntax.IfStatement:
                        case Syntax.WithStatement:
                        case Syntax.SwitchStatement:
                        case Syntax.ThrowStatement:
                        case Syntax.TryStatement:
                        case Syntax.WhileStatement:
                        case Syntax.DoWhileStatement:
                        case Syntax.ForStatement:
                        case Syntax.ForInStatement:
                        case Syntax.ForOfStatement:
                        case Syntax.LabeledStatement:
                        case Syntax.DebuggerStatement:
                        case Syntax.FunctionDeclaration:                    /** DECLARATION **/
                            return scripts[i] + "\n";
                        case Syntax.VariableDeclaration:
                            return scripts[i].replace(/;*\s*$/, ";\n");
                    }
                    return "";
                };

                for (i = 0; i < scripts.length; i += 1) {
                    if (scripts[i]) {
                        tree = eparse(scripts[i]).body;
                        j = tree.length;
                        if (j) {
                            tmp = false;
                            while (j-- && !tmp) {
                                tmp = write(scripts[i], tree[j].type, scripts[i + 1]);
                            }
                            script += tmp;
                        }
                    }
                }
                return script;
            }
        };
    }());
});
