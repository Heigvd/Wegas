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

YUI.add('wegas-form', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    FormWidget;

    FormWidget = Y.Base.create("wegas-form", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {

        // ** Private Fields ** //

        // ** Lifecycle Methods ** //
        initializer: function () {
            this.plug(Y.Plugin.WidgetToolbar);
            this.publish("submit", {
                emitFacade: true
            });
        },

        renderUI: function () {
            this.renderToolbar();
        },

        // ** Private Methods ** //

        renderToolbar: function () {
            var toolbarNode = this.toolbar.get('header');

            this.saveButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-save\" ></span>Save",
                on: {
                    click: Y.bind(function () {
                        var form = this.get("form"),
                        val = form.getValue();

                        if (!form.validate()) {
                            return;
                        }
                        form.fire("afterValidation");
                        if (val.valueselector) {
                            val = val.valueselector;
                        }
                        this.fire("submit", {
                            value: val
                        });
                    }, this)
                }
            }).render(toolbarNode);

            this.cancelButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-cancel\" ></span>Cancel",
                on: {
                    click: Y.bind(function () {
                        this.fire("cancel");
                    }, this)
                }
            }).render(toolbarNode);
        },
        setForm: function (values, formCfg) {
            this.set("values", values);
            this.set("formCfg", formCfg);
        },

        destroyForm: function () {
            this.set("form", null);
        }

    }, {
        ATTRS: {
            values: {
                value: {}
            },
            form: {
                setter: function (val) {
                    if (this.get("form")) {                                 // If there is alread a form instantiated, we destroy it
                        this.get("form").destroy();
                    }
                    return val;
                }
            },
            formCfg: {
                setter: function (val) {
                    val.parentEl = this.get(CONTENTBOX);                        //  Set up the form parentEl attribute, so it knows where to render

                    Y.inputEx.use(val, Y.bind(function (formCfg) {              // Load form dependencies
                        var form = Y.inputEx(formCfg);                          // Initialize and render form
                        form.setValue(this.get("values"));                      // Sync form with "values" ATTR
                        this.set("form", form);
                    }, this, val));
                    return val;
                }
            }
        }
    });

    Y.namespace("Wegas").FormWidget = FormWidget;
});
