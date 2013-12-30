/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-editor-entityaction', function(Y) {
    "use strict";
    var ENTITY = "entity", LABEL = "label",
            Plugin = Y.Plugin, Action = Plugin.Action, Wegas = Y.Wegas, Lang = Y.Lang,
            EntityAction, EditFSMAction;
    /**
     * @class
     * @name Y.Plugin.EntityAction
     * @extends Y.Plugin.Action
     * @constructor
     */
    EntityAction = function() {
        EntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EntityAction, Action, {}, {
        /** @lends Y.Wegas.EntityAction */
        NS: "entityaction",
        NAME: "EntityAction",
        ATTRS: {
            entity: {
                getter: function(val) {
                    if (val === "currentGameModel") {
                        return Wegas.Facade.GameModel.cache.getCurrentGameModel();
                    }
                    return val;
                }
            },
            dataSource: {
                getter: function(val) {
                    if (Lang.isString(val)) {
                        return Wegas.Facade[val];
                    }
                    return val;
                }
            }
        }
    });
    Plugin.EntityAction = EntityAction;
    /**
     * @name Y.Plugin.EditEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    var EditEntityAction = function() {
        EditEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EditEntityAction, EntityAction, {
        /**
         * @function
         * @private
         */
        execute: function() {
            var entity = this.get(ENTITY);

            EditEntityAction.getEditionTab();                                   // Create the edition tab (and the left panel won't pop in and out)

            if ((Wegas.persistence.VariableDescriptor &&
                    (entity instanceof Wegas.persistence.VariableDescriptor     // Those classes may not be loaded
                            || entity instanceof Wegas.persistence.VariableInstance))
                    || entity instanceof Wegas.persistence.JpaAccount
                    || entity instanceof Wegas.persistence.GameModel
                    || entity instanceof Wegas.persistence.Game) {              // @fixme we may get extended mode for every entities
                EditEntityAction.showEditFormOverlay();
                this.get("dataSource").cache.getWithView(entity, "EditorExtended", {// just need to check if it causes bugs
                    on: {
                        success: function(e) {
                            EditEntityAction.hideEditFormOverlay();
                            EditEntityAction.showUpdateForm(e.response.entity, e.callback.ds);
                        },
                        ds: this.get("dataSource")
                    }
                });
            } else {
                EditEntityAction.showUpdateForm(entity, this.get("dataSource"));
            }
        }
    }, {
        NS: "editentity",
        NAME: "EditEntityAction",
        ATTRS: {
            formCfg: {
            }
        },
        /**
         *
         */
        tab: null,
        /**
         *
         */
        form: null,
        /**
         * Show edition form in the target div
         */
        showEditForm: function(entity, callback, cancelCallback, formCfg) {

            EditEntityAction.hideRightTabs();                                   // Hide all active tabs

            if (EditEntityAction.cancelCallback) {                              // A cancel action was defined. By changing form, assume cancel
                try {
                    EditEntityAction.cancelCallback(EditEntityAction.currentEntity);
                } finally {
                    EditEntityAction.cancelCallback = null;
                }
            }

            EditEntityAction.callback = callback;
            EditEntityAction.currentEntity = entity;
            EditEntityAction.cancelCallback = cancelCallback;

            var tab = EditEntityAction.getEditionTab(),
                    prefix = (entity.get("id")) ? "Edit " : "New ";             // No id -> new entity

            tab.setAttrs({
                label: prefix + entity.getType().replace("Descriptor", "").replace("Instance", "").toLowerCase(),
                selected: 2
            });
            tab.form.setAttrs({
                values: entity.toObject(),
                cfg: formCfg || entity.getFormCfg()
            });
            tab.form.toolbar.setStatusMessage("");
            //tab.form.saveButton.set("disabled", false);

            Y.fire("rightTabShown");

            return tab.form;
        },
        getEditionTab: function() {
            if (!EditEntityAction.tab || EditEntityAction.tab.get("destroyed")) {// First make sure the edit tab exists
//                Y.Widget.getByNode("#rightTabView").destroyAll();
                EditEntityAction.tab = Wegas.TabView.createTab("Edit", '#rightTabView', {}, 0);
                var form = new Wegas.Form();
                //EditEntityAction.tab = Wegas.TabView.createTab("Edit", '#centerTabView');
                form.on("submit", function(e) {
                    this.form.showOverlay();
                    //EditEntityAction.form.saveButton.set("disabled", true);
                    this.callback(e.value, this.currentEntity);
                }, EditEntityAction);
                form.on("cancel", function() {
                    this.tab.remove();
                    this.tab.destroy();
                    if (Y.Lang.isFunction(this.cancelCallback)) {
                        this.cancelCallback(this.currentEntity);
                    }
                    this.cancelCallback = this.currentEntity = this.callback = null;
                    //Wegas.app.widget.hidePosition("right");                   // Hide the right layout
                }, EditEntityAction);
                form.before("updated", function(e) {
                    EditEntityAction.form.toolbar.setStatusMessage("*");
                    //EditEntityAction.form.saveButton.set("disabled", false);
                });
                EditEntityAction.tab.form = EditEntityAction.form = form;
                EditEntityAction.tab.add(form);
                //if (!Wegas.App.hideRightPanelCloseButton) {
                //    form.addButton({
                //        type: "Button",
                //        action: "cancel",
                //        label: "<span class=\"wegas-icon wegas-icon-cancel\" ></span>Close"
                //    });
                //}
            }
            return EditEntityAction.tab;
        },
        /**
         *
         */
        hideFormFields: function() {
            EditEntityAction.form.destroyForm();
        },
        /**
         *
         */
        showEditFormOverlay: function() {
            EditEntityAction.form.showOverlay();
        },
        /**
         *
         */
        hideEditFormOverlay: function() {
            EditEntityAction.form.hideOverlay();
        },
        hideRightTabs: function() {
            Y.Widget.getByNode("#rightTabView").destroyAll();
        },
        /**
         *
         */
        showFormMessage: function(level, msg, timeout) {
            EditEntityAction.form.showMessageBis(level, msg);
        },
        /**
         *
         */
        showUpdateForm: function(entity, dataSource) {
            var dataSource = dataSource;

            EditEntityAction.showEditForm(entity, function(cfg) {               // Display the edit form
                // entity.setAttrs(cfg);
                dataSource.cache.put(cfg, {
                    success: function() {
                        EditEntityAction.showFormMessage("success", "Item has been updated");
                        EditEntityAction.hideEditFormOverlay();
                    },
                    failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                });
            });
        }
    });
    Plugin.EditEntityAction = EditEntityAction;
    /**
     * @class
     * @name Y.Plugin.NewEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    var NewEntityAction = function() {
        NewEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(NewEntityAction, EditEntityAction, {
        showAddForm: function(entity) {
            var dataSource = this.get("dataSource");
            EditEntityAction.showEditForm(entity, function(newVal) {
                dataSource.cache.post(newVal, null, {
                    success: function(e) {
                        EditEntityAction.hideEditFormOverlay();
                        EditEntityAction.hideRightTabs();                       // Hide all right tabs
                        //EditEntityAction.showUpdateForm(e.response.entity, dataSource);
                        //EditEntityAction.showFormMessage("success", "Item has been added");
                    },
                    failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                });
            }, null, this.get("formCfg"));
        },
        execute: function() {
            Wegas.Editable.useAndRevive({
                "@class": this.get("targetClass")                               // Load target class dependencies
            }, Y.bind(function(entity) {
                this.showAddForm(entity);                                       // and display the edition form
            }, this));
        }
    }, {
        NS: "NewEntityAction",
        NAME: "NewEntityAction",
        ATTRS: {
            targetClass: {},
            dataSource: {
                getter: function(val) {
                    if (!val) {
                        return Wegas.Facade.VariableDescriptor;
                    }
                    if (Lang.isString(val)) {
                        return Wegas.Facade[val];
                    }
                    return val;
                }
            }
        }
    });
    Plugin.NewEntityAction = NewEntityAction;
    /**
     * @class
     * @name Y.Plugin.EditEntityArrayFieldAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    var EditEntityArrayFieldAction = function() {
        EditEntityArrayFieldAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EditEntityArrayFieldAction, EntityAction, {
        execute: function() {
            var entity = (this.get("method").toLowerCase() === "post") ? this.get(ENTITY) : this.get("parentEntity");

            if (entity instanceof Wegas.persistence.VariableDescriptor) {
                this.get("dataSource").cache.getWithView(entity, "EditorExtended", {// just need to check if it causes bugs
                    on: {
                        success: Y.bind(function(e) {
                            this.doExecute(e.response.entity);
                        }, this)
                    }
                });
            } else {
                this.doExecute(entity);
            }
        },
        doExecute: function(descriptor) {
            var entity = this.get(ENTITY),
                    dataSource = this.get("dataSource"),
                    newEntity, targetArray;

            switch (this.get("method").toString().toLowerCase()) {
                case "put":
                    var child = Y.Array.find(descriptor.get(this.get("attributeKey")), function(i) {
                        return i.get("id") === entity.get("id");
                    });

                    EditEntityAction.showEditForm(child, function(newVal) {
                        child.setAttrs(newVal);
                        dataSource.cache.put(descriptor.toObject(), {
                            success: function() {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.showFormMessage("success", "Item has been updated");
                            },
                            failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                        });
                    });
                    break;
                case "post":
                    newEntity = Wegas.Editable.revive({
                        "@class": this.get("targetClass")
                    });
                    EditEntityAction.showEditForm(newEntity, Y.bind(function(newVal) {
                        newEntity.setAttrs(newVal);
                        descriptor.get(this.get("attributeKey")).push(newEntity);
                        dataSource.cache.put(descriptor.toObject(), {
                            success: function() {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.showFormMessage("success", "Item has been added");
                                EditEntityAction.hideFormFields();
                            },
                            failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                        });
                    }, this));
                    break;
                case "delete":
                    if (confirm("Are your sure your want to delete this item ?")) {
                        targetArray = descriptor.get(this.get("attributeKey"));
                        Y.Array.find(targetArray, function(e, i, a) {
                            if (e.get("id") === entity.get("id")) {
                                a.splice(i, 1);
                                return true;
                            }
                            return false;
                        });
                        this.get("host").showOverlay();
                        dataSource.cache.put(descriptor.toObject());
                    } else {
                        return;
                    }
                    break;
            }
        }
    }, {
        NS: "editentitarrayfieldaction",
        NAME: "EditEntityArrayFieldAction",
        ATTRS: {
            /**
             * Can be put, post or delete
             */
            method: {
                value: "put"
            },
            parentEntity: {},
            targetClass: {},
            attributeKey: {}
        }
    });
    Plugin.EditEntityArrayFieldAction = EditEntityArrayFieldAction;
    /**
     * @class
     * @name Y.Plugin.AddEntityChildAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    var AddEntityChildAction = function() {
        AddEntityChildAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(AddEntityChildAction, NewEntityAction, {
        showAddForm: function(entity, parentData) {
            var dataSource = this.get("dataSource");

            EditEntityAction.showEditForm(entity, function(newVal) {
                //@Hack since the server return the parent list,
                // and we have no way to identify the newly created descriptor
                // we need to look for the one that was not there before
                var idBack = [];
                Y.Array.each(parentData.get("items"), function(e) {
                    idBack.push(e.get("id"));
                });
                dataSource.cache.post(newVal, parentData.toObject(), {
                    success: function(e) {
                        EditEntityAction.hideEditFormOverlay();

                        var newDescriptor = e.response.entity;
                        if (newDescriptor instanceof Wegas.persistence.VariableDescriptor
                                && newDescriptor.get("items")) {                // If the parent list of the edited item was returned,
                            newDescriptor = Y.Array.find(newDescriptor.get("items"), function(e) {// need to look up for the edited entity
                                return idBack.indexOf(e.get("id")) === -1;
                            });
                        }

                        EditEntityAction.showUpdateForm(newDescriptor, dataSource);
                        EditEntityAction.showFormMessage("success", "Item has been added");
                    },
                    failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                });
            }, null, this.get("formCfg"));
        },
        execute: function() {
            Wegas.Editable.useAndRevive({// Load target class dependencies
                "@class": this.get("targetClass")
            }, Y.bind(function(entity) {
                this.showAddForm(entity, this.get(ENTITY)); // and display the edition form
            }, this));
        }
    }, {
        NS: "wegas",
        NAME: "AddEntityChildAction",
        ATTRS: {
            targetClass: {}
        }
    });
    Plugin.AddEntityChildAction = AddEntityChildAction;
    /**
     * @class
     * @name Y.Plugin.DuplicateEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    var DuplicateEntityAction = function() {
        DuplicateEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(DuplicateEntityAction, EntityAction, {
        execute: function() {
            this.get("host").showOverlay();
            this.get("dataSource").cache.duplicateObject(this.get(ENTITY));
        }
    }, {
        NS: "DuplicateEntityAction",
        NAME: "DuplicateEntityAction"
    });
    Plugin.DuplicateEntityAction = DuplicateEntityAction;
    /**
     * @class
     * @name Y.Plugin.PublishEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    var PublishGameModelAction = function() {
        PublishGameModelAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(PublishGameModelAction, EntityAction, {
        execute: function() {
            if (confirm("Are your sure your want to publish this item ?")) {
                //this.get("dataSource").rest.publishObject(this.get("entity"));
            }
        }
    }, {
        NS: "PublishGameModelAction",
        NAME: "PublishGameModelAction"
    });
    Plugin.PublishGameModelAction = PublishGameModelAction;
    /**
     * @class
     * @name Y.Plugin.DeleteEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    var DeleteEntityAction = function() {
        DeleteEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(DeleteEntityAction, EntityAction, {
        execute: function() {
            var entity = this.get(ENTITY);
            if (confirm("Are your sure your want to delete this " + entity.getType().toLowerCase() + " ?")) {
                this.get("host").showOverlay();
                this.get("dataSource").cache.deleteObject(entity);
            }
        }
    }, {
        NS: "DeleteEntityAction",
        NAME: "DeleteEntityAction"
    });
    Plugin.DeleteEntityAction = DeleteEntityAction;
    // *** Buttons *** //
    /**
     * Shortcut to create a Button with an NewEntityAction plugin
     */
    Wegas.NewEntityButton = Y.Base.create("button", Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(NewEntityAction, cfg);
        }
    });
    /**
     * Shortcut to create a Button with an AddEntityChildAction plugin
     */
    Wegas.AddEntityChildButton = Y.Base.create("button", Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(AddEntityChildAction, cfg);
        }
    });
    /**
     * Shortcut to create a Button with an EditEntityAction plugin
     */
    Wegas.EditEntityButton = Y.Base.create("button", Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(EditEntityAction, cfg);
        },
        bindUI: function() {
            if (!this.get(LABEL)) {
                this.set(LABEL, "Edit"); // @fixme hack because the ATTR's value is not taken into account
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
    Wegas.AddEntityChildButton = Y.Base.create("button", Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(AddEntityChildAction, cfg);
        }
    });
    /**
     * Shortcut to create a Button with an DeleteEntityAction plugin
     */
    Wegas.DeleteEntityButton = Y.Base.create("button", Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(DeleteEntityAction, cfg);
        },
        bindUI: function() {
            if (!this.get(LABEL)) {
                this.set(LABEL, "<span class=\"wegas-icon wegas-icon-delete\"></span>Delete"); // @fixme hack because the ATTR's value is not taken into account
            }
        }
    }, {
        ATTRS: {
            label: {
                value: "<span class=\"wegas-icon wegas-icon-delete\"></span>Delete"
            }
        }
    });

    /**
     *  @name Y.Plugin.EditFSMAction
     *  @extends Y.Plugin.EntityAction
     *  @class Open a state machine viewer in the edition tab
     *  @constructor
     */
    EditFSMAction = function() {
        EditFSMAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EditFSMAction, Plugin.EntityAction, {
        /** @lends Y.Plugin.EditFSMAction# */

        /**
         * @private
         * @function
         */
        execute: function() {
            Wegas.TabView.findTabAndLoadWidget("State machine", // Load and display the editor in a new tab
                    "#centerTabView", {}, Y.mix(this.get("viewerCfg"), {
                type: "StateMachineViewer",
                plugins: [{
                        fn: "WidgetToolbar"
                    }]
            }), Y.bind(function(entity, widget, tab) {
                tab.set("selected", 2);
                widget.showOverlay();
                EditEntityAction.showEditFormOverlay();
                this.get("dataSource").cache.getWithView(entity, "EditorExtended", {// just need to check if it causes bugs
                    on: {
                        success: function(e) {
                            widget.set("entity", e.response.entity);
                            EditEntityAction.hideEditFormOverlay();
                        }
                    }
                });
            }, this, this.get("entity")));
        }
    }, {
        NS: "wegas",
        NAME: "EditFSMAction",
        ATTRS: {
            viewerCfg: {
                value: {}
            }
        }
    });
    Plugin.EditFSMAction = EditFSMAction;

});
