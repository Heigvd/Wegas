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
YUI.add('wegas-editor-widgetaction', function (Y) {
    "use strict";

    var Plugin = Y.Plugin, Action = Y.Plugin.Action, Wegas = Y.Wegas,
    WidgetAction;

    /**
     * @class
     * @name Y.Plugin.WidgetAction
     * @extends Y.Plugin.Action
     * @constructor
     */
    WidgetAction = function () {
        WidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(WidgetAction, Action, {}, {
        /** @lends Y.Wegas.EntityAction */
        NS: "WidgetAction",
        NAME: "WidgetAction",
        ATTRS: {
            widget: {},
            dataSource: {
                getter: function (val) {
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
    var EditWidgetAction = function () {
        EditWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(EditWidgetAction, WidgetAction, {

        /**
         * @function
         * @private
         */
        execute: function () {
            Plugin.EditEntityAction.showEditForm(this.get("widget"), Y.bind(function( val, e, f) {
                Plugin.EditEntityAction.hideEditFormOverlay();
                var targetWidget = this.get("widget");
                targetWidget.setAttrs(val);
                targetWidget.syncUI();
                this.get("dataSource").cache.patch(targetWidget.get("root").toObject());
            }, this));
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
    var AddChildWidgetAction = function () {
        AddChildWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(AddChildWidgetAction, WidgetAction, {
        execute: function () {
            var newWidget = new Y.Wegas.Widget.create({
                "type": this.get("childType")
            });

            Wegas.Editable.use(newWidget, Y.bind(function () {                  // Load target widget dependencies

                Plugin.EditEntityAction.showEditForm(newWidget, Y.bind(function(val) {
                    Plugin.EditEntityAction.hideEditFormOverlay();
                    var targetWidget = this.get("widget");
                    targetWidget.add(val);
                    this.get("dataSource").cache.patch(targetWidget.get("root").toObject());
                }, this));

            }, this));
        }
    }, {
        NS: "AddChildWidgetAction",
        NAME: "AddChildWidgetAction",
        ATTRS: {
            childType: {}
        }
    });
    Plugin.AddChildWidgetAction = AddChildWidgetAction;

    /**
     * @class
     * @name Y.Plugin.DeleteWidgetAction
     * @extends Y.Plugin.WidgetAction
     * @constructor
     */
    var DeleteWidgetAction = function () {
        DeleteWidgetAction.superclass.constructor.apply(this, arguments);
    };
    Y.extend(DeleteWidgetAction, WidgetAction, {
        execute: function() {
            if (confirm("Are your sure your want to delete this widget ?")) {
                var targetWidget = this.get("widget"),
                root = targetWidget.get("root");

                if (root !== targetWidget) {
                    targetWidget.destroy();
                } else if (targetWidget.item(0)) { // @TODO: Panic mode, to change
                    targetWidget.removeAll();
                }

                this.get("dataSource").cache.patch(root.toObject());
            }
        }
    }, {
        NS: "DeleteWidgetAction",
        NAME: "DeleteWidgetAction"
    });
    Plugin.DeleteWidgetAction = DeleteWidgetAction;

});