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
YUI.add('wegas-editor-widgetaction', function(Y) {
    "use strict";

    var Plugin = Y.Plugin,
        Action = Y.Plugin.Action,
        Wegas = Y.Wegas,
        WidgetAction, EditWidgetAction,
        AddChildWidgetAction,
        DeleteWidgetAction,
        PAGEDATASOURCE = Wegas.Facade.Page.cache,
        UPDATED_MSG = "Item updated";

    /**
     * @class
     * @name Y.Plugin.WidgetAction
     * @extends Y.Plugin.Action
     * @constructor
     */
    WidgetAction = function() {
        WidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(WidgetAction, Action, {}, {
        /** @lends Y.Wegas.EntityAction */
        NS: "WidgetAction",
        NAME: "WidgetAction",
        ATTRS: {
            widget: {},
            dataSource: {
                getter: function(val) {
                    if (!val) {
                        return Wegas.Facade.Page;
                    }
                    return val;
                }
            }
        }
    });
    //Plugin.WidgetAction = WidgetAction;

    /**
     * @name Y.Plugin.EditWidgetAction
     * @extends Y.Plugin.WidgetAction
     * @constructor
     */
    EditWidgetAction = function() {
        EditWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EditWidgetAction, WidgetAction, {
        /**
         * @function
         * @private
         */
        execute: function() {
            Plugin.EditEntityAction.hideRightTabs();
            var widget = this.get("widget"),
                form,
                menuItems = Y.Array.filter(widget.getMenuCfg().slice(0), function(i) {

                    switch (i.label) { // @hack add icons to some buttons
                        case "Delete":
                        case "Copy":
                        case "Edit":
                            i.label = '<span class="wegas-icon wegas-icon-' + i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                            break;
                    }

                    // return (!i.label || (i.label.indexOf("New") < 0 && i.label.indexOf("Edit") < 0));
                    return (i.label && (i.label !== "New" && i.label.indexOf("Edit") < 0));
                }); // Retrieve menu and remove the first item

            form = Plugin.EditEntityAction.showEditForm(widget, Y.bind(function(val, entity) {
                Plugin.EditEntityAction.showEditFormOverlay();
                var i, plugins = {},
                    pls, plugin, cfg, oldCfg = entity.get("root").toObject();
                /* Retrieve page's name if it has one */
                if (val.hasOwnProperty("@pageName")) {
                    PAGEDATASOURCE.editMeta(entity.get("@pageId"), {
                        name: val["@pageName"]
                    }, function() {
                        PAGEDATASOURCE.fire("pageUpdated");
                    });
                    delete val["@pageName"];
                }
                entity.setAttrs(val);
                for (i = 0; i < val.plugins.length; i += 1) {
                    plugin = Y.Plugin[Y.Wegas.Plugin.getPluginFromName(val.plugins[i].fn)];
                    if (!Y.Lang.isUndefined(entity._plugins[plugin.NS])) { //that plugin exists on target
                        entity[plugin.NS].setAttrs(val.plugins[i].cfg);
                        plugins[plugin.NS] = true; //store namespace as treated
                    } else {
                        entity.plug(plugin, val.plugins[i].cfg);
                        plugins[plugin.NS] = true; //store namespace as treated
                    }
                }
                pls = Y.merge(entity.get("plugins"));
                for (i in pls) { // remove
                    plugin = Y.Plugin[pls[i].fn];
                    if (Y.Lang.isUndefined(plugins[plugin.NS])) { //An inexistant namespace
                        entity.unplug(plugin);
                    }
                }
                cfg = entity.get("root").toObject();
                if (Y.JSON.stringify(cfg) !== Y.JSON.stringify(oldCfg)) {
                    this.get("dataSource").cache.patch(cfg, Y.bind(function() {
                        entity.fire("AttributesChange", {
                            attrs: val
                        });
                        Plugin.EditEntityAction.hideEditFormOverlay();
                        Plugin.EditEntityAction.showFormMessage("success", UPDATED_MSG);
                        this.highlight(Plugin.EditEntityAction.currentEntity, true);
                    }, this));
                } else {
                    Plugin.EditEntityAction.hideEditFormOverlay();
                    Plugin.EditEntityAction.showFormMessage("success", UPDATED_MSG);
                }
            }, this), Y.bind(function(entity) {
                if (entity) {
                    this.highlight(entity, false);
                }
            }, this));
            /* Inject page's name */
            if (widget.get("root") === widget) {
                PAGEDATASOURCE.getIndex(function(index) {
                    var formCfg = widget.getFormCfg();
                    formCfg.fields.splice(0, 0, {
                        label: "Name",
                        name: "@pageName",
                        showMsg: true,
                        type: "string",
                        value: index[widget.get("@pageId")],
                        wrapperClassName: "inputEx-fieldWrapper wegas-pagename-edition"
                    });
                    form.set("cfg", formCfg);
                });
            }
            this.highlight(widget, true);
            form.toolbar.add(menuItems).item(0).get("contentBox").setStyle("marginLeft", "10px");
        },
        highlight: function(widget, val) {
            var bb = widget.get("boundingBox");
            if (bb && bb._node) {
                bb.toggleClass("highlighted", val || Y.Lang.isUndefined(val));
            }
        }
    }, {
        NS: "EditWidgetAction",
        NAME: "EditWidgetAction"
    });
    Plugin.EditWidgetAction = EditWidgetAction;

    /**
     * @class
     * @name Y.Plugin.AddChildWidgetAction
     * @extends Y.Plugin.WidgetAction
     * @constructor
     */
    AddChildWidgetAction = function() {
        AddChildWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(AddChildWidgetAction, WidgetAction, {
        execute: function() {
            Wegas.Editable.use(this.get("childCfg"), Y.bind(function() { // Load target widget dependencies
                var newWidget = Y.Wegas.Widget.create(this.get("childCfg"));

                Plugin.EditEntityAction.showEditForm(newWidget, Y.bind(function(val) {
                    Plugin.EditEntityAction.showEditFormOverlay();
                    var targetWidget = this.get("widget"),
                        widget = Y.Wegas.Widget.create(val);
                    targetWidget.add(widget);

                    this.get("dataSource").cache.patch(targetWidget.get("root").toObject(), Y.bind(function() {
                        var tw = new Y.Wegas.Text();
                        Plugin.EditEntityAction.showFormMessage("success", "Element has been saved");
                        Plugin.EditEntityAction.hideEditFormOverlay();
                        tw.plug(Plugin.EditWidgetAction, {
                            widget: this
                        });
                        tw.EditWidgetAction.execute();
                    }, widget));
                }, this));
            }, this));
        }
    }, {
        NS: "AddChildWidgetAction",
        NAME: "AddChildWidgetAction",
        ATTRS: {
            childType: {},
            childCfg: {
                value: {},
                getter: function(v) {
                    if (!v.type) {
                        v.type = this.get("childType");
                    }
                    return v;
                }
            }
        }
    });
    Plugin.AddChildWidgetAction = AddChildWidgetAction;

    /**
     * @class
     * @name Y.Plugin.DeleteWidgetAction
     * @extends Y.Plugin.WidgetAction
     * @constructor
     */
    DeleteWidgetAction = function() {
        DeleteWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(DeleteWidgetAction, WidgetAction, {
        execute: function() {
            Wegas.Panel.confirm("Are you sure you want to delete this element?", Y.bind(function() {
                var targetWidget = this.get("widget"),
                    root = targetWidget.get("root");
                if (Plugin.EditEntityAction.currentEntity === targetWidget) {
                    Plugin.EditEntityAction.hideRightTabs();
                }
                targetWidget.destroy();
                this.get("dataSource").cache.patch(root.toObject());
            }, this));
        }
    }, {
        NS: "DeleteWidgetAction",
        NAME: "DeleteWidgetAction"
    });
    Plugin.DeleteWidgetAction = DeleteWidgetAction;
    /**
     * @class
     * @name Y.Plugin.DeleteLayoutWidgetAction
     * @extends Y.Plugin.WidgetAction
     * @constructor
     */
    Plugin.DeleteLayoutWidgetAction = function() {
        Plugin.DeleteLayoutWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Plugin.DeleteLayoutWidgetAction, WidgetAction, {
        execute: function() {
            var targetWidget = this.get("widget"),
                root = targetWidget.get("root");
            /*if (targetWidget.size() > 0) {
             alert("Please delete content first");
             } else */
            if (root === targetWidget) {
                Y.Widget.getByNode(".wegas-page-editor").deletePage(root.get("@pageId"));
            } else {
                Wegas.Panel.confirm("Are you sure you want to delete this widget and all of its content?", Y.bind(function() {
                    targetWidget.destroy();
                    this.get("dataSource").cache.patch(root.toObject());
                }, this));
            }
        }
    }, {
        NS: "DeleteLayoutWidgetAction",
        NAME: "DeleteLayoutWidgetAction"
    });
    /**
     * @class
     * @name Y.Plugin.DuplicateWidgetAction
     * @extends Y.Plugin.WidgetAction
     * @constructor
     */
    Plugin.DuplicateWidgetAction = function() {
        Plugin.DuplicateWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Plugin.DuplicateWidgetAction, WidgetAction, {
        execute: function() {
            var targetWidget = this.get("widget"),
                root = targetWidget.get("root");
            /*if (targetWidget.size() > 0) {
             alert("Please delete content first");
             } else */
            if (root === targetWidget) {
                Y.Widget.getByNode(".wegas-page-editor").duplicatePage(root.get("@pageId"));
            } else {
                targetWidget.get("parent").add(targetWidget.toObject());
                this.get("dataSource").cache.patch(root.toObject());
            }
        }
    }, {
        NS: "DeleteLayoutWidgetAction",
        NAME: "DeleteLayoutWidgetAction"
    });

});
