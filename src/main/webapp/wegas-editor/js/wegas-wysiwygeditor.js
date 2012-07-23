/**
 *
 *
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-wysiwygeditor', function(Y) {
    "use strict";

    var WysiwygEditor = Y.Base.create("wegas-wysiwygeditor", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild], {

        // *** Lifecycle Methods *** //

        initializer: function () {
        },
        destructor : function () {
        },

        renderUI: function () {
            return;
            var cb = this.get("contentBox"), code, syntax;

            cb.append("<textarea style=\"width:100%;200px\">VariableDescriptor.getInstance(self);</textarea>");

            new Y.Button({
                label: "Generate form",
                on: {
                    click: Y.bind(this.genSyntaxTree, this)
                }
            }).render(cb);

            new Y.Button({
                label: "Generate code",
                on: {
                    click: Y.bind(this.genCode, this)
                }
            }).render(cb);

            var base_schema_map = {
                "address": {
                    id:'address',
                    type:'object',
                    properties:{
                        'address1':{
                            'type':'string',
                            'title':'Address'
                        },
                        'address2':{
                            'type':'string',
                            'optional':true,
                            'title':' '
                        },
                        'city':{
                            'type':'string',
                            'title':'City'
                        },
                        'state':{
                            'type':'string',
                            'minLength':2,
                            'maxLength':2,
                            'pattern':/^[A-Za-z][A-Za-z]$/,
                            'title':'State'

                        },
                        'postal_code':{
                            'type':'string',
                            'pattern':/(^\d{5}-\d{4}$)|(^\d{5}$)/,
                            'title':'Zip'
                        }
                    }
                },
                "information-source": {
                    id:'information-source',
                    type:'object',
                    properties:{
                        'name':{
                            'type':'string',
                            'title':'Organization'
                        },
                        'contact':{
                            'type':'string',
                            'optional':true,
                            'title':'Contact Name'
                        },
                        'physical_address':{
                            '$ref':'address',
                            'optional':true,
                            'title':'Physical Address'
                        },
                        'postal_address':{
                            '$ref':'address',
                            'title':'Postal Address'
                        },
                        'telephone':{
                            'type':'string',
                            'pattern':/^\d{3}-\d{3}-\d{4}$/,
                            'title':'Telephone'
                        }
                    }
                },
                'community': {
                    'id':'community',
                    'type':'object',
                    'properties':{
                        'community_id':{
                            'type':'number',
                            'title':'Community ID'
                        },
                        'display_name':{
                            'type':'string',
                            'title':'Community Name'
                        },
                        'short_description':{
                            'type':'string',
                            'format':'text',
                            'title':'Short Description',
                            '_inputex':{
                                'rows':5,
                                'cols':50
                            }
                        },
                        'long_description':{
                            'type':'string',
                            'format':'html',
                            'title':'Long Description',
                            "_inputex":{
                                "opts":{
                                    'width':'500',
                                    'height':'200'
                                }
                            }
                        },
                        "information_sources": {
                            "title":"Information Sources",
                            "type":"array",
                            "items":{
                                "$ref":"information-source"
                            },
                            "_inputex":{
                                "useButtons":false,
                                "sortable":true
                            }
                        }
                    }
                },
                'Program': {
                    'id':'program',
                    'type':'object',
                    'properties':{
                        "type": {
                            'type':'string',
                            _inputex: {
                                _type: "hidden",
                                value: "Program"
                            }
                        },
                        "body": {
                            "type":"array",
                            "items":{
                                "$ref":"ExpressionStatement"
                            },
                            "_inputex":{
                                "useButtons":false,
                                className: "wegas-field wegas-field-body"
                            }
                        }
                    }
                },
                "ExpressionStatement": {
                    id:'information-source',
                    type:'object',
                    properties:{
                        "type": {
                            'type':'string',
                            _inputex: {
                                _type: "hidden",
                                value: "ExpressionStatement"
                            }
                        },
                        'expression':{
                            '$ref':'CallExpression'
                        }
                    }
                },
                "CallExpression": {
                    id: 'CallExpression',
                    type: 'object',
                    properties:{
                        "type": {
                            'type':'string',
                            _inputex: {
                                _type: "hidden",
                                value: "CallExpression"
                            }
                        },
                        'callee': {
                            $ref: "MemberExpression"
                        },
                        'arguments':{
                            'type':'array',
                            "items":{
                                "$ref":"Identifier"
                            },
                            "_inputex":{
                                // "useButtons":false
                                sortable: false,
                                className: "wegas-field wegas-field-arguments"
                            }
                        }
                    },
                    "_inputex":{
                        className: "wegas-field wegas-field-callexpression"
                    }
                },
                "Identifier": {
                    id:'identifier',
                    type:'object',
                    properties:{
                        "type": {
                            'type':'string',
                            _inputex: {
                                _type: "hidden",
                                value: "Identifier"
                            }
                        },
                        'name':{
                            'type':'string',
                            "_inputex": {
                                className: "wegas-field wegas-field-identifier",
                                label: ""
                            }
                        }
                    }
                },
                "MemberExpression": {
                    type: "object",
                    properties: {
                        "type": {
                            'type':'string',
                            _inputex: {
                                _type: "hidden",
                                value: "MemberExpression"
                            }
                        },
                        "object": {
                            "$ref":"Identifier",
                            "_inputex":{
                                className: "wegas-field wegas-field-identifier wegas-field-object"
                            }
                        },
                        "property": {
                            "$ref":"Identifier"
                        }
                    },
                    "_inputex":{
                        className: "wegas-field wegas-field-memberexpression"
                    }
                }
            };

            var builder = new Y.inputEx.JsonSchema.Builder({
                'schemaIdentifierMap':base_schema_map,
                'defaultOptions':{
                    'showMsg':true
                }
            });
            var formFields = builder.schemaToInputEx(base_schema_map.Program);
            formFields.parentEl = cb;

            Y.inputEx.use(formFields, Y.bind(function(fields) {
                this.form = Y.inputEx(fields);
                this.genSyntaxTree();
            }, this, formFields));
        },

        // *** Private Methods *** //

        genSyntaxTree: function() {
            var code = this.get("contentBox").one("textarea").get("value"),
            syntax = window.esprima.parse(code, {
                raw: true
            });
            var code = window.escodegen.generate(syntax, {
                indent: true
            });
            console.log("Generating tree:", syntax , code,"info", "Wegas.WysiwyEditor");
            this.form.setValue(syntax);
        },
        genCode: function() {
            console.log("Generating code:", this.form.getValue(), "info", "Wegas.WysiwyEditor");
            var code = window.escodegen.generate(this.form.getValue(), {
                indent: true
            });
            this.get("contentBox").one("textarea").set("value", code);
        }
    }, {
        ATTRS: {

    }
    });

    Y.namespace('Wegas').WysiwygEditor = WysiwygEditor;

});