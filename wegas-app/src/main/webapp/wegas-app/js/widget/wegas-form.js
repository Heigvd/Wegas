/*
 * Wegas
 *
 * http://wegas.albasim.ch
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-form', function(Y) {
    "use strict";

    var FORM = "form", inputEx = Y.inputEx, Wegas = Y.Wegas, Form;

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
            this.get("contentBox").on("key", this.save, "down:83+ctrl", this);  // ctrl-s shortcut
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
            this.set(FORM, null);
        },
        addButton: function(b) {
            switch (b.action) {
                case "submit":
                    b.on = {
                        click: Y.bind(this.save, this)
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
            this.toolbar.add(new Wegas.Button(b));
        },
        /**
         * @function
         * @private
         * @description set the given form to null
         */
        destroyForm: function() {
            this.set(FORM, null);
        },
        setCfg: function(val) {
            var cfg = Y.clone(val);                                             // Duplicate so val will be untouched while serializing
            Y.mix(cfg, {
                parentEl: this.get("contentBox"),
                type: "group"
            });                                                                 // Set up the form parentEl attribute, so it knows where to render

            inputEx.use(val, Y.bind(function(cfg) {                           // Load form dependencies
                if(this.get("destroyed")){
                    return;
                }
                var form = inputEx(cfg);                                      // Initialize and render form
                form.setValue(this.get("values"), false);                       // Sync form with "values" ATTR
                form.removeClassFromState();                                    // Remove required state
                this.set(FORM, form);
                this.fire("formUpdate");
                form.on("updated", function(e) {
                    this.fire("updated", e);
                }, this);
            }, this, cfg));
        },
        save: function(e) {
            e.halt(true);

            var form = this.get(FORM),
                val = form.getValue();

            if (!form.validate()) {
                this.showMessage("error", "Some fields are not valid.");
                return;
            }
            if (val.valueselector) {
                val = val.valueselector;
            }
            this.fire("submit", {
                value: val
            });
        },
        validate: function() {
            return this.get("form").validate();
        }
    }, {
        /** @lends Y.Wegas.Form */
        EDITORNAME: "Form",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>values: values of fields of the form</li>
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
            values: {
                "transient": true,
                value: {},
                setter: function(val) {
                    if (this.get(FORM)) {
                        this.get(FORM).setValue(val, false);
                    }
                    return val;
                }
            },
            /**
             * The form to manage
             */
            form: {
                "transient": true,
                setter: function(val) {
                    if (this.get(FORM)) {                                       // If there is alread a form instantiated, destroy it
                        this.get(FORM).destroy();
                    }
                    return val;
                }
            },
            /**
             * Configuation of the form
             */
            cfg: {
                validator: Y.Lang.isObject,
                setter: function(val) {
                    this.setCfg(val);
                    return val;
                },
                items: {
                    test: {
                        type: "string"
                    }
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
                ],
                _inputex: {
                    _type: "hidden"
                }
            }
        }
    });
    Wegas.Form = Form;

    /* Add relevant plugin*/
    Wegas.Form.ATTRS.plugins = Y.clone(Wegas.Widget.ATTRS.plugins);
    Wegas.Form.ATTRS.plugins._inputex.items.push({
        type: "Button",
        label: "Save to",
        data: "SaveObjectAction"
    });

});
