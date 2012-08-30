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

YUI.add('wegas-editor-action', function (Y) {
    "use strict";
    /**
     *  @class Action
     *  @module Wegas
     *  @constructor
     */
    var Action = Y.Plugin.Action, EntityAction;

    /**
     *  @class Action
     *  @module Wegas
     *  @constructor
     */
    EntityAction = function () {
        EntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(EntityAction, {
        NS: "entityaction",
        NAME: "EntityAction"
    });

    Y.extend(EntityAction, Action, {}, {
        ATTRS: {
            entity: {},
            dataSource: {}
        }
    });
    Y.namespace("Plugin").EntityAction = EntityAction;

    /**
     *  @class NewEntityAction
     *  @module Wegas
     *  @constructor
     */
    var NewEntityAction = function () {
        NewEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(NewEntityAction, {
        NS: "wegas",
        NAME: "NewEntityAction"
    });

    Y.extend(NewEntityAction, EntityAction, {
        execute: function () {
            EditEntityAction.showAddForm(Y.Wegas.persistence.Entity.revive({
                "@class": this.get("targetClass")
            }), null, Y.Wegas.app.dataSources[ this.get( "dataSource" ) ] );
        }
    }, {
        ATTRS: {
            targetClass: { },
            dataSource: {
                getter: function ( value ) {
                    if ( !value ) {
                        return this.get( "targetClass" );
                    }
                    return value;
                }
            }
        }
    });

    Y.namespace("Plugin").NewEntityAction = NewEntityAction;


    /**
     *  @class EditEntityAction
     *  @module Wegas
     *  @constructor
     */
    var EditEntityAction = function () {
        EditEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(EditEntityAction, {
        NS: "editentity",
        NAME: "EditEntityAction"
    });

    Y.extend(EditEntityAction, EntityAction, {
        execute: function() {
            EditEntityAction.showUpdateForm( this.get( "entity" ), this.get( "dataSource" ) );
        }
    }, {
        tab: null,
        form: null,
        /**
         * Show edition form in the target div
         */
        showEditForm: function (entity, callback) {
            EditEntityAction.callback = callback;
            EditEntityAction.currentEntity = entity;

            if (!EditEntityAction.tab) {
                EditEntityAction.tab = Y.Wegas.TabView.createTab("Edit", '#rightTabView');
                //EditEntityAction.tab = Y.Wegas.TabView.createTab("Edit", '#centerTabView');
                EditEntityAction.form = new Y.Wegas.FormWidget();

                EditEntityAction.form.on("submit", function (e) {
                    this.callback(e.value, this.currentEntity);
                }, EditEntityAction);

                EditEntityAction.form.on("cancel", EditEntityAction.hideEditForm, EditEntityAction);
                EditEntityAction.tab.add(EditEntityAction.form);
            }
            EditEntityAction.tab.set("selected", 2);
            EditEntityAction.form.emptyMessage();
            EditEntityAction.form.setForm(entity.toObject2(), entity.getFormCfg());
        },

        hideEditForm: function () {
            EditEntityAction.tab.get( "parent" ).selectChild( 0 );
            EditEntityAction.tab.destroy();
            EditEntityAction.tab = null;
        },

        hideFormFields: function () {
            EditEntityAction.form.destroyForm();
        },

        showUpdateForm: function (entity, dataSource) {
            EditEntityAction.showEditForm(entity, function (cfg) {  // Display the edit form
                // entity.setAttrs( cfg );
                dataSource.rest.put(cfg, {
                    success: function () {
                        EditEntityAction.showFormMsg("success", "Item has been updated");
                    },
                    failure: function (e) {
                        EditEntityAction.showFormMsg("error", e.response.message || "Error while update item");
                    }
                });
            });
        },

        showAddForm: function (entity, parentData, dataSource) {
            EditEntityAction.showEditForm(entity, function (newVal) {
                dataSource.rest.post(newVal, (parentData) ? parentData.toObject2() : parentData , {
                    success: function (e) {
                        EditEntityAction.showUpdateForm(e.response.entity, dataSource);
                        EditEntityAction.showFormMsg("success", "Item has been added");
                    },
                    failure: function (e) {
                        EditEntityAction.showFormMsg("error", e.response.results.message || "Error while adding item");
                    }
                });
            });
        },
        showFormMsg: function (level, msg) {
            EditEntityAction.form.showMessage(level, msg);
        }
    });

    Y.namespace("Plugin").EditEntityAction = EditEntityAction;

    /**
     *  @class EditEntityArrayFieldAction
     *  @module Wegas
     *  @constructor
     */
    var EditEntityArrayFieldAction = function () {
        EditEntityArrayFieldAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(EditEntityArrayFieldAction, {
        NS: "editentitarrayfieldaction",
        NAME: "EditEntityArrayFieldAction"
    });

    Y.extend(EditEntityArrayFieldAction, EntityAction, {
        execute: function () {
            var entity = this.get( "entity"),
            dataSource = this.get( "dataSource"),
            parentEntity = this.get ( "parentEntity" );

            switch (this.get( "method" ) ) {
                case "put":
                    EditEntityAction.showEditForm( entity, function ( newVal ) {

                        entity.setAttrs( newVal );

                        dataSource.rest.put( parentEntity.toObject2(), {
                            success: function () {
                                EditEntityAction.showFormMsg( "success", "Item has been updated" );
                            },
                            failure: function (e) {
                                EditEntityAction.showFormMsg( "error", e.response.message || "Error while update item" );
                            }
                        });
                    });
                    break;

                case "post":
                    var newEntity = Y.Wegas.persistence.Entity.revive({
                        "@class": this.get( "targetClass" )
                    });
                    EditEntityAction.showEditForm( newEntity , Y.bind( function ( newVal ) {
                        newEntity.setAttrs( newVal);
                        entity.get( this.get( "attributeKey" ) ).push( newEntity );

                        dataSource.rest.put( entity.toObject2(), {
                            success: function () {
                                EditEntityAction.showFormMsg( "success", "Item has been added" );
                                EditEntityAction.hideFormFields();
                            },
                            failure: function (e) {
                                EditEntityAction.showFormMsg( "error", e.response.message || "Error while update item" );
                            }
                        });
                    }, this ) );
                    break;

                case "delete":
                    if ( confirm( "Are your sure your want to delete this item ?" ) ) {
                        var targetArray = parentEntity.get( this.get( "attributeKey" ) );
                        Y.Array.find( targetArray, function ( e, i, a ) {
                            if ( e.get( "id" ) == entity.get( "id" ) ) {
                                a.splice( i, 1 );
                                return true;
                            }
                            return false;
                        });
                        dataSource.rest.put( parentEntity.toObject2() );
                    } else {
                        return;
                    }
                    break;
            };
        }
    }, {
        ATTRS: {
            /**
             * Can be put, post or delete
             */
            method: {
                value: "put"
            },
            parentEntity: {},
            targetClass: { },
            attributeKey: { }
        }
    });

    Y.namespace("Plugin").EditEntityArrayFieldAction = EditEntityArrayFieldAction;

    /**
     *  @class AddEntityChildAction
     *  @module Wegas
     *  @constructor
     */
    var AddEntityChildAction = function () {
        AddEntityChildAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(AddEntityChildAction, {
        NS: "wegas",
        NAME: "AddEntityChildAction"
    });

    Y.extend(AddEntityChildAction, EntityAction, {
        execute: function() {
            EditEntityAction.showAddForm(Y.Wegas.persistence.Entity.revive({      // Display the add form
                "@class": this.get( "childClass" )
            }), this.get( "entity" ), this.get( "dataSource" ) );
        }
    }, {
        ATTRS: {
            childClass: {}
        }
    });

    Y.namespace("Plugin").AddEntityChildAction = AddEntityChildAction;

    /**
     *  @class DeleteEntityAction
     *  @module Wegas
     *  @constructor
     */
    var DeleteEntityAction = function () {
        DeleteEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(DeleteEntityAction, {
        NS: "wegas",
        NAME: "DeleteEntityAction"
    });

    Y.extend(DeleteEntityAction, EntityAction, {
        execute: function() {
            if (confirm("Are your sure your want to delete this item ?")) {
                this.get( "dataSource" ).rest.deleteObject( this.get( "entity" ) );
            }
        }
    });

    Y.namespace("Plugin").DeleteEntityAction = DeleteEntityAction;

    /**
     *  @class EditFSMAction
     *  @module Wegas
     *  @constructor
     */
    var EditFSMAction = function () {
        EditFSMAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(EditFSMAction, {
        NS: "wegas",
        NAME: "EditFSMAction"
    });

    Y.extend(EditFSMAction, EntityAction, {
        execute: function() {
            Y.Wegas.TabView.findTabAndLoadWidget("State machine editor",        // Load and display the editor in a new tab
                "#centerTabView", null, {
                    type: "StateMachineViewer",
                    plugins: [{
                        fn: "WidgetToolbar"
                    }]
                }, Y.bind(function (entity, widget) {
                    widget.set( "entity", entity);
                }, this, this.get( "entity" ) ) );
        }
    });

    Y.namespace("Plugin").EditFSMAction = EditFSMAction;

    /**
     *  @class ResetAction
     *  @module Wegas
     *  @constructor
     */
    var ResetAction = function () {
        ResetAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(ResetAction, {
        NS: "wegas",
        NAME: "ResetAction"
    });

    Y.extend(ResetAction, Action, {
        execute: function () {
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: '/reset'
            });
        }
    });

    Y.namespace("Plugin").ResetAction = ResetAction;

    /**
     *  @class OpenTabAction
     *  @module Wegas
     *  @constructor
     */
    var OpenTabAction = function () {
        OpenTabAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(OpenTabAction, {
        NS: "wegas",
        NAME: "OpenTabAction"
    });

    Y.extend(OpenTabAction, Action, {
        execute: function () {
            Y.Wegas.TabView.findTabAndLoadWidget( this.get( "host" ).get( "label" ),
                this.get( "tabSelector" ), {}, this.get( "subpage" ) );
        }
    }, {
        ATTRS: {
            tabSelector: {
                value: '#centerTabView'
            },
            subpage: {}
        }
    });

    Y.namespace("Plugin").OpenTabAction = OpenTabAction;

    /**
     *  @class OpenGameAction
     *  @module Wegas
     *  @constructor
     */
    var OpenGameAction = function () {
        OpenGameAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(OpenGameAction, {
        NS: "wegas",
        NAME: "OpenGameAction"
    });

    Y.extend(OpenGameAction, Y.Plugin.OpenUrlAction, {
        execute: function () {
            var params, entity = this.get( "entity" );

            if ( entity instanceof Y.Wegas.persistence.GameModel ) {
                params = "gameModelId=" + entity.get( "id" );
            } else if ( entity instanceof Y.Wegas.persistence.Player ) {
                params = "id=" + entity.get( "id" );
            } else {
                params = "gameId=" + entity.get( "id" );
            }
            this.set( "url",  this.get("editorUrl") + params );
            OpenGameAction.superclass.execute.call( this );
        }
    }, {
        ATTRS: {
            entity: {},
            editorUrl: {
                value: 'wegas-editor/view/editor.html?'
            }
        }
    });

    Y.namespace( "Plugin" ).OpenGameAction = OpenGameAction;

    /**
     *  @class LoadTreeviewNodeAction
     *  @module Wegas
     *  @constructor
     */
    var LoadTreeviewNodeAction = function () {
        LoadTreeviewNodeAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(LoadTreeviewNodeAction, {
        NS: "wegas",
        NAME: "LoadTreeviewNodeAction"
    });

    Y.extend(LoadTreeviewNodeAction, Action, {

        tab: null,

        execute: function () {
            var entity = this.get( "entity"),
            tabId = this.get("tabId") || this.get( "host" ).get("label"),
            tabCfg = {
                label: entity.get("name") || "Unnamed"
            },
            tab = Y.Wegas.TabView.createTab( tabId,
                this.get("tabSelector"), tabCfg );

            tab.set("selected", 2);

            tab.witem(0).set("emptyMessage", "This game model has no games.");
            tab.witem(0).toolbar.get( "children" )[0].set( "disabled", false);  // Allow game creation

            Y.Wegas.GameFacade.set("source",                                    // Change the source attribute on the datasource
                Y.Wegas.app.get("base") + "rest/GameModel/" + entity.get( "id" ) + "/Game");

            Y.Wegas.GameFacade.sendRequest({
                request: "/"
            });
        }
    }, {
        ATTRS: {
            entity: {},
            tabId: {},
            tabSelector: {
                value: '#centerTabView'
            }
        }
    });

    Y.namespace("Plugin").LoadTreeviewNodeAction = LoadTreeviewNodeAction;

    /**
     *  @class CloneEntityAction
     *  @module Wegas
     *  @constructor
     */
    var CloneEntityAction = function () {
        CloneEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(CloneEntityAction, {
        NS: "wegas",
        NAME: "CloneEntityAction"
    });

    Y.extend(CloneEntityAction, EntityAction, {
        execute: function() {
            this._clone(this.get("entity"), this.get("entity").parentDescriptor);

        },
        _onSuccess: function( e){
            console.log("Clone successfull");
        },
        _clone: function(entity, parent){
            if(parent && parent.toObject){
                parent = parent.toObject();
            }
            Y.Wegas.VariableDescriptorFacade.rest.clone(entity.get("id"), parent, {
                success:Y.bind(this._onSuccess, this)
            });
        }
    }, {
        ATTRS:{
            childs:{}
        }
    });

    Y.namespace("Plugin").CloneEntityAction = CloneEntityAction;
    // *** Buttons *** //
    /**
     * Shortcut to create a Button with an NewEntityAction plugin
     */
    Y.Wegas.NewEntityButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(NewEntityAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an EditEntityAction plugin
     */
    Y.Wegas.EditEntityButton = Y.Base.create("button", Y.Wegas.Button, [], {
        bindUI: function () {
            this.plug(EditEntityAction);
            if (!this.get("label")) {
                this.set("label", "Edit");                                      // @fixme hack because the ATTR's value is not taken into account
            }
        }
    }, {
        ATTRS: {
            label: {
                value: "Y.ButtonCore.ATTRS.label.value"
            }
        }
    });
    /**
     * Shortcut to create a Button with an AddEntityChildAction plugin
     */
    Y.Wegas.AddEntityChildButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(AddEntityChildAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an DeleteEntityAction plugin
     */
    Y.Wegas.DeleteEntityButton = Y.Base.create("button", Y.Wegas.Button, [], {
        bindUI: function () {
            this.plug(DeleteEntityAction);
            if (!this.get("label")) {
                this.set("label", "Delete");                                    // @fixme hack because the ATTR's value is not taken into account
            }
        }
    }, {
        ATTRS:{
            label: {
                value: "Delete"
            }
        }
    });

    /**
     * Shortcut to create a Button with an OpenTabAction plugin
     */
    Y.Wegas.OpenTabButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(OpenTabAction, cfg);
        }
    });
    /**
     * Shortcut to create a Button with an CloneEntityAction plugin
     */
    Y.Wegas.CloneEntityButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(CloneEntityAction, cfg);
        },
        bindUI: function(){
            if (!this.get("label")) {
                this.set("label","Duplicate");
            }
        }
    });
});


