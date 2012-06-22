/**
 *
 *
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor', function(Y) {
    "use strict";

    var Editor = Y.Base.create("wegas-editor", Y.Wegas.App, [], {

        _tab: null,
        _form: null,
        _editMenu: null,

        initializer: function () {
            Y.Wegas.editor = this;
            this._editMenu = new Y.Wegas.EditMenu({
                zIndex: 2,
                render: true,
                visible: true
            });
        },
        destructor : function () {
        },


        /**
         * Show the contextual edit menu
         */
        showEditMenu: function (data, dataSource) {
            var menuItems = this.get("editorMenus")[data["@class"]];
            if (!menuItems) {
                Y.log('error', 'Menu items are undefined.', "Wegas.Editor");
                return;
            }
            this._editMenu.setMenuItems(data, dataSource);
            this._editMenu.show();
        },
        showEditPanel: function (data, dataSource) {
            this.edit(data, function (cfg) {
                this.rest.put(cfg, {
                    success: function (e) {
                        Y.Wegas.editor.showFormMsg("success", "Item has been updated");
                    },
                    failure: function (e) {
                        Y.Wegas.editor.showFormMsg("error", e.response.message || "Error while update item");
                    }
                });
            }, null, dataSource);
        },
        showAddPanel: function (data, parentData, dataSource) {
            this.edit(data, function (cfg) {
                this.rest.post(cfg, parentData, {
                    success: function () {
                        Y.Wegas.editor.showFormMsg("success", "Item has been added");
                        Y.Wegas.editor._form.setValue(data);
                    },
                    failure: function (e) {
                        Y.Wegas.editor.showFormMsg("error", e.response.results.message || "Error while adding item");
                    }
                });
            }, null, dataSource);
        },
        /**
         * Show edition form in the target div
         */
        edit: function (data, callback, formFields, scope) {
            var node, toolbarNode;

            this.callback = callback;
            this.scope = scope;
            //widget = Y.Widget.getByNode('#centerTabView');

            if (!this._tab) {
                this.tabView = Y.Widget.getByNode('#rightTabView');
                this._tab = this.tabView.add({
                    type: "Tab",
                    label: "Edit"
                }).item(0);
                toolbarNode = this._tab.get('toolbarNode');

                this.saveButton = new Y.Button({
                    label: "<span class=\"wegas-icon wegas-icon-save\" ></span>Save",
                    on: {
                        click: Y.bind(function () {
                            var val = this._form.getValue();

                            if (!this._form.validate()) {
                                return;
                            }
                            this._form.fire("afterValidation");
                            if (val.valueselector) {
                                val = val.valueselector;
                            }
                            this.callback.call(this.scope || this, val, this.currentData);
                        }, this)
                    }
                }).render(toolbarNode);

                this.cancelButton = new Y.Button({
                    label: "<span class=\"wegas-icon wegas-icon-cancel\" ></span>Cancel",
                    on: {
                        click: Y.bind(function () {
                            this._form.destroy();
                            this.tabView.remove(this._tab.get('index'));
                            this.tabView.selectChild(0);
                            this._tab.destroy();
                            this._tab = null;
                        }, this)
                    }
                }).render(toolbarNode);
            }
            this.tabView.selectChild(this.tabView.size() - 1);

            node = this._tab.get('panelNode').one('.yui3-tab-panel-content');
            node.setStyle('padding-right', '5px');
            data = data || {};

            if (!formFields) {                                                  // If no form is provided, we select one based on the @class
                formFields = Y.Wegas.app.get('forms')[data['@class']];
            }
            if (!formFields) {                                                  // Or the type
                formFields = Y.Wegas.app.get('forms')[data.type];
            }

            if (this._form) {
                this._form.destroy();
                node.empty();
            }
            node.append('<div class="yui3-wegas-systemmessage"><span class="icon"></span><span class="content"></span></div>');

            formFields = {
                type: "group",
                fields: formFields,
                parentEl: node,
                onSubmit: function () {
                    return false;
                }
            };

            this.currentData = data;

            Y.inputEx.use(formFields, Y.bind(function(fields, data) {
                this._form = Y.inputEx(fields, this.currentData);
            }, this, formFields));
        },
        showFormMsg: function (level, msg) {													// Form msgs logic
            var msgNode = this._tab.get('panelNode').one('.yui3-wegas-systemmessage');
            msgNode.removeClass("info");
            msgNode.removeClass("warn");
            msgNode.removeClass("error");
            msgNode.addClass(level);
            msgNode.one('.content').setContent(msg);
        }
    }, {
        ATTRS: {
            editorMenus: {
                value: []
            }
        }
    });

    Y.namespace('Wegas').Editor = Editor;

});