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

    var WysiwygEditor = Y.Base.create("wegas-wysiwygeditor", Y.Widget, [Y.Wegas.Widget, Y.WidgetChild], {

        // *** Lifecycle Methods *** //

        initializer: function () {
        },
        destructor : function () {
        },

        renderUI: function () {
            var cb = this.get("contentBox"), code, syntax;

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
            this.get("contentBox").one("textarea").set("value", this.form.getArray().join(";\n"));
        }
    });

    Y.namespace('Wegas').WysiwygEditor = WysiwygEditor;

    var lang = Y.Lang,
    inputEx = Y.inputEx;

    /**
     *  Adds a method that retrieves the value of each input in the group
     *  (unlike Y.inputEx.Group.getValue() that returns an object based on
     *  inputs names):
     */
    Y.inputEx.Group.prototype.getArray = function () {
        var i, ret = [];
        for ( i = 0; i < this.inputs.length; i =  i + 1 ) {
            ret.push( this.inputs[i].getValue() );
        }
        return ret;
    }

    /**
     * @class VariableDescriptorSelect
     * @constructor
     * @extends
     * @param {Object} options InputEx definition object
     */
    var VariableDescriptorSelect = function(options) {
        VariableDescriptorSelect.superclass.constructor.call(this, options);
    };

    Y.extend( VariableDescriptorSelect, inputEx.Group, {

        entityId: null,
        /**
	 * Setup the options.fields from the availableFields option
	 */
        setOptions: function(options) {
            options.fields = options.fields || [];

            VariableDescriptorSelect.superclass.setOptions.call(this, options);
            this.options.method = options.method;
            this.options.arguments = options.arguments;
        },

        render: function () {
            VariableDescriptorSelect.superclass.render.call( this );
            this.syncUI();
        },

        setValue: function ( val ) {
            console.log( "VariableDescriptorSelect.setValue", val );
        },
        getValue: function () {
            var l = this.inputs.length;
            return "VariableDescriptorFacade.find(" + this.inputs[ l - 3].getValue() + ")" +
                "." + this.inputs[ l - 2 ].getValue() +
                "(" + this.inputs[ l - 1 ].getValue().join( ", ") + ")";

        },
        getEntityId: function () {
            return this.inputs[ this.inputs.length - 3 ].getValue();
        },
        getEntity: function () {
            return Y.Wegas.VariableDescriptorFacade.rest.findById( this.getEntityId() );
        },

        syncUI: function () {
            this.empty();
            this.addField( this.generateField() );                              // Generates method and object selection

            var methods  = this.currentEntity.getMethodCfgs(),
            cMethod = methods[ this.options.method ],
            fieldCfg;

            if ( !cMethod ) {
                for (var i in methods) {
                    cMethod = methods[i];
                    break;
                }
            }
            fieldCfg   = {
                type: "combine",
                fields: ( cMethod && cMethod.arguments ) ? cMethod.arguments : []
            };
            if ( this.options.arguments ) {
                fieldCfg.value = this.options.arguments;
            }


            this.addField( fieldCfg );
        },
        /**
         *
         * @overrride Y.inputEx.Group.onChange()
         *
         */
        onChange: function( fieldValue, fieldInstance ) {

            if ( Y.Lang.isNumber( fieldValue ) ) {
                this.entityId = fieldValue;
                this.options.arguments = null;
            } else if ( Y.Lang.isString( fieldValue ) ) {
                this.options.method = fieldValue;
                this.options.arguments = null;
            } else {
                this.options.arguments = this.inputs[ this.inputs.length - 1 ].getValue() // Saves current args value
            }
            this.syncUI();
            this.fireUpdatedEvt();
        },
        empty: function () {
            while ( this.inputs.length > 0 ) {
                this.inputs.pop().destroy();
            }
        },

        /**
         * Generate
         */
        generateField: function () {
            var ret = [],
            currentId = this.entityId || this.options.value,
            rootEntities = Y.Wegas.VariableDescriptorFacade.rest.getCache(),
            currentEntity = Y.Wegas.VariableDescriptorFacade.rest.findById( currentId ) || rootEntities[ 0 ] ;

            this.currentEntity = currentEntity;                                 // Keeps a reference to the current entity

            ret.push( this.generateSelectConfig( null,                          // Pushes the current entity to the fields stack
            currentEntity, currentEntity.get( "items" ) ) );

            if ( currentEntity.parentDescriptor ) {                             // Add its hierarchy
                while ( currentEntity.parentDescriptor ) {
                    ret.push( this.generateSelectConfig ( currentEntity, currentEntity.parentDescriptor, currentEntity.parentDescriptor.get( "items" ) ) );
                    currentEntity = currentEntity.parentDescriptor;
                }
            }
            ret.push( this.generateSelectConfig( currentEntity,                 // And finally the root context (entities that are at the root of the gameModel
            null, rootEntities ) );

            return ret.reverse();
        },

        /**
         * Generate
         */
        generateSelectConfig: function ( entity, parentEntity, items ) {
            var i, j, value, choices = [];

            if ( parentEntity ) {
                var methods = parentEntity.getMethodCfgs();
                for ( j in methods ) {
                    choices.push({
                        value: j
                    });
                }
            }

            if ( parentEntity && items ) {
                choices.push({
                    value: "----------"
                });
            }

            if ( items ) {
                //if ( items && ( !parentEntity || (parentEntity instanceof Y.Wegas.persistence.ListDescriptor)) ) {
                for ( i = 0 ; i < items.length ; i++ ) {
                    choices.push({
                        value: items[i].get( "id" ),
                        label: items[i].get( "name" )
                    });
                }
            }
            if ( parentEntity === this.currentEntity ) {
                value = this.options.method
            }
            if ( entity ) {
                value = entity.get( "id" );
            }
            return {
                type: 'select',
                choices: choices,
                value: value
            };
        },

        /**
         *  Overriden to allow adding a list of fields at once
         */
        addField: function( fieldOptions ) {
            if ( Y.Lang.isArray( fieldOptions ) ) {
                for ( var i = 0; i < fieldOptions.length; i = i + 1 ) {
                    this.addField( fieldOptions[i] );
                }
            } else {
                VariableDescriptorSelect.superclass.addField.call(this, fieldOptions);
            }
        }
    });

    inputEx.registerType("variabledescriptorselect", VariableDescriptorSelect, {});

    /**
     * @class VariableDescriptorMethodSelect
     * @constructor
     * @extends VariableDescriptorSelect
     * @param {Object} options InputEx definition object
     */
    var VariableDescriptorMethodSelect = function(options) {
        VariableDescriptorMethodSelect.superclass.constructor.call(this, options);
    };

    Y.extend( VariableDescriptorMethodSelect, VariableDescriptorSelect, {});

    inputEx.registerType("variabledescriptormethodselect", VariableDescriptorMethodSelect, {});

    var lang = Y.Lang,
    inputEx = Y.inputEx, ListField

    ListField = function(options) {
        ListField.superclass.constructor.call(this, options);
    };
    Y.extend(ListField, inputEx.Group, {

        /**
	 * Set the ListField classname
	 * @param {Object} options Options object as passed to the constructor
	 */
        setOptions: function(options) {
            ListField.superclass.setOptions.call(this, options);

            this.options.className = options.className ? options.className : 'inputEx-Field inputEx-ListField';
        },

        /**
	 * Render the addButton
	 */
        render: function() {
            ListField.superclass.render.call(this);

            this.addButton = new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-add\"></span>"
            });
            this.addButton.render( this.divEl );
        },

        /**
	 * Handle the click event on the add button
	 */
        initEvents: function() {
            ListField.superclass.initEvents.call(this);

            this.addButton.on( "click", this.onAdd, this );
        },

        renderField: function( fieldOptions ) {
            var fieldInstance = ListField.superclass.renderField.call( this, fieldOptions ),
            removebutton = new Y.Wegas.Button({
                label: '<span class="wegas-icon wegas-icon-remove"></span>'
            });
            removebutton.targetField = fieldInstance;
            removebutton.render( fieldInstance.divEl );
            removebutton.on( "click", this.onRemove, this);
            return fieldInstance;
        },

        onRemove: function ( e ) {
            var i = Y.Array.indexOf( this.inputs, e.target.targetField ),
            d = this.inputs[i];
            d.destroy();
            this.inputs.splice( i, 1 );
        },

        onAdd: function ( e ) {
            this.addField({
                type: "variabledescriptorselect"
            })
        },

        /**
         * Override to disable
         */
        runInteractions: function () { }

    });

    // Register this class as "list" type
    inputEx.registerType("inputlist", ListField);

    var EntityArrayFieldSelect = function(options) {
        EntityArrayFieldSelect.superclass.constructor.call(this, options);
    };
    Y.extend(EntityArrayFieldSelect, inputEx.SelectField, {

        /**
	 * Set the ListField classname
	 * @param {Object} options Options object as passed to the constructor
	 */
        setOptions: function(options) {
            options.choices = [];
            EntityArrayFieldSelect.superclass.setOptions.call(this, options);

        },

        /**
	 * Render the addButton
	 */
        renderComponent: function() {
            EntityArrayFieldSelect.superclass.renderComponent.call(this);
            //this.choices =
        },

        /**
	 * Handle the click event on the add button
	 */
        initEvents: function() {
            EntityArrayFieldSelect.superclass.initEvents.call(this);

        }
    });

    inputEx.registerType( "entryarrayfieldselect", EntityArrayFieldSelect );    // Register this class as "list" type

});