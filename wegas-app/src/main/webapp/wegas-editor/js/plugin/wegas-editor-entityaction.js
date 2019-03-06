
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
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
        Promise = Y.Promise,
        Wegas = Y.Wegas, persistence = Wegas.persistence,
        EntityAction, EditFSMAction, EditEntityAction, NewEntityAction,
        EditEntityArrayFieldAction, AddEntityChildAction, DuplicateEntityAction,
        SortEntityAction, ResetVisibilityAction,
        DeleteEntityAction, SearchEntityAction, ToolbarMenu;

    var MESSAGE_DISCARD_EDITS = "Unsaved changes!";

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
            var entity = this.get(ENTITY);
            if (!entity) {
                return;
            }
            EditEntityAction.allowDiscardingEdits(Y.bind(function() {
                EditEntityAction.discardEdits();
                EditEntityAction.showUpdateForm(entity, this.get(DATASOURCE));
            }, this));
            Wegas.TabView.restoreColumn(Wegas.TabView.getCurrentEditorTabViewId());
        }
    }, {
        NS: "editentity",
        ATTRS: {
            formCfg: {}
        },
        /**
         * Transform labeled menu items into an icon button.
         * HACK ?!?!
         *
         * @param {Array<{}>} menuItems list of actions
         * @param {{}} entity entity associated with the action
         */
        processMenu: function(menuItems, entity) {
            Y.Array.each(menuItems, function(i) {                      // @hack add icons to some buttons
                var allowedChildren;
                if (!i.label) {                                        // @Overhack to centralize more icon definitions here
                    switch (i.type) {
                        case "DeleteEntityButton":
                            i = EditEntityAction.stackedIcon(i, 'fa-trash');
                            i.tooltip = 'Delete';
                            break;
                    }
                } else {
                    switch (i.label) {
                        case "New":
                        case "View":
                        case "Open in editor":
                        case "Open":
                        case "Edit":
                            i.label = '<span class="wegas-icon wegas-icon-' +
                                i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                            break;
                        case "Add":
                            allowedChildren = entity.get("allowedTypes");
                            // is children type restricted ?
                            if (allowedChildren && allowedChildren.length > 0) {
                                Y.Array.each(i.plugins[0].cfg.children, function(child) {
                                    if (allowedChildren && allowedChildren.length > 0 && !Y.Array.find(allowedChildren, function(allowedType) {
                                        return child.targetClass === allowedType;
                                    })) {
                                        child.cssClass = "wegas-forbidden-feature";
                                    }
                                }, this);
                            }
                            i = EditEntityAction.stackedIcon(i, 'fa-plus-circle');
                            i.tooltip = 'Add element';
                            break;
                        case "Delete":
                            i = EditEntityAction.stackedIcon(i, 'fa-trash');
                            i.tooltip = 'Delete';
                            break;
                        case "Sort":
                            i = EditEntityAction.stackedIcon(i, 'fa-sort-alpha-asc');
                            i.tooltip = 'Sort contents alphabetically';
                            break;
                        case "Duplicate":
                            i = EditEntityAction.stackedIcon(i, 'fa-files-o');
                            i.tooltip = 'Duplicate';
                            break;
                        case "Export":
                            i = EditEntityAction.stackedIcon(i, 'fa-download');
                            i.tooltip = 'Export';
                            break;
                        case "Search for usages":
                            i = EditEntityAction.stackedIcon(i, 'fa-compass');
                            i.tooltip = 'Find usage';
                            break;
                        case "Reset visibilities":
                            i = EditEntityAction.stackedIcon(i, 'fa-paw');
                            i.tooltip = 'Reset visibilities recursively';
                            break;
                    }
                }
            });
        },
        /**
         *
         * @param {type} entity
         * @@param {Y.DataSource} dataSource
         * @returns {undefined}
         */
        showUpdateForm: function(entity, dataSource) {
            return new Promise(function(resolve) {
                var doShow = function(entity, dataSource) {
                    //EditEntityAction.destroyEditionTab();
                    var form = EditEntityAction.showEditForm(entity, function(data) { // Display the edit form
                        // entity.setAttrs(cfg);
                        dataSource.cache.put(data, {
                            on: {
                                success: function(res) {
                                    EditEntityAction.showUpdateForm(res.response.entity, dataSource).then(function() {
                                        //EditEntityAction.showFormMessage("success", "Item updated");
                                        var form = EditEntityAction.getEditionTab().form;
                                        form.animateSaveBtn();
                                        EditEntityAction.hideEditFormOverlay();
                                    });
                                },
                                failure: Y.bind(EditEntityAction.hideEditFormOverlay, EditEntityAction)
                            }
                        });
                    }),
                        // Retrieve menu and remove the first items (the "Save" button)
                        menuItems = Y.Array.filter(entity.getMenuCfg({dataSource: dataSource}).slice(1), function(i) {
                            return (!i.label || (i.label.indexOf("New") < 0 && i.label.indexOf("Edit") < 0));
                        }),
                        allowedChildren;

                    EditEntityAction.processMenu(menuItems, entity);

                    form.toolbar.add(menuItems);
                    //if (form.toolbar.item(0)) { form.toolbar.item(0).get(CONTENTBOX).setStyle("marginRight", "10px"); }
                    resolve(form);
                };
                //EditEntityAction.destroyEditionTab();                                   // Hide all active tabs
                EditEntityAction.getEditionTab();                                   // Create the edition tab
                // (and the left panel won't pop in and out)

                if ((Wegas.persistence.VariableDescriptor &&
                    (entity instanceof Wegas.persistence.VariableDescriptor || // Those classes may not be loaded
                        entity instanceof Wegas.persistence.VariableInstance)) ||
                    entity instanceof Wegas.persistence.JpaAccount ||
                    entity instanceof Wegas.persistence.GameModel ||
                    entity instanceof Wegas.persistence.Game) {                  // @fixme we may get extended mode for any entity, just need to check if it causes bugs
                    EditEntityAction.showEditFormOverlay();
                    EditEntityAction.hideEditFormOverlay();
                    doShow(entity, dataSource);

                    /*dataSource.cache.getWithView(entity, "Editor", {
                     on: {
                     success: function (e) {
                     EditEntityAction.hideEditFormOverlay();
                     doShow(e.response.entity, e.callback.ds);
                     },
                     ds: dataSource
                     }
                     });*/
                } else {
                    doShow(entity, dataSource);
                }
            });
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

            // All properties of 'Ref' must be found in 'Other' and have the same value.
            // Array elements are expected to be found in the same order...
            // 'Other' may contain additional properties, which will be ignored.
            // In fact, 'Other' is normally a Yui3 object containing a copy of the properties of 'Ref'.
            function isDifferent(ref, other) {

                // Returns the index of plugin inside arr or -1 if not found
                function pluginIndex(arr, pluginName) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i] && arr[i].fn === pluginName) {
                            return i;
                        }
                    }
                    return -1;
                }

                // Check if no plugins are different, even if the cfg property points to the plugin's 'host'
                function cfgIsDifferent(currProp, otherProp) {
                    for (var i = 0; i < currProp.length; i++) {
                        var elemc = currProp[i],
                            elemo = otherProp[i];
                        if (elemo && elemc && elemo.fn === elemc.fn && elemo.cfg && elemc.cfg) {
                            if (!elemc.cfg.host && elemo.cfg.host && typeof elemo.cfg.host === "object") {
                                try {
                                    if (isDifferent(elemc.cfg, elemo.cfg.host.get("plugins")[i].cfg)) {
                                        return true;
                                    }
                                } catch (e) {
                                    return true; // Different structures
                                }
                            } else {
                                if (isDifferent(elemc, elemo)) {
                                    return true;
                                }
                            }
                        } else {
                            if (isDifferent(elemc, elemo)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }

                // In the case of an AbsoluteLayout or its children, two standard plugins may be regenerated at each display.
                // See "AbsoluteLayout" widget, method bindUI().
                function differentAbsoluteLayoutPlugins(currProp, otherProp) {
                    var posIndex = pluginIndex(currProp, "CSSPosition");
                    if (posIndex !== pluginIndex(otherProp, "CSSPosition")) {
                        if (posIndex === -1) {
                            return true;
                        }
                        var pos = currProp[posIndex].cfg.styles;
                        // If new, this object should be equal to { position: "absolute", top: "0px", left: "0px" }
                        if (pos.position === "absolute" && pos.top === "0px" && pos.left === "0px") {
                            otherProp[posIndex] = currProp[posIndex];
                        } else {
                            return true;
                        }
                    }
                    var sizeIndex = pluginIndex(currProp, "CSSSize");
                    if (sizeIndex !== pluginIndex(otherProp, "CSSSize")) {
                        if (sizeIndex === -1) {
                            return true;
                        }
                        var size = currProp[sizeIndex] && currProp[sizeIndex].cfg && currProp[sizeIndex].cfg.styles;
                        // If new, this object should be empty:
                        if (Object.keys(size).length === 0) {
                            otherProp[sizeIndex] = currProp[sizeIndex];
                        } else {
                            return true;
                        }
                    }
                }

                // BEGIN isDifferent(ref, other)
                if ((ref && !other) || (!ref && other)) {
                    return true;
                }
                for (var name in ref) {
                    if (ref.hasOwnProperty(name)) {
                        var currProp = ref[name],
                            otherProp = other._yuid ? other.get(name) : other[name];
                        if (typeof currProp === "object") {
                            if (currProp === otherProp)
                                continue;
                            // Check if the form's plugins property is different from the one inside the widget.
                            if (name === "plugins" && Array.isArray(currProp)) {
                                if (otherProp && !Array.isArray(otherProp)) {
                                    return true;
                                }
                                if (otherProp === undefined) {
                                    otherProp = [];
                                }
                                if (currProp.length === 0 && otherProp.length === 0) {
                                    continue;
                                }
                                if (differentAbsoluteLayoutPlugins(currProp, otherProp)) {
                                    return true;
                                }
                                if (cfgIsDifferent(currProp, otherProp)) {
                                    return true;
                                } else {
                                    continue;
                                }
                            }
                            if (isDifferent(currProp, otherProp)) {
                                return true;
                            }
                        } else if (currProp != otherProp) { // Allow conversions like string/int, undefined/null
                            if (Number.isNaN(currProp) && Number.isNaN(otherProp)) {
                                // In this specific case, NaN equals NaN
                                continue;
                            }
                            if (currProp === "" && otherProp == null) { // Tolerate clicking in and out of an empty field
                                continue;
                            }
                            return true;
                        }
                    }
                }
                return false;
            }


            EditEntityAction.currentEntity = entity;

            var tab = EditEntityAction.getEditionTab(),
                name = entity.getType().replace("Descriptor", "").replace("Instance", ""),
                tb = tab.form.toolbar,
                sz = tb.size();
            if (sz > 1) {
                // Remove any pre-existing buttons, except the "Save" button at position 0:
                for (var i = sz - 1; i > 0; i--) {
                    tb.remove(i);
                }
            }
            if (!entity.get(ID) && !(entity instanceof Y.Widget)) {             // No id -> new entity
                name = "New " + name.toLowerCase();
            }
            tab.setAttrs({
                label: Wegas.TabView.getEditorTabLabel(),
                selected: 1
            });                                                                 // Update tab attrs
            tab.form.setAttrs({
                values: entity.toObject(),
                cfg: formCfg || entity.getFormCfg()
            });                                                                 // Update form attrs
            var statusNode = new Y.Node.create('<span class="wegas-form-title">' + name + '</span>'),
                header = tab.form.toolbar.get("header"),
                currTitle = header.one('.wegas-form-title');
            if (currTitle) {
                header.replaceChild(statusNode, currTitle);
            } else {
                header.prepend(statusNode);
            }
            tab.form.toolbar.setStatusMessage("");

            tab.form.detach("submit");
            tab.form.on("submit", function(e) {                                 // Attach submit callback
                this.showOverlay();
                var destroyed = EditEntityAction.currentEntity.get("destroyed");
                if (destroyed) {
                    EditEntityAction.showFormMessage("error", "Conflit !");
                } else {
                    callback(e.value, EditEntityAction.currentEntity);
                }
                this.hideOverlay();
                EditEntityAction.unsaved = false;
                //callback(e.value, entity);
                //EditEntityAction.form.saveButton.set("disabled", true);
            });

            tab.detach("destroy");
            tab.on("destroy", function() {                                      // and destroy callback
                if (cancelCallback) {
                    cancelCallback(EditEntityAction.currentEntity);
                }
                Y.fire("edit-entity:cancel", {entity: EditEntityAction.currentEntity});
                EditEntityAction.currentEntity = null;
                EditEntityAction.form = null;
                EditEntityAction.tab = null;
            });
            tab.form.detach("updated");
            tab.form.on("updated", function(e) {
                // If it's a widget, check first if any of its own properties have really been modified.
                if (isDifferent(e, entity)) {
                    tab.form.activateSaveBtn();
                    EditEntityAction.setUnsaved(true);
                } else {
                    tab.form.deactivateSaveBtn();
                    EditEntityAction.setUnsaved(false);
                }
            });
            Y.fire("edit-entity:edit", {entity: entity});
            //tab.form.detach("cancel");
            //tab.form.on("cancel", function() {
            //    this.remove();
            //    this.destroy();
            //}, tab);
            //Y.fire("rightTabShown");

            return tab.form;
        },
        /**
         * Adds icon, styling and tooltip to a button being created. Uses Font Awesome icons.
         *
         * @param menuItem the button being created
         * @param faName the icon name in Font Awesome
         * @param tooltip optional: the text to be displayed on mouse hover
         * @param bgStyle optional: the CSS class of the background circle
         * @return the modified menuItem
         */
        stackedIcon: function(menuItem, faName, tooltip, bgStyle) {
            menuItem.label = this.getStackedIconLabel(faName, tooltip, bgStyle);
            menuItem.cssClass = (menuItem.cssClass ? menuItem.cssClass + ' ' : '') + this.getStackedIconClass();
            return menuItem;
        },
        getStackedIconLabel: function(faName, tooltip, bgStyle) {
            bgStyle = bgStyle || '';
            tooltip = tooltip ? ' title="' + tooltip + '"' : '';
            return '<span class="fa-stack fa-lg"' + tooltip + '">' +
                '<i class="fa fa-circle fa-stack-2x ' + bgStyle + '"></i>' +
                '<i class="fa ' + faName + ' fa-stack-1x"></i>' +
                '</span>';
        },
        getStackedIconClass: function() {
            return 'wegas-stacked-button';
        },
        setUnsaved: function(unsaved) {
            EditEntityAction.unsaved = unsaved;
        },
        isUnsaved: function() {
            return EditEntityAction.unsaved;
        },
        allowDiscardingEdits: function(okCb, cancelCb) {
            if (EditEntityAction.unsaved === true) {
                Y.Wegas.Panel.confirm(
                    MESSAGE_DISCARD_EDITS,
                    Y.bind(function() {
                        EditEntityAction.discardEdits();
                        okCb && okCb();
                    }, this),
                    cancelCb,
                    "Do not save",
                    "Keep editing");
            } else {
                okCb && okCb();
            }
        },
        discardEdits: function() {
            EditEntityAction.unsaved = false;
            if (EditEntityAction.tab && EditEntityAction.tab.form) {
                EditEntityAction.tab.form.deactivateSaveBtn();
            }
        },
        setEditionTab: function(newTab) {
            var oldTab = EditEntityAction.tab;
            // EditEntityAction.currentEntity is left unchanged
            newTab.form = EditEntityAction.form;
            EditEntityAction.tab = newTab;
            if (!newTab.hasPlugin("editentity")) {
                newTab.plug(Plugin.EditEntityAction);
            }
            if (oldTab && !oldTab.get("destroyed")) {
                oldTab.remove(); // do not destroy() otherwise the destructor callback will cause mayhem
            }
        },
        getEditionTab: function() {

            if (!EditEntityAction.tab || EditEntityAction.tab.get("destroyed")   // First make sure the edit tab does not exist
                || !EditEntityAction.tab.get("panelNode").one(".wegas-react-form")) {             // or is empty
                var currTab = Wegas.TabView.getEditorTab(),
                    // Check if the edition tab has been created somewhere but still is empty:
                    tabViewSelector = currTab ? currTab.get("tabSelector") : Wegas.TabView.getDefaultEditorTabView();
                var tab = Wegas.TabView.createTab(Wegas.TabView.getEditorTabLabel(), tabViewSelector), // Create a tab,
                    form = new Wegas.RForm();                                    // and a form

                tab.plug(Plugin.Removeable);                                  // make it closeable
                tab.add(form);

                if (!tab.hasPlugin("editentity")) {
                    tab.plug(Plugin.EditEntityAction);
                }

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
            if (EditEntityAction.form) {
                EditEntityAction.form.showOverlay();
            }
        },
        /**
         *
         */
        hideEditFormOverlay: function() {
            if (EditEntityAction.form) {
                EditEntityAction.form.hideOverlay();
            }
        },
        /**
         *
         */
        hideRightTabs: function() {
            Y.Widget.getByNode("#rightTabView").destroyAll();
            Y.all(".wegas-editing").removeClass("wegas-editing");               // @Hack for state machine edition tab
            Y.Widget.getByNode(".wegas-layout-right > .wegas-widget").unplug(Plugin.WidgetToolbar);
        },
        destroyEditionTab: function() {
            this.unsaved = false;
            Wegas.TabView.destroyTab(Wegas.TabView.getEditorTabLabel());
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
            //  EditEntityAction.destroyEditionTab();                                   // Hide all active tabs
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
            Plugin.EditEntityAction.allowDiscardingEdits(Y.bind(function() {
                Wegas.Editable.useAndRevive(Y.merge({// Load target class dependencies
                    "@class": this.get("targetClass")
                }, Y.clone(this.get("cfg"))), Y.bind(function(entity) {
                    this.showAddForm(entity);                                       // and display the edition form
                }, this));
            }, this));
        }
    }, {
        NS: "NewEntityAction",
        ATTRS: {
            targetClass: {},
            cfg: {},
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
            Plugin.EditEntityAction.allowDiscardingEdits(Y.bind(function() {
                var entity = (this.get("method").toLowerCase() === "post") ? this.get(ENTITY) :
                    this.get("parentEntity"), descriptor;
                this.doExecute(entity);
            }, this));
        },
        associateDescriptor: function(container) {
            var desc, cont;

            if (container instanceof Wegas.persistence.VariableDescriptor) {
                return {
                    descriptor: container,
                    container: container
                };
            } else if (Wegas.persistence.EvaluationDescriptorContainer && container instanceof Wegas.persistence.EvaluationDescriptorContainer) {
                desc = Y.Array.find(Y.Wegas.Facade.Variable.cache.findAll("@class", "PeerReviewDescriptor"),
                    function(item) {
                        if (item.get("feedback").get("id") === container.get("id")) {
                            cont = item.get("feedback");
                            return true;
                        } else if (item.get("fbComments").get("id") === container.get("id")) {
                            cont = item.get("fbComments");
                            return true;
                        }
                        return false;
                    });
                return {
                    descriptor: desc,
                    container: cont
                };
            } else {
                return {
                    descriptor: null,
                    container: null
                };
            }
        },
        doExecute: function(container) {
            var entity = this.get(ENTITY), assoc,
                key = this.get("attributeKey"),
                dataSource = this.get(DATASOURCE),
                newEntity, targetArray, child, menuItems, form;

            switch (this.get("method").toString().toLowerCase()) {
                case "put":
                    child = Y.Array.find(container.get(key), function(i) {
                        return i.get(ID) === entity.get(ID);
                    });
                    menuItems = Y.Array.filter(child.getMenuCfg({dataSource: dataSource, parentEntity: container}).slice(1), function(i) {
                        return (!i.label || (i.label.indexOf("New") < 0 && i.label.indexOf("Edit") < 0));
                    });
                    EditEntityAction.processMenu(menuItems, entity);
                    // EditEntityAction.destroyEditionTab();                           // Hide all active tabs
                    form = EditEntityAction.showEditForm(child, Y.bind(function(newVal) {
                        var assoc = this.associateDescriptor(container),
                            oldVal;

                        child = Y.Array.find(assoc.container.get(key), function(i) {
                            return i.get(ID) === entity.get(ID);
                        });
                        oldVal = child.getAttrs();
                        child.setAttrs(newVal);
                        dataSource.cache.put(assoc.descriptor.toObject(), {
                            on: {
                                success: Y.bind(function() {
                                    EditEntityAction.hideEditFormOverlay();
                                    EditEntityAction.showFormMessage("success", "Item has been updated");
                                    this.execute();
                                }, this),
                                failure: Y.bind(function() {
                                    EditEntityAction.hideEditFormOverlay();
                                    //EditEntityAction.showFormMessage("error", "Conflit !");
                                    // Revert changes ????
                                    child.setAttrs(oldVal);
                                }, this)
                            }
                        });
                    }, this));
                    form.toolbar.add(menuItems);
                    if (form.toolbar.item(0)) {
                        form.toolbar.item(0).get(CONTENTBOX).setStyle("marginRight", "10px");
                    }
                    break;
                case "post":
                    newEntity = Wegas.Editable.revive({
                        "@class": this.get("targetClass")
                    });
                    // EditEntityAction.destroyEditionTab();                           // Hide all active tabs
                    EditEntityAction.showEditForm(newEntity, Y.bind(function(newVal) {
                        var assoc = this.associateDescriptor(container);
                        newEntity.setAttrs(newVal);
                        assoc.container.get(this.get("attributeKey")).push(newEntity);
                        dataSource.cache.put(assoc.descriptor.toObject(), {
                            on: {
                                success: Y.bind(function(e) {
                                    //  EditEntityAction.destroyEditionTab();
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
                        var assoc = this.associateDescriptor(container);
                        targetArray = assoc.container.get(this.get("attributeKey"));
                        Y.Array.find(targetArray, function(e, i, a) {
                            if (e.get(ID) === entity.get(ID)) {
                                a.splice(i, 1);
                                return true;
                            }
                            return false;
                        });
                        this.showOverlay();

                        dataSource.cache.put(assoc.descriptor.toObject(), {
                            on: {
                                success: Y.bind(function() {
                                    this.hideOverlay();
                                    EditEntityAction.destroyEditionTab();
                                }, this),
                                failure: Y.bind(this.hideOverlay, this)
                            }
                        });
                    }, this));
                    break;
                case "copy":
                    assoc = this.associateDescriptor(container);
                    targetArray = container.get(this.get("attributeKey"));
                    Y.Array.find(targetArray, function(e, i, a) {
                        if (e.get(ID) === entity.get(ID)) {
                            newEntity = new entity.constructor(entity.toObject(ID, "refId"));
                            a.push(newEntity);
                            return true;
                        }
                        return false;
                    });
                    this.showOverlay();

                    dataSource.cache.put(assoc.descriptor.toObject(), {
                        on: {
                            success: Y.bind(function() {
                                this.hideOverlay();
                                EditEntityAction.destroyEditionTab();
                            }, this),
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
            //EditEntityAction.destroyEditionTab();                                   // Hide all active tabs
            EditEntityAction.showEditForm(entity, Y.bind(function(newVal) {
                var dataSource = this.get(DATASOURCE);
                dataSource.cache.post(newVal, parentData, {
                    success: Y.bind(function(e) {
                        EditEntityAction.hideEditFormOverlay();

                        var entity = e.response.entity, button;

                        var button = Wegas.Widget.create(entity.getMenuCfg({dataSource: dataSource})[0]);
                        button.render().fire("click");
                        button.destroy();
                    }, this),
                    failure: Y.bind(this.hideOverlay, this)
                });
            }, this), null, this.get("formCfg"));
        },
        execute: function() {
            Plugin.EditEntityAction.allowDiscardingEdits(Y.bind(function() {
                Wegas.Editable.useAndRevive(Y.merge({// Load target class dependencies
                    "@class": this.get("targetClass")
                }, Y.clone(this.get("cfg"))), Y.bind(function(entity) {
                    this.showAddForm(entity, this.get(ENTITY));                     // and display the edition form
                }, this));
            }, this));
        }
    }, {
        NS: "AddEntityChildAction",
        ATTRS: {
            targetClass: {},
            cfg: {}
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
            Plugin.EditEntityAction.allowDiscardingEdits(Y.bind(function() {
                this.showOverlay();
                this.get(DATASOURCE).cache.duplicateObject(this.get(ENTITY), {
                    on: {
                        success: Y.bind(function(e) {
                            var entity = e.response.entity;
                            EditEntityAction.showUpdateForm(entity, this.get(DATASOURCE));
                            this.hideOverlay();
                        }, this),
                        failure: Y.bind(this.hideOverlay, this)
                    }
                });
            }, this));
        }
    }, {
        NS: "DuplicateEntityAction"
    });
    Plugin.DuplicateEntityAction = DuplicateEntityAction;

    /**
     * @class
     * @name Y.Plugin.SearchEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    SearchEntityAction = Y.Base.create("SearchEntityAction", EntityAction, [], {
        execute: function() {
            var scriptAlias = this.get(ENTITY).get('name'),
                searchField = Y.one('.wegas-filter-input input'),
                searchBtn = Y.one('.wegas-filter-input button'),
                currentSearch = searchField.get('value'),
                variableTV = Y.Widget.getByNode(".wegas-editor-variabletreeview"),
                searchValue = '"' + scriptAlias + '"';
            if (currentSearch === searchValue) {
                // Seems we are already searching for this entity. Removing search
                searchField.set('value', '');
                variableTV.checkSearchField({
                    prevVal: searchValue,
                    newVal: ''
                });
            } else {
                searchField.set('value', searchValue);
                variableTV.checkSearchField({prevVal: currentSearch, newVal: searchValue}, true);
                variableTV.serverSearch();
            }
        }
    }, {
        NS: "SearchEntityAction"
    });
    Plugin.SearchEntityAction = SearchEntityAction;

    /**
     * @class
     * @name Y.Plugin.SortEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    SortEntityAction = Y.Base.create("SortEntityAction", EntityAction, [], {
        execute: function() {
            this.showOverlay();
            this.get(DATASOURCE).cache.sortList(this.get(ENTITY), {
                on: {
                    success: Y.bind(this.hideOverlay, this),
                    failure: Y.bind(this.hideOverlay, this)
                }
            });
        }
    }, {
        NS: "SortEntityAction"
    });
    Plugin.SortEntityAction = SortEntityAction;


    ResetVisibilityAction = Y.Base.create("ResetVisibilityAction", EntityAction, [], {
        execute: function() {
            if (Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("type") === "MODEL") {
                this.showOverlay();
                Y.Wegas.Facade.Variable.cache.sendRequest({
                    request: '/' + this.get(ENTITY).get("id") + "/visibility/" + this.get("visibility"),
                    cfg: {
                        method: 'PUT'
                    },
                    on: {
                        success: Y.bind(this.hideOverlay, this),
                        failure: Y.bind(this.hideOverlay, this)
                    }
                });
            }
        }
    }, {
        NS: "ResetVisibilityAction",
        ATTRS: {
            visibility: {
                type: "string"
            }
        }
    });
    Plugin.ResetVisibilityAction = ResetVisibilityAction;

    var ConvertToListAction = Y.Base.create("ConvertToListAction", EntityAction, [], {
        execute: function() {
            this.showOverlay();
            Y.Wegas.Facade.Variable.cache.sendRequest({
                request: '/' + this.get(ENTITY).get("id") + "/ConvertToList",
                cfg: {
                    method: 'PUT'
                },
                on: {
                    success: Y.bind(this.hideOverlay, this),
                    failure: Y.bind(this.hideOverlay, this)
                }
            });
        }
    }, {
        NS: "ConvertToListAction",
        ATTRS: {
        }
    });
    Plugin.ConvertToListAction = ConvertToListAction;

    /**
     * @class
     * @name Y.Plugin.DeleteEntityAction
     * @extends Y.Plugin.EntityAction
     * @constructor
     */
    DeleteEntityAction = Y.Base.create("DeleteEntityAction", EntityAction, [], {
        execute: function() {
            var entity = this.get(ENTITY), i;

            Wegas.Panel.confirm("Are you sure you want to delete the " +
                entity.getType().toLowerCase().replace("descriptor", "") +
                " \"" + entity.getEditorLabel() +
                "\" ?",
                Y.bind(function() {
                    this.showOverlay();
                    this.confirmDelete = true;
                    this.get(DATASOURCE).cache.deleteObject(entity, {
                        on: {
                            success: Y.bind(function() {
                                this.hideOverlay();
                                /*if (EditEntityAction.currentEntity) {
                                 if (EditEntityAction.currentEntity.get(ID) === entity.get(ID)) {
                                 EditEntityAction.destroyEditionTab();
                                 } else if (entity.get("@class") === "ListDescriptor") {
                                 for (i = 0; i < entity.get("items").length; i += 1) {
                                 // Who cares about deeper levels ? TODO...
                                 if (EditEntityAction.currentEntity.get(ID) ===
                                 entity.get("items")[i].get(ID)) {
                                 EditEntityAction.destroyEditionTab();
                                 }
                                 }
                                 } else if (entity.get("@class") === "FSMDescriptor") {
                                 // Before closing the tabs, be sure the Transition/State belongs to the destroyed FSM
                                 if (EditEntityAction.currentEntity.get("@class") === "Transition" ||
                                 EditEntityAction.currentEntity.get("@class") === "State") {
                                 EditEntityAction.destroyEditionTab();
                                 }
                                 }
                                 }*/
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
                value: "Edit " + Wegas.TabView.getEditorTabLabel()
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
            var tab = Wegas.TabView.findTabAndLoadWidget(
                "State machine", // Load and display the editor in a new tab
                Wegas.TabView.getNonEditorTabViewId(),
                {label: this.get(ENTITY).getType()},
                Y.mix(this.get("viewerCfg"),
                    {
                        type: "StateMachineViewer",
                        plugins: [{
                                fn: "WidgetToolbar"
                            }]
                    }),
                Y.bind(function(entity, widget, tab) {
                    tab.set("selected", 2);
                    widget.showOverlay();
                    EditEntityAction.showEditFormOverlay();
                    widget.set(ENTITY, entity);
                    EditEntityAction.hideEditFormOverlay();
                    widget.hideOverlay();
                    /*this.get(DATASOURCE).cache.getWithView(entity, "Editor", {// just need to check if it causes bugs
                     on: {
                     success: function (e) {
                     widget.set(ENTITY, e.response.entity);
                     EditEntityAction.hideEditFormOverlay();
                     widget.hideOverlay();
                     },
                     failure: function () {
                     EditEntityAction.hideEditFormOverlay();
                     widget.hideOverlay();
                     }
                     }
                     });*/
                }, this, this.get(ENTITY))
                );

            tab.plug(Plugin.Removeable, {
                closeCallback: function() {
                    var entity = EditEntityAction.currentEntity;
                    if (/*entity instanceof persistence.FSMDescriptor ||*/
                        entity instanceof persistence.State ||
                        entity instanceof persistence.Transition) {
                        EditEntityAction.destroyEditionTab();
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
                    case "Duplicate":
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
                        Y.Plugin.EditEntityAction.destroyEditionTab();
                    }
                }
            });                                                                 // Add close button
            target.toolbar.get("header")
                .append(target.toolbar.get("header").one(".wegas-status-message"));// @hack move status node to the
            // very end of the node
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
                children: Y.Array.map(Wegas.persistence.ListDescriptor.EDITMENU["addBtn"].cfg.plugins[0].cfg.children,
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
