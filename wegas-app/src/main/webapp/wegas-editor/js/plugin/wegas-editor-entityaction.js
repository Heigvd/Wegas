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
    var ENTITY = "entity", LABEL = "label", HOST = "host", CONTENTBOX = "contentBox",
            ID = "id", DATASOURCE = "dataSource",
            Plugin = Y.Plugin, Lang = Y.Lang, Action = Plugin.Action, Wegas = Y.Wegas,
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
            EditEntityAction.showUpdateForm(this.get(ENTITY), this.get(DATASOURCE));
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
         *
         * @param {type} entity
         * @@param {Y.DataSource} dataSource
         * @returns {undefined}
         */
        showUpdateForm: function(entity, dataSource) {
            var dataSource = dataSource,
                    doShow = function(entity, dataSource) {
                        var form = EditEntityAction.showEditForm(entity, function(data) { // Display the edit form
                            // entity.setAttrs(cfg);
                            dataSource.cache.put(data, {
                                on: {
                                    success: function() {
                                        EditEntityAction.showFormMessage("success", "Item updated");
                                        EditEntityAction.hideEditFormOverlay();
                                    },
                                    failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                                }
                            });
                        }), menuItems = Y.Array.filter(entity.getMenuCfg({dataSource: dataSource}).slice(1), function(i) {
                            return (!i.label || (i.label.indexOf("New") < 0 && i.label.indexOf("Edit") < 0));
                        });                                                             // Retrieve menu and remove the first item

                        Y.Array.each(menuItems, function(i) {                           // @hack add icons to some buttons
                            switch (i.label) {
                                case "Delete":
                                case "New":
                                case "Add":
                                case "Copy":
                                case "View":
                                case "Open in editor":
                                case "Open":
                                case "Edit":
                                    i.label = '<span class="wegas-icon wegas-icon-' + i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                            }
                        });
                        form.toolbar.add(menuItems).item(0).get(CONTENTBOX).setStyle("marginLeft", "15px");
                    };
            EditEntityAction.hideRightTabs();                                   // Hide all active tabs
            EditEntityAction.getEditionTab();                                   // Create the edition tab (and the left panel won't pop in and out)

            if ((Wegas.persistence.VariableDescriptor &&
                    (entity instanceof Wegas.persistence.VariableDescriptor     // Those classes may not be loaded
                            || entity instanceof Wegas.persistence.VariableInstance))
                    || entity instanceof Wegas.persistence.JpaAccount
                    || entity instanceof Wegas.persistence.GameModel
                    || entity instanceof Wegas.persistence.Game) {              // @fixme we may get extended mode for any entity, just need to check if it causes bugs
                EditEntityAction.showEditFormOverlay();
                dataSource.cache.getWithView(entity, "EditorExtended", {
                    on: {
                        success: function(e) {
                            EditEntityAction.hideEditFormOverlay();
                            doShow(e.response.entity, e.callback.ds);
                        },
                        ds: dataSource
                    }
                });
            } else {
                doShow(entity, dataSource);
            }
        },
        /**
         * Show edition form in the target div
         *
         * @param {type} entity
         * @param {type} callback
         * @param {type} cancelCallback
         * @param {type} formCfg
         * @returns {@exp;tab@pro;form}
         */
        showEditForm: function(entity, callback, cancelCallback, formCfg) {
            EditEntityAction.currentEntity = entity;

            var tab = EditEntityAction.getEditionTab(),
                    name = entity.getType().replace("Descriptor", "").replace("Instance", "");

            if (!entity.get(ID) && !(entity instanceof Y.Widget)) {           // No id -> new entity
                name = "New " + name.toLowerCase();
            }
            tab.setAttrs({
                label: name,
                selected: 2
            });                                                                 // Update tab attrs
            tab.form.setAttrs({
                values: entity.toObject(),
                cfg: formCfg || entity.getFormCfg()
            });                                                                 // Update form attrs
            tab.form.toolbar.setStatusMessage("");

            tab.form.detach("submit");
            tab.form.on("submit", function(e) {                                 // Attach submit callback
                this.showOverlay();
                callback(e.value, EditEntityAction.currentEntity);
                //callback(e.value, entity);
                //EditEntityAction.form.saveButton.set("disabled", true);
            });

            tab.form.detach("destroy");
            tab.on("destroy", function() {                                      // and destroy callback
                EditEntityAction.currentEntity = null;
                if (cancelCallback) {
                    cancelCallback(entity);
                }
            });

            //tab.form.detach("cancel");
            //tab.form.on("cancel", function() {
            //    this.remove();
            //    this.destroy();
            //}, tab);
            //Y.fire("rightTabShown");

            return tab.form;
        },
        getEditionTab: function() {
            if (!EditEntityAction.tab || EditEntityAction.tab.get("destroyed")) {// First make sure the edit tab does not exist
                var tab = Wegas.TabView.createTab("Edit", '#rightTabView', {}, 0), // Create a tab,
                        form = new Wegas.Form();                                // and a form

                tab.plug(Plugin.Removeable);                                    // make it closeable
                tab.add(form);

                tab.form = EditEntityAction.form = form;                        // Set up global references for singleton pattern
                EditEntityAction.tab = tab;
                //form.before("updated", function(e) {
                //    EditEntityAction.form.toolbar.setStatusMessage("*");
                //    EditEntityAction.form.saveButton.set("disabled", false);
                //});
            }
            return EditEntityAction.tab;
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
        hideRightTabs: function() {
            Y.Widget.getByNode("#rightTabView").destroyAll();
        },
        /**
         *
         * @param {type} level
         * @param {type} msg
         */
        showFormMessage: function(level, msg) {
            EditEntityAction.form.showMessageBis(level, msg);
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
            var dataSource = this.get(DATASOURCE);
            EditEntityAction.hideRightTabs();                                   // Hide all active tabs
            EditEntityAction.showEditForm(entity, function(newVal) {
                dataSource.cache.post(newVal, null, {
                    success: function(e) {
                        //EditEntityAction.hideEditFormOverlay();
                        //EditEntityAction.showUpdateForm(e.response.entity, dataSource);
                        //EditEntityAction.showFormMessage("success", "Item created");

                        var button = Wegas.Widget.create(e.response.entity.getMenuCfg({dataSource: dataSource})[0]);
                        button.render().fire("click");
                        button.destroy();
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
                this.get(DATASOURCE).cache.getWithView(entity, "EditorExtended", {// just need to check if it causes bugs
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
                    host = this.get(HOST),
                    dataSource = this.get(DATASOURCE),
                    newEntity, targetArray;

            switch (this.get("method").toString().toLowerCase()) {
                case "put":
                    var child = Y.Array.find(descriptor.get(this.get("attributeKey")), function(i) {
                        return i.get(ID) === entity.get(ID);
                    });

                    EditEntityAction.hideRightTabs();                           // Hide all active tabs
                    EditEntityAction.showEditForm(child, function(newVal) {
                        child.setAttrs(newVal);
                        dataSource.cache.put(descriptor.toObject(), {
                            on: {
                                success: function() {
                                    EditEntityAction.hideEditFormOverlay();
                                    EditEntityAction.showFormMessage("success", "Item has been updated");
                                },
                                failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                            }
                        });
                    });
                    break;
                case "post":
                    newEntity = Wegas.Editable.revive({
                        "@class": this.get("targetClass")
                    });
                    EditEntityAction.hideRightTabs();                           // Hide all active tabs
                    EditEntityAction.showEditForm(newEntity, Y.bind(function(newVal) {
                        newEntity.setAttrs(newVal);
                        descriptor.get(this.get("attributeKey")).push(newEntity);
                        dataSource.cache.put(descriptor.toObject(), {
                            on: {
                                success: function() {
                                    EditEntityAction.hideRightTabs();
                                    //EditEntityAction.hideEditFormOverlay();
                                    //EditEntityAction.showFormMessage("success", "Item has been added");
                                    //EditEntityAction.hideFormFields();
                                },
                                failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                            }
                        });
                    }, this));
                    break;
                case "delete":
                    if (confirm("Are your sure your want to delete this item ?")) {
                        targetArray = descriptor.get(this.get("attributeKey"));
                        Y.Array.find(targetArray, function(e, i, a) {
                            if (e.get(ID) === entity.get(ID)) {
                                a.splice(i, 1);
                                return true;
                            }
                            return false;
                        });
                        host.showOverlay();

                        dataSource.cache.put(descriptor.toObject(), {
                            on: {
                                success: function() {
                                    EditEntityAction.hideRightTabs();
                                },
                                failure: Y.bind(host.defaultFailureHandler, host)
                            }
                        });
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
            var dataSource = this.get(DATASOURCE);
            EditEntityAction.hideRightTabs();                                   // Hide all active tabs
            EditEntityAction.showEditForm(entity, function(newVal) {
                //@Hack since the server return the parent list,
                // and we have no way to identify the newly created descriptor
                // we need to look for the one that was not there before
                var idBack = [];
                Y.Array.each(parentData.get("items"), function(e) {
                    idBack.push(e.get(ID));
                });
                dataSource.cache.post(newVal, parentData, {
                    success: Y.bind(function(e) {
                        EditEntityAction.hideEditFormOverlay();

                        var entity = e.response.entity;
                        if (entity instanceof Wegas.persistence.VariableDescriptor
                                && entity.get("items")) {                       // If the parent list of the edited item was returned,
                            entity = Y.Array.find(entity.get("items"), function(e) {// need to look up for the edited entity
                                return Y.Array.indexOf(idBack, e.get(ID)) === -1;
                            });
                        }

                        var button = Wegas.Widget.create(entity.getMenuCfg({dataSource: dataSource})[0]);
                        button.render().fire("click");
                        button.destroy();
                        //EditEntityAction.showUpdateForm(newDescriptor, dataSource);
                        //EditEntityAction.showFormMessage("success", "Item has been added");
                    }, this),
                    failure: Y.bind(EditEntityAction.form.defaultFailureHandler, EditEntityAction.form)
                });
            }, null, this.get("formCfg"));
        },
        execute: function() {
            Wegas.Editable.useAndRevive({// Load target class dependencies
                "@class": this.get("targetClass")
            }, Y.bind(function(entity) {
                this.showAddForm(entity, this.get(ENTITY));                     // and display the edition form
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
            var host = this.get(HOST);
            host.showOverlay();
            this.get(DATASOURCE).cache.duplicateObject(this.get(ENTITY), {
                on: {
                    success: Y.bind(host.hideOverlay, host),
                    failure: Y.bind(host.defaultFailureHandler, host)
                }});
        }
    }, {
        NS: "DuplicateEntityAction",
        NAME: "DuplicateEntityAction"
    });
    Plugin.DuplicateEntityAction = DuplicateEntityAction;
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
            var entity = this.get(ENTITY),
                    host = this.get(HOST);
            if (confirm("Are your sure your want to delete this " + entity.getType().toLowerCase() + " ?")) {
                host.showOverlay();
                this.get(DATASOURCE).cache.deleteObject(entity, {
                    on: {
                        success: function() {
                            //host.hideOverlay();
                            EditEntityAction.hideRightTabs();
                        },
                        failure: Y.bind(host.defaultFailureHandler, host)
                    }
                });
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
                this.set(LABEL, "Edit");                                        // @FIXME hack because the ATTR's value is not taken into account
            }
        }
    }, {
        ATTRS: {
            label: {
                value: "Edit"
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
                this.get(DATASOURCE).cache.getWithView(entity, "EditorExtended", {// just need to check if it causes bugs
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
