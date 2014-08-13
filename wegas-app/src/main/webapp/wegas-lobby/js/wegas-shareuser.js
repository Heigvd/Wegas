/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-shareuser', function(Y) {
    'use strict';
    var CONTENTBOX = 'contentBox', ShareUser;

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
                parentEl: el.one(".wegas-userlist")
            });

            this.userList.currentWidget = this;

            if (e instanceof Y.Wegas.persistence.GameModel) {
                this.userList.targetEntityId = "gm" + e.get("id");
            } else {
                this.userList.targetEntityId = "g" + e.get("id");
            }

            this.autocompleteValue = [];
            this.typeInviteValue = "e-mail, name or lastname";
            this.field = new Y.inputEx.AutoComplete({
                parentEl: el.one(".wegas-adduser"),
                typeInvite: this.typeInviteValue,
                // Format the hidden value (value returned by the form)
                returnValue: Y.bind(function(oResultItem) {
                    if (!this.field.options.value) {
                        this.field.options.value = [];
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
                    source: Y.bind(function(query, callback) {
                        this.autocompleteRequest(query, callback);
                    }, this),
                    enableCache: false,
                    resultListLocator: Y.bind(function(responses) {
                        Y.Array.each(this.userList.subFields, function(user) {
                            responses = this.resultListLocator(user.getValue().userId, responses);
                        }, this);
                        //Y.Array.each(this.field.options.value, function(fieldValue) {
                        //    responses = this.resultListLocator(fieldValue.value, responses);
                        //}, this);
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
        autocompleteRequest: function(query, callback) {
            var data = {
                rolesList: this.get("roleList")
            };
            Y.Wegas.Facade.User.sendRequest({
                request: "/AutoComplete/" + query,
                cfg: {
                    method: "POST",
                    data: data
                },
                on: {
                    success: Y.bind(function(e) {
                        var data = e.response.results.entities, result = [], temp;
                        Y.Array.each(data, function(r) {
                            if ((r.get("firstname") && r.get("firstname") !== " ")) {
                                temp = {
                                    label: r.get("firstname") + " " + r.get("lastname")
                                };
                            } else {
                                temp = {
                                    label: r.get("email")
                                };
                            }
                            temp.value = r.get("id");
                            result.push(temp);
                        });
                        callback(result);

                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        resultListLocator: function(id, responses) {
            var i;
            for (i = 0; i < responses.length; i += 1) {
                if (id === responses[i].value) {
                    responses.splice(i, 1);
                    break;
                }
            }
            return responses;
        },
        bindUI: function() {
            this.saveButton.on("click", function() {
                var i, emailList = [], otherValueList = [],
                    fieldValue = this.field.yEl.get("value"), notAdd,
                    userNames = fieldValue.split(",");
                this.sendAddErrorMessage = false;

                if (fieldValue === this.typeInviteValue) {                                        // Check the input element is not empty
                    return;
                }

                //Add all accounts from "this.field" with an id (means selected with autocompletion)
                Y.Array.each(this.field.options.value, function(account) {
                    if (this.checkFieldValue(userNames, account)) {
                        this.addToUserlist(account.value, account.label);
                    }
                }, this);

                Y.Array.each(userNames, function(value) {                       // Create the email list and other value list
                    notAdd = true;
                    for (i in this.field.options.value) {
                        if (this.field.options.value.hasOwnProperty(i)) {
                            if (this.field.options.value[i].label === Y.Lang.trim(value)) {
                                notAdd = false;
                                break;
                            }
                        }
                    }
                    if (notAdd && value.indexOf("@") !== -1) {
                        emailList.push(Y.Lang.trim(value));
                    } else if (notAdd) {
                        otherValueList.push(Y.Lang.trim(value));
                    }
                }, this);

                if (emailList.length > 0) {
                    this.findAccountsByEmail(emailList);
                }

                if (otherValueList.length > 0) {
                    this.findAccountsByName(otherValueList);
                }

                this.field.options.value = [];
                this.field.setValue("");
            }, this);
        },
        findAccountsByEmail: function(emailList) {
            Y.Wegas.Facade.User.sendRequest({
                request: "/FindAccountsByEmailValues/",
                headers: {
                    'Managed-Mode': 'false'
                },
                cfg: {
                    data: {
                        values: emailList
                    }
                },
                on: {
                    success: Y.bind(function(e) {
                        var notAddedAccounts;
                        Y.Array.each(e.response.results.entities, function(account) {
                            this.addToUserlist(account.get("val.value"), account.get("val.label"));
                        }, this);
                        notAddedAccounts = Y.Wegas.Facade.User.cache.findEvent("NotAddedAccount", e);
                        this.notAddedToUserlist(notAddedAccounts);
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        findAccountsByName: function(valueList) {
            Y.Wegas.Facade.User.sendRequest({
                request: "/FindAccountsByName/",
                headers: {
                    'Managed-Mode': 'true'
                },
                cfg: {
                    data: {
                        values: valueList
                    }
                },
                on: {
                    success: Y.bind(function(e) {
                        var notAddedAccounts;
                        Y.Array.each(e.response.results.entities, function(account) {
                            this.addToUserlist(account.get("id"), account.get("name"));
                        }, this);
                        notAddedAccounts = Y.Wegas.Facade.User.cache.findEvent("NotAddedAccount", e);
                        this.notAddedToUserlist(notAddedAccounts);
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        notAddedToUserlist: function(notAddedAccounts) {
            var i;
            for (i = 0; i < notAddedAccounts[0].length; i += 1) {
                this.field.setValue(this.field.getValue() + notAddedAccounts[0][i] + ", ");
            }
            if (notAddedAccounts[0].length > 0 && !this.sendAddErrorMessage) {
                this.sendAddErrorMessage = true;
                this.showMessage("warn", "Some accounts couldn't be added");
            }
        },
        addToUserlist: function(id, label) {
            var accountFind, newPermGroup;
            accountFind = Y.Array.find(this.userList.getValue(), Y.bind(function(item) {
                if (item.userId === id) {
                    return true;
                }
            }), this);

            if (!accountFind) {
                newPermGroup = this.userList.addElement({
                    username: label,
                    userId: id
                });
                this.defaultSelectedPerm(newPermGroup);
            }
        },
        checkFieldValue: function(usernameList, account) {
            return Y.Array.some(usernameList, function(value) {
                if (account.label === Y.Lang.trim(value)) {
                    return true;
                }
            });
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
                                for (i = 0; i < permissions.length; i += 1) {
                                    splitedPerm = permissions[i].get("val").value.split(":");
                                    if (splitedPerm[2] === this.userList.targetEntityId) {
                                        if (field.options.value === splitedPerm[0] + ":" + splitedPerm[1]) {
                                            field.setValue(true, false);
                                            newField.gameModelAddRight(field.options.value);
                                        }
                                    }
                                }
                            }, this);

                        }, this);
                        this.hideUsersWithoutVisiblePermission();
                    }, this),
                    failure: Y.bind(this.defaultFailureHandler, this)
                }
            });
        },
        defaultSelectedPerm: function(permGroup) {
            var selectedPerm = this.get("selectedPermsList");
            Y.Array.each(permGroup.inputs, function(input) {
                Y.Array.each(selectedPerm, function(perm) {
                    if (input.options.value === perm) {
                        input.setValue(true);
                    }
                });
            });
        },
        hideUsersWithoutVisiblePermission: function() {
            var i, ii, checkboxes, checked,
                users = this.get(CONTENTBOX).one(".inputEx-ListField-childContainer").get("children");
            for (i = 0; i < users.size(); i += 1) {
                checked = false;
                checkboxes = users.item(i).all(".inputEx-CheckBox");
                for (ii = 0; ii < checkboxes.size(); ii += 1) {
                    if (checkboxes.item(ii).get("children").item(0).get("checked")) {
                        checked = true;
                        break;
                    }
                }
                if (!checked) {
                    users.item(i).addClass("wegas-advanced-feature");
                }
            }
        }
    }, {
        ATTRS: {
            permsList: {
                value: []
            },
            selectedPermsList: {
                value: []
            },
            entity: {},
            roleList: {
                value: []
            }
        }
    });
    Y.Wegas.ShareUser = ShareUser;

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
            this.currentWidget.showMessageBis("success", "Saving...");
            var elementDiv = e.target._node.parentNode, i,
                subFieldEl = elementDiv.childNodes[this.options.useButtons ? 1 : 0];
            for (i = 0; i < this.subFields.length; i += 1) {
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
                    success: Y.bind(function() {
                        this.currentWidget.showMessageBis("success", "All changes saved");
                    }, this),
                    failure: Y.bind(function() {
                        this.currentWidget.showMessageBis("error", "Error removing permissions");
                    }, this)
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
            this.getParentField().currentWidget.showMessageBis("success", "Saving...");
            if (fieldValue) {
                this.addPermission(fieldInstance.options.value + ":" + this.parentField.targetEntityId, this.getValue().userId);
                this.gameModelAddRight(fieldInstance.options.value);
            } else {
                this.removePermission(fieldInstance.options.value + ":" + this.parentField.targetEntityId, this.getValue().userId);
                this.gameModelRemoveRight(fieldInstance.options.value);
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
                    success: Y.bind(function(e) {
                        this.getParentField().currentWidget.showMessageBis("success", "All changes saved");
                    }, this),
                    failure: Y.bind(function(e) {
                        if (e.response.results.exception !== "javax.persistence.NoResultException") {
                            this.getParentField().currentWidget.showMessageBis("error", "Error removing permission");
                        }
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
                    success: Y.bind(function(e) {
                        this.getParentField().currentWidget.showMessageBis("success", "All changes saved");
                    }, this),
                    failure: Y.bind(function(e) {
                        this.getParentField().currentWidget.showMessageBis("error", "Error adding permission");
                    }, this)
                }
            });
        },
        gameModelAddRight: function(fieldInstance) {                            // @hack (hardcode)
            if (fieldInstance === "GameModel:View,Edit,Delete,Duplicate,Instantiate") { // If GameModel has right edit -> then add the other rights
                this.inputs[3].disable();
                this.inputs[4].disable();
                this.inputs[3].setValue(true, false);
                this.inputs[4].setValue(true, false);
            }
        },
        gameModelRemoveRight: function(fieldInstance) {                         // @hack (hardcode)
            if (fieldInstance === "GameModel:View,Edit,Delete,Duplicate,Instantiate") { // If GameModel hasn't right edit -> then remove the other rights
                this.inputs[3].enable();
                this.inputs[4].enable();
                this.inputs[3].setValue(false, true);
                this.inputs[4].setValue(false, true);
            }
        }
    });
    Y.inputEx.registerType("permissiongroup", PermissionGroup);
});
