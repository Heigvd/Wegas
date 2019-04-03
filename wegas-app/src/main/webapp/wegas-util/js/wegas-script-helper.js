/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global Element, HTMLElement */

/**
 * @fileoverview
 * @author Maxence
 */
YUI.add('wegas-script-helper', function(Y) {
    "use strict";

    var Wegas = Y.Wegas,
        Syntax = window.esprima.Syntax,
        ScriptHelper;

    ScriptHelper = {
        /**
         * Script pretty printer
         *
         * @param {type} script the script to format
         * @param {type} globals from RForm (must be resovled by the callee !!!)
         * @returns {String} textual representation of the script
         */
        formatScript: function(script, globals) {
            if (script && script.get) {
                script = script.get("content");
            } else if (Y.Lang.isObject(script)) {
                script = script.content;
            }
            if (!script) {
                return "";
            }
            try {
                var findLabel = function(a, n) {
                    var l = Y.Array.find(a, function(i) {
                        return i.value === n;
                    });
                    return l ? l.label : n;
                },
                    source = function(range) {
                        return script.substring.apply(script, range);
                    },
                    getArgValue = function(arg) {
                        var src = source(arg.range);
                        if (arg.type === "ObjectExpression") {
                            var obj = JSON.parse(src);
                            if (obj["@class"] === "TranslatableContent") {
                                return I18n.t(obj);
                            }
                        }
                        return src;
                    },
                    formatArgs = function(args, cfg) {
                        return Y.Array.map(Y.Array.filter(args, function(o, index) {
                            return cfg[index].type !== "hidden" && cfg[index].type !== "list";
                        }), function(o) {
                            return Wegas.Helper.trimLength(Wegas.Helper.stripHtml(getArgValue(o)), 50, "...\"");// Args are limited to 50 char
                        }).join(", ");
                    },
                    parse = function(i) {
                        switch (i.type) {
                            case Syntax.EmptyStatement:
                                return "";
                            case Syntax.CallExpression:
                                if (i.callee.object.callee
                                    && i.callee.object.callee.object
                                    && (i.callee.object.callee.object.name === "Variable"
                                        || i.callee.object.callee.object.name === "VariableDescriptorFacade") // @backwardcompatibility
                                    && i.callee.object.callee.property && i.callee.object.callee.property.name === "find") {
                                    var vd = Wegas.Facade.Variable.cache.find("name",
                                        i.callee.object.arguments[1].value), methodName = i.callee.property.name,
                                        method = vd.getMethodCfgs()[methodName];


                                    //" " + (i.callee.property.name !== "getValue" ? "<em>" + (method.label ? method.label.toLowerCase() : methodName) + "</em> " : "") +

                                    var mName = "";
                                    if (method.label) {
                                        mName = "<em>" + method.label.toLowerCase() + "</em>";
                                    } else if (i.callee.property.name !== "getValue") {
                                        mName = "<em>" + methodName + "</em>";
                                    }
                                    return vd.getEditorLabel() + " " + mName + " " +
                                        formatArgs(i.arguments.slice(1), method.arguments.slice(1));
                                } else {
                                    var global = globals && globals[i.callee.object.name + "." + i.callee.property.name];
                                    if (global) {
                                        return "<em>" + global.label + "</em> " + formatArgs(i.arguments,
                                            global.arguments);
                                    } else {
                                        return source(i.range);
                                    }
                                }
                            case Syntax.ExpressionStatement:
                                return parse(i.expression);
                            case Syntax.LogicalExpression:
                                var strOp = i.operator === "&&" ? "AND" : "OR";
                                return parse(i.left) + " <em>" + strOp + "</em> " + parse(i.right);
                            case Syntax.BinaryExpression:
                                // Try to prevent display of "undefined" for right-hand operands:
                                if (!i.right.value) {
                                    var right = i.right;
                                    if (right.type === 'UnaryExpression' && right.operator === '-') {
                                        var arg = right.argument;
                                        if (arg.type === 'Literal' && typeof arg.value === 'number') {
                                            i.right.value = -arg.value;
                                        }
                                    }
                                }
                                return parse(i.left) + " <em>" + i.operator.replace("===",
                                    "=").replace("!==", "<>") + "</em> " + i.right.value;
                            default:
                                return source(i.range);
                        }
                    },
                    tree = window.esprima.parse(script, {
                        raw: true,
                        range: true
                    });
                return Y.Array.map(tree.body, parse, this).join("<br />").replace(/\\n/gi, "");
            } catch (e) {
                return script;
            }
        },
        parseMethod: function(node, globals) {
            var vd;
            if (node.type === Syntax.CallExpression) {
                if (node.callee.object.callee
                    && node.callee.object.callee.object
                    && (node.callee.object.callee.object.name === "Variable"
                        || node.callee.object.callee.object.name === "VariableDescriptorFacade") // @backwardcompatibility
                    && node.callee.object.callee.property && node.callee.object.callee.property.name === "find") {

                    vd = Wegas.Facade.Variable.cache.find("name", node.callee.object.arguments[1].value);

                    if (vd) {
                        return {
                            method: vd.getMethodCfgs()[node.callee.property.name],
                            methodName: node.callee.property.name + " (" + vd.getEditorLabel() + ")"
                        };
                    }
                } else {
                    return {
                        method: globals && globals[node.callee.object.name + "." + node.callee.property.name],
                        methodName: node.callee.object.name + "." + node.callee.property.name
                    };
                }
            }
            return null;
        },
        /**
         *
         * @param {type} script
         * @param {type} config: {
         *          onEnterFn: callback called against each node, returned value => go deepper? true/false,
         *          onOutFn: callback after node has been walked
         *          globals: global methods to consider
         * @returns {undefined}
         */
        visitAST: function(script, config) {

            var thiz = this,
                fn = config && config.onEnterFn,
                exitFn = config && config.onExitFn,
                globals = config && config.globals;

            if (script && script.get) {
                script = script.get("content");
            } else if (Y.Lang.isObject(script)) {
                script = script.content;
            }

            var tree = window.esprima.parse(script, {
                raw: true,
                range: true
            });

            function parse(node, args) {
                var key, child, keys, i, j, subArgs, method;

                if (!fn || fn.call(null, node, args)) {

                    // catch calls to wegas method
                    method = thiz.parseMethod(node, globals);

                    if (method && method.method && node.arguments.length === method.method.arguments.length) {
                        // same method name & numner or parameters match number of arguments
                        for (j = 0; j < node.arguments.length; j++) {
                            parse(node.arguments[j], method.method.arguments[j]);
                        }
                        exitFn && exitFn.call(null, node);
                        return;
                    }

                    keys = Object.keys(node).sort();
                    for (i in keys) {
                        key = keys[i];
                        if (node.hasOwnProperty(key)) {
                            child = node[key];
                            if (Array.isArray(child)) {
                                // process all items in array
                                if (args && args.type === 'array' && args.items && args.items.type === "object") {
                                    subArgs = args.items;
                                } else {
                                    subArgs = null;
                                }
                                for (j = 0; j < child.length; j++) {
                                    if (child[j] instanceof Object && typeof child[j].type === "string") {
                                        if (!subArgs && args && args.properties && child[j].type === 'Property') {
                                            parse(child[j].value, args.properties[child[j].key.value]);
                                        } else {
                                            parse(child[j], subArgs);
                                        }
                                    }
                                }
                            } else if (child instanceof Object && typeof child.type === "string") {
                                // the child is an object which contains a type property
                                if (node.type === "Property" && key === "value") {
                                    parse(child, args);
                                } else {
                                    parse(child);
                                }
                            }
                        }
                    }
                }
                exitFn && exitFn.call(null, node);
            }
            parse(tree);
        }

    };
    Y.Wegas.ScriptHelper = ScriptHelper;
});
