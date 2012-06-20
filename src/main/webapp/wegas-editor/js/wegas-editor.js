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
            var node, widget = Y.Widget.getByNode('#rightTabView');
            // var widget = Y.Widget.getByNode('#centerTabView');

            if (!this._tab) {
                this._tab = widget.add({
                    type: "Tab",
                    label: "Edit",
                    toolbarLabel: "Edit"
                });
            }
            widget.selectChild(widget.size() - 1);
            /* var node = Y.one('#editor-editdisplayarea').one('div');
            node.empty();
            var node = newTab.item(0).get('panelNode').append('<div></div>');
            */
            node = this._tab.item(0).get('panelNode').one('.yui3-tab-panel-content');
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

            this._form = new Y.inputEx.Form({
                fields: formFields,
                buttons: [{
                    type: 'submit',
                    value: 'Submit'
                }, {
                    type: 'button',
                    value: 'Cancel',
                    onClick: function () {
                        this._form.destroy();
                        widget.remove(newTab.item(0).get('index'));
                        widget.selectChild(0);
                    }
                }],
                parentEl: node._node,
                onSubmit: function () {
                    var val = this.getValue();

                    if (!this.validate()) {
                        return;
                    }
                    this.fire("afterValidation");
                    if (val.valueselector) {
                        val = val.valueselector;
                    }
                    callback.call(scope || this, val, this._oData);
                /*
                      this._form.destroy();
                    widget.remove(newTab.item(0).get('index'));
                    widget.selectChild(0);
                     */
                }
            });
            this._form.setValue(data);
            this._form._oData = data;
        },
        showFormMsg: function (level, msg) {													// Form msgs logic
            var msgNode = this._tab.item(0).get('panelNode').one('.yui3-wegas-systemmessage');
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