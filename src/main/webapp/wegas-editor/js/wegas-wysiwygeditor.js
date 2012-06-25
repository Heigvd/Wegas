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
            var cb = this.get("contentBox");

            cb.append("<textarea style=\"width:100%;200px\">VariableDescriptor.getInstance(self);</textarea>");

            new Y.Button({
                label: "Generate form",
                on: {
                    click: Y.bind(this.syncUI, this)
                }
            }).render(cb);

        },

        syncUI: function () {
            var cb = this.get("contentBox"),
            code = cb.one("textarea").get("value"),
            syntax = window.esprima.parse(code, {
                raw: true
            });
            //            code = window.escodegen.generate(syntax, {
            //                indent: indent
            //            });

            console.log(syntax, code);

            if (this.form) {
                this.form.destroy();
            }

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
                                type: "hidden"
                            }
                        },
                        "body": {
                            "type":"array",
                            "items":{
                                "$ref":"ExpressionStatement"
                            },
                            "_inputex":{
                                "useButtons":false
                            }
                        }
                    }
                },
                "ExpressionStatement": {
                    id:'information-source',
                    type:'object',
                    properties:{
                        'expression':{
                            '$ref':'CallExpression'
                        }
                    }
                },
                "CallExpression": {
                    id: 'CallExpression',
                    type: 'object',
                    properties:{
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
                    }
                },
                "Identifier": {
                    id:'identifier',
                    type:'object',
                    properties:{
                        'name':{
                            'type':'string',
                            "_inputex": {
                                className: "wegas-field wegas-field-identifier",
                                label: null
                            }
                        }
                    }
                },
                "MemberExpression": {
                    type: "object",
                    properties: {
                        "object": {
                            "$ref":"Identifier"
                        },
                        "property": {
                            "$ref":"Identifier"
                        }
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
                this.form.setValue(syntax);
            }, this, formFields));

        }

        // *** Private Methods *** //

    }, {
        ATTRS: {

        }
    });

    Y.namespace('Wegas').WysiwygEditor = WysiwygEditor;

});