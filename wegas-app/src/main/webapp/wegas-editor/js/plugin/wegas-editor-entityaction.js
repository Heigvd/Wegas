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
YUI.add('wegas-editor-entityaction', function (Y) {
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
    EntityAction = function () {
        EntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EntityAction, Action, {}, {
        /** @lends Y.Wegas.EntityAction */
        NS: "entityaction",
        NAME: "EntityAction",
        ATTRS: {
            entity: {
                getter: function (val) {
                    if (val === "currentGameModel") {
                        return Wegas.GameModelFacade.cache.getCurrentGameModel();
                    }
                    return val;
                }
            },
            dataSource: {
                getter: function (val) {
                    if (Lang.isString(val)) {
                        return Wegas.app.dataSources[val];
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
    var EditEntityAction = function () {
        EditEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EditEntityAction, EntityAction, {

        /**
         * @function
         * @private
         */
        execute: function () {
            EditEntityAction.showUpdateForm(this.get(ENTITY), this.get("dataSource"));
        }
    }, {
        NS: "editentity",
        NAME: "EditEntityAction",
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
        showEditForm: function (entity, callback) {
            EditEntityAction.callback = callback;
            EditEntityAction.currentEntity = entity;

            if (!EditEntityAction.tab) {                                      // First make sure the edit tab exists
                EditEntityAction.tab = Wegas.TabView.createTab("Edit", '#rightTabView');
                //EditEntityAction.tab = Wegas.TabView.createTab("Edit", '#centerTabView');
                EditEntityAction.form = new Wegas.Form();

                EditEntityAction.form.on("submit", function (e) {
                    this.form.showOverlay();
                    this.callback(e.value, this.currentEntity);
                }, EditEntityAction);

                EditEntityAction.form.on("cancel", function () {
                    EditEntityAction.tab.remove();
                    EditEntityAction.tab.destroy();
                    delete EditEntityAction.tab;

                //Wegas.app.widget.hidePosition("right");                   // Hide the right layout
                });
                EditEntityAction.tab.add(EditEntityAction.form);
            }

            EditEntityAction.tab.set("selected", 2);
            EditEntityAction.form.emptyMessage();
            EditEntityAction.form.set("values",  entity.toObject());
            EditEntityAction.form.set("cfg", entity.getFormCfg());
        },

        /**
         *
         */
        hideFormFields: function () {
            EditEntityAction.form.destroyForm();
        },

        /**
         *
         */
        showEditFormOverlay: function () {
            EditEntityAction.form.showOverlay();
        },

        /**
         *
         */
        hideEditFormOverlay: function () {
            EditEntityAction.form.hideOverlay();
        },

        /**
         *
         */
        showFormMessage: function (level, msg, timeout) {
            EditEntityAction.form.showMessage(level, msg);
        },

        /**
         *
         */
        showUpdateForm: function (entity, dataSource) {
            EditEntityAction.showEditForm(entity, function (cfg) {           // Display the edit form
                // entity.setAttrs(cfg);
                dataSource.cache.put(cfg, {
                    success: function () {
                        EditEntityAction.showFormMessage("success", "Item has been updated");
                        EditEntityAction.hideEditFormOverlay();
                    },
                    failure: function (e) {
                        EditEntityAction.showFormMessage("error", e.response.message || "Error while update item");
                        EditEntityAction.hideEditFormOverlay();
                    }
                });
            });
        },

        showAddForm: function (entity, parentData, dataSource) {
            EditEntityAction.showEditForm(entity, function (newVal) {
                dataSource.cache.post(newVal, (parentData) ? parentData.toObject() : parentData, {
                    success: function (e) {
                        EditEntityAction.hideEditFormOverlay();
                        EditEntityAction.showUpdateForm(e.response.entity, dataSource);
                        EditEntityAction.showFormMessage("success", "Item has been added");
                    },
                    failure: function (e) {
                        EditEntityAction.hideEditFormOverlay();
                        EditEntityAction.showFormMessage("error", e.response.results.message || "Error while adding item");
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
    var NewEntityAction = function () {
        NewEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(NewEntityAction, EntityAction, {
        execute: function () {
            Wegas.Editable.useAndRevive({                                     // Load target class dependencies
                "@class": this.get("targetClass")
            }, Y.bind(function (entity) {
                EditEntityAction.showAddForm(entity, null,this.get("dataSource"));           // and display the edition form
            }, this));
        }
    }, {
        NS: "NewEntityAction",
        NAME: "NewEntityAction",
        ATTRS: {
            targetClass: { },
            dataSource: {
                getter: function (val) {
                    if (!val) {
                        return Wegas.VariableDescriptorFacade;
                    }
                    if (Lang.isString(val)) {
                        return Wegas.app.dataSources[val];
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
    var EditEntityArrayFieldAction = function () {
        EditEntityArrayFieldAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(EditEntityArrayFieldAction, EntityAction, {
        execute: function () {
            var entity = this.get(ENTITY),
            dataSource = this.get("dataSource"),
            parentEntity = this.get("parentEntity"),
            newEntity, targetArray;

            switch (this.get("method")) {
                case "put":
                    EditEntityAction.showEditForm(entity, function (newVal) {

                        entity.setAttrs(newVal);

                        dataSource.cache.put(parentEntity.toObject(), {
                            success: function () {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.showFormMessage("success", "Item has been updated");
                            },
                            failure: function (e) {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.showFormMessage("error", e.response.message || "Error while update item");
                            }
                        });
                    });
                    break;

                case "post":
                    newEntity = Wegas.Editable.revive({
                        "@class": this.get("targetClass")
                    });
                    EditEntityAction.showEditForm(newEntity, Y.bind(function (newVal) {
                        newEntity.setAttrs(newVal);
                        entity.get(this.get("attributeKey")).push(newEntity);

                        dataSource.cache.put(entity.toObject(), {
                            success: function () {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.showFormMessage("success", "Item has been added");
                                EditEntityAction.hideFormFields();
                            },
                            failure: function (e) {
                                EditEntityAction.hideEditFormOverlay();
                                EditEntityAction.showFormMessage("error", e.response.message || "Error while update item");
                            }
                        });
                    }, this));
                    break;

                case "delete":
                    if (confirm("Are your sure your want to delete this item ?")) {
                        targetArray = parentEntity.get(this.get("attributeKey"));
                        Y.Array.find(targetArray, function (e, i, a) {
                            if (e.get("id") === entity.get("id")) {
                                a.splice(i, 1);
                                return true;
                            }
                            return false;
                        });
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
            parentEntity: { },
            targetClass: { },
            attributeKey: { }
        }
    });
    Plugin.EditEntityArrayFieldAction = EditEntityArrayFieldAction;

    /**
     * @class
     * @name Y.Plugin.AddEntityChildAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    var AddEntityChildAction = function () {
        AddEntityChildAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(AddEntityChildAction, EntityAction, {
        execute: function () {
            Wegas.Editable.useAndRevive({                                     // Load target class dependencies
                "@class": this.get("targetClass")
            }, Y.bind(function (entity) {
                EditEntityAction.showAddForm(entity, this.get(ENTITY), this.get("dataSource")); // and display the edition form
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
    var DuplicateEntityAction = function () {
        DuplicateEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(DuplicateEntityAction, EntityAction, {
        execute: function () {
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
    var PublishGameModelAction = function () {
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
    var DeleteEntityAction = function () {
        DeleteEntityAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(DeleteEntityAction, EntityAction, {
        execute: function() {
            if (confirm("Are your sure your want to delete this item ?")) {
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
        initializer: function (cfg) {
            this.plug(NewEntityAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an AddEntityChildAction plugin
     */
    Wegas.AddEntityChildButton = Y.Base.create("button", Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(AddEntityChildAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an EditEntityAction plugin
     */
    Wegas.EditEntityButton = Y.Base.create("button", Wegas.Button, [], {

        initializer: function (cfg) {
            this.plug(EditEntityAction, cfg);
        },

        bindUI: function () {
            if (!this.get(LABEL)) {
                this.set(LABEL, "Edit");                                     // @fixme hack because the ATTR's value is not taken into account
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
        initializer: function (cfg) {
            this.plug(AddEntityChildAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an DeleteEntityAction plugin
     */
    Wegas.DeleteEntityButton = Y.Base.create("button", Wegas.Button, [], {

        initializer: function (cfg) {
            this.plug(DeleteEntityAction, cfg);
        },

        bindUI: function () {
            if (!this.get(LABEL)) {
                this.set(LABEL, "Delete");                                    // @fixme hack because the ATTR's value is not taken into account
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
