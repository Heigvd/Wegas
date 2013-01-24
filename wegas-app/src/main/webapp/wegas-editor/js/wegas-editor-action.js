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

    Y.extend(EntityAction, Action, {}, {
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
                        return Y.Wegas[val];
                    }
                    return val;
                }
            }
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

    Y.extend(NewEntityAction, EntityAction, {
        execute: function () {
            Y.Wegas.Editable.useAndRevive({                                     // Load target class dependencies
                "@class": this.get("targetClass")
            }, Y.bind(function (entity) {
                EditEntityAction.showAddForm(entity, null,
                    Y.Wegas.app.dataSources[this.get("dataSource")]);           // and display the edition form
            }, this));
        }
    }, {
        NS: "wegas",
        NAME: "NewEntityAction",
        ATTRS: {
            targetClass: { },
            dataSource: {
                getter: function (value) {
                    if (!value) {
                        return "VariableDescriptor";
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

    /**
     *  @class EditFSMAction
     *  @module Wegas
     *  @constructor
     */
    var EditFSMAction = function () {
        EditFSMAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(EditFSMAction, EntityAction, {
        execute: function () {
            Y.Wegas.TabView.findTabAndLoadWidget("State machine editor",        // Load and display the editor in a new tab
                "#centerTabView", null, {
                    type: "StateMachineViewer",
                    plugins: [{
                        fn: "WidgetToolbar"
                    }]
                }, Y.bind(function (entity, widget) {
                    widget.set("entity", entity);
                }, this, this.get("entity")));
        }
    }, {
        NS: "wegas",
        NAME: "EditFSMAction"
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

    Y.extend(ResetAction, Action, {
        execute: function () {
            Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                request: '/Reset/'
            });
        }
    }, {
        NS: "wegas",
        NAME: "ResetAction"
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

    Y.extend(OpenTabAction, Action, {
        execute: function () {
            var childCfg = this.get("children");                                // Forward plugin data to the target widget
            childCfg.data = this.get("data");
            Y.Wegas.TabView.findTabAndLoadWidget(this.get("host").get("label"),
                this.get("tabSelector"), {}, childCfg);
        }
    }, {
        NS: "wegas",
        NAME: "OpenTabAction",
        ATTRS: {
            tabSelector: {
                value: '#centerTabView'
            },
            children: {}
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

    Y.extend(OpenGameAction, Y.Plugin.OpenUrlAction, {
        execute: function () {
            var params, entity = this.get("entity");

            if (entity instanceof Y.Wegas.persistence.GameModel) {
                params = "gameModelId=" + entity.get("id");
            } else if (entity instanceof Y.Wegas.persistence.Player) {
                params = "id=" + entity.get("id");
            } else {
                params = "gameId=" + entity.get("id");
            }
            this.set("url",  this.get("editorUrl") + params);
            OpenGameAction.superclass.execute.call(this);
        }
    }, {
        NS: "wegas",
        NAME: "OpenGameAction",
        ATTRS: {
            entity: {},
            editorUrl: {
                value: 'wegas-app/view/editor.html?'
            }
        }
    });

    Y.namespace("Plugin").OpenGameAction = OpenGameAction;

    /**
     *  @class LoadTreeviewNodeAction
     *  @module Wegas
     *  @constructor
     */
    var LoadTreeviewNodeAction = function () {
        LoadTreeviewNodeAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(LoadTreeviewNodeAction, Action, {

        tab: null,

        execute: function () {
            var entity = this.get("entity"),
            tabId = this.get("tabId") || this.get("host").get("label"),
            tabCfg = {
                label: entity.get("name") || "Unnamed"
            },
            tab = Y.Wegas.TabView.createTab(tabId, this.get("tabSelector"), tabCfg);

            tab.set("selected", 2);

            tab.witem(0).set("emptyMessage", "This game model has no games.");
            tab.witem(0).toolbar.get("children")[0].set("disabled", false);  // Allow game creation

            Y.Wegas.GameFacade.set("source",                                    // Change the source attribute on the datasource
                Y.Wegas.app.get("base") + "rest/GameModel/" + entity.get("id") + "/Game");

            Y.Wegas.GameFacade.sendRequest({
                request: "/"
            });
        }
    }, {
        NS: "wegas",
        NAME: "LoadTreeviewNodeAction",
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
     *  @deprecated
     *  @module Wegas
     *  @constructor
     */
    var CloneEntityAction = function () {
        CloneEntityAction.superclass.constructor.apply(this, arguments);
    };

    Y.extend(CloneEntityAction, EntityAction, {
        execute: function () {
            this._clone(this.get("entity"), this.get("entity").parentDescriptor);

        },
        _onSuccess: function (e) {
            Y.log("Clone successfull");
        },
        _clone: function (entity, parent) {
            if (parent && parent.toObject) {
                parent = parent.toObject();
            }
            Y.Wegas.VariableDescriptorFacade.rest.clone(entity.get("id"), parent, {
                success: Y.bind(this._onSuccess, this)
            });
        }
    }, {
        NS: "wegas",
        NAME: "CloneEntityAction",
        ATTRS: {
            childs: {}
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
    /**
     * Shortcut to create a Button with an CloneEntityAction plugin
     */
    Y.Wegas.CloneEntityButton = Y.Base.create("button", Y.Wegas.Button, [], {
        initializer: function (cfg) {
            this.plug(CloneEntityAction, cfg);
        },
        bindUI: function () {
            if (!this.get("label")) {
                this.set("label", "Duplicate");
            }
        }
    });
});


