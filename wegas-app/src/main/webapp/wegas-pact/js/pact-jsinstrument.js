/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('pact-jsinstrument', function(Y) {
    'use strict';

    /**
     * Level display, should handle canvas, for now renders the level as a
     * table element.
     *
     */
    var JSInstrument = Y.Base.create(
        'pact-display',
        Y.Base,
        [],
        {},
        {
            instrument: function(code) {
                var tree,
                    getDebugStatement = function(line) {
                        return {
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'Identifier',
                                    name: '_____debug',
                                },
                                arguments: [
                                    {
                                        type: 'Literal',
                                        value: line,
                                    },
                                    {
                                        type: 'ThisExpression',
                                    },
                                    {
                                        type: 'Identifier',
                                        name: '___DEBUGBLOCK___',
                                    },
                                ],
                            },
                        };
                    },
                    getWatchStatement = function(s) {
                        return {
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'Identifier',
                                    name: '_____watch',
                                },
                                arguments: Y.Array.map(s.declarations, function(
                                    s
                                ) {
                                    return {
                                        type: 'Literal',
                                        value: s.id.name,
                                    };
                                }),
                            },
                        };
                    };
                try {
                    tree = window.esprima.parse(code, {
                        //                           // Generate the syntaxic tree using esprima
                        //raw: true,
                        //range: true,
                        loc: true,
                    });

                    //console.log("Wegas.JSInstrument: Parsed source tree:", tree);
                    JSInstrument.traverse(
                        tree,
                        function(object, path) {
                            var add = [],
                                inter;
                            switch (object['type']) {
                                case 'BlockStatement':
                                case 'Program':
                                    //for (var i = 0; i < object.body.length; i += 1) {
                                    Y.Array.each(object.body, function(s) {
                                        inter = [
                                            getDebugStatement(s.loc.start.line),
                                        ];
                                        switch (s.type) {
                                            case 'VariableDeclaration':
                                                //inter.push(getWatchStatement(s));     // Automatically add declared variables to the list of watches (may be useful if we remove them at the end of execution)
                                                break;
                                        }
                                        add.push(inter);
                                    });
                                    object.body = JSInstrument.zip(
                                        object.body,
                                        add
                                    );
                                    //object.body.push(getDebugStatement(object.loc.end.line));
                                    break;
                            }
                        },
                        true
                    );

                    var instrumentedCode = window.escodegen.generate(tree, {
                        indent: true,
                    });
                    instrumentedCode = instrumentedCode.replace(
                        /___DEBUGBLOCK___/g,
                        '(function(){ var i, w = watches, ret = {};' +
                            'for(i=0;i<w.length;i++){' +
                            'try {' +
                            'ret[w[i]]=eval(w[i]);' +
                            //ret[this.watches[i]] = this.doEval(this.watches[i]);
                            '} catch(e){}' +
                            '}' +
                            'return ret;})()'
                    ); // This function returns any watched variable int he scope, so it can be used in the breakpoint event

                    return instrumentedCode;
                } catch (e) {
                    Y.log('Error evaluating client code', 'error');
                    return;
                }
            },
            /**
             * Zip any item of lists in b and objects in a (very specific)
             *
             * @param {Array} a
             * @param {Array} b
             * @returns {Array}
             */
            zip: function(a, b) {
                var results = [];
                Y.Array.each(a, function(item, index) {
                    results = results.concat(b[index]);
                    results.push(item);
                });
                return results;
            },
            /**
             *
             * @param {Array} object
             * @param {function} visitor
             * @param {type} path
             * @returns
             */
            traverse: function(object, visitor, path) {
                var key, child;

                if (typeof path === 'undefined') {
                    path = [];
                }
                for (key in object) {
                    if (object.hasOwnProperty(key)) {
                        child = object[key];
                        if (typeof child === 'object' && child !== null) {
                            JSInstrument.traverse(
                                child,
                                visitor,
                                [object].concat(path)
                            );
                        }
                    }
                }
                visitor.call(this, object, path);
            },
        }
    );
    Y.Wegas.JSInstrument = JSInstrument;
});
