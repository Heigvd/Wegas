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
            this.publish("submit", {
                emitFacade: true
            });
        },

        renderUI: function () {
            this.renderToolbar();

            this.get(CONTENTBOX).setContent('<div class="wegas-systemmessage"><span class="icon"></span><span class="content"></span></div>');
        },

        bindUI: function () {
        },

        syncUI: function () {
        },

        // ** Private Methods ** //

        renderToolbar: function () {
            var toolbarNode = this.get("parent").get('toolbarNode');
            if (!toolbarNode) return;

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
                        this.fire("submit", {value: val});
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
            this.set("formCfg", formCfg)
        },
        emptyMessage: function () {						// Form msgs logic
            var msgNode = this.get(CONTENTBOX).one('.wegas-systemmessage');
            msgNode.removeClass("info");
            msgNode.removeClass("warn");
            msgNode.removeClass("error");
            msgNode.one('.content').setContent();
        },
        showMessage: function(level, txt) {
            var msgNode = this.get(CONTENTBOX).one('.wegas-systemmessage');
            this.emptyMessage();
            msgNode.addClass(level);
            msgNode.one('.content').setContent(txt);
        }
    }, {
        ATTRS: {
            values: {
                value: {}
            },
            form: {},
            formCfg: {
                value: [],
                setter: function (val) {
                    if (this.get("form")) {
                        this.get("form").destroy();
                    }

                    Y.inputEx.use(val, Y.bind(function (fields) {
                        var form = Y.inputEx({
                            type: "group",
                            fields: fields,
                            parentEl: this.get(CONTENTBOX)
                        });
                        form.setValue(this.get("values"));
                        this.set("form", form);
                    }, this, val));
                }
            }
        }
    });

    Y.namespace("Wegas").FormWidget = FormWidget;
});
