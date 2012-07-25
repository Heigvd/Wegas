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


YUI.add('wegas-editor', function(Y) {
    "use strict";

    var Editor = Y.Base.create("wegas-editor", Y.Wegas.App, [], {

        tab: null,
        form: null,

        // *** Lifecycle Methods *** //

        initializer: function () {
            Y.Wegas.editor = this;
        },
        destructor : function () {
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

            if (!this.tab) {
                this.tabView = Y.Widget.getByNode('#rightTabView');
                this.tab = Y.Wegas.TabView.createTab("Edit", '#rightTabView');

                this.formWidget = new Y.Wegas.FormWidget();

                this.formWidget.on("submit", function (e) {
                    this.callback.call(this.scope || this, e.value, this.currentEntity);
                }, this);

                this.formWidget.on("cancel", function (e) {
                    this.tabView.remove(this.tab.get('index'));
                    this.tabView.selectChild(0);
                    // this.tab.destroy();
                    this.tab = null;
                }, this);
                this.tab.add(this.formWidget);
            }
            this.tabView.selectChild(this.tab.get("index"));
            this.formWidget.emptyMessage();
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

        showAddForm: function (entity, parentData, dataSource) {
            this.showEditForm(entity, function (newVal) {
                this.rest.post(newVal, (parentData) ? parentData.toJSON() : parentData , {
                    success: function (e) {
                        Y.Wegas.editor.showUpdateForm(e.response.entity, dataSource);
                        Y.Wegas.editor.showFormMsg("success", "Item has been added");
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