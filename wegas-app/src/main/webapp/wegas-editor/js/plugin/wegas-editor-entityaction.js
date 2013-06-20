/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
            Plugin = Y.Plugin, Action = Y.Plugin.Action, Wegas = Y.Wegas, Lang = Y.Lang,
            EntityAction;
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
            if (entity instanceof Y.Wegas.persistence.VariableDescriptor
                    || entity instanceof Y.Wegas.persistence.JpaAccount) {      // @fixme we may get extended mode for every entities,
                this.get("dataSource").cache.getWithView(entity, "EditorExtended", {// just need to check if it causes bugs
                    on: {
                        success: function(e) {
                            EditEntityAction.showUpdateForm(e.response.entity, e.callback.ds);
                        },
                        ds: this.get("dataSource")
                    }
                });
            } else {
                EditEntityAction.showUpdateForm(this.get(ENTITY), this.get("dataSource"));
            }
        }
    }, {
        NS: "editentity",
        NAME: "EditEntityAction",
        STATUS: {
            "NEW": 1,
            "EDITING": 2
        },
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
            if (!EditEntityAction.tab) {                                        // First make sure the edit tab exists
                EditEntityAction.tab = Wegas.TabView.createTab("Edit", '#rightTabView');
                //EditEntityAction.tab = Wegas.TabView.createTab("Edit", '#centerTabView');
                EditEntityAction.form = new Wegas.Form();
                this.status = EditEntityAction.STATUS.NEW;
                EditEntityAction.form.on("submit", function(e) {
                    this.form.showOverlay();
                    this.callback(e.value, this.currentEntity);
                }, EditEntityAction);
                EditEntityAction.form.on("cancel", function() {
                    this.tab.remove();
                    this.tab.destroy();
                    delete this.tab;
                    if (this.cancelCallback instanceof Function) {
                        this.cancelCallback(this.currentEntity);
                        delete this.cancelCallback;
                    }
                    //Wegas.app.widget.hidePosition("right");                   // Hide the right layout
                }, EditEntityAction);
                EditEntityAction.form.before("updated", function(e) {
                    switch (this.status) {
                        case EditEntityAction.STATUS.NEW:
                            this.form.emptyMessage();
                            this.status = EditEntityAction.STATUS.EDITING;
                            break;
                        case EditEntityAction.STATUS.EDITING:
                            this.form.setStatusMessage("*");
                            break;
                        default:
                            this.form.emptyMessage();
                    }
                }, this);
                EditEntityAction.tab.add(EditEntityAction.form);
            }

            EditEntityAction.tab.set("selected", 2);
            EditEntityAction.form.set("values", entity.toObject());
            EditEntityAction.form.set("cfg", (formCfg) ? formCfg : entity.getFormCfg());
            this.status = EditEntityAction.STATUS.NEW;
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
        /**
         *
         */
        showFormMessage: function(level, msg, timeout) {
            EditEntityAction.form.showMessage(level, msg);
        },
        /**
         *
         */
        showUpdateForm: function(entity, dataSource) {
            var dataSource = dataSource;
            EditEntityAction.showEditForm(entity, function(cfg) {           // Display the edit form
                // entity.setAttrs(cfg);
                dataSource.cache.put(cfg, {
                    success: function() {
                        EditEntityAction.showFormMessage("success", "Item has been updated");
                        EditEntityAction.hideEditFormOverlay();
                    },
                    failure: function(e) {
                        EditEntityAction.hideEditFormOverlay();
                        EditEntityAction.form.defaultFailureHandler(e);
                    }
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
        showAddForm: function(entity, parentData) {
            var dataSource = this.get("dataSource");
            EditEntityAction.showEditForm(entity, function(newVal) {
                dataSource.cache.post(newVal, (parentData) ? parentData.toObject() : parentData, {
                    success: function(e) {
                        EditEntityAction.hideEditFormOverlay();
                        EditEntityAction.showUpdateForm(e.response.entity, dataSource);
                        EditEntityAction.showFormMessage("success", "Item has been added");
                    },
                    failure: function(e) {
                        EditEntityAction.hideEditFormOverlay();
                        EditEntityAction.form.defaultFailureHandler(e);
                    }
                });
            }, null, this.get("formCfg"));
        },
        execute: function() {
            Wegas.Editable.useAndRevive({// Load target class dependencies
                "@class": this.get("targetClass")
            }, Y.bind(function(entity) {
                this.showAddForm(entity, null); // and display the edition form
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
            var entity = this.get(ENTITY),
                    dataSource = this.get("dataSource"),
                    parentEntity = this.get("parentEntity"),
                    newEntity, targetArray;
            switch (this.get("method").toString().toLowerCase()) {
                case "put":
                    EditEntityAction.showEditForm(entity, function(newVal) {

                        entity.setAttrs(newVal);
                        dataSource.cache.put(parentEntity.toObject(), {
                            success: function() {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.showFormMessage("success", "Item has been updated");
                            },
                            failure: function(e) {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.form.defaultFailureHandler(e);
                            }
                        });
                    });
                    break;
                case "post":
                    newEntity = Wegas.Editable.revive({
                        "@class": this.get("targetClass")
                    });
                    EditEntityAction.showEditForm(newEntity, Y.bind(function(newVal) {
                        newEntity.setAttrs(newVal);
                        entity.get(this.get("attributeKey")).push(newEntity);
                        dataSource.cache.put(entity.toObject(), {
                            success: function() {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.showFormMessage("success", "Item has been added");
                                EditEntityAction.hideFormFields();
                            },
                            failure: function(e) {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.form.defaultFailureHandler(e);
                            }
                        });
                    }, this));
                    break;
                case "delete":
                    if (confirm("Are your sure your want to delete this item ?")) {
                        targetArray = parentEntity.get(this.get("attributeKey"));
                        Y.Array.find(targetArray, function(e, i, a) {
                            if (e.get("id") === entity.get("id")) {
                                a.splice(i, 1);
                                return true;
                            }
                            return false;
                        });
                        this.get("host").showOverlay();
                        dataSource.cache.put(parentEntity.toObject());
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
            if (confirm("Are your sure your want to delete this item ?")) {
                this.get("host").showOverlay();
                this.get("dataSource").cache.deleteObject(this.get(ENTITY));
            }
        }
    }, {
        NS: "wegas",
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
                this.set(LABEL, "Delete"); // @fixme hack because the ATTR's value is not taken into account
            }
        }
    }, {
        ATTRS: {
            label: {
                value: "Delete"
            }
        }
    });
});
