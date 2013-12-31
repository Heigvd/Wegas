/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-editor-form', function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", inputEx = Y.inputEx, Lang = Y.Lang,
            Wegas = Y.Wegas,
            Form, EditEntityForm;

    /**
     * @name Y.Wegas.Form
     * @class  Class to submit a form, add a toolbar with buttons "submit" and
     * "cancel" to mangae forms.
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @constructor
     */
    Form = Y.Base.create("wegas-form", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /**
         * @lends Y.Wegas.Form#
         */

        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @description plug a toolbar and publich "submit" event.
         */
        initializer: function() {
            this.plug(Y.Plugin.WidgetToolbar);
            this.publish("submit", {
                emitFacade: true
            });
            this.publish("updated", {
                emitFacade: false
            });
        },
        /**
         * @function
         * @private
         * @description
         */
        renderUI: function() {
            Y.Array.each(this.get("buttons"), this.addButton, this);
        },
        /**
         * @function
         * @private
         * @description call function "renderToolbar".
         */
        syncUI: function() {
            this.set("cfg", this.get("cfg"));
        },
        /**
         * @function
         * @private
         * @returns {undefined}
         */
        destructor: function() {
            if (this.form) {
                this.form.destroy();
            }
        },
        addButton: function(b) {
            switch (b.action) {
                case "submit":
                    b.on = {
                        click: Y.bind(function() {
                            if (!this.form.validate()) {
                                this.showMessageBis("error", "Some fields are not valid.");
                                return;
                            }
                            this.fire("submit", {
                                value: this.form.getValue()
                            });
                        }, this)
                    };
                    break;
                default:
                    b.on = {
                        click: Y.bind(function(action) {
                            this.fire(action);
                        }, this, b.action)
                    };
                    break;
            }
            this.toolbar.add(b);
        }

    }, {
        /** @lends Y.Wegas.Form */
        EDITORNAME: "Form",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>value: value of fields of the form</li>
         *    <li>form: the form to manage (see YUI Form)</li>
         *    <li>cfg: configuation of the form (see YUI Form)</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            /**
             * Values of fields of the form
             */
            value: {
                "transient": true,
                value: {
                    setter: function(val) {
                        if (this.form) {
                            this.form.setValue(val, false);
                        }
                        return val;
                    }
                }
            },
            /**
             * Configuation of the form
             */
            cfg: {
                setter: function(val) {
                    if (val) {
                        var cfg = Y.clone(val);                                 // Duplicate so val will be untouched while serializing
                        Y.mix(cfg, {
                            parentEl: this.get(CONTENTBOX),
                            className: "wegas-form-ix",
                            type: "group"
                        });
                        inputEx.use(val, Y.bind(function(cfg) {                 // Load form dependencies
                            if (this.form) {
                                this.form.destroy();
                            }
                            this.form = inputEx(cfg);                           // Initialize and render form
                            this.form.parentWidget = this;
                            this.form.setValue(this.get("value"), false);       // Sync form with "value" ATTR

                            this.form.on("updated", function(e) {
                                this.fire("updated", e);
                            }, this);
                        }, this, cfg));
                    }
                    return val;
                },
                _inputex: {
                    index: 8,
                    _type: "group",
                    legend: "Fields",
                    fields: inputEx.Group.groupOptions
                }
            },
            buttons: {
                value: [{
                        type: "Button",
                        action: "submit",
                        label: "<span class=\"wegas-icon wegas-icon-save\" ></span>Save"
                    }
                ]
            }
        }
    });
    //Y.namespace("Wegas").Form = Form;

    EditEntityForm = Y.Base.create("wegas-form", Form, [], {
        bindUI: function() {
            this.on("submit", function(e) {
                this.showOverlay();
                this.get("dataSource").cache.put(e.value, {
                    on: {
                        success: Y.bind(function() {
                            this.showMessageBis("success", "Item has been updated");
                            this.hideOverlay();
                        }, this),
                        failure: Y.bind(this.defaultFailureHandler, this)
                    }
                });
            });
        },
        /**
         * @function
         * @private
         * @description call function "renderToolbar".
         */
        syncUI: function() {
            var entity = this.get("entity");

            if ((Wegas.persistence.VariableDescriptor &&
                    (entity instanceof Wegas.persistence.VariableDescriptor
                            || entity instanceof Wegas.persistence.VariableInstance))// Those classes may not be loaded
                    || entity instanceof Wegas.persistence.JpaAccount
                    || entity instanceof Wegas.persistence.GameModel
                    || entity instanceof Wegas.persistence.Game) {              // @fixme we may get extended mode for every entities
                this.showOverlay();
                this.get("dataSource").cache.getWithView(entity, "EditorExtended", {// just need to check if it causes bugs
                    on: {
                        success: Y.bind(function(e) {
                            this.showUpdateForm(e.response.entity);
                            this.hideOverlay();
                        }, this)
                    }
                });
            } else {
                this.showUpdateForm(entity);
            }
        },
        showUpdateForm: function(entity) {
            this.set("value", entity.toObject());
            this.set("cfg", this.get("cfg") || entity.getFormCfg());

            var menuItems = Y.Array.filter(entity.getMenuCfg({dataSource: this.get("dataSource")}).slice(1), function(i) {
                return (!i.label || (i.label.indexOf("New") < 0 && i.label.indexOf("Edit") < 0));
            });                                                             // Retrieve menu and remove the first item

            Y.Array.each(menuItems, function(i) {                           // @hack add icons to some buttons
                switch (i.label) {
                    case "Delete":
                    case "New":
                    case "New element":
                    case "Copy":
                    case "View":
                    case "Open in editor":
                    case "Open":
                    case "Edit":
                        i.label = '<span class="wegas-icon wegas-icon-' + i.label.replace(/ /g, "-").toLowerCase() + '"></span>' + i.label;
                }
            });
            this.toolbar.add(menuItems).item(0).get(CONTENTBOX).setStyle("marginLeft", "15px");
            
            Y.fire("rightTabShown");// @fixme @hack
        }
    }, {
        ATTRS: {
            entity: {},
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

    Y.namespace('Wegas').EditEntityForm = EditEntityForm;
});