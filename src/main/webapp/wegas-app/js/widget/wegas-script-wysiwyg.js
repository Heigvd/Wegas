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
 * @module wegas-script-wysiwyg
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-script-wysiwyg", function(Y){

    var inputEx = Y.inputEx;

    inputEx.WysiwygScript = function(options) {
        inputEx.WysiwygScript.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.WysiwygScript, inputEx.Script, {

        /**
         *
         */
        destroy: function () {
            inputEx.WysiwygScript.superclass.destroy.call( this );

            this.form.destroy();
            this.viewSrc.destroy();
        },
        /**
         *
         */
        setOptions: function( options ) {
            inputEx.WysiwygScript.superclass.setOptions.call(this, options);
            this.options.className = options.className ? options.className : 'inputEx-Field inputEx-WysiwigScript';
            this.options.mode = options.mode || "wysiwyg";
        },

        /**
         *
         */
        setMode: function ( mode ) {
            var wysiwygmode = ( mode === "wysiwyg");

            this.wrapEl.style[ "display" ] = ( wysiwygmode) ? "none" : "block";

            this.viewSrc.set( "selected", !wysiwygmode );
            this.form.addButton.set( "disabled", !wysiwygmode);

            if ( wysiwygmode ) {
                this.form.show();
            } else {
                this.form.hide();
            }

            this.options.mode = mode;
        },

        // *** Private Methods *** //
        /**
         *
         */
        renderComponent: function () {
            inputEx.Script.superclass.renderComponent.call(this);

            this.viewSrc = new Y.Wegas.Button({                                 // Add the "view src" button
                label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>"
            });
            this.viewSrc.on( "click", function () {
                if ( this.viewSrc.get( "disabled" ) ) {
                    return;
                }
                this.setMode( ( this.options.mode === "wysiwyg" ) ? "text" : "wysiwyg" );
            }, this );
            this.viewSrc.render( this.fieldContainer );

            var container = new Y.Node( this.fieldContainer );
            container.prepend( this.viewSrc.get( "boundingBox" ) );
            container.append("<em class=\"msg\"></em>");

            this.on( "updated", this.syncUI, this );                            // Whenever the value is updated, we synchronize the UI

            this.syncUI();
        },

        /**
         *
         */
        syncUI: function () {
            var i, tree = window.esprima.parse( this.el.value, {                // Generate the form
                raw: true
            }),
            container = new Y.Node( this.fieldContainer ),
            fields = [];

            container.one( ".msg" ).setContent( "");

            for (i = 0; i < tree.body.length; i = i + 1) {
                try {
                    fields.push( this.generateExpression( tree.body[i].expression ) );
                } catch( e ) {
                    //Y.error( "Error evaluating line: " +
                    //    window.escodegen.generate(tree.body[i].expression, {
                    //        indent: true
                    //    }));
                    this.setMode( "text" );
                    this.viewSrc.set( "disabled", true );
                    container.one( ".msg" ).setContent( "Unable to read this impact, displaying source only.");
                    return;
                }
            }

            if ( this.form ) {
                this.form.destroy();
            }

            this.form = Y.inputEx({
                type: "inputlist",
                fields: fields,
                useButtons: true,
                parentEl: this.fieldContainer
            });

            this.form.addButton.get( "boundingBox" ).setStyle( "display", "inline-block" );

            this.form.on( "updated", function () {
                if ( this.options.mode === "wysiwyg" ) {
                    this.el.value =  this.form.getArray().join(";\n") + ";";
                }
                console.log("form updated");
            }, this );

            this.setMode( this.options.mode );
            this.viewSrc.set( "disabled", false );
        },
        /**
         *
         */
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
                                arguments: args

                            });
                            return vdSelect;
                    }
            }
            throw new Exception("Unable to parse expression.");
        }
    });

    inputEx.registerType('script', inputEx.WysiwygScript);                             // Register this class as "script" type

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

            var i, args, methods  = this.currentEntity.getMethodCfgs(),
            cMethod = methods[ this.options.method ];

            if ( !cMethod && Y.Object.values(methods).length > 0 ) {
                cMethod = Y.Object.values(methods)[0];                          // By default select the first method available
            }

            args = ( cMethod && cMethod.arguments ) ? cMethod.arguments : [];

            for ( i = 0; i < args.length; i = i + 1 ) {
                args[i].entity = this.currentEntity;                            // Adds a reference to the target entity to the argument Fields;
            }

            this.addField( {
                type: "combine",
                fields: args,
                value: this.options.arguments
            } );
        },
        /**
         *
         * @overrride Y.inputEx.Group.onChange()
         */
        onChange: function( fieldValue, fieldInstance ) {

            if ( Y.Lang.isNumber( fieldValue ) ) {
                this.entityId = fieldValue;
                this.options.method = null;
                this.options.arguments = null;
            } else if ( Y.Lang.isString( fieldValue ) ) {
                this.entityId = fieldInstance.options.parentEntity.get( "id" );
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
                        value: j,
                        label: j.label || j
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
                value: value,
                parentEntity: parentEntity
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
                this.inputs[ this.inputs.length - 1].options.parentEntity = fieldOptions.parentEntity;
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


    /**
     * @class ListField
     * @constructor
     * @extends inputEx.Group
     * @param {Object} options InputEx definition object
     */
    var ListField = function(options) {
        ListField.superclass.constructor.call(this, options);

        var parentNode = new Y.Node( this.divEl.parentNode ) ;
        //parentNode.insert( this.addButton.get( "boundingBox" ).remove(), 1 );
        this.addButton.render( this.divEl.parentNode );
        parentNode.prepend( this.addButton.get( "boundingBox" ) );
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
            ListField.superclass.render.call( this );

            this.addButton = new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-add\"></span>"
            });
            this.addButton.on( "click", this.onAdd, this );
        },
        /**
         *
         */
        destroy: function () {
            ListField.superclass.destroy.call( this );
            this.addButton.destroy();
        },
        /**
	 * Handle the click event on the add button
	 */
        initEvents: function() {
            ListField.superclass.initEvents.call( this );

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
            this.fireUpdatedEvt();
        },

        onAdd: function ( e ) {
            this.addField({
                type: "variabledescriptorselect"
            });
            this.fireUpdatedEvt();
        },

        /**
         * Override to disable
         */
        runInteractions: function () { }

    });

    inputEx.registerType("inputlist", ListField);


    /**
     * @class EntityArrayFieldSelect
     * @constructor
     * @extends inputEx.SelectField
     * @param {Object} options InputEx definition object
     */
    var EntityArrayFieldSelect = function(options) {
        EntityArrayFieldSelect.superclass.constructor.call(this, options);
    };
    Y.extend(EntityArrayFieldSelect, inputEx.SelectField, {

        /**
	 * Set the ListField classname
	 * @param {Object} options Options object as passed to the constructor
	 */
        setOptions: function(options) {
            var i, results = options.entity ? options.entity.get( "results" ) :
            Y.Plugin.EditEntityAction.currentEntity.get( "results" );
            options.choices = [];

            for ( i = 0; i < results.length; i = i + 1 ) {
                options.choices.push({
                    value: results[i].get( "id"  ),
                    label: results[i].get( "name" )
                })

            }

            EntityArrayFieldSelect.superclass.setOptions.call(this, options);
            this.options.entity = options.entity;
        }
    });

    inputEx.registerType( "entityarrayfieldselect", EntityArrayFieldSelect );    // Register this class as "list" type

});