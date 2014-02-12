/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 *
 * @TODO les showmessage en cas de failure des requ�tes ne marchent pas
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */

YUI.add('wegas-shareuser', function(Y) {
    var CONTENTBOX = 'contentBox',
            ShareUser = Y.Base.create("wegas-shareuser", Y.Widget, [Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Widget], {
        /**
         *
         */
        CONTENT_TEMPLATE: "<div>"
                + "<div class=\"title\">Name<span style=\"width: 152px;display: inline-block;\"></span>Permissions</div>"
                + "<div class=\"wegas-userlist\"></div>"
                + "<div class=\"wegas-adduser\"><div class=\"title\">Add user</div></div></div>",
        /**
         *
         */
        renderUI: function() {
            var el = this.get(CONTENTBOX),
                    e = this.get("entity"),
                    permissions = [{
                    name: "username",
                    type: 'markup',
                    readonly: true,
                    className: "username-field"
                }, {
                    name: "userId",
                    type: "hidden"
                }];

            permissions = permissions.concat(Y.Array.map(this.get("permsList"), function(item) {
                item.type = "boolean";
                return item;
            }));

            this.userList = new UserPermissionList({
                elementType: {
                    type: 'permissiongroup',
                    fields: permissions,
                    className: "permission-group"
                },
                parentEl: el.one(".wegas-userlist"),
                useButtons: true
            });

            if (e instanceof Y.Wegas.persistence.GameModel) {
                this.userList.targetEntityId = "gm" + e.get("id");
            } else {
                this.userList.targetEntityId = "g" + e.get("id");
            }


            this.autocompleteValue = [];
            this.field = new Y.inputEx.AutoComplete({
                parentEl: el.one(".wegas-adduser"),
                typeInvite: "e-mail, name or lastname",
                // Format the hidden value (value returned by the form)
                returnValue: Y.bind(function(oResultItem) {
                    if (!this.field.options.value) {
                        this.field.options.value = [];
                        // console.log("in instanciate");
                    }
                    this.field.options.value.push(oResultItem);
                    return oResultItem.value;
                }, this),
                autoComp: {
                    minQueryLength: 1,
                    maxResults: 30,
                    resultTextLocator: 'label',
                    resultHighlighter: 'phraseMatch',
                    queryDelimiter: ',',
                    source: Y.Wegas.app.get("base") + "rest/User/AutoComplete/{query}",
                    enableCache: false,
                    resultListLocator: Y.bind(function(responses) {
                        var i;
                        Y.Array.forEach(this.userList.subFields, function(user) {
                            for (i = 0; i < responses.length; i++) {
                                if (user.getValue().userId === responses[i].value) {
                                    responses.splice(responses[i], 1);
                                    break;
                                }
                            }
                        });
                        return responses;
                    }, this)
                }
            });

            this.saveButton = new Y.Wegas.Button({
                label: "Add",
                render: el.one(".wegas-adduser")
            });

            this.loadPermissions();
        },
        bindUI: function() {
            this.saveButton.on("click", function() {
                var values = [],
                        fieldValue = this.field.yEl.get("value"),
                        userNames = fieldValue.split(",");

                if (fieldValue === "") {                                        // Check the input element is not empty
                    return;
                }
                //if (this.field.getValue() === "")
                //    return;

                Y.Array.each(userNames, function(value) {                       // Remove items that have
                    if ((!this.field.options.value || !this.field.options.value.indexOf[Y.Lang.trim(value)])
                            && Y.Lang.trim(value) !== "") {
                        values.push(value);
                    }
                }, this);
                if (values.length > 0) {
                    Y.Wegas.Facade.User.sendRequest({
                        request: "/FindAccountsByValues/",
                        cfg: {
                            data: {
                                values: values
                            }
                        },
                        on: {
                            success: Y.bind(function(e) {
                                Y.Array.each(e.response.results.entities, function(account) {
                                    this.userList.addElement({
                                        username: account.get("val.label"),
                                        userId: account.get("val.value"),
                                    });
                                }, this);
                            }, this),
                            failure: Y.bind(this.defaultFailureHandler, this)
                        }
                    });
                }

                Y.Array.each(this.field.options.value, function(account) {
                    this.userList.addElement({
                        username: account.label,
                        userId: account.value
                    });
                }, this);

                this.field.options.value = [];
                this.field.setValue("");
            }, this);
        },
        destructor: function() {
            this.field.destroy();
            this.saveButton.destroy();
            this.userList.destroy();
        },
        loadPermissions: function() {
            Y.Wegas.Facade.User.sendRequest({
                request: "/FindAccountPermissionByInstance/" + this.userList.targetEntityId,
                on: {
                    success: Y.bind(function(e) {
                        var data = e.response.results.entities,
                                i, permissions, splitedPerm, newField;

                        Y.Array.forEach(data, function(account) {
                            permissions = account.get('permissions');
                            newField = this.userList.addElement({
                                username: account.getPublicName(),
                                userId: account.get('id')
                            });

                            Y.Array.forEach(newField.inputs, function(field) {
                                for (i = 0; i < permissions.length; i++) {
                                    splitedPerm = permissions[i].get("val").value.split(":");
                                    if (splitedPerm[2] === this.userList.targetEntityId) {
                                        if (field.options.value === splitedPerm[0] + ":" + splitedPerm[1]) {
                                            field.setValue(true, false);
                                        }
                                    }
                                }
                            }, this);

                        }, this);
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        }
    }, {
        ATTRS: {
            permsList: {
                value: []
            },
            entity: {}
        }
    });
    Y.namespace('Wegas').ShareUser = ShareUser;

    /**
     * @name Y.inputEx.Wegas.UserPermissionList
     * @class
     * @extends Y.inputEx.ListField
     * @constructor
     * @param {Object} options
     */
    var UserPermissionList = function(options) {
        UserPermissionList.superclass.constructor.call(this, options);
    };
    Y.extend(UserPermissionList, Y.inputEx.ListField, {
        /** @lends Y.inputEx.Wegas.UserPermissionList# */

        onDelete: function(e) {
            var elementDiv = e.target._node.parentNode,
                    subFieldEl = elementDiv.childNodes[this.options.useButtons ? 1 : 0];
            for (var i = 0; i < this.subFields.length; i++) {
                if (this.subFields[i].getEl() === subFieldEl) {
                    this.deletePermission(this.targetEntityId, this.subFields[i].getValue().userId); //param : entity Id, have userId
                    break;
                }
            }

            UserPermissionList.superclass.onDelete.apply(this, arguments);
        },
        deletePermission: function(entityId, userId) {
            Y.Wegas.Facade.User.sendRequest({
                request: "/DeleteAccountPermissionByInstanceAndAccount/" + entityId + "/" + userId,
                cfg: {
                    method: "DELETE"
                },
                on: {
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        }
    });

    /**
     * @name Y.inputEx.Wegas.PermissionGroup
     * @class
     * @extends Y.inputEx.Group
     * @constructor
     * @param {Object} options
     */
    var PermissionGroup = function(options) {
        PermissionGroup.superclass.constructor.call(this, options);
    };
    Y.extend(PermissionGroup, Y.inputEx.Group, {
        /** @lends Y.inputEx.Wegas.PermissionGroup# */
        onChange: function(fieldValue, fieldInstance) {
            if (fieldValue) {
                this.addPermission(fieldInstance.options.value + ":" + this.parentField.targetEntityId, this.getValue().userId);
            } else {
                this.removePermission(fieldInstance.options.value + ":" + this.parentField.targetEntityId, this.getValue().userId);
            }
            PermissionGroup.superclass.onChange.apply(this, arguments);
        },
        removePermission: function(permission, userId) {
            Y.Wegas.Facade.User.sendRequest({
                request: "/DeleteAccountPermissionByPermissionAndAccount/" + permission + "/" + userId,
                cfg: {
                    method: "DELETE"
                },
                on: {
                    failure: Y.bind(function(e) {
                        this.showMessage("error", "Error removing permission");
                    }, this)
                }
            });
        },
        addPermission: function(permission, userId) {
            Y.Wegas.Facade.User.sendRequest({
                request: "/addAccountPermission/" + permission + "/" + userId,
                cfg: {
                    method: "POST"
                },
                on: {
                    failure: Y.bind(function(e) {
                        this.showMessage("error", "Error adding permission");
                    }, this)
                }
            });
        }
    });
    Y.inputEx.registerType("permissiongroup", PermissionGroup);
});