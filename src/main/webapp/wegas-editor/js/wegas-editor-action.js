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
     *  @class NewAction
     *  @module Wegas
     *  @constructor
     */
    var NewAction = function () {
        NewAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(NewAction, {
        NS: "wegas",
        NAME: "NewAction"
    });

    Y.extend(NewAction, Y.Plugin.Base, {
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

    Y.namespace("Plugin").NewAction = NewAction;

    /**
     *  @class NewAction
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
     *  @class AddEntityChildAction
     *  @module Wegas
     *  @constructor
     */
    var AddEntityChildAction = function () {
        AddEntityChildAction.superclass.constructor.apply(this, arguments);
    };

    Y.mix(EditEntityAction, {
        NS: "wegas",
        NAME: "AddEntityChildAction"
    });

    Y.extend(AddEntityChildAction, Y.Plugin.Base, {
        execute: function() {
            Y.Wegas.editor.showUpdateForm(host.get("entity"),                   // Display the edit form
                host.get("dataSource"));

            Y.Wegas.editor.edit({
                '@class': this.get("childClass")
            }, function (value) {
                var host = this.get("host");
                host.get("dataSource").rest.post(value, host.get("entity").toJSON());
            }, null, this);
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
});


