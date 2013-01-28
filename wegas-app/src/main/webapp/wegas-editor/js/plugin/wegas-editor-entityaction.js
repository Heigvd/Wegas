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
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor-entityaction', function (Y) {
    "use strict";
    var Action = Y.Plugin.Action, EntityAction;

    /**
     *  @class Y.Wegas.EntityAction
     *  @module Wegas
     *  @constructor
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
                        return Y.Wegas.GameModelFacade.rest.getCurrentGameModel();
                    }
                    return val;
                }
            },
            dataSource: {
                getter: function (val) {
                    if (Y.Lang.isString(val)) {
                        return Y.Wegas.app.dataSources[val];
                    }
                    return val;
                }
            }
        }
    });
    Y.namespace("Plugin").EntityAction = EntityAction;



    /**
     *  @class EditEntityAction
     *  @module Wegas
     *  @constructor
     */
    var EditEntityAction = function () {
        EditEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(EditEntityAction, EntityAction, {
        execute: function () {
            EditEntityAction.showUpdateForm(this.get("entity"), this.get("dataSource"));
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
                EditEntityAction.tab = Y.Wegas.TabView.createTab("Edit", '#rightTabView');
                //EditEntityAction.tab = Y.Wegas.TabView.createTab("Edit", '#centerTabView');
                EditEntityAction.form = new Y.Wegas.FormWidget();

                EditEntityAction.form.on("submit", function (e) {
                    this.form.showOverlay();
                    this.callback(e.value, this.currentEntity);
                }, EditEntityAction);

                EditEntityAction.form.on("cancel", function () {
                    EditEntityAction.tab.remove();
                    EditEntityAction.tab.destroy();
                    delete EditEntityAction.tab;

                //Y.Wegas.app.widget.hidePosition("right");                   // Hide the right layout
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
                dataSource.rest.put(cfg, {
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
                dataSource.rest.post(newVal, (parentData) ? parentData.toObject() : parentData, {
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

    Y.namespace("Plugin").EditEntityAction = EditEntityAction;

    /**
     *  @class NewEntityAction
     *  @module Wegas
     *  @constructor
     */
    var NewEntityAction = function () {
        NewEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(NewEntityAction, EntityAction, {
        execute: function () {
            Y.Wegas.Editable.useAndRevive({                                     // Load target class dependencies
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
                        return Y.Wegas.VariableDescriptorFacade;
                    }
                    if (Y.Lang.isString(val)) {
                        return Y.Wegas.app.dataSources[val];
                    }
                    return val;
                }
            }
        }
    });
    Y.namespace("Plugin").NewEntityAction = NewEntityAction;

    /**
     *  @class EditEntityArrayFieldAction
     *  @module Wegas
     *  @constructor
     */
    var EditEntityArrayFieldAction = function () {
        EditEntityArrayFieldAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(EditEntityArrayFieldAction, EntityAction, {
        execute: function () {
            var entity = this.get("entity"),
            dataSource = this.get("dataSource"),
            parentEntity = this.get("parentEntity"),
            newEntity, targetArray;

            switch (this.get("method")) {
                case "put":
                    EditEntityAction.showEditForm(entity, function (newVal) {

                        entity.setAttrs(newVal);

                        dataSource.rest.put(parentEntity.toObject(), {
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
                    newEntity = Y.Wegas.Editable.revive({
                        "@class": this.get("targetClass")
                    });
                    EditEntityAction.showEditForm(newEntity, Y.bind(function (newVal) {
                        newEntity.setAttrs(newVal);
                        entity.get(this.get("attributeKey")).push(newEntity);

                        dataSource.rest.put(entity.toObject(), {
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
                        dataSource.rest.put(parentEntity.toObject());
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

    Y.namespace("Plugin").EditEntityArrayFieldAction = EditEntityArrayFieldAction;

    /**
     *  @class AddEntityChildAction
     *  @module Wegas
     *  @constructor
     */
    var AddEntityChildAction = function () {
        AddEntityChildAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(AddEntityChildAction, EntityAction, {
        execute: function () {
            Y.Wegas.Editable.useAndRevive({                                     // Load target class dependencies
                "@class": this.get("targetClass")
            }, Y.bind(function (entity) {
                EditEntityAction.showAddForm(entity, this.get("entity"), this.get("dataSource")); // and display the edition form
            }, this));
        }
    }, {
        NS: "wegas",
        NAME: "AddEntityChildAction",
        ATTRS: {
            targetClass: {}
        }
    });
    Y.namespace("Plugin").AddEntityChildAction = AddEntityChildAction;

    /**
     *  @class DuplicateEntityAction
     *  @module Wegas
     *  @constructor
     */
    var DuplicateEntityAction = function () {
        DuplicateEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(DuplicateEntityAction, EntityAction, {
        execute: function () {
            this.get("dataSource").rest.duplicateObject(this.get("entity"));
        }
    }, {
        NS: "DuplicateEntityAction",
        NAME: "DuplicateEntityAction"
    });

    Y.namespace("Plugin").DuplicateEntityAction = DuplicateEntityAction;

    /**
     *  @class DeleteEntityAction
     *  @module Wegas
     *  @constructor
     */
    var DeleteEntityAction = function () {
        DeleteEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(DeleteEntityAction, EntityAction, {
        execute: function() {
            if (confirm("Are your sure your want to delete this item ?")) {
                this.get("dataSource").rest.deleteObject(this.get("entity"));
            }
        }
    }, {
        NS: "wegas",
        NAME: "DeleteEntityAction"
    });

    Y.namespace("Plugin").DeleteEntityAction = DeleteEntityAction;

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
     * Shortcut to create a Button with an AddEntityChildAction plugin
     */
    Y.Wegas.AddEntityChildButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(AddEntityChildAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an EditEntityAction plugin
     */
    Y.Wegas.EditEntityButton = Y.Base.create("button", Y.Wegas.Button, [], {

        initializer: function (cfg) {
            this.plug(EditEntityAction, cfg);
        },

        bindUI: function () {
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
        initializer: function (cfg) {
            this.plug(DeleteEntityAction, cfg);
        },
        bindUI: function () {
            if (!this.get("label")) {
                this.set("label", "Delete");                                    // @fixme hack because the ATTR's value is not taken into account
            }
        }
    }, {
        ATTRS: {
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