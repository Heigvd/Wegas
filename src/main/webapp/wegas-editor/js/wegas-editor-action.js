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
                Y.Wegas.TabView.findTabAndLoadWidget( this.get("host").get("label"), this.get("tabSelector"), null, this.get("subpage"));
            }, this);
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
                Y.Wegas.editor.showAddForm(Y.Wegas.persistence.Entity.revive({
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
            Y.Wegas.editor.showUpdateForm(host.get("entity"),                   // Display the edit form
            host.get("dataSource"));
        },
        initializer: function () {
            this.afterHostEvent("click", this.execute, this);
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
            Y.Wegas.editor.showAddForm(Y.Wegas.persistence.Entity.revive({      // Display the add form
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
            this.set("label", "Edit");                                          // @fixme hack because the ATTR's value is not taken into account
        }
    }, {
        ATTRS:{
            label: {
                value: "Edit"
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
            this.set("label", "Delete");                                        // @fixme hack because the ATTR's value is not taken into account
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


