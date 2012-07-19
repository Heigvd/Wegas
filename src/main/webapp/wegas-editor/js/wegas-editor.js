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

        // *** Editor Menu Methods *** //

        /**
         * Show the contextual edit menu
         */
        showEditMenu: function (entity, dataSource) {
            this._editMenu.setMenuItems(entity, dataSource);
            this._editMenu.show();
        },

        // *** Editor Form Methods *** //

        /**
         * Show edition form in the target div
         */
        showEditForm: function (entity, callback, scope) {
            this.callback = callback;
            this.scope = scope;
            this.currentEntity = entity;
            //widget = Y.Widget.getByNode('#centerTabView');

            if (!this._tab) {
                this.tabView = Y.Widget.getByNode('#rightTabView');
                this._tab = this.tabView.add({
                    type: "Tab",
                    label: "Edit"
                }).item(0);

                this.formWidget = new Y.Wegas.FormWidget();

                this.formWidget.on("submit", function (e) {
                    this.callback.call(this.scope || this, e.value, this.currentEntity);
                }, this);

                this.formWidget.on("cancel", function (e) {
                        this.tabView.remove(this._tab.get('index'));
                        this.tabView.selectChild(0);
                        // this._tab.destroy();
                         this._tab = null;
                }, this);
                this._tab.add(this.formWidget);
            }
            this.tabView.selectChild(this.tabView.size() - 1);
            this.formWidget.setForm(entity.toJSON(), entity.getFormCfg());
        },
        showUpdateForm: function (entity, dataSource) {
            this.showEditForm(entity, function (cfg) {
                this.rest.put(cfg, {
                    success: function (e) {
                        Y.Wegas.editor.showFormMsg("success", "Item has been updated");
                    },
                    failure: function (e) {
                        Y.Wegas.editor.showFormMsg("error", e.response.message || "Error while update item");
                    }
                });
            }, dataSource);
        },

        showAddForm: function (data, parentData, dataSource) {
            this.showEditForm(data, function (newVal) {
                this.rest.post(newVal, parentData, {
                    success: function () {
                        Y.Wegas.editor.showFormMsg("success", "Item has been added");
                        Y.Wegas.editor._form.setValue(data);
                    },
                    failure: function (e) {
                        Y.Wegas.editor.showFormMsg("error", e.response.results.message || "Error while adding item");
                    }
                });
            }, dataSource);
        },
        showFormMsg: function (level, msg) {
            this.formWidget.showMessage(level, msg);
        }
    }, {
        ATTRS: {
            /**
            * This field is used to globally override Entities edition menus.
            * Use the target class name as the key.
            */
            editorMenus: {
                value: {}
            },
            /**
            * This field is used to globally override Entities edition forms.
            * Use the target class name as the key.
            */
            editorForms: {
                value: {}
            }

        }
    });

    Y.namespace('Wegas').Editor = Editor;

});