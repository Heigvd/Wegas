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

    Y.extend(NewEntityAction, Y.Plugin.Base, {
        initializer: function () {
            this.afterHostEvent("click", function() {
                EditEntityAction.showAddForm(Y.Wegas.persistence.Entity.revive({
                    "@class": this.get("targetClass")
                }), null, Y.Wegas.app.dataSources[this.get("targetClass")]);
            }, this);
        }
    }, {
        ATTRS: {
            targetClass: { }
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
        NS: "wegas",
        NAME: "EditEntityAction"
    });

    Y.extend(EditEntityAction, Y.Plugin.Base, {
        execute: function() {
            var host = this.get("host");
            EditEntityAction.showUpdateForm(host.get("entity"), host.get("dataSource"));
        },
        initializer: function () {
            this.afterHostEvent("click", this.execute, this);
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
            EditEntityAction.form.setForm(entity.toJSON(), entity.getFormCfg());
        },

        hideEditForm: function () {
            EditEntityAction.get("parent").selectChild(0);
            EditEntityAction.tab.destroy();
            EditEntityAction.tab = null;
        },

        showUpdateForm: function (entity, dataSource) {
            EditEntityAction.showEditForm(entity, function (cfg) {  // Display the edit form
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
                dataSource.rest.post(newVal, (parentData) ? parentData.toJSON() : parentData , {
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

    Y.extend(AddEntityChildAction, Y.Plugin.Base, {
        execute: function() {
            var host = this.get("host");
            EditEntityAction.showAddForm(Y.Wegas.persistence.Entity.revive({      // Display the add form
                "@class": this.get("childClass")
            }), host.get("entity"), host.get("dataSource"));
        },
        initializer: function () {
            this.afterHostEvent("click", this.execute, this);
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

    Y.extend(DeleteEntityAction, Y.Plugin.Base, {
        execute: function() {
            if (confirm("Confirm item deletion ?")) {
                var host = this.get("host");
                host.get("dataSource").rest.deleteObject(host.get("entity"));
            }
        },
        initializer: function () {
            this.afterHostEvent("click", this.execute, this);
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

    Y.extend(EditFSMAction, Y.Plugin.Base, {
        execute: function() {
            Y.Wegas.TabView.findTabAndLoadWidget("State machine editor",        // Load and display the editor in a new tab
                "#centerTabView", null, {
                    type: "StateMachineViewer"
                }, Y.bind(function (entity, widget) {
                    widget.set("entity", entity);
                }, this, this.get("host").get("entity")));
        },
        initializer: function () {
            this.afterHostEvent("click", this.execute, this);
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

    Y.extend(ResetAction, Y.Plugin.Base, {
        initializer: function () {
            this.afterHostEvent("click", function() {

                Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                    request: '/reset'
                });
            }, this);
        }
    }, {
        ATTRS: {
            targetClass: { }
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

    Y.extend(OpenTabAction, Y.Plugin.Base, {

        tab: null,

        initializer: function () {
            this.afterHostEvent("click", function() {
                Y.Wegas.TabView.findTabAndLoadWidget( this.get("host").get("label"),
                    this.get("tabSelector"), {
                        toolbarChildren: this.get("toolbarChildren")
                    }, this.get("subpage"));
            }, this);
        }
    }, {
        ATTRS: {
            tabSelector: {
                value: '#centerTabView'
            },
            subpage: {},
            toolbarChildren: {}
        }
    });

    Y.namespace("Plugin").OpenTabAction = OpenTabAction;

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

    Y.extend(OpenTabAction, Y.Plugin.Base, {

        tab: null,

        initializer: function () {
            this.afterHostEvent("click", function() {
                Y.Wegas.TabView.findTabAndLoadWidget( this.get("host").get("label"),
                    this.get("tabSelector"), {
                        toolbarChildren: this.get("toolbarChildren")
                    }, this.get("subpage"));
            }, this);
        }
    }, {
        ATTRS: {
            tabSelector: {
                value: '#centerTabView'
            },
            subpage: {},
            toolbarChildren: {}
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

    Y.extend(OpenGameAction, Y.Plugin.Base, {
        initializer: function () {
            this.afterHostEvent( "click", function () {
                var params, entity = this.get( "host" ).get( "entity" );

                if ( entity instanceof Y.Wegas.persistence.GameModel ) {
                    params = "gameModelId=" + entity.get( "id" );
                } else if ( entity instanceof Y.Wegas.persistence.Player ) {
                    params = "id=" + entity.get( "id" );
                }  else {
                    params = "gameId=" + entity.get( "id" );
                }

                window.open( Y.Wegas.app.get( "base" ) + this.get("editorUrl") + params );
            }, this );
        }
    }, {
        ATTRS: {
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

    Y.extend(LoadTreeviewNodeAction, Y.Plugin.Base, {

        tab: null,

        initializer: function () {
            this.afterHostEvent("click", function() {
                var host = this.get("host"),
                entityId = host.get("entity").get("id"),
                tabId = this.get("tabId") || host.get("label"),
                tabCfg = {
                    label: host.get("entity").get("name") || "Unnamed"
                },
                tab = Y.Wegas.TabView.createTab( tabId,
                    this.get("tabSelector"), tabCfg );
                tab.set("selected", 2);

                tab.CHILDREN[0].set("emptyMessage", "This game model has no games.");

                Y.Wegas.GameFacade.set("source",                                // Change the source attribute on the datasource
                    Y.Wegas.app.get("base") + "rest/GameModel/" + entityId + "/Game");
                Y.Wegas.GameFacade.sendRequest({
                    request: "/"
                });
            });
        }
    }, {
        ATTRS: {
            tabId: {},
            tabSelector: {
                value: '#centerTabView'
            }
        }
    });

    Y.namespace("Plugin").LoadTreeviewNodeAction = LoadTreeviewNodeAction;


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
});


