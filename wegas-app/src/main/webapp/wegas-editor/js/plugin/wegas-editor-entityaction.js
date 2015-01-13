/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-editor-entityaction", function(Y) {
    "use strict";

    var ENTITY = "entity", LABEL = "label", HOST = "host", CONTENTBOX = "contentBox",
        ID = "id", DATASOURCE = "dataSource", BUTTON = "button",
        Plugin = Y.Plugin, Lang = Y.Lang, Action = Plugin.Action,
        Wegas = Y.Wegas, persistence = Wegas.persistence,
        EntityAction, EditFSMAction, EditEntityAction, NewEntityAction,
        EditEntityArrayFieldAction, AddEntityChildAction, DuplicateEntityAction,
        DeleteEntityAction, DeleteFSMAction, ToolbarMenu;

    /**
     * @class
     * @name Y.Plugin.EntityAction
     * @extends Y.Plugin.Action
     * @constructor
     */
    EntityAction = Y.Base.create("EntityAction", Action, [], {}, {
        /** @lends Y.Wegas.EntityAction */
        NS: "entityaction",
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
    EditEntityAction = Y.Base.create("EditEntityAction", EntityAction, [], {
        /**
         * @function
         * @private
         */
        execute: function() {
            EditEntityAction.showUpdateForm(this.get(ENTITY), this.get(DATASOURCE));
        }
    }, {
        NS: "editentity",
        ATTRS: {
            formCfg: {}
        },
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
                                failure: Y.bind(EditEntityAction.hideEditFormOverlay, EditEntityAction)
                            }
                        });
                    }), menuItems = Y.Array.filter(entity.getMenuCfg({dataSource: dataSource}).slice(1), function(i) {
                        return (!i.label || (i.label.indexOf("New") < 0 && i.label.indexOf("Edit") < 0));
                    });                                                         // Retrieve menu and remove the first
                    // item

                    Y.Array.each(menuItems, function(i) {                       // @hack add icons to some buttons
                        switch (i.label) {
                            case "Delete":
                            case "New":
                            case "Add":
                            case "Copy":
                            case "View":
                            case "Open in editor":
                            case "Open":
                            case "Edit":
                                i.label = '<span class="wegas-icon wegas-icon-' +
                                    i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                        }
                    });
                    form.toolbar.add(menuItems);
                    form.toolbar.item(0) && form.toolbar.item(0).get(CONTENTBOX).setStyle("marginRight", "10px");
                };
            EditEntityAction.hideRightTabs();                                   // Hide all active tabs
            EditEntityAction.getEditionTab();                                   // Create the edition tab (and the left
            // panel won't pop in and out)

            if ((Wegas.persistence.VariableDescriptor &&
                (entity instanceof Wegas.persistence.VariableDescriptor         // Those classes may not be loaded
                    || entity instanceof Wegas.persistence.VariableInstance))
                || entity instanceof Wegas.persistence.JpaAccount
                || entity instanceof Wegas.persistence.GameModel
                || entity instanceof Wegas.persistence.Game) {                  // @fixme we may get extended mode for any entity, just need to check if it causes bugs
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

            if (!entity.get(ID) && !(entity instanceof Y.Widget)) {             // No id -> new entity
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
                this.hideOverlay();
                //callback(e.value, entity);
                //EditEntityAction.form.saveButton.set("disabled", true);
            });

            tab.detach("destroy");
            tab.on("destroy", function() {                                      // and destroy callback             
                if (cancelCallback) {
                    cancelCallback(EditEntityAction.currentEntity);
                }
                EditEntityAction.currentEntity = null;
                EditEntityAction.form = null;
                EditEntityAction.tab = null;
            });
            tab.form.detach("updated");
            tab.form.on("updated", function(e) {
                EditEntityAction.showFormMessage("success", "Changes not saved");
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
                var tab = Wegas.TabView.createTab("Edit", "#rightTabView", {}, 0), // Create a tab,
                    form = new Wegas.Form();                                    // and a form

                //tab.plug(Plugin.Removeable);                                  // make it closeable
                tab.add(form);

                tab.form = EditEntityAction.form = form;                        // Set up global references for
                // singleton pattern
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
            Y.all(".wegas-editing").removeClass("wegas-editing");               // @Hack for state machine edition tab
            Y.Widget.getByNode(".wegas-layout-right > .wegas-widget").unplug(Plugin.WidgetToolbar);
        },
        /**
         *
         * @param {type} level
         * @param {type} msg
         */
        showFormMessage: function(level, msg) {
            EditEntityAction.form.showMessage(level, msg);
        }
    });
    Plugin.EditEntityAction = EditEntityAction;
    /**
     * Search for an other action on the given entity given an index to execute it. 0 should match usual edit action
     * Used to have a button with a different name in some cases.
     * Avoid copying an entire configuration.
     * @class
     * @name Y.Plugin.DoAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    Plugin.DoAction = Y.Base.create("DoAction", EntityAction, [], {
        execute: function() {
            var menuCfg = this.get("entity").getMenuCfg(), tmpWidget;
            tmpWidget = Y.Wegas.Widget.create(menuCfg[this.get("index")]);
            tmpWidget.fire("click");
            tmpWidget.destroy();
        }
    }, {
        NS: "DoAction",
        ATTRS: {
            index: {
                value: 0 //usual edit action 's index
            }
        }
    });
    /**
     * @class
     * @name Y.Plugin.NewEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    NewEntityAction = Y.Base.create("NewEntityAction", EditEntityAction, [], {
        showAddForm: function(entity) {
            EditEntityAction.hideRightTabs();                                   // Hide all active tabs
            EditEntityAction.showEditForm(entity, Y.bind(function(newVal) {
                var dataSource = this.get(DATASOURCE);
                this.showOverlay();
                dataSource.cache.post(newVal, null, {
                    success: Y.bind(function(e) {
                        if (this.get("showEditionAfterRequest")) {
                            var button = Wegas.Widget.create(e.response.entity.getMenuCfg({dataSource: dataSource})[0]);
                            button.render().fire("click");
                            button.destroy();

                            //EditEntityAction.hideEditFormOverlay();
                            //EditEntityAction.showUpdateForm(e.response.entity, dataSource);
                            //EditEntityAction.showFormMessage("success", "Item created");
                            this.hideOverlay();
                        }
                    }, this),
                    failure: Y.bind(this.hideOverlay, this)
                });
            }, this), null, this.get("formCfg"));
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
        ATTRS: {
            targetClass: {},
            showEditionAfterRequest: {
                value: true
            },
            dataSource: {
                getter: function(val) {
                    if (!val) {
                        return Wegas.Facade.Variable;
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
    EditEntityArrayFieldAction = Y.Base.create("EditEntityArrayFieldAction", EntityAction, [], {
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
                dataSource = this.get(DATASOURCE),
                newEntity, targetArray, child, menuItems, form;

            switch (this.get("method").toString().toLowerCase()) {
                case "put":
                    child = Y.Array.find(descriptor.get(this.get("attributeKey")), function(i) {
                        return i.get(ID) === entity.get(ID);
                    });
                    menuItems = Y.Array.filter(child.getMenuCfg({dataSource: dataSource}).slice(1), function(i) {
                        return (!i.label || (i.label.indexOf("New") < 0 && i.label.indexOf("Edit") < 0));
                    });

                    EditEntityAction.hideRightTabs();                           // Hide all active tabs
                    form = EditEntityAction.showEditForm(child, function(newVal) {
                        child.setAttrs(newVal);
                        dataSource.cache.put(descriptor.toObject(), {
                            on: {
                                success: function() {
                                    EditEntityAction.hideEditFormOverlay();
                                    EditEntityAction.showFormMessage("success", "Item has been updated");
                                },
                                failure: Y.bind(EditEntityAction.hideEditFormOverlay, EditEntityAction)
                            }
                        });
                    });
                    form.toolbar.add(menuItems);
                    form.toolbar.item(0) && form.toolbar.item(0).get(CONTENTBOX).setStyle("marginRight", "10px");
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
                                success: Y.bind(function(e) {
                                    EditEntityAction.hideRightTabs();
                                    if (this.get("showEditionAfterRequest")) {
                                        var button = Wegas.Widget.create(e.response.entity.get(this.get("attributeKey")).slice(-1)[0].getMenuCfg({
                                            dataSource: dataSource,
                                            parentEntity: e.response.entity
                                        })[0]);
                                        button.fire("click");
                                        button.destroy();
                                    }

                                }, this),
                                failure: Y.bind(EditEntityAction.hideEditFormOverlay, EditEntityAction)
                            }
                        });
                    }, this));
                    break;
                case "delete":
                    Wegas.Panel.confirm("Are you sure you want to delete this item?", Y.bind(function() {
                        targetArray = descriptor.get(this.get("attributeKey"));
                        Y.Array.find(targetArray, function(e, i, a) {
                            if (e.get(ID) === entity.get(ID)) {
                                a.splice(i, 1);
                                return true;
                            }
                            return false;
                        });
                        this.showOverlay();

                        dataSource.cache.put(descriptor.toObject(), {
                            on: {
                                success: function() {
                                    EditEntityAction.hideRightTabs();
                                },
                                failure: Y.bind(this.hideOverlay, this)
                            }
                        });
                    }, this));
                    break;
                case "copy":
                    targetArray = descriptor.get(this.get("attributeKey"));
                    Y.Array.find(targetArray, function(e, i, a) {
                        if (e.get(ID) === entity.get(ID)) {
                            a.push(new entity.constructor(entity.toObject(ID)));
                            return true;
                        }
                        return false;
                    });
                    this.showOverlay();

                    dataSource.cache.put(descriptor.toObject(), {
                        on: {
                            success: EditEntityAction.hideRightTabs,
                            failure: Y.bind(this.hideOverlay, this)
                        }
                    });
                    break;
            }
        }
    }, {
        NS: "editentitarrayfieldaction",
        ATTRS: {
            /**
             * Can be put, post or delete
             */
            method: {
                value: "put"
            },
            showEditionAfterRequest: {},
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
    AddEntityChildAction = Y.Base.create("AddEntityChildAction", NewEntityAction, [], {
        showAddForm: function(entity, parentData) {
            EditEntityAction.hideRightTabs();                                   // Hide all active tabs
            EditEntityAction.showEditForm(entity, Y.bind(function(newVal) {
                //@Hack since the server return the parent list,
                // and we have no way to identify the newly created descriptor
                // we need to look for the one that was not there before
                var dataSource = this.get(DATASOURCE), idBack = [];
                Y.Array.each(parentData.get("items"), function(e) {
                    idBack.push(e.get(ID));
                });
                dataSource.cache.post(newVal, parentData, {
                    success: Y.bind(function(e) {
                        EditEntityAction.hideEditFormOverlay();

                        var entity = e.response.entity;
                        if (Wegas.persistence.VariableDescriptor                // If entity is loaded
                            && entity instanceof Wegas.persistence.VariableDescriptor
                            && entity.get("items")) {                           // If the parent list of the edited item was returned,
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
                    failure: Y.bind(this.hideOverlay, this)
                });
            }, this), null, this.get("formCfg"));
        },
        execute: function() {
            Wegas.Editable.useAndRevive({// Load target class dependencies
                "@class": this.get("targetClass")
            }, Y.bind(function(entity) {
                this.showAddForm(entity, this.get(ENTITY));                     // and display the edition form
            }, this));
        }
    }, {
        NS: "AddEntityChildAction",
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
    DuplicateEntityAction = Y.Base.create("DuplicateEntityAction", EntityAction, [], {
        execute: function() {
            this.showOverlay();
            this.get(DATASOURCE).cache.duplicateObject(this.get(ENTITY), {
                on: {
                    success: Y.bind(this.hideOverlay, this),
                    failure: Y.bind(this.hideOverlay, this)
                }
            });
        }
    }, {
        NS: "DuplicateEntityAction"
    });
    Plugin.DuplicateEntityAction = DuplicateEntityAction;

    /**
     * @class
     * @name Y.Plugin.DeleteEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    DeleteEntityAction = Y.Base.create("DeleteEntityAction", EntityAction, [], {
        execute: function() {
            var entity = this.get(ENTITY), i;

            Wegas.Panel.confirm("Are you sure you want to delete the "
                + entity.getType().toLowerCase().replace("descriptor", "") 
                + " \"" + entity.get("label") + "\" " 
                + "?",
                Y.bind(function() {
                    this.showOverlay();
                    this.confirmDelete = true;
                    this.get(DATASOURCE).cache.deleteObject(entity, {
                        on: {
                            success: Y.bind(function() {
                                this.hideOverlay();
                                if (EditEntityAction.currentEntity) {
                                    if (EditEntityAction.currentEntity.get(ID) === entity.get(ID)) {
                                        EditEntityAction.hideRightTabs();

                                    } else if (entity.get("@class") === "ListDescriptor") {
                                        for (i = 0; i < entity.get("items").length; i += 1) {
                                            if (EditEntityAction.currentEntity.get(ID) ===
                                                entity.get("items")[i].get(ID)) {
                                                EditEntityAction.hideRightTabs();
                                            }
                                        }
                                    } else if (entity.get("@class") === "FSMDescriptor") {
                                        if (EditEntityAction.currentEntity.get("@class") === "Transition" ||
                                            EditEntityAction.currentEntity.get("@class") === "State") {
                                            EditEntityAction.hideRightTabs();
                                        }
                                    }
                                }
                            }, this),
                            failure: Y.bind(this.hideOverlay, this)
                        }
                    });
                }, this));
        }
    }, {
        NS: "DeleteEntityAction"
    });
    Plugin.DeleteEntityAction = DeleteEntityAction;

    // *** Buttons *** //
    /**
     * Shortcut to create a Button with an NewEntityAction plugin
     */
    Wegas.NewEntityButton = Y.Base.create(BUTTON, Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(NewEntityAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an AddEntityChildAction plugin
     */
    Wegas.AddEntityChildButton = Y.Base.create(BUTTON, Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(AddEntityChildAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an EditEntityAction plugin
     */
    Wegas.EditEntityButton = Y.Base.create(BUTTON, Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(EditEntityAction, cfg);
        }
    }, {
        ATTRS: {
            label: {
                value: "Edit"
            }
        }
    });
    /**
     * Shortcut to create a Button with a DoAction plugin
     * Refresh by default
     */
    Wegas.RefreshEntityButton = Y.Base.create(BUTTON, Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(Plugin.DoAction, cfg);
        }
    }, {
        ATTRS: {
            label: {
                value: "<span class='wegas-icon wegas-icon-refresh'></span>Refresh"
            }
        }
    });
    /**
     * Shortcut to create a Button with an AddEntityChildAction plugin
     */
    Wegas.AddEntityChildButton = Y.Base.create(BUTTON, Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(AddEntityChildAction, cfg);
        }
    });

    /**
     * Shortcut to create a Button with an DeleteEntityAction plugin
     */
    Wegas.DeleteEntityButton = Y.Base.create(BUTTON, Wegas.Button, [], {
        initializer: function(cfg) {
            this.plug(DeleteEntityAction, cfg);
        }
    }, {
        ATTRS: {
            label: {
                value: "<span class=\"wegas-icon wegas-icon-delete\"></span>Delete"
            }
        }
    });

    /**
     * @class
     * @name Y.Plugin.DeleteSMAction
     * @extends Y.Plugin.DeleteEntityAction
     * @constructor
     */
    DeleteFSMAction = Y.Base.create("DeleteFSMAction", DeleteEntityAction, [], {
        execute: function() {
            var entity = this.get(ENTITY),
                tab = Wegas.TabView.findTab("State machine");
            if (this.get(HOST).DeleteEntityAction.confirmDelete
                && tab && tab.item(0).get(ENTITY).get(ID) === entity.get(ID)) {
                tab.remove().destroy();
            }
        }
    }, {
        NS: "DeleteSMAction"
    });
    Plugin.DeleteFSMAction = DeleteFSMAction;

    /**
     * Shortcut to create a Button with an DeleteEntityAction plugin
     */
    Wegas.DeleteFSMButton = Y.Base.create(BUTTON, Wegas.DeleteEntityButton, [], {
        initializer: function(cfg) {
            this.plug(DeleteFSMAction, cfg);
        }
    });

    /**
     *  @name Y.Plugin.EditFSMAction
     *  @extends Y.Plugin.EntityAction
     *  @class Open a state machine viewer in the edition tab
     *  @constructor
     */
    EditFSMAction = Y.Base.create("EditFSMAction", EntityAction, [], {
        /** @lends Y.Plugin.EditFSMAction# */
        /**
         * @private
         * @function
         */
        execute: function() {
            var tab = Wegas.TabView.findTabAndLoadWidget("State machine", // Load and display the editor in a new tab
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
                            widget.set(ENTITY, e.response.entity);
                            EditEntityAction.hideEditFormOverlay();
                            widget.hideOverlay();
                        },
                        failure: function(){
                            EditEntityAction.hideEditFormOverlay();
                            widget.hideOverlay();
                        }
                    }
                });
            }, this, this.get(ENTITY)));

            tab.plug(Plugin.Removeable, {
                closeCallback: function() {
                    var entity = EditEntityAction.currentEntity;
                    if (/*entity instanceof persistence.FSMDescriptor
                     ||*/ entity instanceof persistence.State
                        || entity instanceof persistence.Transition) {
                        EditEntityAction.hideRightTabs();
                    }
                }
            });                                                            // Removable tab
        }
    }, {
        NS: "wegas",
        ATTRS: {
            viewerCfg: {
                value: {}
            }
        }
    });
    Plugin.EditFSMAction = EditFSMAction;

    /**
     *
     */
    ToolbarMenu = Y.Base.create("wegas-editentitytoolbar", EntityAction, [], {
        execute: function() {
            Y.later(1, this, function() {
                EditEntityAction.currentEntity = this.get(ENTITY);              // @hack
            });

            var target = Y.Widget.getByNode(".wegas-layout-right > .wegas-widget"),
                menuItems = this.get("children"),
                entity = this.get(ENTITY),
                data = {
                    entity: entity,
                    dataSource: this.get(DATASOURCE)
                };

            if (menuItems) {                                                    // If there are menu items in the cfg
                Wegas.Editable.mixMenuCfg(menuItems, data);                     // use them
            } else {                                                            // Otherwise
                menuItems = entity.getMenuCfg(data).slice(1);                   // use entity default menu
            }

            Y.Array.each(menuItems, function(i) {                               // @hack Add icons to some buttons
                switch (i.label) {
                    case "Leave":
                    case "Delete":
                    case "New":
                    case "Copy":
                    case "Open":
                    case "Edit":
                        i.label = '<span class="wegas-icon wegas-icon-' + i.label.replace(/ /g, "-").toLowerCase() +
                            '"></span>' + i.label;
                }
            });
            target.unplug(Plugin.WidgetToolbar);                                // Plug & and unplug to empty menu
            target.plug(Plugin.WidgetToolbar);
            target.toolbar.add(menuItems);                                      // Add menu items to the form
            target.toolbar.add({
                type: BUTTON,
                label: "x",
                cssClass: "wegas-editor-closeposition",
                on: {
                    click: function() {
                        target.unplug(Plugin.Toolbar);
                        Y.Plugin.EditEntityAction.hideRightTabs();
                    }
                }
            });                                                                 // Add close button
            target.toolbar.get("header")
                .append(target.toolbar.get("header").one(".wegas-status-message"));// @hack move status node to the
            // very end of th enode
        }
    }, {
        NS: "toolbarmenu",
        ATTRS: {
            children: {}
        }
    });
    Plugin.ToolbarMenu = ToolbarMenu;

    /**
     *
     */
    Wegas.NewDescriptorButton = Y.Base.create(BUTTON, Wegas.Button, [], {
        /** @lends Y.Wegas.NewDescriptorButton# */
        /**
         * @function
         * @private
         */
        initializer: function() {
            this.plug(Plugin.WidgetMenu, {
                children: Y.Array.map(Wegas.persistence.ListDescriptor.EDITMENU[1].plugins[0].cfg.children,
                    function(o) {
                        return Y.mix({
                            type: "NewEntityButton"
                        }, o);
                    })
            });
        }
    });

    /**
     *  @name Y.Plugin.SendRequestAction
     *  @extends Y.Plugin.Action
     *  @class Open a game in the editor
     *  @constructor
     */
    Plugin.SendRequestAction = Y.Base.create("SendRequestAction", EditEntityAction, [], {
        /** @lends Y.Plugin.SendRequestAction# */
        /**
         * @function
         * @private
         */
        execute: function() {
            var entity = this.get(ENTITY),
                ds = this.get("ds") || this.get(DATASOURCE);

            this.showOverlay();

            ds.sendRequest({
                request: Lang.sub(this.get("request"), entity.toJSON()),
                cfg: this.get("cfg"),
                on: {
                    success: Y.bind(this.hideOverlay, this),
                    failure: Y.bind(this.hideOverlay, this)
                }
            });
        }
    }, {
        /** @lends Y.Plugin.SendRequestAction */
        NS: "SendRequestAction",
        ATTRS: {
            request: {
                value: ""
            },
            ds: {
                getter: function(val) {
                    if (Lang.isString(val)) {
                        return Wegas.Facade[val];
                    }
                    return val;
                }
            },
            cfg: {
                value: {}
            }
        }
    });
});
