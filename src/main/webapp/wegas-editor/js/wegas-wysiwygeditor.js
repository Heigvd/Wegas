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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */


YUI.add('wegas-wysiwygeditor', function(Y) {
    "use strict";

    var WysiwygEditor = Y.Base.create("wegas-wysiwygeditor", Y.Widget, [ Y.Wegas.Widget, Y.WidgetChild ], {

        // *** Lifecycle Methods *** //

        initializer: function () {
        },
        destructor : function () {
        },

        renderUI: function () {
            var cb = this.get("contentBox");

            cb.append("<textarea style=\"width:100%;200px\">VariableDescriptorFacade.find(6).setValue(self, 200);</textarea>");

            new Y.Button({
                label: "Generate form",
                on: {
                    click: Y.bind(this.syncUI, this)
                }
            }).render(cb);

            new Y.Button({
                label: "Generate code",
                on: {
                    click: Y.bind(this.genCode, this)
                }
            }).render(cb);
        },

        // *** Private Methods *** //
        syncUI: function () {
            var i, code = this.get("contentBox").one("textarea").get("value"),
            tree = window.esprima.parse(code, {
                raw: true
            }),
            outputCode = window.escodegen.generate(tree, {
                indent: true
            }), ret = [],
            fields = [];
            console.log("Generating tree:", tree , outputCode, "info", "Wegas.WysiwyEditor");

            for (i = 0; i < tree.body.length; i = i + 1) {
                try {
                    fields.push( this.generateExpression( tree.body[i].expression ) );
                } catch( e ) {
                    Y.error( "Error evaluating line: " +
                        window.escodegen.generate(tree.body[i].expression, {
                            indent: true
                        }));
                }
            }

            if ( this.form ) {
                this.form.destroy();
            }

            this.form = Y.inputEx({
                type: "inputlist",
                fields: fields,
                useButtons: true,
                parentEl: this.get( "contentBox" )
            });

        },
        generateExpression: function ( expression ) {
            switch ( expression.type ) {
                case "CallExpression":
                    switch ( expression.callee.object.type ) {
                        case "Identifier":
                            switch ( expression.callee.object.name ) {
                                case "VariableDescriptorFacade":
                                    return {
                                        type: "variabledescriptorselect",
                                        value: expression.arguments[0].value
                                    };
                            }
                            break;
                        default:
                            //return new MethodSelect({
                            //    object: this.generateExpression( expression.callee.object ),
                            //    name: expression.callee.property.value,
                            //    arguments: expression.callee.arguments
                            var vdSelect = this.generateExpression( expression.callee.object ), args = [];

                            Y.Array.each( expression.arguments, function ( i ) {
                                args.push( i.value || i.name );
                            });
                            Y.mix(vdSelect, {
                                //type: "variabledescriptormethodselect",
                                //object: this.generateExpression( expression.callee.object ),
                                //fields: [  ],
                                method: expression.callee.property.name,
                                arguments: args,

                            });
                            return vdSelect;
                    }
            }
            throw new Exception("Unable to parse expression.");
        },
        genCode: function() {
            this.get("contentBox").one("textarea").set("value", this.form.getArray().join(";\n") + ";");
        }
    });

    Y.namespace('Wegas').WysiwygEditor = WysiwygEditor;
});