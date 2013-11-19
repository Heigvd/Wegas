/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
/*global Crafty*/
YUI.add('wegas-proggame-jsinstrument', function(Y) {
    "use strict";

    /**
     * Level display, should handle canvas, for now renders the level as a
     * table element.
     *
     */
    var JSInstrument = Y.Base.create("wegas-proggame-display", Y.Base, [], {
        instrument: function(code) {
            var tree, getDebugStatement = function(line) {
                return {
                    type: "ExpressionStatement",
                    expression: {
                        type: "CallExpression",
                        callee: {
                            type: "Identifier",
                            name: "__debug"
                        },
                        "arguments": [{
                                type: "Literal",
                                value: line - 1
                            }]
                    }
                };
            };
            try {
                tree = window.esprima.parse(code, {//                           // Generate the syntaxic tree using esprima
                    raw: true,
                    range: true,
                    loc: true
                });

                console.log("Tree", tree);
                this.traverse(tree, function(object, path) {
                    var add = [];
                    switch (object['type']) {
                        case "BlockStatement":
                        case "Program":
                            for (var i = 0; i < object.body.length; i += 1) {
                                add.push(getDebugStatement(object.body[i].loc.start.line));
                            }
                            object.body = this.zip(add, object.body);
                            object.body.push(getDebugStatement(object.loc.end.line));
                            break;
                    }
                }, true);

                return window.escodegen.generate(tree, {
                    indent: true
                });
            } catch (e) {
                Y.log("Error evaluating client code", "error");
                return;
            }
        },
        zip: function(a, b) {
            var results = [];
            Y.Array.each(a, function(item, index) {
                results.push(item, b[index]);
            });
            return results;
        },
        traverse: function(object, visitor, path) {
            var key, child;

            if (typeof path === 'undefined') {
                path = [];
            }
            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    child = object[key];
                    if (typeof child === 'object' && child !== null) {
                        this.traverse(child, visitor, [object].concat(path));
                    }
                }
            }
            visitor.call(this, object, path);

        }
    });
    Y.namespace("Wegas").JSInstrument = JSInstrument;

});
