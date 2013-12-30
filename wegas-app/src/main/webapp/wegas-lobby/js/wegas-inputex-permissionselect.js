/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @module inputex-url
 */
YUI.add("wegas-inputex-permissionselect", function(Y) {

    var inputEx = Y.inputEx, CONTENTBOX = "contentBox", RolePermissionList;

    /**
     * @name Y.Wegas.RolePermissionList
     * @class
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Editable
     * @augments Y.Wegas.Widget
     * @constructor
     * @param {Object} options
     */

    RolePermissionList = Y.Base.create("wegas-permissionlist", Y.Widget, [Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Widget], {
        /** @lends Y.Wegas.RolePermissionList# */

        renderUI: function() {
            this.plug(Y.Plugin.WidgetToolbar);
            this.bNew = this.toolbar.add({
                type: "Button",
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>New"
            }).item(0);
        },
        bindUI: function() {
            this.bNew.on('click', function(e) {
                this.permsField.onAddButton(e);
            }, this);
        },
        syncUI: function() {
            if (this.permsField) {
                this.permsField.destroy();
            }

            var e = this.get("entity");

            this.targetEntityId = (e instanceof Y.Wegas.persistence.GameModel) ? "gm" + e.get("id")
                    : "g" + e.get("id");

            Y.Wegas.Facade.User.sendRequest({
                request: "/FindPermissionByInstance/" + this.targetEntityId,
                on: {
                    success: Y.bind(function(e) {
                        var roles = Y.Array.map(e.response.results.entities, function(role) {
                            return role.get("val");
                        }, this);

                        this.messageDiv = Y.Node.create('<div class="wegas-smallmessage">Click new to add rights</div>');
                        this.get(CONTENTBOX).append(this.messageDiv);

                        this.permsField = new PermissionList({
                            //listLabel: 'Websites',
                            elementType: {
                                type: 'permissionsselect',
                                permissionsChoices: this.get("permsList"),
                                targetEntityId: this.targetEntityId,
                                value: roles,
                                className: "role-permissions"
                            },
                            useButtons: true,
                            value: roles,
                            parentEl: this.get(CONTENTBOX),
                            className: "roleBox"
                        });
                        this.permsField.on("updated", this.sync, this);
                        this.get(CONTENTBOX).one(".roleBox img").hide();        // Hide add role button
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        destructor: function() {
            if (this.permsField) {
                this.permsField.destroy();
            }
        },
        sync: function() {
            var list = this.permsField.getRoleIds();

            Y.Array.each(this.permsField.subFields, function(eachSubfield) {
                Y.Array.each(eachSubfield.roleSelect.choicesList, function(role) {
                    if (eachSubfield.roleSelect.getValue().id === role.value || list.indexOf(role.value) === -1) {
                        eachSubfield.roleSelect.showChoice(role);
                    } else {
                        eachSubfield.roleSelect.hideChoice(role);
                    }
                });
            });

            if (this.permsField.subFields.length < 1) {
                this.messageDiv.show();
            } else {
                this.messageDiv.hide();
            }
        }
    }, {
        /** @lends Y.Wegas.RolePermissionList */
        ATTRS: {
            permsList: {
                value: []
            },
            entity: {}
        }
    });
    Y.namespace("Wegas").RolePermissionList = RolePermissionList;

    /**
     *
     * @name Y.inputEx.Wegas.PermissionSelect
     * @class
     * @extends Y.inputEx.Field
     * @constructor
     */
    Y.namespace("inputEx.Wegas").PermissionSelect = function(options) {
        inputEx.Wegas.PermissionSelect.superclass.constructor.call(this, options);
    };

    Y.extend(inputEx.Wegas.PermissionSelect, inputEx.Field, {
        /** @lends Y.inputEx.Wegas.PermissionSelect# */

        setOptions: function(options) {
            inputEx.Wegas.PermissionSelect.superclass.setOptions.call(this, options);
            this.options.permissions = options.permissionsChoices;
            this.options.roles = options.roles;
            this.options.targetEntityId = options.targetEntityId;
            this.value = {};
        },
        renderComponent: function() {
            this.fireUpdatedEvt();

            this.roleSelect = new inputEx.Wegas.RoleSelect({
                parentEl: this.fieldContainer
            });

            this.roleSelect.on("updated", function(val) {

                if (this.value.id !== val.id) {
                    Y.Wegas.Facade.User.cache.deleteAllRolePermissions(this.value.id, this.options.targetEntityId);
                }

                this.value.id = val.id;
                this.value.permissions = [];
                this.syncCheckboxes();
                this.fireUpdatedEvt();
            }, this);

            var logDiv = Y.Node.create('<div class="permissionList"></div>');
            this.fieldContainer.div = this.fieldContainer.appendChild(logDiv.getDOMNode());
            this.permissionsCheckBoxes = Y.Array.map(this.options.permissions, function(item, i) {
                var splitedLabel = item.name.split(":"),
                        splitedPermissions = (item.value) ? item.value.split(":") : item.name.split(":"),
                        box = new inputEx.CheckBox({
                    rightLabel: splitedLabel[1],
                    name: splitedPermissions[0] + ":" + splitedPermissions[1],
                    value: false,
                    parentEl: this.fieldContainer.div,
                    className: "eachPermissions"
                });

                box.on("updated", function(e, field) {
                    if (field.getValue()) {
                        Y.Wegas.Facade.User.sendRequest({
                            request: "/AddPermission/" + this.roleSelect.getValue().id
                                    + "/" + field.options.name + ":" + this.options.targetEntityId,
                            cfg: {
                                method: "POST"
                            }
                        });
                    } else {
                        Y.Wegas.Facade.User.sendRequest({
                            request: "/DeletePermission/" + this.roleSelect.getValue().id
                                    + "/" + field.options.name + ":" + this.options.targetEntityId,
                            cfg: {
                                method: "POST"
                            }
                        });
                    }
                    this.fireUpdatedEvt();
                }, this);
                return box;
            }, this);

            this.syncCheckboxes();
        },
        getValue: function() {
            this.value.id = this.roleSelect.getValue().id;
            return this.value;
        },
        setValue: function(val, sendUpdatedEvent) {
            inputEx.Wegas.PermissionSelect.superclass.setValue.call(this, val, sendUpdatedEvent);
            this.roleSelect.setValue(val, false);
            this.value = val;
            this.syncCheckboxes();
        },
        syncCheckboxes: function() {
            var permissions = this.getValue().permissions;
            Y.Array.each(this.permissionsCheckBoxes, function(box) {
                var permName = box.options.name.split(":")[1];
                box.setValue(false, false);

                if (Y.Array.find(permissions, function(perm) {
                    return permName === perm.split(":")[1];
                })) {
                    box.setValue(true, false);
                } else {
                    box.setValue(false, false);
                }
            });
        },
        destroy: function() {
            inputEx.Wegas.PermissionSelect.superclass.destroy.call(this);
            this.roleSelect.destroy();
            Y.Array.each(this.permissionsCheckBoxes, function(b) {
                b.destroy();
            });
        }

    });
    inputEx.registerType("permissionsselect", inputEx.Wegas.PermissionSelect);  // Register this class as "wegasurl" type

    /**
     * @fixme @hack override to receive events.
     *
     * @name Y.inputEx.Wegas.PermissionList
     * @class
     * @extends Y.inputEx.ListField
     * @constructor
     * @param {Object} options
     */
    var PermissionList = function(options) {
        PermissionList.superclass.constructor.call(this, options);
    };
    Y.extend(PermissionList, inputEx.ListField, {
        /** @lends Y.inputEx.Wegas.PermissionList# */

        getRoleIds: function() {
            return Y.Array.map(this.subFields, function(field) {
                return field.getValue().id;
            });
        },
        onAddButton: function() {
            PermissionList.superclass.onAddButton.apply(this, arguments);
            var newField = this.subFields[this.subFields.length - 1],
                    filter = this.getRoleIds(),
                    i = 0;

            while (filter.indexOf(newField.getValue().id) > -1
                    && i < newField.roleSelect.choicesList.length) {
                newField.setValue({
                    id: newField.roleSelect.choicesList[i].value
                });
                i++;
            }
        },
        onDelete: function(e) {
            var elementDiv = e.target._node.parentNode,
                    i, subFieldEl = elementDiv.childNodes[this.options.useButtons ? 1 : 0];
            for (i = 0; i < this.subFields.length; i++) {
                if (this.subFields[i].getEl() === subFieldEl) {
                    Y.Wegas.Facade.User.cache.deleteAllRolePermissions(this.subFields[i].roleSelect.getValue().id, this.subFields[i].options.targetEntityId);
                    break;
                }
            }

            PermissionList.superclass.onDelete.apply(this, arguments);
        }
    });
    inputEx.registerType("permissionslist", PermissionList);                    // Register this class as "wegasurl" type

});
