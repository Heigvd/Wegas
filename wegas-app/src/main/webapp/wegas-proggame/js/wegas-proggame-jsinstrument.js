/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
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
                            name: "_____debug"
                        },
                        "arguments": [{
                                type: "Literal",
                                value: line - 1
                            }, {
                                type: "ThisExpression"
                            }, {
                                type: "Identifier",
                                name: "___DEBUGBLOCK___"
                            }]
                    }
                };
            }, getWatchStatement = function(s) {
                return {
                    type: "ExpressionStatement",
                    expression: {
                        type: "CallExpression",
                        callee: {
                            type: "Identifier",
                            name: "_____watch"
                        },
                        "arguments": Y.Array.map(s.declarations, function(s) {
                            return {
                                type: "Literal",
                                value: s.id.name
                            };
                        })
                    }
                };
            };
            try {
                tree = window.esprima.parse(code, {//                           // Generate the syntaxic tree using esprima
                    //raw: true,
                    //range: true,
                    loc: true
                });

                console.log("Wegas.JSInstrument: Parsed source tree:", tree);
                this.traverse(tree, function(object, path) {
                    var add = [], inter;
                    switch (object['type']) {
                        case "BlockStatement":
                        case "Program":
                            //for (var i = 0; i < object.body.length; i += 1) {
                            Y.Array.each(object.body, function(s) {
                                inter = [getDebugStatement(s.loc.start.line)];
                                switch (s.type) {
                                    case "VariableDeclaration":
                                        inter.push(getWatchStatement(s));
                                        break;
                                }
                                add.push(inter);
                            });
                            object.body = this.zip(object.body, add);
                            //object.body.push(getDebugStatement(object.loc.end.line));
                            break;
                    }
                }, true);

                var instrumentedCode = window.escodegen.generate(tree, {
                    //indent: true
                });
                instrumentedCode = instrumentedCode.replace(/___DEBUGBLOCK___/g, "(function(){ var i, w = watches, ret = {};"
                        + "for(i=0;i<w.length;i++){"
                        + "try {"
                        + "ret[w[i]]=eval(w[i]);"
                        //ret[this.watches[i]] = this.doEval(this.watches[i]);
                        + "} catch(e){}"
                        + "}"
                        + "return ret;})()");

                return instrumentedCode;
            } catch (e) {
                Y.log("Error evaluating client code", "error");
                return;
            }
        },
        zip: function(a, b) {
            var results = [];
            Y.Array.each(a, function(item, index) {
                results = results.concat(b[index]);
                results.push(item);
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
