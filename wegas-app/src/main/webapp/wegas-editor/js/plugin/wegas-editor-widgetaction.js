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

    var Plugin = Y.Plugin, Action = Y.Plugin.Action, Wegas = Y.Wegas,
            WidgetAction;

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
    var EditWidgetAction = function() {
        EditWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EditWidgetAction, WidgetAction, {
        /**
         * @function
         * @private
         */
        execute: function() {
            Plugin.EditEntityAction.showEditForm(this.get("widget"), Y.bind(function(val, e, f) {
                Plugin.EditEntityAction.showEditFormOverlay();
                var i, targetWidget = this.get("widget"), plugins = {}, plugin;
                targetWidget.setAttrs(val);
                for (i = 0; i < val.plugins.length; i += 1) {
                    plugin = Y.Plugin[Y.Wegas.Plugin.getPluginFromName(val.plugins[i].fn)];
                    if (!Y.Lang.isUndefined(targetWidget._plugins[plugin.NS])) { //that plugin exists on target
                        targetWidget[plugin.NS].setAttrs(val.plugins[i].cfg);
                        plugins[plugin.NS] = true;                              //store namespace as treated
                    } else {
                        targetWidget.plug(plugin, val.plugins[i].cfg);
                        plugins[plugin.NS] = true;                              //store namespace as treated
                    }
                }
                for (i in targetWidget._plugins) {                                 // remove
                    if (Y.Lang.isUndefined(plugins[i])) {                           //An inexistant namespace
                        targetWidget.unplug(i);
                    }
                }
                targetWidget.syncUI();
                this.get("dataSource").cache.patch(targetWidget.get("root").toObject(), Y.bind(function() {
                    Plugin.EditEntityAction.hideEditFormOverlay();
                    Plugin.EditEntityAction.showFormMessage("success", "Item has been saved.")
                }, this));
            }, this), Y.bind(function() {
                if (this.get("widget") && !this.get("widget").get("destroyed")) {
                    this.get("widget").highlight(false);
                }
            }, this));

            this.get("widget").highlight(true);
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
    var AddChildWidgetAction = function() {
        AddChildWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(AddChildWidgetAction, WidgetAction, {
        execute: function() {
            Wegas.Editable.use(this.get("childCfg"), Y.bind(function() { // Load target widget dependencies
                var newWidget = Y.Wegas.Widget.create(this.get("childCfg"));

                Plugin.EditEntityAction.showEditForm(newWidget, Y.bind(function(val) {
                    Plugin.EditEntityAction.showEditFormOverlay();
                    var targetWidget = this.get("widget"), widget = Y.Wegas.Widget.create(val);
                    targetWidget.add(widget);

                    this.get("dataSource").cache.patch(targetWidget.get("root").toObject(), Y.bind(function() {
                        var tw = new Y.Wegas.Text();
                        Plugin.EditEntityAction.showFormMessage("success", "Element has been saved");
                        Plugin.EditEntityAction.hideEditFormOverlay();
                        tw.plug(Plugin.EditWidgetAction, {"widget": this});
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
    var DeleteWidgetAction = function() {
        DeleteWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(DeleteWidgetAction, WidgetAction, {
        execute: function() {
            if (confirm("Are your sure your want to delete this widget ?")) {
                var targetWidget = this.get("widget"),
                        root = targetWidget.get("root");
                targetWidget.destroy();
                this.get("dataSource").cache.patch(root.toObject());
            }
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
        DeleteLayoutWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(Plugin.DeleteLayoutWidgetAction, WidgetAction, {
        execute: function() {
            var targetWidget = this.get("widget"),
                    root = targetWidget.get("root");
            if (targetWidget.size() > 0) {
                alert("Please delete content first");
            } else if (confirm("Are your sure your want to delete this widget and all of its content ?")) {
                if (root !== targetWidget) {
                    targetWidget.destroy();
                } else if (targetWidget.item && targetWidget.item(0)) { // @TODO: Panic mode, to change
                    targetWidget.removeAll();
                }

                this.get("dataSource").cache.patch(root.toObject());
            }
        }
    }, {
        NS: "DeleteLayoutWidgetAction",
        NAME: "DeleteLayoutWidgetAction"
    });

});